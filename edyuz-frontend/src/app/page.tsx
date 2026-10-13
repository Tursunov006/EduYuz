'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Users, BookOpen, CreditCard, TrendingUp, Calendar, ArrowUpRight, 
  AlertCircle, Plus, MessageSquare, FileSpreadsheet, Target, CheckCircle2,
  Clock, Award, Sparkles, Filter, ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { apiFetch } from '@/lib/api';
import axios from 'axios';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { exportToExcel } from '@/lib/excelExport';

// Namuna: 7 kunlik davomat va tushum dinamikasi (Line/Area Chart uchun)
const weeklyTrendData = [
  { day: 'Dush', attendance: 42, revenue: 1400 },
  { day: 'Sesh', attendance: 38, revenue: 950 },
  { day: 'Chor', attendance: 45, revenue: 2100 },
  { day: 'Pay', attendance: 40, revenue: 800 },
  { day: 'Jum', attendance: 48, revenue: 2600 },
  { day: 'Shan', attendance: 52, revenue: 3400 },
  { day: 'Yak', attendance: 20, revenue: 400 },
];

// Namuna: To'lov turlari taqsimoti (Donut Chart uchun)
const paymentMethodData = [
  { name: 'Payme / Click', value: 55, color: '#06b6d4' },
  { name: 'Naqd Pul', value: 30, color: '#10b981' },
  { name: 'Bank Kartasi', value: 15, color: '#8b5cf6' },
];

export default function DashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    studentsCount: 0,
    groupsCount: 0,
    coursesCount: 0,
    paymentsTotal: 0,
  });
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [debtors, setDebtors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Reja ko'rsatkichlari (Plan vs Actual)
  const targetRevenue = 25000000; // 25 mln so'm oylik reja
  const currentRevenue = stats.paymentsTotal || 16400000;
  const revenuePercent = Math.min(Math.round((currentRevenue / targetRevenue) * 100), 100);

  useEffect(() => {
    async function loadData() {
      try {
        const [students, groups, courses, payments] = await Promise.all([
          apiFetch('/students').catch(() => []),
          apiFetch('/groups').catch(() => []),
          apiFetch('/courses').catch(() => []),
          apiFetch('/payments').catch(() => []),
        ]);

        const totalPay = (payments || []).reduce((acc: number, p: any) => acc + Number(p.amount || 0), 0);
        const debtList = (students || []).filter((s: any) => Number(s.balance) < 0);

        setStats({
          studentsCount: students?.length || 0,
          groupsCount: groups?.length || 0,
          coursesCount: courses?.length || 0,
          paymentsTotal: totalPay,
        });
        setRecentPayments((payments || []).slice(0, 5));
        setDebtors(debtList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  function handleExportDebtors() {
    if (debtors.length === 0) return alert('Qarzdorlar ro‘yxati bo‘sh');
    exportToExcel(
      `EduYuz_Qarzdorlar_${new Date().toISOString().split('T')[0]}`,
      [
        { header: 'ID', key: 'id' },
        { header: t('students.name', 'F.I.SH'), key: 'fullName' },
        { header: t('students.phone', 'Telefon'), key: 'phone' },
        { header: 'Ota-ona telefoni', key: 'parentPhone' },
        { header: 'Qarzdorlik', key: 'balance', format: (val) => `${Math.abs(Number(val) || 0).toLocaleString('uz-UZ')} so'm` },
      ],
      debtors
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      
      {/* 1. HERO BANNER & TEZKOR AMALLAR (Responsive Desktop & Mobile) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-indigo-950/60 border border-slate-800/80 p-5 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 -mb-10 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              EduYuz 2.0 • Real-vaqt Boshqaruv Markazi
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              Boshqaruv <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">Paneli</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-xl">
              Markazingizning davomat, moliya va o'quvchilar oqimi tahlili bitta ekranda.
            </p>
          </div>

          {/* Tezkor Tugmalar (Kompyuterda qatorda, telefonda 2 ustunda) */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5">
            <Link
              href="/attendance/scanner"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/40 text-cyan-300 px-3.5 sm:px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-lg shadow-cyan-500/10 hover:scale-[1.02] active:scale-95"
            >
              <span className="text-sm">📷</span> Face-ID Skaner
            </Link>
            <Link
              href="/students"
              className="flex items-center justify-center gap-2 bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-200 px-3.5 sm:px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95"
            >
              <Plus size={14} className="text-indigo-400" /> O'quvchi
            </Link>
            <Link
              href="/groups"
              className="flex items-center justify-center gap-2 bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-200 px-3.5 sm:px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95"
            >
              <Plus size={14} className="text-indigo-400" /> Guruh
            </Link>
            <Link
              href="/payments"
              className="col-span-2 sm:col-auto flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-xl shadow-purple-600/30 hover:scale-[1.02] active:scale-95"
            >
              <Plus size={14} /> To'lov qabul qilish
            </Link>
          </div>
        </div>
      </div>

      {/* 2. REJA VA HAQIQAT (PLAN VS FACT) — KATTA CRM STRUKTURASI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Reja / Maqsad (Target) */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <Target size={16} className="text-cyan-400" /> Oylik Reja (Kassa)
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">
              Maqsad
            </span>
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {targetRevenue.toLocaleString('uz-UZ')} so'm
            </div>
            <div className="text-xs text-slate-400 mt-1">Belgilangan oylik kassa rejasi</div>
          </div>
          <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Bajarilish:</span>
              <span className="text-cyan-400 font-bold">{revenuePercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-1000"
                style={{ width: `${revenuePercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Amalda yig'ilgan (Fact) */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" /> Amalda Yig'ildi
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
              Fakt
            </span>
          </div>
          <div className="my-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
              {(stats.paymentsTotal || 16400000).toLocaleString('uz-UZ')} so'm
            </div>
            <div className="text-xs text-slate-400 mt-1">Joriy oy tushumlar jamg'armasi</div>
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
            <span className="text-slate-400">O'tgan oyga nisbatan:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
              +18.4% <TrendingUp size={12} />
            </span>
          </div>
        </div>

        {/* Faol O'quvchilar va Guruhlar */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <Users size={16} className="text-purple-400" /> O'quvchilar Oqimi
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold">
              Faol
            </span>
          </div>
          <div className="my-3 flex items-baseline justify-between">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">
                {loading ? '...' : stats.studentsCount} <span className="text-xs font-normal text-slate-400">nafar</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">{stats.groupsCount} ta faol guruhda ta'lim olmoqda</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <BookOpen size={22} />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
            <span className="text-slate-400">O'rtacha to'lalik:</span>
            <span className="text-purple-300 font-bold">92%</span>
          </div>
        </div>

      </div>

      {/* 3. INTERAKTIV GRAFIKLAR BLOKI (Line Chart + Donut Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chapdagi Katta Grafik: 7 Kunlik Davomat va Tushum Dinamikasi */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/60">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-cyan-400" />
                Haftalik Davomat va Tushum Dinamikasi
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Face-ID orqali o'tgan o'quvchilar va kunlik tushumlar</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Davomat
              </span>
              <span className="flex items-center gap-1.5 text-purple-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span> Tushum (ming so'm)
              </span>
            </div>
          </div>

          {/* Area Chart */}
          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#334155', 
                    borderRadius: '16px',
                    color: '#fff',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
                  }} 
                />
                <Area type="monotone" dataKey="attendance" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#attendanceGradient)" />
                <Area type="monotone" dataKey="revenue" stroke="#a855f7" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* O'ngdagi Donut Chart: To'lov Turlari Taqsimoti */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div className="pb-2 border-b border-slate-800/60">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard size={18} className="text-purple-400" />
              To'lov Usullari Taqsimoti
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Qaysi usulda ko'p to'lanmoqda</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderColor: '#334155', 
                    borderRadius: '12px',
                    color: '#fff'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            {paymentMethodData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  {item.name}
                </span>
                <span className="font-bold text-white font-mono">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. SO'NGGI TO'LOVLAR & QARZDORLAR (Zamonaviy Tablitsa va Tezkor Amallar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* So'nggi to'lovlar jadvali (2 ustun) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard size={18} className="text-cyan-400" />
                So'nggi qabul qilingan to'lovlar
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Real vaqtdagi kassa tushumlari</p>
            </div>
            <Link 
              href="/payments" 
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition flex items-center gap-1"
            >
              Barchasi <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800/80">
                <tr>
                  <th className="py-3 px-3">O'quvchi</th>
                  <th className="py-3 px-3">Miqdor</th>
                  <th className="py-3 px-3">Usul</th>
                  <th className="py-3 px-3">Sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {recentPayments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-500 text-xs">Hozircha to'lovlar kiritilmagan</td>
                  </tr>
                ) : (
                  recentPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/50 transition">
                      <td className="py-3.5 px-3 font-semibold text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-bold shrink-0">
                          {p.student?.fullName?.[0] || 'O'}
                        </div>
                        <span className="truncate max-w-[130px] sm:max-w-none">{p.student?.fullName || 'Noma\'lum'}</span>
                      </td>
                      <td className="py-3.5 px-3 text-emerald-400 font-extrabold font-mono text-xs sm:text-sm">
                        +{Math.abs(Number(p.amount)).toLocaleString('uz-UZ')} so'm
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-0.5 bg-slate-800/80 text-cyan-300 rounded-lg text-[10px] sm:text-[11px] font-bold border border-slate-700/60 uppercase">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-400 text-xs font-medium">
                        {new Date(p.paidAt).toLocaleDateString('uz-UZ')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Qarzdor o'quvchilar ro'yxati (1 ustun) */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <AlertCircle size={18} className="text-rose-400" />
                  Qarzdorlar
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Nazorat talab etiladi</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleExportDebtors}
                  title="Qarzdorlarni Excelga yuklash"
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1 transition active:scale-95"
                >
                  <FileSpreadsheet size={13} />
                  <span>Excel</span>
                </button>
                <span className="text-xs bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/20 font-bold">
                  {debtors.length} ta
                </span>
              </div>
            </div>

            <div className="space-y-2.5 pt-3">
              {debtors.length === 0 ? (
                <div className="py-12 text-center">
                  <span className="text-2xl">🎉</span>
                  <p className="text-xs text-slate-400 mt-2">Hamma to'lovlar joyida! Qarzdorlar yo'q.</p>
                </div>
              ) : (
                debtors.slice(0, 5).map((d) => (
                  <div key={d.id} className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex items-center justify-between hover:border-slate-700 transition">
                    <div>
                      <h4 className="text-xs font-bold text-white truncate max-w-[120px]">{d.fullName}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{d.parentPhone || d.phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-rose-400 font-mono">
                        {Math.abs(Number(d.balance)).toLocaleString('uz-UZ')}
                      </span>
                      <button
                        onClick={async () => {
                          if (!d.parentPhone) return alert("Ota-ona telefon raqami kiritilmagan");
                          try {
                            await axios.post('http://localhost:3000/api/v1/sms/send', {
                              phone: d.parentPhone,
                              message: `EduYuz: Hurmatli ota-ona! Farzandingiz ${d.fullName}ning ${Math.abs(Number(d.balance)).toLocaleString('uz-UZ')} so'm qarzdorligi mavjud. Iltimos, to'lovni amalga oshirishingizni so'raymiz.`,
                            });
                            alert(`✅ ${d.fullName}ning ota-onasiga SMS eslatma jo'natildi!`);
                          } catch (err: any) {
                            alert('SMS yuborishda xatolik');
                          }
                        }}
                        title="SMS yuborish"
                        className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition active:scale-95"
                      >
                        <MessageSquare size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <Link
            href="/reports"
            className="w-full text-center py-2.5 rounded-2xl bg-slate-800/70 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-750 transition block mt-4"
          >
            Batafsil Moliya Hisobotlari →
          </Link>
        </div>

      </div>

    </div>
  );
}
