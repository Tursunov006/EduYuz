'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, TrendingUp, TrendingDown, DollarSign, Users, BookOpen, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';

const COLORS = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-purple-500', 'bg-pink-500'];

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    monthlyIncome: 0,
    monthlyExpense: 0,
    netProfit: 0,
    totalDebt: 0
  });

  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [teacherStats, setTeacherStats] = useState<any[]>([]);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const [payments, expenses, students, teachers, groups] = await Promise.all([
          apiFetch('/payments').catch(() => []),
          apiFetch('/expenses').catch(() => []),
          apiFetch('/students').catch(() => []),
          apiFetch('/teachers').catch(() => []),
          apiFetch('/groups').catch(() => []),
        ]);

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        // Calculate Monthly Stats
        const monthlyIn = payments.filter((p: any) => {
          const d = new Date(p.paidAt);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).reduce((acc: number, p: any) => acc + Number(p.amount), 0);

        const monthlyExp = expenses.filter((e: any) => {
          const d = new Date(e.date || e.createdAt);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).reduce((acc: number, e: any) => acc + Number(e.amount), 0);

        const net = monthlyIn - monthlyExp;

        const totalDebt = students.filter((s: any) => Number(s.balance) < 0)
          .reduce((acc: number, s: any) => acc + Math.abs(Number(s.balance)), 0);

        setStats({
          monthlyIncome: monthlyIn,
          monthlyExpense: monthlyExp,
          netProfit: net,
          totalDebt: totalDebt
        });

        // Prepare 6-month Chart Data (Simulated with simple flex bars)
        const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
        const chartData = [];
        let maxVal = 0;
        
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const m = d.getMonth();
          const y = d.getFullYear();

          const mIncome = payments.filter((p: any) => {
            const pd = new Date(p.paidAt);
            return pd.getMonth() === m && pd.getFullYear() === y;
          }).reduce((acc: number, p: any) => acc + Number(p.amount), 0);

          const mExpense = expenses.filter((e: any) => {
            const ed = new Date(e.date || e.createdAt);
            return ed.getMonth() === m && ed.getFullYear() === y;
          }).reduce((acc: number, e: any) => acc + Number(e.amount), 0);
          
          if (mIncome > maxVal) maxVal = mIncome;
          if (mExpense > maxVal) maxVal = mExpense;

          chartData.push({
            name: `${months[m]}`,
            tushum: mIncome,
            xarajat: mExpense,
            foyda: mIncome - mExpense
          });
        }
        
        // Add relative heights
        setMonthlyData(chartData.map(d => ({
          ...d,
          tushumPct: maxVal === 0 ? 0 : (d.tushum / maxVal) * 100,
          xarajatPct: maxVal === 0 ? 0 : (d.xarajat / maxVal) * 100,
        })));

        // Teacher Stats
        const tStats = teachers.map((t: any) => {
          const tGroups = groups.filter((g: any) => g.teacherId === t.id);
          const studentCount = tGroups.reduce((acc: number, g: any) => {
            return acc + (g.students?.length || g._count?.students || 0);
          }, 0);
          return {
            name: t.fullName,
            students: studentCount,
            groups: tGroups.length
          };
        }).sort((a: any, b: any) => b.students - a.students).slice(0, 5);

        // calculate total for progress bar percentages
        const totalStudents = tStats.reduce((acc, t) => acc + t.students, 0);
        setTeacherStats(tStats.map((t, i) => ({
             ...t, 
             pct: totalStudents === 0 ? 0 : (t.students / totalStudents) * 100,
             color: COLORS[i % COLORS.length]
        })));

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Hisobotlar yuklanmoqda...</div>;
  }

  const statCards = [
    { title: 'Oylik Tushum', value: stats.monthlyIncome, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { title: 'Oylik Xarajat', value: stats.monthlyExpense, icon: TrendingDown, color: 'text-rose-400', bg: 'bg-rose-400/10' },
    { title: 'Sof Foyda', value: stats.netProfit, icon: DollarSign, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    { title: 'Jami Qarzdorlik', value: stats.totalDebt, icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Xulosalar va Hisobotlar</h1>
        <p className="text-slate-400 mt-1">Markazning moliyaviy va umumiy holati bo'yicha tahlillar (Analitika)</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-sm font-medium text-slate-400">{card.title}</p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {card.value.toLocaleString('uz-UZ')} <span className="text-sm text-slate-500 font-normal">so'm</span>
              </h3>
            </div>
            <div className={`p-3 rounded-xl ${card.bg}`}>
              <card.icon size={24} className={card.color} />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart (CSS Bar Chart) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col">
          <h2 className="text-lg font-bold text-white mb-2">Oxirgi 6 oylik moliyaviy dinamika</h2>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span><span className="text-xs text-slate-400">Tushum</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500"></span><span className="text-xs text-slate-400">Xarajat</span></div>
          </div>
          
          <div className="flex-1 flex items-end justify-between gap-2 h-[280px] pt-4">
            {monthlyData.map((d, i) => (
              <div key={i} className="flex flex-col items-center flex-1 group">
                <div className="flex-1 flex items-end justify-center w-full gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                  {/* Tushum ustuni */}
                  <div className="w-full max-w-[24px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-sm relative flex items-end justify-center group/tushum" style={{ height: `${d.tushumPct}%`, minHeight: d.tushumPct > 0 ? '4px' : '0' }}>
                    <div className="absolute -top-8 bg-slate-800 text-xs text-emerald-400 px-2 py-1 rounded opacity-0 group-hover/tushum:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                      {d.tushum.toLocaleString()} so'm
                    </div>
                  </div>
                  {/* Xarajat ustuni */}
                  <div className="w-full max-w-[24px] bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-sm relative flex items-end justify-center group/xarajat" style={{ height: `${d.xarajatPct}%`, minHeight: d.xarajatPct > 0 ? '4px' : '0' }}>
                     <div className="absolute -top-8 bg-slate-800 text-xs text-rose-400 px-2 py-1 rounded opacity-0 group-hover/xarajat:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-10">
                      {d.xarajat.toLocaleString()} so'm
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-3 font-medium">{d.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Teachers List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-lg font-bold text-white mb-6">Eng faol o'qituvchilar</h2>
          
          <div className="space-y-5 mt-4">
            {teacherStats.length === 0 ? (
              <p className="text-sm text-slate-500">Ma'lumot yo'q</p>
            ) : (
              teacherStats.map((t, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-bold text-slate-500 w-4">{i + 1}.</span>
                       <span className="text-sm font-medium text-white">{t.name}</span>
                    </div>
                    <span className="text-sm font-bold text-indigo-400">{t.students} ta</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${t.color}`} style={{ width: `${Math.max(t.pct, 2)}%` }}></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{t.groups} ta guruh</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
