# NDieu eKYC - Hệ thống Định danh Điện tử tại Biên (Edge AI)

[![CI Pipeline](https://github.com/ndieu/kyc/actions/workflows/ci.yml/badge.svg)](https://github.com/ndieu/kyc/actions)
[![npm version](https://badge.fury.io/js/@ndieu%2Fkyc-core.svg)](https://badge.fury.io/js/@ndieu%2Fkyc-core)

*Read this in [English](README.md).*

## 🌟 Giới thiệu

**@ndieu/kyc** là giải pháp định danh điện tử (eKYC) mã nguồn mở cấp doanh nghiệp. Điểm đột phá của thư viện này là sử dụng kiến trúc **Edge AI Computing (Tính toán tại Biên)** - tức là toàn bộ quá trình AI nhận diện khuôn mặt và đọc giấy tờ đều diễn ra trực tiếp trên trình duyệt của người dùng, thay vì gửi ảnh lên máy chủ.

**Lợi ích vượt trội:**
- **Bảo mật tuyệt đối (Privacy-by-Design):** Hình ảnh CCCD, khuôn mặt người dùng không bao giờ rời khỏi thiết bị, loại bỏ hoàn toàn nguy cơ lộ lọt dữ liệu nhạy cảm.
- **Tốc độ phản hồi cực nhanh (0ms Latency):** Không cần chờ đợi mạng internet truyền tải ảnh, AI phản hồi kết quả gần như tức thì.
- **Tiết kiệm chi phí Server:** Giảm tải hoàn toàn việc xử lý tính toán nặng nề cho máy chủ backend.
- **Không gây giật lag (No UI Freeze):** Sử dụng Web Worker và WebGPU để chạy ngầm hoàn toàn, không làm ảnh hưởng tới trải nghiệm người dùng.

## ⚙️ Cấu trúc Hệ thống

Thư viện được thiết kế tối ưu với các module chính:
- `@ndieu/kyc-core`: Lõi xử lý AI độc lập môi trường (nhận dạng chữ, trích xuất dữ liệu, so khớp khuôn mặt, kiểm tra liveness).
- `@ndieu/kyc-browser`: Module tối ưu riêng cho Web (Next.js, React, Vue, Vanilla JS). Tích hợp sẵn WebGPU và đa luồng.
- `@ndieu/kyc-node`: Module dùng cho môi trường backend Node.js.

## 🚀 Hướng dẫn Cài đặt & Sử dụng

### 1. Cài đặt thư viện

Bạn cần cài đặt các gói thư viện tương ứng với môi trường sử dụng của mình:

**Dành cho Frontend (Trình duyệt, React, Next.js, Vue, Vanilla JS, v.v.):**
```bash
npm install @ndieu/kyc-browser @ndieu/kyc-core
```

**Dành cho Backend (Node.js):**
```bash
npm install @ndieu/kyc-node @ndieu/kyc-core
```

### 2. Khởi tạo và Tải Mô hình AI (Models)

Thư viện cần các file mô hình AI (`.onnx`) để có thể hoạt động. Chạy lệnh sau trong thư mục gốc của dự án của bạn để tự động tải các mô hình cần thiết vào thư mục `public` (đối với ứng dụng Web):

```bash
npx @ndieu-kyc/cli init
npx @ndieu-kyc/cli download-models
```

### 3. Ví dụ Sử dụng (Dành cho Trình duyệt)

Dưới đây là đoạn mã ví dụ về cách tích hợp hệ thống eKYC vào ứng dụng Web của bạn bằng Javascript/Typescript:

```typescript
import { DocumentExtractor, FaceMatcher, LivenessDetector, loadImage } from '@ndieu/kyc-browser';

async function runEKYC() {
  // 1. Khởi tạo các engine xử lý AI
  // Cấu hình đường dẫn tới thư mục chứa các model (đã tải ở bước 2)
  const docExtractor = new DocumentExtractor({ modelPath: '/models/document_extractor.onnx' });
  const faceMatcher = new FaceMatcher({ modelPath: '/models/face_matcher.onnx' });
  const livenessDetector = new LivenessDetector({ modelPath: '/models/liveness.onnx' });

  // 2. Tải ảnh từ input của người dùng (File) hoặc URL
  const cccdImage = await loadImage(document.getElementById('cccd-input').files[0]);
  const selfieImage = await loadImage(document.getElementById('selfie-input').files[0]);

  // --- BƯỚC A: ĐỌC VÀ TRÍCH XUẤT THÔNG TIN TỪ CCCD (OCR) ---
  console.log("Đang đọc thông tin CCCD...");
  const extractedData = await docExtractor.extract(cccdImage);
  console.log("Kết quả trích xuất:", extractedData);
  // Kết quả chứa: Họ tên, Ngày sinh, Số thẻ, Nơi thường trú...

  // --- BƯỚC B: KIỂM TRA THỰC THỂ SỐNG (LIVENESS DETECTION) ---
  // Đảm bảo ảnh selfie là người thật, chống dùng ảnh in giấy hoặc ảnh chụp qua màn hình thiết bị khác
  console.log("Đang phân tích thực thể sống...");
  const livenessResult = await livenessDetector.analyzePassive(selfieImage);
  if (!livenessResult.isLive) {
      alert("Phát hiện có dấu hiệu giả mạo khuôn mặt!");
      return;
  }

  // --- BƯỚC C: SO KHỚP KHUÔN MẶT (FACE MATCHING) ---
  console.log("Đang so khớp khuôn mặt trên thẻ CCCD và ảnh Selfie...");
  const matchResult = await faceMatcher.match(cccdImage, selfieImage);
  
  if (matchResult.isMatch) {
      console.log(`Xác thực thành công! Độ trùng khớp: ${matchResult.confidence}%`);
  } else {
      console.log(`Xác thực thất bại! Khuôn mặt không khớp.`);
  }
}

// Chạy luồng eKYC
runEKYC();
```

## 🏗️ Kiến trúc Công nghệ

```mermaid
graph TD
    UI[Giao diện Web / Next.js / React] -->|Hình ảnh / Video| WorkerProxy[Luồng Xử lý Ngầm - Web Worker]
    
    subgraph Engine AI (Trình duyệt)
        WorkerProxy --> Session[ONNX Inference Session]
        Session -->|Ưu tiên số 1| GPU[WebGPU]
        Session -.Dự phòng.-> GL[WebGL]
        Session -.Dự phòng.-> WASM[WebAssembly CPU]
    end
    
    Session -->|Trả kết quả tức thì| PostProc[Dịch vụ Xử lý Hậu kỳ]
    PostProc --> OCR[Đọc CCCD]
    PostProc --> Face[So khớp Mặt]
    PostProc --> Liveness[Chống Giả mạo]
```

Hệ thống được trang bị cơ chế **Auto-Degradation (Tự động lùi cấp phần cứng)**:
1. Nếu thiết bị / trình duyệt hỗ trợ **WebGPU** (tốc độ nhanh nhất), engine sẽ ưu tiên sử dụng.
2. Nếu không có WebGPU, engine sẽ tự động lùi về sử dụng **WebGL**.
3. Cuối cùng, nếu không hỗ trợ tăng tốc phần cứng, engine sẽ sử dụng **WebAssembly (WASM)** trên vi xử lý trung tâm (CPU).

Tất cả các tính toán AI tensor nặng nề đều được cô lập trong một luồng riêng biệt (**Inline Web Worker**), giúp giao diện web luôn phản hồi mượt mà ở tốc độ 60fps mà không bao giờ bị đứng máy (UI Freeze).

## 🛡️ Tích hợp Liên tục (CI/CD)
Dự án được thiết lập chu trình tự động (CI) qua GitHub Actions, tự động kiểm thử Vitest trên mỗi Pull Request. Các phiên bản NPM được phát hành hoàn toàn tự động qua **Semantic Release**.

---
*Phát triển bởi NDieu. Được cấp phép theo chuẩn MIT License.*
