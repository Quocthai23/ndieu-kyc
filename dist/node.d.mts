import { DocumentExtractor as DocumentExtractor$1, DocumentExtractorConfig, FaceMatcher as FaceMatcher$1, FaceMatcherConfig, LivenessDetector as LivenessDetector$1, LivenessDetectorConfig } from './core.mjs';
export { DEFAULT_NORMALIZE_CONFIG, ExtractedDocumentData, ExtractedResult, ImageInput, LivenessAction, LivenessChallenge, LivenessResult, MatchResult, NormalizeConfig, cosineSimilarity, preprocessImage, resizeRGBA } from './core.mjs';

/**
 * NDieu Edge AI Hub - Phiên bản dành cho Node.js (Backend)
 * Tự động đóng gói và tiêm động `onnxruntime-node` hỗ trợ chạy trên máy chủ CPU/GPU.
 */

/**
 * Trình trích xuất thông tin giấy tờ tùy thân chuyên dụng cho Node.js
 */
declare class DocumentExtractor extends DocumentExtractor$1 {
    constructor(config?: Omit<DocumentExtractorConfig, 'ort'>);
}
/**
 * Bộ so khớp gương mặt chuyên dụng cho Node.js
 */
declare class FaceMatcher extends FaceMatcher$1 {
    constructor(config?: Omit<FaceMatcherConfig, 'ort'>);
}
/**
 * Bộ kiểm tra thực thể sống chuyên dụng cho Node.js
 */
declare class LivenessDetector extends LivenessDetector$1 {
    constructor(config?: Omit<LivenessDetectorConfig, 'ort'>);
}

export { DocumentExtractor, DocumentExtractorConfig, FaceMatcher, FaceMatcherConfig, LivenessDetector, LivenessDetectorConfig };
