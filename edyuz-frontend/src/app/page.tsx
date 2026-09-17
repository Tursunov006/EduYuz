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
    { title: t('dash.totalStudents', "Jami O'quvchilar"), value: stats.studentsCount, icon: Users, color: 'from-blue-500 to-indigo-600', href: '/students' },
    { title: t('dash.activeGroups', 'Faol Guruhlar'), value: stats.groupsCount, icon: BookOpen, color: 'from-emerald-500 to-teal-600', href: '/groups' },
    { title: 'Kurslar', value: stats.coursesCount, icon: Calendar, color: 'from-amber-500 to-orange-600', href: '/groups' },
    { title: t('dash.monthlyRevenue', 'Jami Tushum'), value: `${stats.paymentsTotal.toLocaleString()} so'm`, icon: TrendingUp, color: 'from-violet-500 to-purple-600', href: '/payments' },
  ];

  return (
    <div className="space-y-8">
      {/* Sarlavha va Tezkor tugmalar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Boshqaruv Paneli</h1>
          <p className="text-slate-400 mt-1">O'quv markazining asosiy statistikasi va tezkor amallar</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/students"
            className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-medium transition"
          >
            <Plus size={14} className="text-indigo-400" /> O'quvchi qo'shish
          </Link>
          <Link
            href="/groups"
            className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-medium transition"
          >
            <Plus size={14} className="text-indigo-400" /> Guruh ochish
          </Link>
          <Link
            href="/payments"
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-medium transition shadow-lg shadow-indigo-600/20"
          >
            <Plus size={14} /> To'lov olish
          </Link>
        </div>
      </div>

      {/* Statistika Kartalari */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link
              key={i}
              href={card.href}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm flex items-center justify-between transition group"
            >
              <div>
                <p className="text-xs font-medium text-slate-400">{card.title}</p>
                <h3 className="text-2xl font-bold mt-2 text-white">{loading ? '...' : card.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform`}>
                <Icon size={22} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Asosiy blok: So'nggi to'lovlar + Qarzdorlar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* So'nggi to'lovlar jadvali (2 ustun) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <CreditCard size={18} className="text-indigo-400" />
              So'nggi qabul qilingan to'lovlar
            </h2>
            <Link href="/payments" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              Barchasi <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 text-slate-400 font-medium">
                <tr>
                  <th className="py-3 px-3">O'quvchi</th>
                  <th className="py-3 px-3">Miqdor</th>
                  <th className="py-3 px-3">Usul</th>
                  <th className="py-3 px-3">Sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentPayments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">To'lovlar mavjud emas</td>
                  </tr>
                ) : (
                  recentPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-medium text-white">{p.student?.fullName || 'Noma\'lum'}</td>
                      <td className="py-3 px-3 text-emerald-400 font-semibold">{Math.abs(Number(p.amount)).toLocaleString('uz-UZ')} so'm</td>
                      <td className="py-3 px-3 uppercase text-xs">
                        <span className="px-2 py-0.5 bg-slate-800 text-indigo-300 rounded font-medium border border-slate-700">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-xs">{new Date(p.paidAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Qarzdor o'quvchilar ro'yxati (1 ustun) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <AlertCircle size={18} className="text-rose-400" />
              {t('dash.debtors', 'Qarzdorlar')}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportDebtors}
                title="Qarzdorlarni Excelga yuklash"
                className="p-1 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1 transition active:scale-95"
              >
                <FileSpreadsheet size={13} />
                <span>Excel</span>
              </button>
              <span className="text-xs bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/20 font-medium">
                {debtors.length} ta
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {debtors.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">Qarzdor o'quvchilar mavjud emas 🎉</p>
            ) : (
              debtors.slice(0, 5).map((d) => (
                <div key={d.id} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white">{d.fullName}</h4>
                    <p className="text-xs text-slate-400">{d.parentPhone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-rose-400">
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
                          alert(`✅ ${d.fullName}ning ota-onasiga (${d.parentPhone}) SMS eslatma jo'natildi!`);
                        } catch (err: any) {
                          alert('SMS yuborishda xatolik');
                        }
                      }}
                      title="Qarzdorlik haqida SMS yuborish"
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg transition"
                    >
                      <MessageSquare size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
