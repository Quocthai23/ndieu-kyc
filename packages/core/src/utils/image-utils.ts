import { ImageInput, NormalizeConfig } from '../interfaces/common.types';

/**
 * Tiện ích tiền xử lý ảnh cho Edge AI đa nền tảng.
 * Hỗ trợ chuyển đổi và chuẩn hóa ảnh từ ImageInput sang Tensor dữ liệu (Float32Array).
 * Hoạt động hoàn toàn bằng JS thuần, độc lập môi trường (Browser, Node.js, React Native).
 */

/**
 * Mặc định chuẩn hóa ảnh về đoạn [0, 1] không trừ mean/std
 */
export const DEFAULT_NORMALIZE_CONFIG: NormalizeConfig = {
    mean: [0.0, 0.0, 0.0],
    std: [1.0, 1.0, 1.0],
    channelOrder: 'RGB'
};

/**
 * Thu nhỏ/phóng to ảnh RGBA phẳng bằng thuật toán Nội suy song tuyến tính (Bilinear Interpolation).
 * Không phụ thuộc vào Canvas hay bất cứ thư viện native nào bên ngoài.
 */
export function resizeRGBA(
    input: Uint8Array | Uint8ClampedArray,
    width: number,
    height: number,
    targetWidth: number,
    targetHeight: number
): Uint8Array {
    const output = new Uint8Array(targetWidth * targetHeight * 4);
    const xRatio = width / targetWidth;
    const yRatio = height / targetHeight;

    for (let cy = 0; cy < targetHeight; cy++) {
        for (let cx = 0; cx < targetWidth; cx++) {
            const px = cx * xRatio;
            const py = cy * yRatio;
            const xL = Math.floor(px);
            const yL = Math.floor(py);
            
            const xH = Math.min(width - 1, xL + 1);
            const yH = Math.min(height - 1, yL + 1);

            const xWeight = px - xL;
            const yWeight = py - yL;

            const idxLL = (yL * width + xL) * 4;
            const idxHL = (yL * width + xH) * 4;
            const idxLH = (yH * width + xL) * 4;
            const idxHH = (yH * width + xH) * 4;

            const outIdx = (cy * targetWidth + cx) * 4;

            for (let c = 0; c < 4; c++) {
                const valLL = input[idxLL + c];
                const valHL = input[idxHL + c];
                const valLH = input[idxLH + c];
                const valHH = input[idxHH + c];

                // Công thức tính toán màu sắc nội suy
                const val = valLL * (1 - xWeight) * (1 - yWeight) +
                            valHL * xWeight * (1 - yWeight) +
                            valLH * (1 - xWeight) * yWeight +
                            valHH * xWeight * yWeight;

                output[outIdx + c] = Math.round(val);
            }
        }
    }
    return output;
}

/**
 * Tiền xử lý ảnh: Thay đổi kích thước (Resize) và chuẩn hóa (Normalize) về Tensor 1D Float32Array (dạng CHW)
 * @param source Đối tượng hình ảnh chuẩn ImageInput
 * @param targetWidth Chiều rộng đích của mô hình
 * @param targetHeight Chiều cao đích của mô hình
 * @param config Cấu hình chuẩn hóa (Mean, Std, Channel Order)
 */
export function preprocessImage(
    source: ImageInput,
    targetWidth: number,
    targetHeight: number,
    config: NormalizeConfig = DEFAULT_NORMALIZE_CONFIG
): Float32Array {
    // 1. Thực hiện thay đổi kích thước ảnh bằng Bilinear Interpolation nếu kích thước không khớp
    let pixelData: Uint8Array | Uint8ClampedArray;
    if (source.width === targetWidth && source.height === targetHeight) {
        pixelData = source.data;
    } else {
        pixelData = resizeRGBA(source.data, source.width, source.height, targetWidth, targetHeight);
    }

    // 2. Chuyển đổi thành dạng CHW (Channels, Height, Width) - [3, H, W]
    const imageChannels = 3;
    const totalPixels = targetWidth * targetHeight;
    const outputBuffer = new Float32Array(imageChannels * totalPixels);

    const [meanR, meanG, meanB] = config.mean;
    const [stdR, stdG, stdB] = config.std;

    for (let i = 0; i < totalPixels; i++) {
        const rIndex = i * 4;
        const gIndex = rIndex + 1;
        const bIndex = rIndex + 2;

        // Chuẩn hóa về [0.0, 1.0] rồi thực hiện công thức: (pixel - mean) / std
        const rVal = (pixelData[rIndex] / 255.0 - meanR) / stdR;
        const gVal = (pixelData[gIndex] / 255.0 - meanG) / stdG;
        const bVal = (pixelData[bIndex] / 255.0 - meanB) / stdB;

        // Điền vào buffer đầu ra theo định dạng CHW
        if (config.channelOrder === 'RGB') {
            outputBuffer[i] = rVal;                   // Kênh R
            outputBuffer[totalPixels + i] = gVal;     // Kênh G
            outputBuffer[totalPixels * 2 + i] = bVal; // Kênh B
        } else {
            outputBuffer[i] = bVal;                   // Kênh B (BGR)
            outputBuffer[totalPixels + i] = gVal;     // Kênh G
            outputBuffer[totalPixels * 2 + i] = rVal; // Kênh R (BGR)
        }
    }

    return outputBuffer;
}

/**
 * Tính toán độ tương đồng Cosine (Cosine Similarity) giữa hai vector đặc trưng
 * @param vecA Vector A
 * @param vecB Vector B
 */
export function cosineSimilarity(vecA: number[] | Float32Array, vecB: number[] | Float32Array): number {
    if (vecA.length !== vecB.length) {
        throw new Error("[NDieu Utils] Hai vector đặc trưng phải có cùng độ dài.");
    }
    
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) {
        return 0; // Tránh chia cho 0
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
