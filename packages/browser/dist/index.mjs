// src/index.ts
import * as ortWeb2 from "onnxruntime-web";
import {
  DocumentExtractor as CoreDocumentExtractor,
  FaceMatcher as CoreFaceMatcher,
  LivenessDetector as CoreLivenessDetector
} from "@ndieu/kyc-core";
import { browserImageToInput, loadImage, browserResizeImage } from "@ndieu/kyc-core";

// src/worker-builder.ts
function createKycWorker() {
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
  const blob = new Blob([workerCode], { type: "application/javascript" });
  return new Worker(URL.createObjectURL(blob));
}

// src/engine.ts
import * as ortWeb from "onnxruntime-web";
var sharedWorker = null;
var msgIdCounter = 0;
function getSharedWorker() {
  if (!sharedWorker) {
    sharedWorker = createKycWorker();
  }
  return sharedWorker;
}
function postToWorker(worker, type, payload, transferables = [], onProgress) {
  return new Promise((resolve, reject) => {
    const id = ++msgIdCounter;
    const handler = (e) => {
      if (e.data.id === id) {
        if (e.data.type === "PROGRESS") {
          if (onProgress) {
            onProgress(e.data.payload.progress);
          }
          return;
        }
        worker.removeEventListener("message", handler);
        if (e.data.success) {
          resolve(e.data);
        } else {
          reject(new Error(e.data.error));
        }
      }
    };
    worker.addEventListener("message", handler);
    worker.postMessage({ id, type, payload }, transferables);
  });
}
var WorkerInferenceSession = class {
  sessionId;
  worker;
  constructor(worker, sessionId) {
    this.worker = worker;
    this.sessionId = sessionId;
  }
  /**
   * Send tensor data to worker and get response
   * Uses Transferable objects for 0ms latency
   */
  async run(feeds) {
    const feedsData = {};
    const transferables = [];
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
    const response = await postToWorker(this.worker, "RUN_SESSION", {
      sessionId: this.sessionId,
      feedsData
    }, transferables);
    const results = {};
    for (const key of Object.keys(response.result)) {
      const res = response.result[key];
      results[key] = new ortWeb.Tensor(res.type, res.data, res.dims);
    }
    return results;
  }
  /**
   * Destroy session and release memory from C++/WASM layer
   */
  async release() {
    await postToWorker(this.worker, "DISPOSE_SESSION", { sessionId: this.sessionId });
  }
};
async function createWorkerSession(modelBuffer, options = {}) {
  const worker = getSharedWorker();
  await postToWorker(worker, "LOAD_ORT", {});
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const executionProviders = options.executionProviders || ["webgpu", "webgl", "wasm"];
  await postToWorker(worker, "INIT_SESSION", {
    sessionId,
    modelBuffer,
    executionProviders
  }, [], options.onProgress);
  return new WorkerInferenceSession(worker, sessionId);
}

// src/index.ts
export * from "@ndieu/kyc-core";
var workerOrt = {
  ...ortWeb2,
  InferenceSession: {
    create: async (modelBuffer, options) => {
      return await createWorkerSession(modelBuffer, options);
    }
  }
};
var DocumentExtractor = class extends CoreDocumentExtractor {
  constructor(config = {}) {
    super({ ort: workerOrt, ...config });
  }
  /**
   * Ghi đè hàm extract để hỗ trợ cả DOM Image/Canvas và ImageInput chuẩn hóa
   */
  async extract(imageSource) {
    const input = "data" in imageSource ? imageSource : browserImageToInput(imageSource);
    return super.extract(input);
  }
};
var FaceMatcher = class extends CoreFaceMatcher {
  constructor(config = {}) {
    super({ ort: workerOrt, ...config });
  }
  /**
   * Trích xuất đặc trưng khuôn mặt từ ảnh của Trình duyệt hoặc cấu trúc ImageInput
   */
  async extractEmbedding(imageSource) {
    const input = "data" in imageSource ? imageSource : browserImageToInput(imageSource);
    return super.extractEmbedding(input);
  }
  /**
   * So khớp hai khuôn mặt từ các ảnh của Trình duyệt hoặc cấu trúc ImageInput
   */
  async match(documentImage, selfieImage) {
    const docInput = "data" in documentImage ? documentImage : browserImageToInput(documentImage);
    const selfieInput = "data" in selfieImage ? selfieImage : browserImageToInput(selfieImage);
    return super.match(docInput, selfieInput);
  }
};
var LivenessDetector = class extends CoreLivenessDetector {
  constructor(config = {}) {
    super({ ort: workerOrt, ...config });
  }
  /**
   * Phân tích thực thể sống thụ động trên Trình duyệt
   */
  async analyzePassive(imageSource) {
    const input = "data" in imageSource ? imageSource : browserImageToInput(imageSource);
    return super.analyzePassive(input);
  }
};
export {
  DocumentExtractor,
  FaceMatcher,
  LivenessDetector,
  browserImageToInput,
  browserResizeImage,
  loadImage
};
//# sourceMappingURL=index.mjs.map