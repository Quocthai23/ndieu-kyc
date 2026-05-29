import * as ortWeb from 'onnxruntime-web';
import { DocumentExtractor, FaceMatcher, LivenessDetector } from '@ndieu/kyc-core';

// Set up ONNX Web worker configuration
ortWeb.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.0/dist/';

const documentExtractor = new DocumentExtractor({ ort: ortWeb });
const faceMatcher = new FaceMatcher({ ort: ortWeb });
const livenessDetector = new LivenessDetector({ ort: ortWeb });

self.onmessage = async (event) => {
    const { action, payload, id } = event.data;

    try {
        let result;
        switch (action) {
            case 'INIT_DOCUMENT':
                await documentExtractor.initialize(payload.detModel, payload.recModel, payload.options);
                result = { success: true };
                break;
            case 'EXTRACT_DOCUMENT':
                result = await documentExtractor.extract(payload.image);
                break;
            case 'INIT_FACE':
                await faceMatcher.initialize(payload.detModel, payload.recModel, payload.options);
                result = { success: true };
                break;
            case 'MATCH_FACE':
                result = await faceMatcher.match(payload.documentImage, payload.selfieImage);
                break;
            case 'INIT_LIVENESS':
                await livenessDetector.initialize(payload.model, payload.options);
                result = { success: true };
                break;
            case 'ANALYZE_LIVENESS':
                result = await livenessDetector.analyzePassive(payload.image);
                break;
            default:
                throw new Error(`[Worker] Unknown action: ${action}`);
        }

        self.postMessage({ id, result });
    } catch (error: any) {
        self.postMessage({ id, error: error.message || String(error) });
    }
};
