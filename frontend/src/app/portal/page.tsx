'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { 
  CalendarCheck, 
  BookOpen, 
  CreditCard, 
  Award, 
  Coins, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Phone, 
  ExternalLink,
  GraduationCap,
  Sparkles,
  User,
  Gamepad2,
  Bot
} from 'lucide-react';
import Link from 'next/link';
import AiStudentTutorChat from '@/components/ai/AiStudentTutorChat';

function PortalContent() {
  const searchParams = useSearchParams();
  const urlStudentId = searchParams.get('studentId');

  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(urlStudentId || '');
  const [studentData, setStudentData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'attendance' | 'lms' | 'games' | 'ai' | 'payments' | 'certificates'>('attendance');
  const [loading, setLoading] = useState(true);

  // Talabaning darslari, davomati va to'lovlari
  const [attendances, setAttendances] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);

  useEffect(() => {
    async function fetchStudents() {
      try {
        const res = await axios.get('http://localhost:3000/api/v1/students');
        const list = res.data || [];
        setAllStudents(list);
        if (!selectedStudentId && list.length > 0) {
          setSelectedStudentId(list[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchStudents();
  }, []);

  useEffect(() => {
    if (!selectedStudentId) return;

    async function loadStudentProfile() {
      try {
        setLoading(true);
        const [stRes, attRes, payRes, certRes] = await Promise.all([
          axios.get(`http://localhost:3000/api/v1/students/${selectedStudentId}`),
          axios.get(`http://localhost:3000/api/v1/attendance/student/${selectedStudentId}`).catch(() => ({ data: [] })),
          axios.get(`http://localhost:3000/api/v1/payments?studentId=${selectedStudentId}`).catch(() => ({ data: [] })),
          axios.get(`http://localhost:3000/api/v1/certificates/student/${selectedStudentId}`).catch(() => ({ data: [] })),
        ]);

        const st = stRes.data;
        setStudentData(st);
        setAttendances(attRes.data || []);
        setPayments(payRes.data || []);
        setCertificates(certRes.data || []);

        // Talaba guruhining darslari
        const grpId = st.groups?.[0]?.groupId;
        if (grpId) {
          const lmsRes = await axios.get(`http://localhost:3000/api/v1/lms/groups/${grpId}/lessons`).catch(() => ({ data: [] }));
          setLessons(lmsRes.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadStudentProfile();
  }, [selectedStudentId]);

  const groupInfo = studentData?.groups?.[0]?.group;
  const isDebt = Number(studentData?.balance || 0) < 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-0 sm:p-4">
      {/* CRM ga qaytish navigatsiyasi */}
      <div className="w-full max-w-md flex items-center justify-between px-3 py-2 mb-1 text-xs">
        <Link href="/" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl font-medium">
          ← CRM Boshqaruviga qaytish
        </Link>
        <span className="text-[11px] text-slate-500 font-medium">O'quvchi & Ota-ona ko'rinishi</span>
      </div>

      {/* Mobil Ilova Ramkasi */}
      <div className="w-full max-w-md bg-slate-900 sm:border border-slate-800 sm:rounded-3xl min-h-screen sm:min-h-[840px] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Yuqori Profil Header */}
        <div className="bg-gradient-to-b from-indigo-900/60 to-slate-900 p-5 border-b border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center shadow-md">
                <img src="/logo-icon-transparent.png" alt="EduYuz" className="w-6 h-6 object-contain" />
              </div>
              <span className="font-extrabold text-white text-sm">
                Edu<span className="text-blue-400">Yuz</span> Mobile Portal
              </span>
            </div>

            {/* O'quvchini almashtirish dropdown (agar bir nechta bo'lsa) */}
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-2 py-1 text-slate-300 focus:outline-none"
            >
              {allStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}
                </option>
              ))}
            </select>
          </div>

          {studentData && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-black text-lg">
                  {studentData.fullName?.[0] || 'O'}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white leading-tight">{studentData.fullName}</h2>
                  <p className="text-xs text-indigo-300 font-medium">
                    {groupInfo?.name || 'Guruh biriktirilmagan'}
                  </p>
                </div>
              </div>

              {/* Balans va EduCoinlar Vidjeti */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5">
                  <span className="text-[10px] text-slate-400 block">{isDebt ? 'Qarzdorlik' : 'Hisob Balansi'}</span>
                  <span className={`text-sm font-black ${isDebt ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {Math.abs(Number(studentData.balance || 0)).toLocaleString('uz-UZ')} so'm
                  </span>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5">
                  <span className="text-[10px] text-slate-400 block">Yig'ilgan Coinlar</span>
                  <span className="text-sm font-black text-amber-400 flex items-center gap-1">
                    <Coins size={14} />
                    {studentData.coins || 0} EduCoin
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigatsiyasi */}
        <div className="grid grid-cols-3 sm:grid-cols-6 bg-slate-950 border-b border-slate-800 text-[11px] font-semibold text-center select-none">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`py-2.5 flex flex-col items-center gap-1 transition ${
              activeTab === 'attendance' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarCheck size={16} />
            Davomat
          </button>
          <button
            onClick={() => setActiveTab('lms')}
            className={`py-2.5 flex flex-col items-center gap-1 transition ${
              activeTab === 'lms' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen size={16} />
            Darslar
          </button>
          <button
            onClick={() => setActiveTab('games')}
            className={`py-2.5 flex flex-col items-center gap-1 transition ${
              activeTab === 'games' ? 'text-rose-400 border-b-2 border-rose-500 bg-rose-500/5' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gamepad2 size={16} />
            O‘yinlar
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-2.5 flex flex-col items-center gap-1 transition ${
              activeTab === 'ai' ? 'text-sky-400 border-b-2 border-sky-500 bg-sky-500/5' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot size={16} />
            AI Repetitor
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-2.5 flex flex-col items-center gap-1 transition ${
              activeTab === 'payments' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard size={16} />
            To'lovlar
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`py-2.5 flex flex-col items-center gap-1 transition ${
              activeTab === 'certificates' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award size={16} />
            Sertifikat
          </button>
        </div>

        {/* Kontent Bo'limi */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-500">Ma'lumotlar yuklanmoqda...</div>
          ) : activeTab === 'attendance' ? (
            /* 1. DAVOMAT TABI */
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Davomat Tarixi ({attendances.length} dars)
              </h3>
              {attendances.length === 0 ? (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-500">
                  Hali davomat qilinmagan
                </div>
              ) : (
                <div className="space-y-2">
                  {attendances.map((att) => {
                    const isPresent = att.status === 'present';
                    const isLate = att.status === 'late';

                    return (
                      <div
                        key={att.id}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-white">
                            {new Date(att.date).toLocaleDateString()}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5">{groupInfo?.name}</p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${
                            isPresent
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : isLate
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {isPresent ? '✅ Keldi (+10 Coin)' : isLate ? '⏳ Kechikdi' : '❌ Kelmadi'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : activeTab === 'lms' ? (
            /* 2. DARSLAR VA VAZIFALAR TABI */
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Guruh Darslari va Vazifalar
              </h3>
              {lessons.length === 0 ? (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-500">
                  Ushbu guruhga hali darslar joylanmagan
                </div>
              ) : (
                <div className="space-y-3">
                  {lessons.map((ls, idx) => (
                    <div
                      key={ls.id}
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-white">
                          {ls.orderIndex || idx + 1}. {ls.title}
                        </h4>
                        {ls.videoUrl && (
                          <a
                            href={ls.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-md font-semibold shrink-0"
                          >
                            Video Dars
                          </a>
                        )}
                      </div>

                      {ls.content && (
                        <p className="text-[11px] text-slate-400 line-clamp-2">{ls.content}</p>
                      )}

                      {/* Uyga vazifalar */}
                      {ls.homeworks?.map((hw: any) => {
                        const mySub = hw.submissions?.find((s: any) => s.studentId === selectedStudentId);

                        return (
                          <div
                            key={hw.id}
                            className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2 mt-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-indigo-300">
                                📝 {hw.title}
                              </span>
                              <span className="text-[10px] text-amber-400 font-semibold">
                                Max {hw.maxScore} ball
                              </span>
                            </div>

                            {mySub ? (
                              <div className="text-[11px] bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 text-emerald-300 space-y-1">
                                <div className="flex justify-between font-bold">
                                  <span>Holati: {mySub.status === 'reviewed' ? 'Baholandi' : 'Kutilmoqda'}</span>
                                  {mySub.score !== null && <span>{mySub.score} ball</span>}
                                </div>
                                {mySub.feedback && (
                                  <p className="text-[10px] text-slate-300">Ustoz: "{mySub.feedback}"</p>
                                )}
                              </div>
                            ) : (
                              <p className="text-[10px] text-slate-500 italic">Vazifa hali topshirilmagan</p>
                            )}
                          </div>
                        );
                      })}
                      {/* Dars o'yini tugmasi */}
                      <Link
                        href={`/games/play?topic=${encodeURIComponent(ls.title)}&studentId=${selectedStudentId}`}
                        className="mt-2.5 py-2 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white text-[11px] font-bold flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 transition"
                      >
                        <Gamepad2 size={14} />
                        <span>Mavzuli O‘yinni Boshlash (+25 Coin)</span>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'games' ? (
            /* O'YINLAR TABI */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-blue-950/40 border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  🎮 EduYuz Gamifikatsiya
                </span>
                <h3 className="text-sm font-bold text-white">Darslarni o‘ynab, EduCoin yutib oling!</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Viktorinada to‘g‘ri javoblarni toping, ketma-ket Combo ballar to‘plang va umumiy reytingda 1-o‘ringa chiqing!
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Guruh Darslari Bo‘yicha O‘yinlar
                </h4>
                {lessons.length === 0 ? (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-500">
                    Darslar mavjud emas
                  </div>
                ) : (
                  lessons.map((ls) => (
                    <div
                      key={ls.id}
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate">{ls.title}</div>
                        <span className="text-[10px] text-amber-400 font-semibold">+25 gacha EduCoin</span>
                      </div>
                      <Link
                        href={`/games/play?topic=${encodeURIComponent(ls.title)}&studentId=${selectedStudentId}`}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/20 shrink-0 transition"
                      >
                        <Gamepad2 size={13} />
                        <span>O‘ynash</span>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : activeTab === 'ai' ? (
            /* AI REPETITOR TABI */
            <div className="space-y-3">
              <AiStudentTutorChat
                studentName={studentData?.fullName}
                topic={groupInfo?.course?.title || groupInfo?.name}
              />
            </div>
          ) : activeTab === 'payments' ? (
            /* 3. TO'LOVLAR TABI */
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                To'lov Cheklari va Tarixi
              </h3>
              {payments.length === 0 ? (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-500">
                  Hali to'lovlar amalga oshirilmagan
                </div>
              ) : (
                <div className="space-y-2">
                  {payments.map((p) => {
                    const isCharge = Number(p.amount) < 0;

                    return (
                      <div
                        key={p.id}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-white">
                            {new Date(p.paidAt).toLocaleDateString()}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {p.comment || (isCharge ? 'Oylik to\'lov' : 'Kassaga to\'lov')}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-black text-xs ${
                              isCharge ? 'text-slate-400' : 'text-emerald-400'
                            }`}
                          >
                            {isCharge ? '' : '+'}
                            {Math.abs(Number(p.amount)).toLocaleString('uz-UZ')} so'm
                          </span>
                          <span className="text-[9px] uppercase tracking-wider text-slate-500 block">
                            {p.paymentMethod}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* 4. SERTIFIKATLAR TABI */
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Rasmiy QR-Sertifikatlar
              </h3>
              {certificates.length === 0 ? (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-500 space-y-2">
                  <Award size={28} className="mx-auto text-slate-600" />
                  <p>Hozircha rasmiy sertifikat taqdim etilmagan.</p>
                  <p className="text-[10px] text-slate-600">Kursni bitirganingizdan so'ng sertifikat shu yerda paydo bo'ladi.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {certificates.map((cert) => (
                    <div
                      key={cert.id}
                      className="bg-slate-950 border-2 border-amber-500/30 rounded-2xl p-4 space-y-3 text-center"
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
                        <GraduationCap size={22} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{cert.courseTitle}</h4>
                        <p className="text-[11px] font-mono text-amber-400 mt-0.5">{cert.certificateNumber}</p>
                      </div>
                      <div className="inline-block px-3 py-1 bg-amber-500/10 rounded-full text-amber-300 font-bold text-xs">
                        Baho: {cert.grade}
                      </div>
                      <div className="pt-2">
                        <Link
                          href={`/verify/${cert.certificateNumber}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
                        >
                          <ExternalLink size={13} /> QR Sertifikatni Tekshirish
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PortalPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Portal yuklanmoqda...</div>}>
      <PortalContent />
    </Suspense>
  );
}
