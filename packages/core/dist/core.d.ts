interface BBox {
    x: number;
    y: number;
    width: number;
    height: number;
}
interface ImageInput {
    data: Uint8Array | Uint8ClampedArray;
    width: number;
    height: number;
}
interface NormalizeConfig {
    mean: [number, number, number];
    std: [number, number, number];
    channelOrder: 'RGB' | 'BGR';
}

interface DocumentExtractorConfig {
    ort: any;
    confidenceThreshold?: number;
}
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
     * Initialize ONNX Runtime sessions for character detection and recognition
     * @param detModel URL path or binary buffer (Uint8Array) of the text detection model (.onnx)
     * @param recModel URL path or binary buffer (Uint8Array) of the text recognition model (.onnx)
     * @param options Session configuration options for ONNX Runtime (Default uses WASM)
     * @param onProgress Callback to track model loading progress
     */
    initialize(detModel: string | Uint8Array, recModel: string | Uint8Array, options?: any, onProgress?: (progress: number, modelName: string) => void): Promise<void>;
    /**
     * Extract identity document information from standard image input
     * @param image Standard image object ImageInput
     */
    extract(image: ImageInput): Promise<ExtractedResult>;
    /**
     * Simulate raw OCR text recognized from a Vietnamese Chip ID card
     */
    private getSimulatedOcrTexts;
    release(): Promise<void>;
}

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
     * Initialize FaceMatcher by loading Face Detection (BlazeFace) and Recognition (MobileFaceNet) models
     * @param detModel URL path or binary buffer (Uint8Array) of the BlazeFace model (.onnx)
     * @param recModel URL path or binary buffer (Uint8Array) of the MobileFaceNet model (.onnx)
     * @param options Session configuration options for ONNX Runtime (Default uses WASM)
     */
    initialize(detModel: string | Uint8Array, recModel: string | Uint8Array, options?: any, onProgress?: (progress: number, modelName: string) => void): Promise<void>;
    /**
     * Extract Vector Embedding from an image containing a face
     * @param image Image containing the face to extract features from
     */
    extractEmbedding(image: ImageInput): Promise<Float32Array>;
    /**
     * Compare document image with portrait image (Selfie)
     * @param documentImage Portrait image cropped from ID card
     * @param selfieImage Actual selfie image of the customer
     */
    match(documentImage: ImageInput, selfieImage: ImageInput): Promise<MatchResult>;
    release(): Promise<void>;
}

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
     * Initialize liveness detector with quantized model (e.g., MiniFASNet)
     * @param model URL path or binary buffer (Uint8Array) of the anti-spoofing model (.onnx)
     * @param options Session configuration options for ONNX Runtime (Default uses WASM)
     */
    initialize(model?: string | Uint8Array, options?: any, onProgress?: (progress: number, modelName: string) => void): Promise<void>;
    /**
     * Generate random action challenges for the user (Active Liveness)
     * @param count Number of challenges to pass (default: 3)
     */
    generateChallenges(count?: number): LivenessChallenge[];
    /**
     * Get the current active challenge
     */
    getCurrentChallenge(): LivenessChallenge | null;
    /**
     * Move to the next challenge in the sequence
     */
    nextChallenge(): LivenessChallenge | null;
    /**
     * Analyze liveness using a machine learning model (Passive Liveness)
     * Typically used to determine if the face in the image is a screen/print or a real face
     * @param image Standard image object ImageInput
     */
    analyzePassive(image: ImageInput): Promise<LivenessResult>;
    /**
     * Evaluate EAR (Eye Aspect Ratio) index to determine blinking (BLINK)
     * Mathematical formula calculates the eye openness ratio from 6 landmark coordinates
     * EAR = (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||)
     * @param landmarks Landmarks of left or right eye
     */
    calculateEAR(landmarks: {
        x: number;
        y: number;
    }[]): number;
    release(): Promise<void>;
}

/**
 * Tiện ích tiền xử lý ảnh cho Edge AI đa nền tảng.
 * Hỗ trợ chuyển đổi và chuẩn hóa ảnh từ ImageInput sang Tensor dữ liệu (Float32Array).
 * Hoạt động hoàn toàn bằng JS thuần, độc lập môi trường (Browser, Node.js, React Native).
 */
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

export { type BBox, DEFAULT_NORMALIZE_CONFIG, DocumentExtractor, type DocumentExtractorConfig, type ExtractedDocumentData, type ExtractedResult, FaceMatcher, type FaceMatcherConfig, type ImageInput, type LivenessAction, type LivenessChallenge, LivenessDetector, type LivenessDetectorConfig, type LivenessResult, type MatchResult, type NormalizeConfig, cosineSimilarity, preprocessImage, resizeRGBA };
