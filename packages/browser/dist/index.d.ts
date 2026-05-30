import { DocumentExtractor as DocumentExtractor$1, DocumentExtractorConfig, ImageInput, ExtractedResult, FaceMatcher as FaceMatcher$1, FaceMatcherConfig, MatchResult, LivenessDetector as LivenessDetector$1, LivenessDetectorConfig, LivenessResult } from '@ndieu/kyc-core';
export * from '@ndieu/kyc-core';
export { browserImageToInput, browserResizeImage, loadImage } from '@ndieu/kyc-core';

/**
 * NDieu Edge AI Hub - Phiên bản dành cho Trình duyệt (Web)
 * Tự động đóng gói và tiêm động `onnxruntime-web`.
 * Sử dụng Inline Web Worker và Auto-Degradation WebGPU để chạy mô hình AI không block UI.
 */

/**
 * Trình trích xuất thông tin giấy tờ tùy thân chuyên dụng cho Trình duyệt
 */
declare class DocumentExtractor extends DocumentExtractor$1 {
    constructor(config?: Omit<DocumentExtractorConfig, 'ort'>);
    /**
     * Ghi đè hàm extract để hỗ trợ cả DOM Image/Canvas và ImageInput chuẩn hóa
     */
    extract(imageSource: HTMLImageElement | HTMLCanvasElement | ImageInput): Promise<ExtractedResult>;
}
/**
 * Bộ so khớp gương mặt chuyên dụng cho Trình duyệt
 */
declare class FaceMatcher extends FaceMatcher$1 {
    constructor(config?: Omit<FaceMatcherConfig, 'ort'>);
    /**
     * Trích xuất đặc trưng khuôn mặt từ ảnh của Trình duyệt hoặc cấu trúc ImageInput
     */
    extractEmbedding(imageSource: HTMLImageElement | HTMLCanvasElement | ImageInput): Promise<Float32Array>;
    /**
     * So khớp hai khuôn mặt từ các ảnh của Trình duyệt hoặc cấu trúc ImageInput
     */
    match(documentImage: HTMLImageElement | HTMLCanvasElement | ImageInput, selfieImage: HTMLImageElement | HTMLCanvasElement | ImageInput): Promise<MatchResult>;
}
/**
 * Bộ kiểm tra thực thể sống chuyên dụng cho Trình duyệt
 */
declare class LivenessDetector extends LivenessDetector$1 {
    constructor(config?: Omit<LivenessDetectorConfig, 'ort'>);
    /**
     * Phân tích thực thể sống thụ động trên Trình duyệt
     */
    analyzePassive(imageSource: HTMLImageElement | HTMLCanvasElement | ImageInput): Promise<LivenessResult>;
}

export { DocumentExtractor, FaceMatcher, LivenessDetector };
