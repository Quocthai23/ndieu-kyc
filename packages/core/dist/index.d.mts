import { ImageInput } from './core.mjs';
export { BBox, DEFAULT_NORMALIZE_CONFIG, DocumentExtractor, DocumentExtractorConfig, ExtractedDocumentData, ExtractedResult, FaceMatcher, FaceMatcherConfig, LivenessAction, LivenessChallenge, LivenessDetector, LivenessDetectorConfig, LivenessResult, MatchResult, NormalizeConfig, cosineSimilarity, preprocessImage, resizeRGBA } from './core.mjs';

/**
 * Tải ảnh từ URL hoặc chuỗi Base64 (Chỉ hoạt động trên Trình duyệt)
 * @param src Đường dẫn ảnh hoặc dữ liệu Base64
 */
declare function loadImage(src: string): Promise<HTMLImageElement>;
/**
 * Chuyển đổi các định dạng ảnh của Trình duyệt (HTMLImageElement hoặc HTMLCanvasElement) sang cấu trúc ImageInput
 * @param source Đối tượng ảnh DOM của trình duyệt
 */
declare function browserImageToInput(source: HTMLImageElement | HTMLCanvasElement): ImageInput;
/**
 * Resize ảnh sử dụng Hardware Acceleration (GPU) của trình duyệt thông qua Canvas API
 * @param source Đối tượng ảnh DOM
 * @param targetWidth Chiều rộng mong muốn
 * @param targetHeight Chiều cao mong muốn
 */
declare function browserResizeImage(source: HTMLImageElement | HTMLCanvasElement, targetWidth: number, targetHeight: number): ImageInput;

export { ImageInput, browserImageToInput, browserResizeImage, loadImage };
