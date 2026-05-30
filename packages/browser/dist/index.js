"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  DocumentExtractor: () => DocumentExtractor,
  FaceMatcher: () => FaceMatcher,
  LivenessDetector: () => LivenessDetector,
  browserImageToInput: () => import_kyc_core2.browserImageToInput,
  browserResizeImage: () => import_kyc_core2.browserResizeImage,
  loadImage: () => import_kyc_core2.loadImage
});
module.exports = __toCommonJS(index_exports);
var ortWeb2 = __toESM(require("onnxruntime-web"));
var import_kyc_core = require("@ndieu/kyc-core");
var import_kyc_core2 = require("@ndieu/kyc-core");

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
var ortWeb = __toESM(require("onnxruntime-web"));
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
__reExport(index_exports, require("@ndieu/kyc-core"), module.exports);
var workerOrt = {
  ...ortWeb2,
  InferenceSession: {
    create: async (modelBuffer, options) => {
      return await createWorkerSession(modelBuffer, options);
    }
  }
};
var DocumentExtractor = class extends import_kyc_core.DocumentExtractor {
  constructor(config = {}) {
    super({ ort: workerOrt, ...config });
  }
  /**
   * Ghi đè hàm extract để hỗ trợ cả DOM Image/Canvas và ImageInput chuẩn hóa
   */
  async extract(imageSource) {
    const input = "data" in imageSource ? imageSource : (0, import_kyc_core2.browserImageToInput)(imageSource);
    return super.extract(input);
  }
};
var FaceMatcher = class extends import_kyc_core.FaceMatcher {
  constructor(config = {}) {
    super({ ort: workerOrt, ...config });
  }
  /**
   * Trích xuất đặc trưng khuôn mặt từ ảnh của Trình duyệt hoặc cấu trúc ImageInput
   */
  async extractEmbedding(imageSource) {
    const input = "data" in imageSource ? imageSource : (0, import_kyc_core2.browserImageToInput)(imageSource);
    return super.extractEmbedding(input);
  }
  /**
   * So khớp hai khuôn mặt từ các ảnh của Trình duyệt hoặc cấu trúc ImageInput
   */
  async match(documentImage, selfieImage) {
    const docInput = "data" in documentImage ? documentImage : (0, import_kyc_core2.browserImageToInput)(documentImage);
    const selfieInput = "data" in selfieImage ? selfieImage : (0, import_kyc_core2.browserImageToInput)(selfieImage);
    return super.match(docInput, selfieInput);
  }
};
var LivenessDetector = class extends import_kyc_core.LivenessDetector {
  constructor(config = {}) {
    super({ ort: workerOrt, ...config });
  }
  /**
   * Phân tích thực thể sống thụ động trên Trình duyệt
   */
  async analyzePassive(imageSource) {
    const input = "data" in imageSource ? imageSource : (0, import_kyc_core2.browserImageToInput)(imageSource);
    return super.analyzePassive(input);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DocumentExtractor,
  FaceMatcher,
  LivenessDetector,
  browserImageToInput,
  browserResizeImage,
  loadImage,
  ...require("@ndieu/kyc-core")
});
//# sourceMappingURL=index.js.map