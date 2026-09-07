'use client';

import { useState, useEffect, use } from 'react';
import axios from 'axios';
import { 
  CheckCircle2, 
  XCircle, 
  Award, 
  Calendar, 
  User, 
  BookOpen, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';
import Link from 'next/link';

export default function VerifyCertificatePage({ params }: { params: Promise<{ certNumber: string }> }) {
  const resolvedParams = use(params);
  const certNumber = resolvedParams.certNumber;

  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyCert() {
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:3000/api/v1/certificates/verify/${certNumber}`);
        setCert(res.data);
      } catch (err) {
        console.error(err);
        setCert({ valid: false });
      } finally {
        setLoading(false);
      }
    }
    verifyCert();
  }, [certNumber]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 w-full max-w-lg shadow-2xl space-y-6 text-center">
        {loading ? (
          <div className="py-12 text-slate-400">Sertifikat haqiqiyligi tekshirilmoqda...</div>
        ) : cert?.valid ? (
          <div className="space-y-6">
            {/* Rasmiy EduYuz Logo */}
            <div className="flex justify-center">
              <div className="bg-white rounded-2xl px-5 py-2.5 shadow-lg inline-flex items-center justify-center">
                <img src="/logo-full.png" alt="EduYuz CRM Platform" className="h-10 w-auto object-contain" />
              </div>
            </div>

            {/* Tasdiqlanganlik Emblemi */}
            <div className="relative inline-flex items-center justify-center">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/20">
                <ShieldCheck size={44} />
              </div>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                Haqiqiy & Tasdiqlangan
              </span>
              <h1 className="text-2xl font-black text-white mt-3">Rasmiy Bitiruv Sertifikati</h1>
              <p className="text-xs text-slate-400 mt-1">
                Ushbu sertifikat EduYuz platformasi ma'lumotlar bazasida ro'yxatga olingan.
              </p>
            </div>

            {/* Sertifikat Ma'lumotlari */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-left space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <span className="text-xs text-slate-400">Sertifikat ID:</span>
                <span className="text-xs font-mono font-bold text-amber-400">{cert.certificateNumber}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <span className="text-xs text-slate-400">Bitiruvchi O'quvchi:</span>
                <span className="text-sm font-bold text-white">{cert.studentName}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <span className="text-xs text-slate-400">Tamomlagan Kursi:</span>
                <span className="text-xs font-semibold text-indigo-300">{cert.courseTitle}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <span className="text-xs text-slate-400">O'zlashtirish Darajasi:</span>
                <span className="text-xs font-black text-amber-400">{cert.grade}</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <span className="text-xs text-slate-400">Berilgan Sana:</span>
                <span className="text-xs font-medium text-slate-200">
                  {new Date(cert.issuedAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Beruvchi Muassasa:</span>
                <span className="text-xs font-semibold text-white">{cert.issuer}</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 transition font-medium"
              >
                EduYuz Bosh Sahifasiga o'tish <ExternalLink size={13} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
              <XCircle size={36} />
            </div>
            <h2 className="text-xl font-bold text-white">Sertifikat Topilmadi</h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Kiritilgan yoki skaner qilingan <b>{certNumber}</b> raqamli sertifikat bazada mavjud emas yoki noto'g'ri kiritilgan.
            </p>
            <Link
              href="/"
              className="inline-block bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-2 rounded-xl transition"
            >
              Bosh Sahifaga qaytish
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
