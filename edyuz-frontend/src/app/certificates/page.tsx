'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Award, 
  Plus, 
  QrCode, 
  Printer, 
  ExternalLink, 
  CheckCircle2, 
  GraduationCap,
  Calendar,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modallar
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [viewingCert, setViewingCert] = useState<any>(null);

  const [issueForm, setIssueForm] = useState({
    studentId: '',
    courseTitle: 'Frontend Dasturlash Bootcamp',
    grade: 'A+',
  });

  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  async function loadData() {
    try {
      setLoading(true);
      const [certRes, stdRes] = await Promise.all([
        axios.get('http://localhost:3000/api/v1/certificates'),
        axios.get('http://localhost:3000/api/v1/students', { headers: getHeaders() }),
      ]);
      setCertificates(certRes.data || []);
      setStudents(stdRes.data || []);
      if (stdRes.data && stdRes.data[0]) {
        setIssueForm((prev) => ({ ...prev, studentId: stdRes.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleIssueCertificate(e: React.FormEvent) {
    e.preventDefault();
    if (!issueForm.studentId) return alert('O\'quvchini tanlang!');
    try {
      const res = await axios.post(
        'http://localhost:3000/api/v1/certificates/issue',
        issueForm
      );
      alert(`Sertifikat berildi! Raqami: ${res.data.certificateNumber}`);
      setIsIssueModalOpen(false);
      loadData();
      setViewingCert(res.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik yuz berdi');
    }
  }

  return (
    <div className="space-y-6">
      {/* Sarlavha va Sertifikat Berish Tugmasi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Award className="text-amber-400" size={28} />
            EduYuz Rasmiy QR-Sertifikatlar
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Kursni muvaffaqiyatli tamomlagan o'quvchilarga avtomatik QR-kodli sertifikat berish va chop etish
          </p>
        </div>

        <button
          onClick={() => setIsIssueModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm transition shadow-lg shadow-amber-500/20"
        >
          <Plus size={18} /> Yangi Sertifikat Berish
        </button>
      </div>

      {/* Sertifikatlar Ro'yxati */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Sertifikatlar yuklanmoqda...</div>
      ) : certificates.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Award size={36} className="mx-auto text-slate-600" />
          <h3 className="text-base font-semibold text-white">Hozircha sertifikatlar berilmagan</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            "Yangi Sertifikat Berish" tugmasi orqali bitiruvchilarga rasmiy QR-kodli sertifikat taqdim eting.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md">
                    {cert.certificateNumber}
                  </span>
                  <h3 className="text-base font-bold text-white mt-2">{cert.student?.fullName}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{cert.courseTitle}</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-black text-xs border border-amber-500/20">
                  {cert.grade}
                </div>
              </div>

              <div className="text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="flex items-center gap-1">
                  <Calendar size={13} className="text-slate-500" />
                  {new Date(cert.issuedAt).toLocaleDateString()}
                </span>
                <span className="text-emerald-400 flex items-center gap-1 font-medium text-[11px]">
                  <CheckCircle2 size={13} /> Tasdiqlangan
                </span>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => setViewingCert(cert)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <Printer size={14} /> Sertifikatni Ochish
                </button>
                <Link
                  href={`/verify/${cert.certificateNumber}`}
                  target="_blank"
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition"
                  title="QR Havolani tekshirish"
                >
                  <ExternalLink size={15} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sertifikat Berish Modali */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="text-amber-400" size={20} />
              Yangi Sertifikat Berish
            </h3>
            <form onSubmit={handleIssueCertificate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400">O'quvchini Tanlang *</label>
                <select
                  required
                  value={issueForm.studentId}
                  onChange={(e) => setIssueForm({ ...issueForm, studentId: e.target.value })}
                  className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.phone || 'Tel yo\'q'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">Tamomlagan Kurs Nomi *</label>
                <input
                  type="text"
                  required
                  value={issueForm.courseTitle}
                  onChange={(e) => setIssueForm({ ...issueForm, courseTitle: e.target.value })}
                  className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">O'zlashtirish Darajasi (Baho)</label>
                <select
                  value={issueForm.grade}
                  onChange={(e) => setIssueForm({ ...issueForm, grade: e.target.value })}
                  className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                >
                  <option value="A+">A+ (A'lo / Mukammal)</option>
                  <option value="A">A (Juda Yaxshi)</option>
                  <option value="B+">B+ (Yaxshi)</option>
                  <option value="B">B (Qoniqarli)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2 rounded-xl text-sm transition"
                >
                  Sertifikatni Rasmiylashtirish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sertifikatni Ko'rish va Chop Etish Modali */}
      {viewingCert && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-4xl space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="text-amber-400" size={18} />
                Sertifikat Ko'rinishi — {viewingCert.certificateNumber}
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition"
                >
                  <Printer size={14} /> Chop etish / PDF
                </button>
                <button
                  onClick={() => setViewingCert(null)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  Yopish
                </button>
              </div>
            </div>

            {/* Sertifikat Dizayni (A4 Formatiga moslashgan) */}
            <div
              id="certificate-sheet"
              className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/80 border-4 border-amber-500/60 rounded-3xl p-10 text-center relative overflow-hidden shadow-2xl space-y-6 select-none"
            >
              {/* Oltin burchak bezaklari */}
              <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-amber-400"></div>
              <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-amber-400"></div>
              <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-amber-400"></div>
              <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-amber-400"></div>

              {/* Brend va Emblem */}
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="bg-white rounded-2xl px-6 py-2.5 shadow-xl shadow-amber-500/20 inline-flex items-center justify-center border border-amber-400/30">
                  <img src="/logo-full.png" alt="EduYuz" className="h-11 w-auto object-contain" />
                </div>
                <h2 className="text-xl font-black tracking-widest text-amber-400 uppercase">
                  EduYuz Ta'lim Akademiyasi
                </h2>
                <p className="text-[10px] tracking-widest uppercase text-slate-400 font-semibold">
                  Muvaffaqiyatli Bitiruv To'g'risida Rasmiy
                </p>
              </div>

              <div>
                <h1 className="text-4xl font-black text-white tracking-wider uppercase font-serif">
                  SERTIFIKAT
                </h1>
                <p className="text-xs text-slate-400 mt-1">Ushbu hujjat tasdiqlaydiki:</p>
              </div>

              {/* O'quvchi Ismi */}
              <div className="py-2">
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 border-b-2 border-amber-500/30 inline-block px-8 pb-2">
                  {viewingCert.student?.fullName || viewingCert.studentName}
                </h2>
              </div>

              <div className="max-w-xl mx-auto space-y-1">
                <p className="text-xs text-slate-300 leading-relaxed">
                  <b>{viewingCert.courseTitle}</b> o'quv dasturini barcha amaliy topshiriqlari va imtihonlari bilan muvaffaqiyatli tamomladi.
                </p>
                <p className="text-xs text-amber-400 font-semibold">
                  O'zlashtirish Darajasi: <b>{viewingCert.grade}</b>
                </p>
              </div>

              {/* Quyi Qism: QR Kod, Sana va Muhr */}
              <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between max-w-2xl mx-auto">
                <div className="text-left space-y-1">
                  <p className="text-[11px] text-slate-400">Berilgan sana:</p>
                  <p className="text-xs font-semibold text-white">
                    {new Date(viewingCert.issuedAt).toLocaleDateString()}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    ID: {viewingCert.certificateNumber}
                  </p>
                </div>

                {/* Jonli QR Kod */}
                <div className="flex flex-col items-center space-y-1">
                  <div className="p-1.5 bg-white rounded-xl shadow-md">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=http://localhost:3001/verify/${viewingCert.certificateNumber}`}
                      alt="QR Code"
                      className="w-16 h-16"
                    />
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono">Haqiqiylikni skanerlang</span>
                </div>

                <div className="text-right space-y-1">
                  <p className="text-[11px] text-slate-400">EduYuz Boshqaruvi:</p>
                  <div className="w-24 h-6 border-b border-dashed border-slate-600 mx-auto"></div>
                  <p className="text-[10px] text-emerald-400 font-semibold flex items-center justify-end gap-1">
                    <CheckCircle2 size={11} /> Rasmiy Muhrlangan
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
