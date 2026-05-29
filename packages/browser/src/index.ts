/**
 * NDieu Edge AI Hub - Phiên bản dành cho Trình duyệt (Web)
 * Tự động đóng gói và tiêm động `onnxruntime-web`.
 * Sử dụng Inline Web Worker và Auto-Degradation WebGPU để chạy mô hình AI không block UI.
 */

import * as ortWeb from 'onnxruntime-web';
import { 
    DocumentExtractor as CoreDocumentExtractor, 
    DocumentExtractorConfig as CoreDocConfig,
    ExtractedResult,
    FaceMatcher as CoreFaceMatcher,
    FaceMatcherConfig as CoreFaceConfig,
    MatchResult,
    LivenessDetector as CoreLivenessDetector,
    LivenessDetectorConfig as CoreLivenessConfig,
    LivenessResult,
    ImageInput
} from '@ndieu/kyc-core';

import { browserImageToInput, loadImage, browserResizeImage } from '@ndieu/kyc-core';
import { createWorkerSession } from './engine';

export { loadImage, browserImageToInput, browserResizeImage };

// Xuất các hàm tiện ích và kiểu dữ liệu từ core
export * from '@ndieu/kyc-core';

/**
 * Proxy đối tượng ORT để đánh lừa các class Core rằng chúng đang chạy cục bộ,
 * nhưng thực chất lệnh tạo Session được chuyển hướng tới Inline Web Worker.
 */
const workerOrt = {
    ...ortWeb,
    InferenceSession: {
        create: async (modelBuffer: string | Uint8Array, options: any) => {
            return await createWorkerSession(modelBuffer, options);
        }
    }
};

/**
 * Trình trích xuất thông tin giấy tờ tùy thân chuyên dụng cho Trình duyệt
 */
export class DocumentExtractor extends CoreDocumentExtractor {
    constructor(config: Omit<CoreDocConfig, 'ort'> = {}) {
        super({ ort: workerOrt, ...config });
    }

    /**
     * Ghi đè hàm extract để hỗ trợ cả DOM Image/Canvas và ImageInput chuẩn hóa
     */
    async extract(imageSource: HTMLImageElement | HTMLCanvasElement | ImageInput): Promise<ExtractedResult> {
        const input = ('data' in imageSource) 
            ? imageSource 
            : browserImageToInput(imageSource);
        return super.extract(input);
    }
}

/**
 * Bộ so khớp gương mặt chuyên dụng cho Trình duyệt
 */
export class FaceMatcher extends CoreFaceMatcher {
    constructor(config: Omit<CoreFaceConfig, 'ort'> = {}) {
        super({ ort: workerOrt, ...config });
    }

    /**
     * Trích xuất đặc trưng khuôn mặt từ ảnh của Trình duyệt hoặc cấu trúc ImageInput
     */
    async extractEmbedding(imageSource: HTMLImageElement | HTMLCanvasElement | ImageInput): Promise<Float32Array> {
        const input = ('data' in imageSource) 
            ? imageSource 
            : browserImageToInput(imageSource);
        return super.extractEmbedding(input);
    }

    /**
     * So khớp hai khuôn mặt từ các ảnh của Trình duyệt hoặc cấu trúc ImageInput
     */
    async match(
        documentImage: HTMLImageElement | HTMLCanvasElement | ImageInput,
        selfieImage: HTMLImageElement | HTMLCanvasElement | ImageInput
    ): Promise<MatchResult> {
        const docInput = ('data' in documentImage) 
            ? documentImage 
            : browserImageToInput(documentImage);
        const selfieInput = ('data' in selfieImage) 
            ? selfieImage 
            : browserImageToInput(selfieImage);
        return super.match(docInput, selfieInput);
    }
}

/**
 * Bộ kiểm tra thực thể sống chuyên dụng cho Trình duyệt
 */
export class LivenessDetector extends CoreLivenessDetector {
    constructor(config: Omit<CoreLivenessConfig, 'ort'> = {}) {
        super({ ort: workerOrt, ...config });
    }

    /**
     * Phân tích thực thể sống thụ động trên Trình duyệt
     */
    async analyzePassive(imageSource: HTMLImageElement | HTMLCanvasElement | ImageInput): Promise<LivenessResult> {
        const input = ('data' in imageSource) 
            ? imageSource 
            : browserImageToInput(imageSource);
        return super.analyzePassive(input);
    }
}
