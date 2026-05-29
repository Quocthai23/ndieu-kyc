'use client';
import { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const initializeAI = () => {
    setIsInitializing(true);
    let p = 0;
    const interval = setInterval(() => {
      p += 5;
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setIsReady(true);
        setIsInitializing(false);
      }
    }, 150);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-8 relative overflow-hidden font-sans">
      <Head>
        <title>NDieu eKYC Playground</title>
      </Head>
      
      {/* Background Glows (Glassmorphism Effects) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none transition-all duration-1000" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-emerald-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none transition-all duration-1000" />

      <main className="z-10 max-w-4xl w-full flex flex-col gap-12 items-center">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium mb-4 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.05)]">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></span>
            <span className="text-gray-200 tracking-wide">100% Edge AI Powered</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
            NDieu <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400">eKYC</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Nền tảng định danh điện tử doanh nghiệp. Xử lý toàn bộ logic ngay trên trình duyệt với sức mạnh nội suy Tensor của WebGPU.
          </p>
        </div>

        {/* Dynamic Card Area */}
        {!isReady ? (
          <div className="w-full max-w-md bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-8 shadow-2xl shadow-black/50 border border-white/10 flex flex-col gap-6 relative overflow-hidden transition-all duration-500 hover:bg-white/[0.05] hover:border-white/20">
            {/* Inner Top Glow */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50" />
            
            <div className="relative z-10 flex flex-col gap-2">
              <h2 className="text-2xl font-semibold tracking-tight text-white">Khởi tạo Engine</h2>
              <p className="text-sm text-gray-400 leading-relaxed">Tải mô hình lượng tử hóa (Quantized Models) và Web Worker vào RAM trình duyệt.</p>
            </div>

            <div className="relative z-10 w-full bg-black/40 rounded-full h-3 overflow-hidden border border-white/5 shadow-inner">
              <div 
                className="bg-gradient-to-r from-blue-500 via-teal-400 to-emerald-400 h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_20px_rgba(52,211,153,0.6)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <div className="relative z-10 flex justify-between items-center text-sm font-medium">
              <span className="text-gray-400">{isInitializing ? 'Đang truyền dữ liệu ArrayBuffer...' : 'Trạng thái: Tạm dừng'}</span>
              <span className="text-emerald-400 tabular-nums text-lg">{progress}%</span>
            </div>

            <button 
              onClick={initializeAI}
              disabled={isInitializing}
              className="relative z-10 mt-4 w-full group overflow-hidden rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="px-6 py-4 font-semibold tracking-wide relative text-white">
                {isInitializing ? 'HỆ THỐNG ĐANG TẢI...' : 'BẮT ĐẦU KIỂM THỬ'}
              </div>
            </button>
          </div>
        ) : (
          <div className="w-full max-w-3xl transition-opacity duration-700 ease-in-out opacity-100">
            <div className="w-full bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-8 shadow-2xl shadow-black/50 border border-emerald-500/30 flex flex-col gap-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-400 to-blue-500" />
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 bg-emerald-500/10 text-emerald-300 rounded-2xl border border-emerald-500/20 shadow-inner">
                <div className="h-12 w-12 shrink-0 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg">ONNX WebGPU Worker Đã Sẵn Sàng</h3>
                  <p className="text-sm opacity-80 mt-1">Hệ thống đã nhận diện phần cứng và sẵn sàng xử lý hàng triệu điểm ảnh không độ trễ.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 {/* Card 1 */}
                 <button className="group relative h-56 bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-5 hover:border-blue-400/50 hover:from-blue-500/10 hover:to-transparent transition-all duration-300 overflow-hidden shadow-lg">
                   <div className="absolute inset-0 bg-blue-400/10 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
                   <div className="relative p-5 bg-white/5 rounded-full group-hover:scale-110 transition-transform duration-300 group-hover:text-blue-400 group-hover:shadow-[0_0_20px_rgba(96,165,250,0.4)] border border-white/5">
                     <svg className="w-10 h-10 text-gray-300 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                     </svg>
                   </div>
                   <span className="relative font-semibold text-xl tracking-wide text-gray-200 group-hover:text-white transition-colors">Quét CCCD / CMND</span>
                 </button>
                 
                 {/* Card 2 */}
                 <button className="group relative h-56 bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-5 hover:border-emerald-400/50 hover:from-emerald-500/10 hover:to-transparent transition-all duration-300 overflow-hidden shadow-lg">
                   <div className="absolute inset-0 bg-emerald-400/10 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
                   <div className="relative p-5 bg-white/5 rounded-full group-hover:scale-110 transition-transform duration-300 group-hover:text-emerald-400 group-hover:shadow-[0_0_20px_rgba(52,211,153,0.4)] border border-white/5">
                     <svg className="w-10 h-10 text-gray-300 group-hover:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                   </div>
                   <span className="relative font-semibold text-xl tracking-wide text-gray-200 group-hover:text-white transition-colors">So Khớp Khuôn Mặt</span>
                 </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
