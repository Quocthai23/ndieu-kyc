# Edge AI eKYC Library using ONNX and WebGPU

[![CI Pipeline](https://github.com/ndieu/kyc/actions/workflows/ci.yml/badge.svg)](https://github.com/ndieu/kyc/actions)
[![npm version](https://badge.fury.io/js/@ndieu%2Fkyc-core.svg)](https://badge.fury.io/js/@ndieu%2Fkyc-core)

*Đọc bản [Tiếng Việt (Vietnamese)](README.vi.md).*

## Overview
**@ndieu/kyc** is an enterprise-grade open-source electronic Know Your Customer (eKYC) solution. Its breakthrough lies in its **Edge AI Computing Architecture**, completely eliminating the need to transmit sensitive user images to cloud servers. This reduces latency to 0ms and fully resolves data privacy concerns (Privacy-by-Design).

The system leverages the **ONNX Runtime Web** engine, orchestrated with **WebGPU / WebGL**, and manages multithreading via **Inline Web Workers**. This guarantees high-performance Tensor inference without causing UI freezes on the main thread.

## Architecture

```mermaid
graph TD
    UI[Next.js / Web App UI] -->|Image / Video Frame| WorkerProxy[Worker Inference Session Proxy]
    
    subgraph Web Worker (Background Thread)
        WorkerProxy -->|ArrayBuffer (Transferable)| Session[ONNX Inference Session]
        Session -->|Auto-Degradation| GPU[WebGPU]
        Session -.Fallback.-> GL[WebGL]
        Session -.Fallback.-> WASM[WebAssembly]
    end
    
    Session -->|Tensor Result (0ms)| PostProc[Post-Processing Services]
    PostProc --> OCR[Document Extractor]
    PostProc --> Face[Face Matcher]
    PostProc --> Liveness[Liveness Detector]
    
    CLI[NDieu KYC CLI] -->|Auto Download Models| PublicDir[Public Directory]
    PublicDir -->|Fetch with Progress| Session
```

## Core Modules
1. **`@ndieu/kyc-core`**: Handles image processing, NLP parsing, and extraction logic.
2. **`@ndieu/kyc-browser`**: Integrates multi-threading (Inline Worker) and hardware auto-degradation.
3. **`@ndieu/kyc-node`**: Provides support for Backend environments (CommonJS & ESM).
4. **`@ndieu/kyc-cli`**: Automatic framework detection and secure `.onnx` model downloader with SHA-256 validation.

## Installation
Run the initialization command to auto-configure and download the required AI models:
```bash
npx @ndieu-kyc/cli init
npx @ndieu-kyc/cli download-models
```

Install the packages into your project:
```bash
npm install @ndieu/kyc-browser @ndieu/kyc-core
```

## Continuous Integration (CI/CD)
The project utilizes automated CI pipelines via GitHub Actions, running Vitest tests on every PR. NPM packages are automatically published using **Semantic Release**.
