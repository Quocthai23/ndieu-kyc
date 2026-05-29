/**
 * Generate Inline Web Worker for ONNX Runtime
 * Wraps logic as string (Blob URL) to avoid path issues with Webpack/Next.js/Vite
 */
export function createKycWorker(): Worker {
    const workerCode = `
        // Worker State
        let ort = null;
        let sessions = {};

        // Helper: Fetch model with progress reporting percentage
        async function fetchModelWithProgress(id, url) {
            const response = await fetch(url);
            if (!response.ok) throw new Error("Failed to load model: " + response.statusText);
            
            const contentLength = response.headers.get('content-length');
            const total = parseInt(contentLength, 10);
            let loaded = 0;
            
            const reader = response.body.getReader();
            const chunks = [];
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                chunks.push(value);
                loaded += value.length;
                
                if (total) {
                    // Emit progress event to Main Thread
                    self.postMessage({ id, type: 'PROGRESS', payload: { progress: Math.round((loaded / total) * 100) } });
                }
            }
            
            const arrayBuffer = new Uint8Array(loaded);
            let offset = 0;
            for (const chunk of chunks) {
                arrayBuffer.set(chunk, offset);
                offset += chunk.length;
            }
            return arrayBuffer.buffer;
        }

        // Receive message from Main Thread
        self.onmessage = async function(e) {
            const { id, type, payload } = e.data;

            try {
                if (type === 'LOAD_ORT') {
                    // Load ONNX Runtime Web from CDN into Worker (if not already loaded)
                    if (!ort) {
                        importScripts(payload.cdnUrl || 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.1/dist/ort.min.js');
                        ort = self.ort;
                        ort.env.wasm.wasmPaths = (payload.cdnUrl || 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.1/dist/').replace('ort.min.js', '');
                    }
                    self.postMessage({ id, success: true });
                } 
                else if (type === 'INIT_SESSION') {
                    if (!ort) throw new Error("ONNX Runtime is not loaded in Worker.");
                    const { sessionId, modelBuffer, executionProviders } = payload;
                    
                    let finalBuffer = modelBuffer;
                    if (typeof modelBuffer === 'string') {
                        // Fetch manually if URL is provided
                        finalBuffer = await fetchModelWithProgress(id, modelBuffer);
                    }
                    
                    let session = null;
                    let lastError = null;
                    
                    // Try to initialize with Auto-Degradation mechanism
                    for (const ep of executionProviders) {
                        try {
                            session = await ort.InferenceSession.create(finalBuffer, { executionProviders: [ep] });
                            console.log("[@ndieu/kyc Worker] Initialized successfully with:", ep);
                            break;
                        } catch (err) {
                            console.warn("[@ndieu/kyc Worker] Not supported", ep, "degrading...");
                            lastError = err;
                        }
                    }
                    
                    if (!session) {
                        throw new Error("Cannot initialize engine on this device: " + lastError);
                    }
                    
                    sessions[sessionId] = session;
                    self.postMessage({ id, success: true, activeProvider: session.executionProviders[0] });
                }
                else if (type === 'RUN_SESSION') {
                    const { sessionId, feedsData } = payload;
                    const session = sessions[sessionId];
                    if (!session) throw new Error("Session not initialized: " + sessionId);

                    // Reconstruct ort.Tensor from feedsData
                    const feeds = {};
                    for (const key of Object.keys(feedsData)) {
                        const fd = feedsData[key];
                        feeds[key] = new ort.Tensor(fd.type, fd.data, fd.dims);
                    }

                    // Run model
                    const results = await session.run(feeds);
                    
                    // Extract output buffer for Transfer (Zero-copy)
                    const outputData = {};
                    const transferables = [];
                    
                    for (const key of Object.keys(results)) {
                        const tensor = results[key];
                        outputData[key] = {
                            type: tensor.type,
                            data: tensor.data,
                            dims: tensor.dims
                        };
                        // Add buffer to transfer list to optimize speed
                        if (tensor.data.buffer) {
                            transferables.push(tensor.data.buffer);
                        }
                    }

                    // Explicit Disposal: Free input Tensors
                    for (const key of Object.keys(feeds)) {
                        if (feeds[key].dispose) {
                            feeds[key].dispose();
                        }
                    }
                    // Explicit Disposal: Free output Tensors (after buffer is transferred)
                    for (const key of Object.keys(results)) {
                        if (results[key].dispose) {
                            results[key].dispose();
                        }
                    }

                    self.postMessage({ id, success: true, result: outputData }, transferables);
                }
                else if (type === 'DISPOSE_SESSION') {
                    const { sessionId } = payload;
                    const session = sessions[sessionId];
                    if (session) {
                        if (session.release) {
                            await session.release();
                        }
                        delete sessions[sessionId];
                    }
                    self.postMessage({ id, success: true });
                }
            } catch (error) {
                self.postMessage({ id, success: false, error: error.toString() });
            }
        };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    return new Worker(URL.createObjectURL(blob));
}
