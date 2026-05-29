import { ImageInput } from '../interfaces/common.types';

/**
 * Tải ảnh từ URL hoặc chuỗi Base64 (Chỉ hoạt động trên Trình duyệt)
 * @param src Đường dẫn ảnh hoặc dữ liệu Base64
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || typeof Image === 'undefined') {
            return reject(new Error("[NDieu Web Utils] Hàm loadImage chỉ có thể chạy trên môi trường Trình duyệt (Browser)."));
        }
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(new Error(`Không thể tải ảnh từ nguồn: ${src}. Chi tiết: ${err}`));
        img.src = src;
    });
}

/**
 * Chuyển đổi các định dạng ảnh của Trình duyệt (HTMLImageElement hoặc HTMLCanvasElement) sang cấu trúc ImageInput
 * @param source Đối tượng ảnh DOM của trình duyệt
 */
export function browserImageToInput(source: HTMLImageElement | HTMLCanvasElement): ImageInput {
    if (typeof document === 'undefined') {
        throw new Error("[NDieu Web Utils] Không thể chuyển đổi ảnh DOM trên môi trường không có tài liệu (document).");
    }

    const canvas = document.createElement('canvas');
    
    // Lấy kích thước tự nhiên hoặc kích thước hiện tại của đối tượng DOM
    const width = source instanceof HTMLImageElement ? source.naturalWidth : source.width;
    const height = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
    
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error("[NDieu Web Utils] Không thể lấy Context 2D của Canvas.");
    }
    
    // Vẽ ảnh lên canvas để trích xuất pixel
    ctx.drawImage(source, 0, 0);
    const imgData = ctx.getImageData(0, 0, width, height);
    
    return {
        data: imgData.data,
        width: width,
        height: height
    };
}

/**
 * Resize ảnh sử dụng Hardware Acceleration (GPU) của trình duyệt thông qua Canvas API
 * @param source Đối tượng ảnh DOM
 * @param targetWidth Chiều rộng mong muốn
 * @param targetHeight Chiều cao mong muốn
 */
export function browserResizeImage(source: HTMLImageElement | HTMLCanvasElement, targetWidth: number, targetHeight: number): ImageInput {
    if (typeof document === 'undefined') {
        throw new Error("[NDieu Web Utils] Không thể resize ảnh trên môi trường không có tài liệu (document).");
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error("[NDieu Web Utils] Không thể lấy Context 2D của Canvas.");
    }
    
    // Sử dụng drawImage để trình duyệt tự động dùng GPU nội suy điểm ảnh
    ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
    const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    
    return {
        data: imgData.data,
        width: targetWidth,
        height: targetHeight
    };
}
