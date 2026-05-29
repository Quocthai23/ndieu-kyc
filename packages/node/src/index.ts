/**
 * NDieu Edge AI Hub - Phiên bản dành cho Node.js (Backend)
 * Tự động đóng gói và tiêm động `onnxruntime-node` hỗ trợ chạy trên máy chủ CPU/GPU.
 */

import * as ortNode from 'onnxruntime-node';
import { 
    DocumentExtractor as CoreDocumentExtractor, 
    DocumentExtractorConfig as CoreDocConfig,
    FaceMatcher as CoreFaceMatcher,
    FaceMatcherConfig as CoreFaceConfig,
    LivenessDetector as CoreLivenessDetector,
    LivenessDetectorConfig as CoreLivenessConfig
} from '@ndieu/kyc-core';

// Xuất các hàm tiện ích và kiểu dữ liệu từ core
export * from '@ndieu/kyc-core';

/**
 * Trình trích xuất thông tin giấy tờ tùy thân chuyên dụng cho Node.js
 */
export class DocumentExtractor extends CoreDocumentExtractor {
    constructor(config: Omit<CoreDocConfig, 'ort'> = {}) {
        super({ ort: ortNode, ...config });
    }
}

/**
 * Bộ so khớp gương mặt chuyên dụng cho Node.js
 */
export class FaceMatcher extends CoreFaceMatcher {
    constructor(config: Omit<CoreFaceConfig, 'ort'> = {}) {
        super({ ort: ortNode, ...config });
    }
}

/**
 * Bộ kiểm tra thực thể sống chuyên dụng cho Node.js
 */
export class LivenessDetector extends CoreLivenessDetector {
    constructor(config: Omit<CoreLivenessConfig, 'ort'> = {}) {
        super({ ort: ortNode, ...config });
    }
}
