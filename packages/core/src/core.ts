/**
 * NDieu Edge AI Hub - Phiên bản Core đa nền tảng
 * Điểm xuất phát của thư viện lõi độc lập, không phụ thuộc môi trường (Browser/Node/React Native).
 * Nhà phát triển cần truyền thủ công đối tượng `ort` (ONNX Runtime) tương ứng của nền tảng khi khởi tạo.
 */

export { 
    DocumentExtractor, 
} from './services/document-extractor';

export { 
    FaceMatcher, 
} from './services/face-matcher';

export { 
    LivenessDetector, 
} from './services/liveness-detector';

export {
    preprocessImage,
    resizeRGBA,
    cosineSimilarity,
    DEFAULT_NORMALIZE_CONFIG
} from './utils/image-utils';

export * from './interfaces';
