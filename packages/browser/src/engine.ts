import { createKycWorker } from './worker-builder';
import * as ortWeb from 'onnxruntime-web';

// Caching the worker instance
let sharedWorker: Worker | null = null;
let msgIdCounter = 0;

function getSharedWorker(): Worker {
    if (!sharedWorker) {
        sharedWorker = createKycWorker();
    }
    return sharedWorker;
}

/**
 * Send message to Worker and wait for response (Promise-based),
 * Supports PROGRESS events.
 */
function postToWorker(
    worker: Worker, 
    type: string, 
    payload: any, 
    transferables: Transferable[] = [],
    onProgress?: (progress: number) => void
): Promise<any> {
    return new Promise((resolve, reject) => {
        const id = ++msgIdCounter;
        
        const handler = (e: MessageEvent) => {
            if (e.data.id === id) {
                if (e.data.type === 'PROGRESS') {
                    if (onProgress) {
                        onProgress(e.data.payload.progress);
                    }
                    return; // Wait for SUCCESS event
                }

                worker.removeEventListener('message', handler);
                if (e.data.success) {
                    resolve(e.data);
                } else {
                    reject(new Error(e.data.error));
                }
            }
        };
        
        worker.addEventListener('message', handler);
        worker.postMessage({ id, type, payload }, transferables);
    });
}

/**
 * Proxy class simulating ort.InferenceSession interface
 * Forwards all model execution commands to Web Worker to avoid freezing UI
 */
export class WorkerInferenceSession {
    private sessionId: string;
    private worker: Worker;

    constructor(worker: Worker, sessionId: string) {
        this.worker = worker;
        this.sessionId = sessionId;
    }

    /**
     * Send tensor data to worker and get response
     * Uses Transferable objects for 0ms latency
     */
    async run(feeds: Record<string, any>): Promise<Record<string, any>> {
        const feedsData: Record<string, any> = {};
        const transferables: ArrayBuffer[] = [];

        // Convert ort.Tensor to plain object and extract buffers
        for (const key of Object.keys(feeds)) {
            const tensor = feeds[key];
            feedsData[key] = {
                type: tensor.type,
                data: tensor.data,
                dims: tensor.dims
            };
            if (tensor.data.buffer) {
                transferables.push(tensor.data.buffer);
            }
        }

        const response = await postToWorker(this.worker, 'RUN_SESSION', {
            sessionId: this.sessionId,
            feedsData
        }, transferables);

        // Reconstruct Tensor structure from Worker response
        const results: Record<string, any> = {};
        for (const key of Object.keys(response.result)) {
            const res = response.result[key];
            results[key] = new ortWeb.Tensor(res.type, res.data, res.dims);
        }

        return results;
    }

    /**
     * Destroy session and release memory from C++/WASM layer
     */
    async release(): Promise<void> {
        await postToWorker(this.worker, 'DISPOSE_SESSION', { sessionId: this.sessionId });
    }
}

/**
 * Initialize ONNX Session via Web Worker with Auto-Degradation mechanism
 * Returns a Proxy Session to inject into Core
 */
export async function createWorkerSession(
    modelBuffer: string | Uint8Array, 
    options: any = {}
): Promise<WorkerInferenceSession> {
    const worker = getSharedWorker();
    
    // Ensure ORT is loaded on worker
    await postToWorker(worker, 'LOAD_ORT', {});

    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const executionProviders = options.executionProviders || ['webgpu', 'webgl', 'wasm'];

    await postToWorker(worker, 'INIT_SESSION', {
        sessionId,
        modelBuffer,
        executionProviders
    }, [], options.onProgress); // Pass onProgress to thread

    return new WorkerInferenceSession(worker, sessionId);
}
