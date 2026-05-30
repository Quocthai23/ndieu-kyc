/**
 * Tiện ích tiền xử lý ảnh cho Edge AI đa nền tảng.
 * Hỗ trợ chuyển đổi và chuẩn hóa ảnh từ ImageInput sang Tensor dữ liệu (Float32Array).
 * Hoạt động hoàn toàn bằng JS thuần, độc lập môi trường (Browser, Node.js, React Native).
 */
/**
 * Cấu trúc hình ảnh tiêu chuẩn đa nền tảng (dữ liệu pixel phẳng dạng RGBA)
 */
interface ImageInput {
    data: Uint8Array | Uint8ClampedArray;
    width: number;
    height: number;
}
/**
 * Cấu hình chuẩn hóa (Normalization) cho Pixel ảnh
 */
interface NormalizeConfig {
    mean: [number, number, number];
    std: [number, number, number];
    channelOrder: 'RGB' | 'BGR';
}
/**
 * Mặc định chuẩn hóa ảnh về đoạn [0, 1] không trừ mean/std
 */
declare const DEFAULT_NORMALIZE_CONFIG: NormalizeConfig;
/**
 * Thu nhỏ/phóng to ảnh RGBA phẳng bằng thuật toán Nội suy song tuyến tính (Bilinear Interpolation).
 * Không phụ thuộc vào Canvas hay bất cứ thư viện native nào bên ngoài.
 */
declare function resizeRGBA(input: Uint8Array | Uint8ClampedArray, width: number, height: number, targetWidth: number, targetHeight: number): Uint8Array;
/**
 * Tiền xử lý ảnh: Thay đổi kích thước (Resize) và chuẩn hóa (Normalize) về Tensor 1D Float32Array (dạng CHW)
 * @param source Đối tượng hình ảnh chuẩn ImageInput
 * @param targetWidth Chiều rộng đích của mô hình
 * @param targetHeight Chiều cao đích của mô hình
 * @param config Cấu hình chuẩn hóa (Mean, Std, Channel Order)
 */
declare function preprocessImage(source: ImageInput, targetWidth: number, targetHeight: number, config?: NormalizeConfig): Float32Array;
/**
 * Tính toán độ tương đồng Cosine (Cosine Similarity) giữa hai vector đặc trưng
 * @param vecA Vector A
 * @param vecB Vector B
 */
declare function cosineSimilarity(vecA: number[] | Float32Array, vecB: number[] | Float32Array): number;

/**
 * Cấu hình cho bộ trích xuất giấy tờ DocumentExtractor
 */
interface DocumentExtractorConfig {
    ort: any;
    confidenceThreshold?: number;
}
/**
 * Cấu trúc thông tin trích xuất chuẩn từ CCCD/CMND/GPLX Việt Nam
 */
interface ExtractedDocumentData {
    idNumber: string;
    fullName: string;
    dateOfBirth: string;
    gender: string;
    nationality: string;
    hometown: string;
    residence: string;
    expiryDate: string;
    documentType: 'CCCD_CHIP' | 'CCCD_CODE' | 'CMND_9_12' | 'GPLX' | 'UNKNOWN';
}
interface ExtractedResult {
    success: boolean;
    message: string;
    confidence: number;
    data: Partial<ExtractedDocumentData>;
    rawTexts: string[];
}
declare class DocumentExtractor {
    private detSession;
    private recSession;
    private config;
    constructor(config: DocumentExtractorConfig);
    /**
     * Khởi tạo các session ONNX Runtime cho phát hiện và nhận dạng ký tự
     * @param detModel Đường dẫn URL hoặc Buffer nhị phân (Uint8Array) của mô hình phát hiện chữ (.onnx)
     * @param recModel Đường dẫn URL hoặc Buffer nhị phân (Uint8Array) của mô hình nhận dạng chữ (.onnx)
     * @param options Tùy chọn cấu hình Session cho ONNX Runtime (Mặc định sử dụng WASM)
     */
    initialize(detModel: string | Uint8Array, recModel: string | Uint8Array, options?: any): Promise<void>;
    /**
     * Trích xuất thông tin giấy tờ tùy thân từ đối tượng hình ảnh tiêu chuẩn
     * @param image Đối tượng hình ảnh tiêu chuẩn ImageInput
     */
    extract(image: ImageInput): Promise<ExtractedResult>;
    /**
     * Bộ parser quy tắc (Rule-based & Heuristics Regex) chuyên sâu dành cho tài liệu tùy thân Việt Nam
     * @param texts Mảng các chuỗi ký tự nhận diện được xếp từ trên xuống dưới, trái qua phải
     */
    parseVietnameseIdCard(texts: string[]): Partial<ExtractedDocumentData>;
    private isAllUpperCase;
    /**
     * Mô phỏng văn bản thô OCR nhận diện được từ mẫu CCCD Chip Việt Nam
     */
    private getSimulatedOcrTexts;
}

/**
 * Cấu hình cho FaceMatcher
 */
interface FaceMatcherConfig {
    ort: any;
    similarityThreshold?: number;
}
interface MatchResult {
    success: boolean;
    similarity: number;
    isMatch: boolean;
    message: string;
}
declare class FaceMatcher {
    private detectorSession;
    private recognizerSession;
    private config;
    constructor(config: FaceMatcherConfig);
    /**
     * Khởi tạo FaceMatcher bằng cách tải mô hình Phát hiện khuôn mặt (BlazeFace) và So khớp (MobileFaceNet)
     * @param detectorModel Đường dẫn URL hoặc Buffer nhị phân (Uint8Array) của mô hình BlazeFace (.onnx)
     * @param recognizerModel Đường dẫn URL hoặc Buffer nhị phân (Uint8Array) của mô hình MobileFaceNet (.onnx)
     * @param options Tùy chọn cấu hình Session cho ONNX Runtime (Mặc định sử dụng WASM)
     */
    initialize(detectorModel: string | Uint8Array, recognizerModel: string | Uint8Array, options?: any): Promise<void>;
    /**
     * Trích xuất Vector Embedding từ ảnh chứa một khuôn mặt
     * @param image Ảnh chứa gương mặt cần trích xuất đặc trưng
     */
    extractEmbedding(image: ImageInput): Promise<Float32Array>;
    /**
     * So sánh ảnh trên giấy tờ và ảnh chân dung (Selfie)
     * @param documentImage Ảnh chân dung cắt ra từ thẻ CCCD/CMND
     * @param selfieImage Ảnh selfie thực tế của khách hàng
     */
    match(documentImage: ImageInput, selfieImage: ImageInput): Promise<MatchResult>;
}

/**
 * Các loại hành động thử thách (Challenge Actions) để kiểm tra thực thể sống
 */
type LivenessAction = 'BLINK' | 'TURN_LEFT' | 'TURN_RIGHT' | 'SMILE' | 'NOD';
interface LivenessChallenge {
    action: LivenessAction;
    instruction: string;
    durationMs: number;
}
interface LivenessResult {
    success: boolean;
    score: number;
    isReal: boolean;
    message: string;
}
interface LivenessDetectorConfig {
    ort: any;
}
declare class LivenessDetector {
    private session;
    private config;
    private currentChallenges;
    private currentChallengeIndex;
    constructor(config: LivenessDetectorConfig);
    /**
     * Khởi tạo bộ kiểm tra thực thể sống với mô hình lượng tử hóa (như MiniFASNet)
     * @param model Đường dẫn URL hoặc Buffer nhị phân (Uint8Array) của mô hình chống giả mạo (.onnx)
     * @param options Tùy chọn cấu hình Session cho ONNX Runtime (Mặc định sử dụng WASM)
     */
    initialize(model?: string | Uint8Array, options?: any): Promise<void>;
    /**
     * Sinh ra chuỗi thử thách hành động ngẫu nhiên cho người dùng (Active Liveness)
     * @param count Số lượng thử thách cần vượt qua (mặc định: 3)
     */
    generateChallenges(count?: number): LivenessChallenge[];
    /**
     * Lấy thử thách hiện tại cần thực hiện
     */
    getCurrentChallenge(): LivenessChallenge | null;
    /**
     * Chuyển sang thử thách tiếp theo trong chuỗi
     */
    nextChallenge(): LivenessChallenge | null;
    /**
     * Phương thức phân tích liveness thông qua mô hình học máy (Passive Liveness)
     * Thường dùng để phân tích xem gương mặt trên ảnh là ảnh chụp màn hình/in ấn hay ảnh thật
     * @param image Đối tượng hình ảnh tiêu chuẩn ImageInput
     */
    analyzePassive(image: ImageInput): Promise<LivenessResult>;
    /**
     * Phương thức đánh giá chỉ số EAR (Eye Aspect Ratio) để xác định việc nháy mắt (BLINK)
     * Công thức toán học tính tỉ lệ mở của mắt từ 6 tọa độ điểm mốc (landmarks)
     * EAR = (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||)
     * @param landmarks Điểm mốc mắt trái hoặc mắt phải
     */
    calculateEAR(landmarks: {
        x: number;
        y: number;
    }[]): number;
}

export { DEFAULT_NORMALIZE_CONFIG, DocumentExtractor, type DocumentExtractorConfig, type ExtractedDocumentData, type ExtractedResult, FaceMatcher, type FaceMatcherConfig, type ImageInput, type LivenessAction, type LivenessChallenge, LivenessDetector, type LivenessDetectorConfig, type LivenessResult, type MatchResult, type NormalizeConfig, cosineSimilarity, preprocessImage, resizeRGBA };
