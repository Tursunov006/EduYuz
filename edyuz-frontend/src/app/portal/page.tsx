'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import { 
  CalendarCheck, 
  BookOpen, 
  CreditCard, 
  QrCode,
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
  Bot,
  Copy,
  Check,
  ShieldCheck,
  X,
  Lock,
  ArrowRight,
  Smartphone,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import AiStudentTutorChat from '@/components/ai/AiStudentTutorChat';

function HomeworkSubmitForm({ homeworkId, studentId, onSuccess }: { homeworkId: string, studentId: string, onSuccess: () => void }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!content.trim()) return alert('Javobni kiriting');
    setLoading(true);
    try {
      await axios.post('http://localhost:3000/api/v1/lms/homeworks/submit', {
        homeworkId,
        studentId,
        content
      });
      alert('Vazifa muvaffaqiyatli yuborildi!');
      onSuccess();
    } catch (err) {
      alert('Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-2">
      <textarea
        required
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Vazifa javobini (yoki Google Drive fayl linkini) yozing..."
        className="w-full text-xs p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-500 min-h-[60px]"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[11px] font-bold py-1.5 rounded-lg transition"
      >
        {loading ? 'Yuborilmoqda...' : 'Vazifani Ustozga Yuborish ??'}
      </button>
    </form>
  );
}

function PortalContent() {
  const searchParams = useSearchParams();
  const urlStudentId = searchParams.get('studentId');

  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(urlStudentId || '');
  const [studentData, setStudentData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'attendance' | 'lms' | 'games' | 'ai' | 'payments' | 'certificates'>('attendance');
  const [loading, setLoading] = useState(true);
  const [copiedCard, setCopiedCard] = useState(false);

  // Ekvayring Modal holatlari
  const [showPayModal, setShowPayModal] = useState(false);
  const [payStep, setPayStep] = useState<'form' | 'sms' | 'success'>('form');
  const [payAmount, setPayAmount] = useState<number>(350000);
  const [inputCardNumber, setInputCardNumber] = useState('');
  const [inputCardExpiry, setInputCardExpiry] = useState('');
  const [inputSmsCode, setInputSmsCode] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [smsTimer, setSmsTimer] = useState(60);
  const [lastPaymentInfo, setLastPaymentInfo] = useState<any>(null);

  // Karta raqamini formatlash (8600 0000 0000 0000)
  const handleCardNumberChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setInputCardNumber(formatted);
  };

  // Karta muddatini formatlash (MM/YY)
  const handleExpiryChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setInputCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setInputCardExpiry(raw);
    }
  };

  // Karta turini aniqlash (UzCard / Humo / Visa)
  const getCardType = (rawNum: string) => {
    const clean = rawNum.replace(/\s/g, '');
    if (clean.startsWith('8600') || clean.startsWith('5614')) return { name: 'UZCARD', color: 'bg-blue-600 text-white' };
    if (clean.startsWith('9860')) return { name: 'HUMO', color: 'bg-amber-500 text-slate-900 font-bold' };
    if (clean.startsWith('4')) return { name: 'VISA', color: 'bg-indigo-600 text-white' };
    if (clean.startsWith('5')) return { name: 'MASTERCARD', color: 'bg-rose-600 text-white' };
    return { name: 'KARTA', color: 'bg-slate-200 text-slate-600' };
  };

  // Onlayn to'lov: to'lov tizimining (Atmos) himoyalangan sahifasiga yo'naltirish.
  // Avval bu yerda karta raqami shu saytning o'zida so'ralib, soxta "SMS kod"dan keyin
  // hech qanday pul yechilmasdan balans to'g'ridan-to'g'ri oshirilardi — ya'ni istalgan
  // odam o'ziga bepul balans yozib olishi mumkin edi. Endi faqat to'lov tizimi
  // imzolagan tasdiq (webhook) kelgandagina yoki kassada admin tomonidan oshiriladi.
  const handleRequestSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount || payAmount < 1000) {
      return alert('Minimal to‘lov miqdori: 1 000 so‘m');
    }

    setPayLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://eduyuz.onrender.com/api/v1';
      const res = await axios.post(`${apiUrl}/payments/atmos/create-invoice`, {
        studentId: selectedStudentId,
        amount: Number(payAmount),
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
        return;
      }
      throw new Error('no-url');
    } catch (err: any) {
      alert(
        'Onlayn karta to‘lovi hozircha ulanmagan. Iltimos, Click yoki Payme ilovasi orqali to‘lang yoki markaz kassasiga murojaat qiling.',
      );
    } finally {
      setPayLoading(false);
    }
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPayModal(false);
  };

  const copyCardNumber = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText('8600060925939614');
    }
    setCopiedCard(true);
    setTimeout(() => setCopiedCard(false), 2500);
  };

  // Talabaning darslari, davomati va to'lovlari
  const [attendances, setAttendances] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);

  useEffect(() => {
    async function fetchStudents() {
      // O'quvchilar ro'yxati faqat tizimga kirgan xodimlarga beriladi.
      // Ota-ona/o'quvchi portalga shaxsiy havola (?studentId=...) orqali kiradi.
      if (!localStorage.getItem('token')) {
        if (!urlStudentId) setLoading(false);
        return;
      }
      try {
        const res = await axios.get('http://localhost:3000/api/v1/students');
        const list = res.data || [];
        setAllStudents(list);
        if (!selectedStudentId && list.length > 0) {
          setSelectedStudentId(list[0].id);
        } else if (!selectedStudentId) {
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (!urlStudentId) setLoading(false);
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

  if (!selectedStudentId && !loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-6">
        <div className="max-w-sm text-center space-y-3 bg-white border border-slate-200 rounded-2xl p-6">
          <div className="text-3xl"></div>
          <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 leading-tight">Shaxsiy havola kerak</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Portalga kirish uchun EduYuz Telegram botidagi «Mini Ilova» tugmasidan yoki
            o‘quv markazingiz bergan shaxsiy havoladan foydalaning.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-0 sm:p-4">
      {/* CRM ga qaytish va Alohida Mini Ilova navigatsiyasi */}
      <div className="w-full max-w-md flex items-center justify-between px-3 py-2 mb-1 text-xs">
        <Link href="/" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition bg-white border border-slate-200 px-3 py-1.5 rounded-xl font-medium">
          ← CRM Boshqaruviga qaytish
        </Link>
        <Link
          href={`/app${selectedStudentId ? `?studentId=${selectedStudentId}` : ''}`}
          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl font-bold"
        >
          <span>Alohida Mini Ilova (/app)</span>
        </Link>
      </div>

      {/* Mobil Ilova Ramkasi */}
      <div className="w-full max-w-md bg-white sm:border border-slate-200 sm:rounded-2xl min-h-screen sm:min-h-[840px] flex flex-col shadow-sm overflow-hidden">
        
        {/* Yuqori Profil Header */}
        <div className="p-5 border-b border-slate-200 space-y-4 bg-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center shadow-md">
                <img src="/logo-icon-transparent.png" alt="EduYuz" className="w-6 h-6 object-contain" />
              </div>
              <span className="font-bold text-slate-900 text-sm">
                Edu<span className="text-blue-600">Yuz</span> Mobile Portal
              </span>
            </div>

            {/* O'quvchini almashtirish dropdown (agar bir nechta bo'lsa) */}
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="bg-slate-100 border border-slate-300 text-xs rounded-lg px-2 py-1 text-slate-600 focus:outline-none"
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
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-700 font-bold text-lg">
                  {studentData.fullName?.[0] || 'O'}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 leading-tight">{studentData.fullName}</h2>
                  <p className="text-xs text-indigo-700 font-medium">
                    {groupInfo?.name || 'Guruh biriktirilmagan'}
                  </p>
                </div>
              </div>

              {/* Balans va EduCoinlar Vidjeti */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <span className="text-[10px] text-slate-500 block">{isDebt ? 'Qarzdorlik' : 'Hisob Balansi'}</span>
                  <span className={`text-sm font-bold ${isDebt ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {Math.abs(Number(studentData.balance || 0)).toLocaleString('uz-UZ')} so'm
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <span className="text-[10px] text-slate-500 block">Yig'ilgan Coinlar</span>
                  <span className="text-sm font-bold text-amber-600 flex items-center gap-1">
                    <Coins size={14} />
                    {studentData.coins || 0} EduCoin
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigatsiyasi */}
        <div className="grid grid-cols-3 sm:grid-cols-6 bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-center select-none">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`py-2.5 flex flex-col items-center gap-1 transition ${
              activeTab === 'attendance' ? 'text-indigo-600 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <CalendarCheck size={16} />
            Davomat
          </button>
          <button
            onClick={() => setActiveTab('lms')}
            className={`py-2.5 flex flex-col items-center gap-1 transition ${
              activeTab === 'lms' ? 'text-indigo-600 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <BookOpen size={16} />
            Darslar
          </button>
          <button
            onClick={() => setActiveTab('games')}
            className={`py-2.5 flex flex-col items-center gap-1 transition ${
              activeTab === 'games' ? 'text-rose-600 border-b-2 border-rose-500 bg-rose-500/5' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Gamepad2 size={16} />
            O‘yinlar
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-2.5 flex flex-col items-center gap-1 transition ${
              activeTab === 'ai' ? 'text-sky-600 border-b-2 border-sky-500 bg-sky-500/5' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Bot size={16} />
            AI Repetitor
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-2.5 flex flex-col items-center gap-1 transition ${
              activeTab === 'payments' ? 'text-indigo-600 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <CreditCard size={16} />
            To'lovlar
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`py-2.5 flex flex-col items-center gap-1 transition ${
              activeTab === 'certificates' ? 'text-indigo-600 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-slate-500 hover:text-slate-700'
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Davomat Tarixi ({attendances.length} dars)
              </h3>
              {attendances.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
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
                        className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-900">
                            {new Date(att.date).toLocaleDateString()}
                          </span>
                          <p className="text-[10px] text-slate-500 mt-0.5">{groupInfo?.name}</p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${
                            isPresent
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                              : isLate
                              ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                          }`}
                        >
                          {isPresent ? 'Keldi (+10 Coin)' : isLate ? 'Kechikdi' : 'Kelmadi'}
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Guruh Darslari va Vazifalar
              </h3>
              {lessons.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
                  Ushbu guruhga hali darslar joylanmagan
                </div>
              ) : (
                <div className="space-y-3">
                  {lessons.map((ls, idx) => (
                    <div
                      key={ls.id}
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900">
                          {ls.orderIndex || idx + 1}. {ls.title}
                        </h4>
                        {ls.videoUrl && (
                          <a
                            href={ls.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] bg-red-500/10 text-red-600 border border-red-500/20 px-2 py-0.5 rounded-md font-semibold shrink-0"
                          >
                            Video Dars
                          </a>
                        )}
                      </div>

                      {ls.content && (
                        <p className="text-[11px] text-slate-500 line-clamp-2">{ls.content}</p>
                      )}

                      {/* Uyga vazifalar */}
                      {ls.homeworks?.map((hw: any) => {
                        const mySub = hw.submissions?.find((s: any) => s.studentId === selectedStudentId);

                        return (
                          <div
                            key={hw.id}
                            className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 mt-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-indigo-700">
                                {hw.title}
                              </span>
                              <span className="text-[10px] text-amber-600 font-semibold">
                                Max {hw.maxScore} ball
                              </span>
                            </div>

                            {mySub ? (
                              <div className="text-[11px] bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 text-emerald-700 space-y-1">
                                <div className="flex justify-between font-bold">
                                  <span>Holati: {mySub.status === 'reviewed' ? 'Baholandi' : 'Kutilmoqda'}</span>
                                  {mySub.score !== null && <span>{mySub.score} ball</span>}
                                </div>
                                {mySub.feedback && (
                                  <p className="text-[10px] text-slate-600">Ustoz: "{mySub.feedback}"</p>
                                )}
                              </div>
                            ) : (
                              <div className="mt-2 pt-2 border-t border-slate-200">
                                <p className="text-[10px] text-slate-500 italic mb-2">Vazifa hali topshirilmagan</p>
                                <HomeworkSubmitForm 
                                  homeworkId={hw.id} 
                                  studentId={selectedStudentId} 
                                  onSuccess={() => window.location.reload()} 
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {/* Dars o'yini tugmasi */}
                      <Link
                        href={`/games/play?topic=${encodeURIComponent(ls.title)}&studentId=${selectedStudentId}`}
                        className="mt-2.5 py-2 px-3 rounded-xl text-white text-[11px] font-bold flex items-center justify-center gap-2 shadow-md transition bg-rose-600 hover:bg-rose-500"
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
              <div className="p-4 rounded-2xl border border-slate-200 space-y-2 bg-rose-50">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-700 border border-rose-500/30">
                  EduYuz Gamifikatsiya
                </span>
                <h3 className="text-sm font-bold text-slate-900">Darslarni o‘ynab, EduCoin yutib oling!</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Viktorinada to‘g‘ri javoblarni toping, ketma-ket Combo ballar to‘plang va umumiy reytingda 1-o‘ringa chiqing!
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Guruh Darslari Bo‘yicha O‘yinlar
                </h4>
                {lessons.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">
                    Darslar mavjud emas
                  </div>
                ) : (
                  lessons.map((ls) => (
                    <div
                      key={ls.id}
                      className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{ls.title}</div>
                        <span className="text-[10px] text-amber-600 font-semibold">+25 gacha EduCoin</span>
                      </div>
                      <Link
                        href={`/games/play?topic=${encodeURIComponent(ls.title)}&studentId=${selectedStudentId}`}
                        className="px-3 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-md shrink-0 transition bg-rose-600 hover:bg-rose-500"
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
            <div className="space-y-4">
              
              {/* Click orqali To'lov Vidjeti */}
              <div className="border border-blue-500/30 rounded-2xl p-4 flex flex-col items-center text-center space-y-3 relative overflow-hidden bg-indigo-50">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <QrCode size={80} />
                </div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 relative z-10"><CreditCard size={18} className="text-[#00AEEF]"/> To'lov uchun QR-Kod</h4>
                <p className="text-[11px] text-slate-600 relative z-10">
                  QR kodni bank ilovasi (Click, Payme, Uzum) yoki telefon kamerasi bilan skaner qiling: o‘quv markazining karta raqami chiqadi, shu kartaga pul o‘tkazing.
                </p>
                
                {/* QR KOD RASMI */}
                <div className="p-2 bg-white rounded-2xl shadow-sm relative z-10 mx-auto max-w-[200px] border border-slate-200">
                  {/* O'quv markazi kartasi (UzCard 8600 0609 2593 9614) raqamini saqlovchi QR */}
                  <img
                    src="/card-qr.svg"
                    alt="O‘quv markazi karta raqami QR kodi: 8600 0609 2593 9614"
                    className="w-full h-auto object-contain rounded-xl"
                  />
                  <p className="text-center font-mono text-xs font-bold text-slate-800 pb-1">8600 0609 2593 9614</p>
                </div>

                <p className="text-[11px] font-mono bg-white px-3 py-1.5 rounded-lg text-slate-600 relative z-10">
                  ID raqamingiz: <span className="font-bold text-slate-900">{selectedStudentId.split('-')[0]}</span>
                </p>

                {/* To'lov uchun Karta Raqami (Humo / UzCard) */}
                <div className="w-full bg-slate-50 border border-emerald-500/30 rounded-2xl p-3.5 space-y-2 relative z-10 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600 flex items-center gap-1.5">
                      <CreditCard size={13} /> O'quv Markazi Rasmiy Kartasi
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                      UZCARD
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm sm:text-base text-slate-900 tracking-widest selection:bg-emerald-500">
                        8600 0609 2593 9614
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={copyCardNumber}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-900 font-bold rounded-lg text-[11px] transition shadow-md cursor-pointer"
                    >
                      {copiedCard ? (
                        <>
                          <Check size={14} className="text-slate-900" />
                          <span>Nusxalandi!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Nusxalash</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-500 text-left">
                    <i>To'lov o'tkazishda izohga o'quvchi ID sini (<span className="text-white font-mono">{selectedStudentId.split('-')[0]}</span>) yoki to'liq ismini yozing.</i>
                  </p>
                </div>

                {/* ASOSIY: Saytda Karta Orqali To'lov Tugmasi (Ekvayring) */}
                <button
                  type="button"
                  onClick={() => {
                    const debt = Math.abs(Number(studentData?.balance || 0));
                    if (debt > 0) setPayAmount(debt);
                    setPayStep('form');
                    setShowPayModal(true);
                  }}
                  className="w-full text-slate-900 font-bold py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-sm relative z-10 active:scale-[0.98] cursor-pointer bg-emerald-600 hover:bg-emerald-500"
                >
                  <CreditCard size={18} className="text-slate-900" />
                  <span>Saytda Karta Orqali To‘lash (UzCard / Humo)</span>
                  <ArrowRight size={15} />
                </button>

                <div className="flex gap-2 w-full pt-1 relative z-10">
                  <a 
                    href="https://my.click.uz/pay?card=8600060925939614"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-[#00AEEF] hover:bg-[#0096cc] text-slate-900 font-bold py-2.5 rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    Click Ilovasi
                  </a>
                  <a 
                    href="https://payme.uz/fallback/transfer/8600060925939614"
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 text-white font-bold py-2.5 rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition shadow-sm bg-teal-600 hover:bg-teal-500"
                  >
                    Payme Ilovasi
                  </a>
                </div></div>

              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-4">
                To'lov Cheklari va Tarixi
              </h3>
              {payments.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
                  Hali to'lovlar amalga oshirilmagan
                </div>
              ) : (
                <div className="space-y-2">
                  {payments.map((p) => {
                    const isCharge = Number(p.amount) < 0;

                    return (
                      <div
                        key={p.id}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900">
                            {new Date(p.paidAt).toLocaleDateString()}
                          </span>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {p.comment || (isCharge ? 'Oylik to\'lov' : 'Kassaga to\'lov')}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-bold text-xs ${
                              isCharge ? 'text-slate-500' : 'text-emerald-600'
                            }`}
                          >
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Rasmiy QR-Sertifikatlar
              </h3>
              {certificates.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500 space-y-2">
                  <Award size={28} className="mx-auto text-slate-400" />
                  <p>Hozircha rasmiy sertifikat taqdim etilmagan.</p>
                  <p className="text-[10px] text-slate-400">Kursni bitirganingizdan so'ng sertifikat shu yerda paydo bo'ladi.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {certificates.map((cert) => (
                    <div
                      key={cert.id}
                      className="bg-slate-50 border-2 border-amber-500/30 rounded-2xl p-4 space-y-3 text-center"
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                        <GraduationCap size={22} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{cert.courseTitle}</h4>
                        <p className="text-[11px] font-mono text-amber-600 mt-0.5">{cert.certificateNumber}</p>
                      </div>
                      <div className="inline-block px-3 py-1 bg-amber-500/10 rounded-full text-amber-700 font-bold text-xs">
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
      {/* ======================================================== */}
      {/* ONLINE KARTA ORQALI TO'LOV MODALI (EKVAYRING + SMS OTP) */}
      {/* ======================================================== */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 backdrop-blur-md animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-sm relative overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                  <CreditCard size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Online Karta orqali To‘lov</h3>
                  <p className="text-[10px] text-slate-500">UzCard, Humo, Visa xavfsiz to‘lov tizimi</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPayModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* 1-BOSQICH: KARTA VA SUMMA KIRITISH */}
            {payStep === 'form' && (
              <form onSubmit={handleRequestSms} className="mt-5 space-y-4">
                
                {/* Interaktiv Karta Dizayni */}
                <div className="w-full border border-emerald-500/30 rounded-2xl p-4 shadow-sm relative overflow-hidden bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] tracking-wider uppercase font-bold text-slate-500">EduYuz Pay</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getCardType(inputCardNumber).color}`}>
                      {getCardType(inputCardNumber).name}
                    </span>
                  </div>

                  <div className="my-4">
                    <span className="font-mono text-base sm:text-lg font-bold text-slate-900 tracking-widest block">
                      {inputCardNumber || '•••• •••• •••• ••••'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <div>
                      <span className="text-[9px] text-slate-500 block uppercase">O‘quvchi</span>
                      <span className="font-bold text-slate-700">{studentData?.fullName || 'O‘quvchi'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-500 block uppercase">Muddati</span>
                      <span className="font-mono font-bold text-slate-700">{inputCardExpiry || 'MM/YY'}</span>
                    </div>
                  </div>
                </div>

                {/* To'lov Summasi */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    To‘lov summasi (so‘mda)
                  </label>
                  <div className="relative">
                    <input 
                      type="number"
                      required
                      min={1000}
                      step={5000}
                      value={payAmount}
                      onChange={(e) => setPayAmount(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-emerald-600 focus:outline-none focus:border-emerald-500"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-500">UZS</span>
                  </div>

                  {/* Tezkor Summa Tugmalari */}
                  <div className="flex gap-1.5 mt-2">
                    {[100000, 300000, 500000].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setPayAmount(val)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-medium transition cursor-pointer"
                      >
                        +{val.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Karta ma’lumotlari bu sahifada so‘ralmaydi — ularni faqat to‘lov tizimining
                  himoyalangan sahifasida kiritasiz.
                </p>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-[10px] text-slate-500 flex items-center justify-between">
                  <span>Qabul qiluvchi markaz kartasi:</span>
                  <span className="font-mono font-bold text-emerald-600">8600 0609 2593 9614</span>
                </div>

                <button 
                  type="submit"
                  disabled={payLoading}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-900 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
                >
                  {payLoading ? 'Yo‘naltirilmoqda...' : 'To‘lov sahifasiga o‘tish'}
                  <ArrowRight size={14} />
                </button>
              </form>
            )}

            {/* 2-BOSQICH: SMS KODNI TASDIQLASH */}
            {payStep === 'sms' && (
              <form onSubmit={handleConfirmPayment} className="mt-5 space-y-4">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 mx-auto flex items-center justify-center">
                    <Smartphone size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">SMS Kodni Kiriting</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Kartangizga ulangan telefon raqamingizga tasdiqlash kodi yuborildi.
                  </p>
                  <p className="text-xs font-bold text-emerald-600">
                    To‘lov summasi: {Number(payAmount).toLocaleString()} so‘m
                  </p>
                </div>

                <div>
                  <input 
                    type="text"
                    required
                    autoFocus
                    maxLength={6}
                    placeholder="••••••"
                    value={inputSmsCode}
                    onChange={(e) => setInputSmsCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-[0.5em] font-mono text-xl font-bold bg-slate-50 border-2 border-emerald-500/50 rounded-xl py-3 text-slate-900 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>Kodni kuting:</span>
                  <span className="font-mono text-emerald-600 font-bold">{smsTimer} soniya</span>
                </div>

                <button 
                  type="submit"
                  disabled={payLoading}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-900 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
                >
                  {payLoading ? 'To‘lov tasdiqlanmoqda...' : 'To‘lovni Tasdiqlash'}
                  <Lock size={14} />
                </button>

                <button 
                  type="button"
                  onClick={() => setPayStep('form')}
                  className="w-full py-2 text-xs text-slate-500 hover:text-slate-900 transition cursor-pointer"
                >
                  ← Karta ma'lumotlarini o'zgartirish
                </button>
              </form>
            )}

            {/* 3-BOSQICH: TO'LOV MUVAFFAQIYATLI (KVITANSIYA) */}
            {payStep === 'success' && (
              <div className="mt-5 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-600 mx-auto flex items-center justify-center animate-bounce">
                  <CheckCircle size={36} />
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-900">To‘lov Muvaffaqiyatli O‘tdi! </h4>
                  <p className="text-xs text-slate-500 mt-1">O‘quvchi hisobiga pul kelib tushdi va balansi to‘ldirildi.</p>
                </div>

                {/* To'lov Cheki */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2 font-mono text-xs text-slate-600">
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Tranzaksiya:</span>
                    <span className="font-bold text-slate-900">{lastPaymentInfo?.txId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Summa:</span>
                    <span className="font-bold text-emerald-600 text-sm">{Number(lastPaymentInfo?.amount).toLocaleString()} UZS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">To‘lovchi:</span>
                    <span className="text-slate-900">{lastPaymentInfo?.card}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Qabul qiluvchi:</span>
                    <span className="text-emerald-700 font-bold">8600 0609 2593 9614 (UzCard)</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Holat:</span>
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <ShieldCheck size={13} /> To‘landi (Tasdiqlangan)
                    </span>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold py-3 rounded-xl text-xs transition cursor-pointer"
                >
                  Yopish
                </button>
              </div>
            )}

          </div>
        </div>
      )}
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
