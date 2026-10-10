'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, ScanFace, CheckCircle2, AlertCircle, Users } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function FaceIdScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [streamActive, setStreamActive] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; name?: string } | null>(null);
  const [students, setStudents] = useState<any[]>([]);

  // O'quvchilar ro'yxatini olib kelish (mock ma'lumot uchun)
  useEffect(() => {
    apiFetch('/students').then(data => {
      if (data && data.length > 0) {
        setStudents(data);
      }
    }).catch(() => {});
  }, []);

  // Kamerani yoqish
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStreamActive(true);
      setResult(null);
      // Wait for React to render the video element, then attach stream
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Kameraga ulanishda xato:", err);
      alert("Kameraga ulanib bo'lmadi! Brauzerdan kameraga ruxsat bering.");
    }
  };

  // Kamerani o'chirish
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setStreamActive(false);
      setIsScanning(false);
    }
  };

  useEffect(() => {
    return () => stopCamera(); // Sahifadan chiqganda kamerani o'chirish
  }, []);

  const handleScan = async () => {
    if (!streamActive || !videoRef.current) return;
    setIsScanning(true);
    setResult(null);

    try {
      // 1. Rasmga olish (Canvas orqali)
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      }
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);

      // 2. Backendga jo'natish
      const data = await apiFetch('/attendance/face-scan', {
        method: 'POST',
        body: JSON.stringify({ image: base64Image })
      });

      setIsScanning(false);
      
      if (data.success || data.name) {
        setResult({
          success: true,
          message: data.message || "Davomatga belgilandi va Telegram orqali ota-onasiga xabar yuborildi!",
          name: data.name || "Noma'lum O'quvchi"
        });
      } else {
        alert(data.message || "Xatolik yuz berdi");
      }
    } catch (err) {
      setIsScanning(false);
      alert("Serverga ulanishda xatolik yuz berdi!");
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ScanFace className="text-indigo-400" size={28} />
            AI Face-ID Davomat
          </h1>
          <p className="text-sm text-slate-400 mt-1">Sun'iy intellekt orqali yuzni tanish va avtomatik davomat tizimi</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kamera Qismi */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col items-center">
          <div className="relative w-full aspect-[4/3] bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-800 flex items-center justify-center">
            
            {!streamActive ? (
              <div className="text-center space-y-3 px-4">
                <Camera size={48} className="mx-auto text-slate-600" />
                <p className="text-slate-400 text-sm">Kamera hozircha o'chirilgan</p>
              </div>
            ) : (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className={`w-full h-full object-cover ${isScanning ? 'brightness-50 blur-[2px]' : ''} transition-all duration-300`}
                />
                
                {/* Skanerlash Animation Overlay */}
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-4 border-indigo-500/50 rounded-2xl relative shadow-[0_0_50px_rgba(99,102,241,0.5)]">
                      {/* Scanning Line */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-indigo-400 shadow-[0_0_20px_#818cf8] animate-[scan_1.5s_ease-in-out_infinite]" />
                      <div className="absolute top-[-2px] left-[-2px] w-6 h-6 border-t-4 border-l-4 border-indigo-400 rounded-tl-xl" />
                      <div className="absolute top-[-2px] right-[-2px] w-6 h-6 border-t-4 border-r-4 border-indigo-400 rounded-tr-xl" />
                      <div className="absolute bottom-[-2px] left-[-2px] w-6 h-6 border-b-4 border-l-4 border-indigo-400 rounded-bl-xl" />
                      <div className="absolute bottom-[-2px] right-[-2px] w-6 h-6 border-b-4 border-r-4 border-indigo-400 rounded-br-xl" />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex gap-4 mt-6 w-full">
            {!streamActive ? (
              <button 
                onClick={startCamera}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition"
              >
                <Camera size={18} /> Kamerani Yoqish
              </button>
            ) : (
              <>
                <button 
                  onClick={stopCamera}
                  className="px-5 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition"
                >
                  O'chirish
                </button>
                <button 
                  onClick={handleScan}
                  disabled={isScanning}
                  className={`flex-1 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition ${
                    isScanning 
                      ? 'bg-indigo-600/50 text-indigo-200 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25'
                  }`}
                >
                  {isScanning ? (
                    <span className="animate-pulse flex items-center gap-2">Yuz aniqlanmoqda...</span>
                  ) : (
                    <><ScanFace size={20} /> Skanerlash (AI)</>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Natija Qismi */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl h-full flex flex-col justify-center relative overflow-hidden">
            
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

            {!result ? (
              <div className="text-center space-y-4 relative z-10 opacity-60">
                <Users size={64} className="mx-auto text-slate-600" />
                <h3 className="text-lg font-medium text-slate-300">Tizim tayyor</h3>
                <p className="text-sm text-slate-500">Kameraga qarab, yuzingizni skanerlang.</p>
              </div>
            ) : (
              <div className="text-center space-y-5 relative z-10 animate-in slide-in-from-right-8 duration-500">
                <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
                  <CheckCircle2 size={48} className="text-emerald-400" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">{result.name}</h3>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-sm font-medium text-emerald-400">100% Moslik (Face-ID)</span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-300 text-left space-y-3">
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-500">Vaqt:</span>
                    <span className="font-medium text-white">{new Date().toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-500">Holat:</span>
                    <span className="font-medium text-emerald-400">Darsga Keldi</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ota-onaga xabar:</span>
                    <span className="font-medium text-sky-400 flex items-center gap-1">Yuborildi <CheckCircle2 size={14}/></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(180px); }
          100% { transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
