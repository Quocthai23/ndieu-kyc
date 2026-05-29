# XÂY DỰNG WEBSITE TÍCH HỢP HỆ THỐNG ĐỊNH DANH ĐIỆN TỬ EKYC TẠI BIÊN SỬ DỤNG ONNX VÀ NEXT.JS

[![CI Pipeline](https://github.com/ndieu/kyc/actions/workflows/ci.yml/badge.svg)](https://github.com/ndieu/kyc/actions)
[![npm version](https://badge.fury.io/js/@ndieu%2Fkyc-core.svg)](https://badge.fury.io/js/@ndieu%2Fkyc-core)

*Read this in [English](README.md).*

## Tổng Quan Đề Tài (Abstract)
Hệ thống **@ndieu-kyc** là một thư viện mã nguồn mở cấp doanh nghiệp (Enterprise-grade) chuyên cung cấp giải pháp định danh điện tử (eKYC). Điểm đột phá của hệ thống nằm ở **Kiến trúc Tính toán tại Biên (Edge AI Computing)**, loại bỏ hoàn toàn việc truyền hình ảnh nhạy cảm lên máy chủ đám mây, giúp giảm thiểu độ trễ xuống mức 0ms và giải quyết triệt để rủi ro rò rỉ dữ liệu (Privacy-by-Design).

Hệ thống tận dụng engine **ONNX Runtime Web**, phối hợp cùng **WebGPU / WebGL**, và quản lý luồng bằng **Inline Web Worker**, đảm bảo tốc độ nội suy Tensor mạnh mẽ nhưng không gây đóng băng giao diện người dùng (UI Freeze).

## Kiến trúc Hệ thống (Architecture)

```mermaid
graph TD
    UI[Giao diện Next.js / Web App] -->|Hình ảnh / Video Frame| WorkerProxy[Worker Inference Session Proxy]
    
    subgraph Web Worker (Background Thread)
        WorkerProxy -->|ArrayBuffer (Transferable)| Session[ONNX Inference Session]
        Session -->|Auto-Degradation| GPU[WebGPU]
        Session -.Fallback.-> GL[WebGL]
        Session -.Fallback.-> WASM[WebAssembly]
    end
    
    Session -->|Kết quả Tensor (0ms)| PostProc[Post-Processing Services]
    PostProc --> OCR[Document Extractor]
    PostProc --> Face[Face Matcher]
    PostProc --> Liveness[Liveness Detector]
    
    CLI[NDieu KYC CLI] -->|Auto Download Models| PublicDir[Thư mục /public]
    PublicDir -->|Fetch with Progress| Session
```

## Các Mảnh Ghép Chính (Modules)
1. **`@ndieu/kyc-core`**: Xử lý hình ảnh, bộ phân tích cú pháp NLP (Vietnamese Parser) và logic trích xuất.
2. **`@ndieu/kyc-browser`**: Tích hợp luồng đa tuyến (Inline Worker), tự động lùi cấp phần cứng.
3. **`@ndieu/kyc-node`**: Hỗ trợ môi trường Backend (CommonJS & ESM).
4. **`@ndieu/kyc-cli`**: Công cụ tự động nhận diện framework và tải file `.onnx` an toàn với mã băm SHA-256.

## Cài đặt (Installation)
Chạy lệnh khởi tạo để tự động cấu hình và tải AI Models:
```bash
npx @ndieu-kyc/cli init
npx @ndieu-kyc/cli download-models
```

Cài đặt package vào dự án:
```bash
npm install @ndieu/kyc-browser @ndieu/kyc-core
```

## Đóng Góp & Tích hợp liên tục (CI/CD)
Hệ thống được thiết lập chu trình tự động (CI) qua GitHub Actions, tự động kiểm thử Vitest trên mọi PR. Các phiên bản NPM được phát hành tự động qua **Semantic Release**.
