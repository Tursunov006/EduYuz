'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, BookOpen, CreditCard, TrendingUp, Calendar, ArrowUpRight, AlertCircle, Plus, MessageSquare, FileSpreadsheet } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import axios from 'axios';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { exportToExcel } from '@/lib/excelExport';

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

  const cards = [
    { title: t('dash.totalStudents', "Jami O'quvchilar"), value: stats.studentsCount, icon: Users, color: 'from-blue-500 to-indigo-600', href: '/students', badge: '+12% bu oy' },
    { title: t('dash.activeGroups', 'Faol Guruhlar'), value: stats.groupsCount, icon: BookOpen, color: 'from-cyan-500 to-teal-600', href: '/groups', badge: '100% to\'liq' },
    { title: 'Kurs Yo\'nalishlari', value: stats.coursesCount, icon: Calendar, color: 'from-amber-500 to-orange-600', href: '/groups', badge: 'Standart' },
    { title: t('dash.monthlyRevenue', 'Jami Tushum'), value: `${stats.paymentsTotal.toLocaleString()} so'm`, icon: TrendingUp, color: 'from-purple-500 via-indigo-600 to-pink-500', href: '/payments', badge: 'Kassa faol' },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* 1. Header Banner & Tezkor Amallar (EduYuz 2.0 Hero) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/50 border border-slate-800/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              EduYuz 2.0 AI Hub • Tizim barqaror ishlamoqda
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Boshqaruv <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">Markazi</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-xl">
              Markazingizning real vaqtdagi davomat, moliya va o'quvchilar balansi ko'rsatkichlari.
            </p>
          </div>

          {/* Tezkor Tugmalar Bloki */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/attendance/scanner"
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/40 text-cyan-300 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-lg shadow-cyan-500/10 hover:scale-[1.02] active:scale-95"
            >
              <span className="text-sm">📷</span> Face-ID Skaner
            </Link>
            <Link
              href="/students"
              className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 text-slate-200 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95"
            >
              <Plus size={15} className="text-indigo-400" /> O'quvchi
            </Link>
            <Link
              href="/groups"
              className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 text-slate-200 px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95"
            >
              <Plus size={15} className="text-indigo-400" /> Guruh
            </Link>
            <Link
              href="/payments"
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-xl shadow-purple-600/30 hover:scale-[1.02] active:scale-95"
            >
              <Plus size={15} /> To'lov qabul qilish
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Statistika Kartalari (EduYuz 2.0 KPI Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link
              key={i}
              href={card.href}
              className="relative overflow-hidden bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 group hover:-translate-y-1 backdrop-blur-md"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{card.title}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
                  {card.badge}
                </span>
              </div>
              
              <div className="flex items-baseline justify-between">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {loading ? '...' : card.value}
                </h3>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${card.color} flex items-center justify-center text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <Icon size={22} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 3. Asosiy blok: So'nggi to'lovlar + Qarzdorlar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* So'nggi to'lovlar jadvali (2 ustun) */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4 backdrop-blur-md">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
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
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-bold">
                          {p.student?.fullName?.[0] || 'O'}
                        </div>
                        {p.student?.fullName || 'Noma\'lum'}
                      </td>
                      <td className="py-3.5 px-3 text-emerald-400 font-extrabold font-mono">
                        +{Math.abs(Number(p.amount)).toLocaleString('uz-UZ')} so'm
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-1 bg-slate-800/80 text-cyan-300 rounded-lg text-[11px] font-bold border border-slate-700/60 uppercase">
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
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-4 backdrop-blur-md flex flex-col justify-between">
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
                      <h4 className="text-xs font-bold text-white">{d.fullName}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{d.parentPhone || d.phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-rose-400 font-mono">
                        {Math.abs(Number(d.balance)).toLocaleString('uz-UZ')} so'm
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
            className="w-full text-center py-2.5 rounded-2xl bg-slate-800/70 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700/60 transition block"
          >
            Batafsil Moliya Hisobotlari →
          </Link>
        </div>
      </div>
    </div>
  );
}
