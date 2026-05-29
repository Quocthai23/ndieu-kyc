import fs from 'fs';
import path from 'path';

/**
 * Tự động nhận diện thư mục public dựa trên framework của dự án hiện tại
 * Hỗ trợ Next.js, Vite, CRA (thư mục public) và Angular (thư mục src/assets)
 */
export function getPublicDirectory(): string {
  const cwd = process.cwd();
  
  if (fs.existsSync(path.join(cwd, 'public'))) {
      return 'public';
  }
  
  if (fs.existsSync(path.join(cwd, 'src', 'assets'))) {
      return 'src/assets';
  }
  
  // Trả về mặc định nếu không tìm thấy (ví dụ dự án Node thuần)
  return 'public'; 
}
