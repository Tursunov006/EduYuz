'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Plus, CreditCard, TrendingUp, TrendingDown, Users, BookOpen, AlertCircle,
  CheckCircle2, MessageSquare, FileSpreadsheet, CalendarClock, ArrowRight, Target,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell } from 'recharts';
import { api, apiFetch } from '@/lib/api';
import { exportToExcel } from '@/lib/excelExport';

// ---------- Yordamchi funksiyalar ----------
const fmt = (n: number) => Math.round(n).toLocaleString('uz-UZ').replace(/,/g, ' ');
const DAY_SHORT = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];
const METHOD_LABELS: Record<string, string> = { cash: 'Naqd', card: 'Karta', click: 'Click', payme: 'Payme' };
const TARGET_KEY = 'eduyuz_revenue_target';

// Guruh kunlari turli ko'rinishda saqlangan: ["Dushanba", ...], "Dush-Chor-Jum", "toq kunlar", "har kuni"
function groupHasLessonOn(group: any, dayIndex: number) {
  const raw = (Array.isArray(group.days) ? group.days.join(' ') : String(group.days || '')).toLowerCase();
  if (!raw) return false;
  if (raw.includes('har kuni')) return true;
  if (raw.includes('toq')) return [1, 3, 5].includes(dayIndex);
  if (raw.includes('juft')) return [2, 4, 6].includes(dayIndex);
  return raw.includes(DAY_SHORT[dayIndex].toLowerCase());
}
const toMinutes = (hhmm: string) => {
  const [h, m] = String(hhmm || '0:0').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Xayrli tong';
  if (h < 18) return 'Xayrli kun';
  return 'Xayrli kech';
}

// ---------- Kichik UI qismlari ----------
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 ${className}`}>{children}</div>;
}
function CardHead({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <h2 className="text-base font-semibold text-slate-800">{title}</h2>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
      {right}
    </div>
  );
}
function Badge({ tone, children }: { tone: 'green' | 'red' | 'amber' | 'gray' | 'indigo'; children: React.ReactNode }) {
  const tones = {
    green: 'bg-emerald-500/10 text-emerald-600',
    red: 'bg-rose-500/10 text-rose-600',
    amber: 'bg-amber-500/10 text-amber-600',
    gray: 'bg-slate-100 text-slate-500',
    indigo: 'bg-indigo-500/10 text-indigo-700',
  };
  return <span className={`inline-flex items-center px-2.5 h-6 rounded-full text-xs font-semibold whitespace-nowrap ${tones[tone]}`}>{children}</span>;
}
function EmptyState({ title, hint, action }: { title: string; hint: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-dashed border-slate-200 px-4 py-8 text-center">
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      <p className="text-xs text-slate-500 mt-1">{hint}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [userName, setUserName] = useState('');
  const [range, setRange] = useState<7 | 30>(7);
  const [target, setTarget] = useState<number>(0);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      setUserName((u.fullName || '').split(' ')[0] || '');
      setTarget(Number(localStorage.getItem(TARGET_KEY)) || 0);
    } catch {}
    const timer = setInterval(() => setNow(new Date()), 60_000);
    (async () => {
      const [st, gr, co, te, pa] = await Promise.all([
        apiFetch('/students').catch(() => []),
        apiFetch('/groups').catch(() => []),
        apiFetch('/courses').catch(() => []),
        apiFetch('/teachers').catch(() => []),
        apiFetch('/payments').catch(() => []),
      ]);
      setStudents(Array.isArray(st) ? st : []);
      setGroups(Array.isArray(gr) ? gr : []);
      setCourses(Array.isArray(co) ? co : []);
      setTeachers(Array.isArray(te) ? te : []);
      setPayments(Array.isArray(pa) ? pa : []);
      setLoading(false);
    })();
    return () => clearInterval(timer);
  }, []);

  // ---------- Hisob-kitoblar (faqat haqiqiy ma'lumot) ----------
  const income = useMemo(() => payments.filter((p) => Number(p.amount) > 0), [payments]);
  const debtors = useMemo(
    () => students.filter((s) => Number(s.balance) < 0).sort((a, b) => Number(a.balance) - Number(b.balance)),
    [students],
  );
  const totalDebt = debtors.reduce((s, d) => s + Math.abs(Number(d.balance)), 0);
  const activeStudents = students.filter((s) => s.status !== 'inactive').length;

  const month = useMemo(() => {
    const y = now.getFullYear();
    const m = now.getMonth();
    const py = m === 0 ? y - 1 : y;
    const pm = m === 0 ? 11 : m - 1;
    let cur = 0;
    let prev = 0;
    income.forEach((p) => {
      const d = new Date(p.paidAt);
      if (d.getFullYear() === y && d.getMonth() === m) cur += Number(p.amount);
      if (d.getFullYear() === py && d.getMonth() === pm) prev += Number(p.amount);
    });
    return { cur, prev, delta: prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null };
  }, [income, now]);

  const todayIncome = income
    .filter((p) => new Date(p.paidAt).toDateString() === now.toDateString())
    .reduce((s, p) => s + Number(p.amount), 0);

  const chartData = useMemo(() => {
    const days: { key: string; label: string; value: number }[] = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      days.push({
        key: d.toDateString(),
        label: range === 7 ? DAY_SHORT[d.getDay()] : String(d.getDate()),
        value: 0,
      });
    }
    income.forEach((p) => {
      const slot = days.find((d) => d.key === new Date(p.paidAt).toDateString());
      if (slot) slot.value += Number(p.amount);
    });
    return days;
  }, [income, range, now]);
  const chartMax = Math.max(...chartData.map((d) => d.value), 0);

  const todayLessons = useMemo(() => {
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return groups
      .filter((g) => groupHasLessonOn(g, now.getDay()))
      .map((g) => {
        const start = toMinutes(g.startTime);
        const end = toMinutes(g.endTime);
        const state = nowMin >= end ? 'done' : nowMin >= start ? 'now' : 'next';
        return { ...g, start, state };
      })
      .sort((a, b) => a.start - b.start);
  }, [groups, now]);

  const steps = [
    { label: 'Kurs yaratish', done: courses.length > 0, href: '/groups' },
    { label: 'O‘qituvchi qo‘shish', done: teachers.length > 0, href: '/teachers' },
    { label: 'Guruh ochish', done: groups.length > 0, href: '/groups' },
    { label: 'O‘quvchi qo‘shish', done: students.length > 0, href: '/students' },
  ];
  const stepsDone = steps.filter((s) => s.done).length;

  // ---------- Amallar ----------
  function editTarget() {
    const v = prompt('Oylik kassa rejasini kiriting (so‘mda):', target ? String(target) : '');
    if (v === null) return;
    const n = Number(v.replace(/\D/g, ''));
    setTarget(n);
    try {
      localStorage.setItem(TARGET_KEY, String(n));
    } catch {}
  }

  async function sendDebtSms(d: any) {
    if (!d.parentPhone) return alert('Ota-ona telefon raqami kiritilmagan');
    if (!confirm(`${d.fullName}ning ota-onasiga qarzdorlik haqida SMS yuborilsinmi?`)) return;
    try {
      await api.post('/sms/send', {
        phone: d.parentPhone,
        message: `EduYuz: Hurmatli ota-ona! Farzandingiz ${d.fullName}ning ${fmt(Math.abs(Number(d.balance)))} so'm qarzdorligi mavjud. Iltimos, to'lovni amalga oshiring.`,
      });
      alert('SMS eslatma yuborildi');
    } catch (err: any) {
      alert(err?.message || 'SMS yuborishda xatolik');
    }
  }

  function exportDebtors() {
    exportToExcel(
      `EduYuz_Qarzdorlar_${new Date().toISOString().split('T')[0]}`,
      [
        { header: 'O‘quvchi', key: 'fullName', width: 240 },
        { header: 'Telefon', key: 'phone', width: 160, align: 'center' },
        { header: 'Ota-ona telefoni', key: 'parentPhone', width: 160, align: 'center' },
        {
          header: 'Qarzdorlik',
          key: 'balance',
          width: 190,
          isCurrency: true,
          format: (val) => `-${fmt(Math.abs(Number(val) || 0))} so'm`,
        },
      ],
      debtors,
      {
        title: "EduYuz CRM — Qarzdor o'quvchilar",
        summaryLabel: 'JAMI QARZDORLIK:',
        summaryValue: `-${fmt(totalDebt)} so'm`,
      },
    );
  }

  const nextLessons = todayLessons.filter((l) => l.state !== 'done').length;

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-12 w-72 rounded-xl bg-white" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-32 rounded-2xl bg-white" />)}
        </div>
        <div className="h-80 rounded-2xl bg-white" />
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6 pb-10 max-w-[1400px] mx-auto">
      {/* Sarlavha va asosiy amallar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-slate-800">
            {greeting()}{userName ? `, ${userName}` : ''}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {todayLessons.length > 0
              ? `Bugun ${todayLessons.length} ta dars, ${nextLessons} tasi hali oldinda`
              : 'Bugun rejalashtirilgan dars yo‘q'}
            {todayIncome > 0 ? ` • bugungi tushum ${fmt(todayIncome)} so‘m` : ''}
          </p>
        </div>
        <div className="flex gap-2.5">
          <Link
            href="/students"
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition"
          >
            <Plus size={16} /> O‘quvchi qo‘shish
          </Link>
          <Link
            href="/payments"
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-500 transition shadow-sm"
          >
            <CreditCard size={16} /> To‘lov qabul qilish
          </Link>
        </div>
      </div>

      {/* Markazni sozlash qadamlari (hammasi bajarilgach yashiriladi) */}
      {stepsDone < steps.length && (
        <Card className="!p-4 sm:!p-5">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="lg:w-56 shrink-0">
              <p className="text-sm font-semibold text-slate-800">Markazni sozlash: {stepsDone} / {steps.length}</p>
              <div className="mt-2 h-1.5 rounded-full bg-indigo-500/15 overflow-hidden">
                <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${(stepsDone / steps.length) * 100}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 flex-1">
              {steps.map((s) => (
                <Link
                  key={s.label}
                  href={s.href}
                  className={`flex items-center gap-2.5 h-11 px-3.5 rounded-xl text-sm transition ${
                    s.done ? 'bg-emerald-500/10 text-emerald-600 font-medium' : 'bg-slate-50 text-slate-800 font-semibold hover:bg-slate-50'
                  }`}
                >
                  {s.done ? (
                    <CheckCircle2 size={18} className="shrink-0" />
                  ) : (
                    <span className="w-[18px] h-[18px] rounded-full border-2 border-slate-300 shrink-0" />
                  )}
                  <span className="truncate">{s.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Asosiy ko'rsatkichlar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="!p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-500">Oylik tushum</span>
            {month.delta === null ? (
              <Badge tone="gray">Yangi oy</Badge>
            ) : (
              <Badge tone={month.delta >= 0 ? 'green' : 'red'}>
                {month.delta >= 0 ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                {month.delta >= 0 ? '+' : ''}{month.delta}%
              </Badge>
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[26px] font-bold text-slate-800">{fmt(month.cur)}</span>
            <span className="text-sm text-slate-500">so‘m</span>
          </div>
          <button onClick={editTarget} className="mt-1.5 flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 transition">
            <Target size={12} />
            {target > 0 ? `Reja: ${fmt(target)} (${Math.round((month.cur / target) * 100)}%)` : 'Oylik rejani belgilash'}
          </button>
        </Card>

        <Card className="!p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-500">Faol o‘quvchilar</span>
            <Users size={16} className="text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[26px] font-bold text-slate-800">{activeStudents}</span>
            <span className="text-sm text-slate-500">nafar</span>
          </div>
          <p className="mt-1.5 text-xs text-slate-500">Jami {students.length} ta o‘quvchi</p>
        </Card>

        <Card className="!p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-500">Guruhlar</span>
            <BookOpen size={16} className="text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[26px] font-bold text-slate-800">{groups.length}</span>
            <span className="text-sm text-slate-500">ta</span>
          </div>
          <p className="mt-1.5 text-xs text-slate-500">{courses.length} ta kurs • {teachers.length} ta o‘qituvchi</p>
        </Card>

        <Card className="!p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-500">Qarzdorlik</span>
            {debtors.length > 0 ? <Badge tone="red">{debtors.length} ta o‘quvchi</Badge> : <Badge tone="green">Qarz yo‘q</Badge>}
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className={`text-[26px] font-bold ${totalDebt > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{fmt(totalDebt)}</span>
            <span className="text-sm text-slate-500">so‘m</span>
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            {debtors[0] ? `Eng katta: ${fmt(Math.abs(Number(debtors[0].balance)))} so‘m` : 'Barcha to‘lovlar o‘z vaqtida'}
          </p>
        </Card>
      </div>

      {/* Grafik va bugungi darslar */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-4">
        <Card>
          <CardHead
            title="Tushum dinamikasi"
            sub={`Oxirgi ${range} kun, so‘mda`}
            right={
              <div className="flex p-1 rounded-xl bg-slate-50 border border-slate-200">
                {[7, 30].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r as 7 | 30)}
                    className={`px-3 h-7 rounded-lg text-xs font-semibold transition ${
                      range === r ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-600'
                    }`}
                  >
                    {r} kun
                  </button>
                ))}
              </div>
            }
          />
          {chartMax === 0 ? (
            <EmptyState title="Bu davrda tushum yo‘q" hint="To‘lov qabul qilingach, kunlik tushum shu yerda ustunlar bilan ko‘rinadi" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" interval={range === 7 ? 0 : 2} />
                  <Tooltip
                    cursor={{ fill: 'rgba(99,102,241,0.06)' }}
                    formatter={(v: any) => [`${fmt(Number(v))} so‘m`, 'Tushum']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={48}>
                    {chartData.map((d) => (
                      <Cell key={d.key} fill={d.value === chartMax ? '#4f46e5' : '#c7d2fe'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <CardHead
            title="Bugungi darslar"
            sub={todayLessons.length ? `${todayLessons.length} ta dars` : undefined}
            right={
              <Link href="/groups" className="inline-flex items-center h-8 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
                Jadval
              </Link>
            }
          />
          {todayLessons.length === 0 ? (
            <EmptyState
              title="Bugun dars yo‘q"
              hint="Guruhlarga dars kunlari va vaqti belgilanganda shu yerda chiqadi"
              action={<Link href="/groups" className="text-xs font-semibold text-indigo-600 hover:underline">Guruh ochish</Link>}
            />
          ) : (
            <ul className="space-y-2.5">
              {todayLessons.slice(0, 5).map((l) => (
                <li key={l.id} className="flex items-center gap-3">
                  <div className={`w-14 h-11 rounded-xl flex items-center justify-center text-sm font-semibold shrink-0 ${
                    l.state === 'now' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-800'
                  }`}>
                    {l.startTime}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{l.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {l.teacher?.fullName || 'O‘qituvchi biriktirilmagan'} • {l._count?.students ?? 0} o‘quvchi
                    </p>
                  </div>
                  {l.state === 'done' && <Badge tone="gray">Tugadi</Badge>}
                  {l.state === 'now' && (
                    <Link href={`/attendance?groupId=${l.id}`} className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-500 transition">
                      Davomat <ArrowRight size={12} />
                    </Link>
                  )}
                  {l.state === 'next' && <Badge tone="indigo"><CalendarClock size={12} className="mr-1" />Kutilmoqda</Badge>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Qarzdorlar va so'nggi to'lovlar */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-4">
        <Card>
          <CardHead
            title="Qarzdor o‘quvchilar"
            sub={debtors.length ? `${debtors.length} ta • jami ${fmt(totalDebt)} so‘m` : undefined}
            right={
              debtors.length > 0 && (
                <button onClick={exportDebtors} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
                  <FileSpreadsheet size={14} /> Excel
                </button>
              )
            }
          />
          {debtors.length === 0 ? (
            <EmptyState title="Qarzdor o‘quvchi yo‘q" hint="Balansi manfiy bo‘lgan o‘quvchilar shu yerda chiqadi" />
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500">
                    <th className="font-semibold px-1 pb-2">O‘quvchi</th>
                    <th className="font-semibold px-1 pb-2 hidden sm:table-cell">Guruh</th>
                    <th className="font-semibold px-1 pb-2 text-right">Qarz</th>
                    <th className="px-1 pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {debtors.slice(0, 6).map((d) => (
                    <tr key={d.id} className="border-t border-slate-200">
                      <td className="px-1 py-3">
                        <p className="font-semibold text-slate-800">{d.fullName}</p>
                        <p className="text-xs text-slate-500">{d.parentPhone || 'Telefon yo‘q'}</p>
                      </td>
                      <td className="px-1 py-3 text-slate-600 hidden sm:table-cell">
                        {d.groups?.[0]?.group?.name || '—'}
                      </td>
                      <td className="px-1 py-3 text-right font-semibold text-rose-600 whitespace-nowrap">
                        -{fmt(Math.abs(Number(d.balance)))}
                      </td>
                      <td className="px-1 py-3 text-right">
                        <button
                          onClick={() => sendDebtSms(d)}
                          className="inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition whitespace-nowrap"
                        >
                          <MessageSquare size={13} /> SMS
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {debtors.length > 6 && (
                <Link href="/payments" className="mt-3 inline-block text-xs font-semibold text-indigo-600 hover:underline">
                  Yana {debtors.length - 6} ta qarzdorni ko‘rish
                </Link>
              )}
            </div>
          )}
        </Card>

        <Card>
          <CardHead
            title="So‘nggi to‘lovlar"
            sub={todayIncome > 0 ? `Bugun: ${fmt(todayIncome)} so‘m` : undefined}
            right={
              <Link href="/payments" className="inline-flex items-center h-8 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
                Barchasi
              </Link>
            }
          />
          {income.length === 0 ? (
            <EmptyState
              title="Hali to‘lovlar yo‘q"
              hint="Birinchi to‘lov qabul qilingach shu yerda ko‘rinadi"
              action={<Link href="/payments" className="text-xs font-semibold text-indigo-600 hover:underline">To‘lov qabul qilish</Link>}
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {income.slice(0, 5).map((p) => {
                const name = p.student?.fullName || 'O‘quvchi';
                const d = new Date(p.paidAt);
                const when = d.toDateString() === now.toDateString()
                  ? d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
                  : d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' });
                return (
                  <li key={p.id} className="flex items-center gap-3 py-3">
                    <span className="w-9 h-9 rounded-full bg-indigo-500/10 text-indigo-700 flex items-center justify-center text-sm font-bold shrink-0">
                      {name[0]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{name}</p>
                      <p className="text-xs text-slate-500">{METHOD_LABELS[p.paymentMethod] || p.paymentMethod} • {when}</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600 whitespace-nowrap">+{fmt(Number(p.amount))}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {debtors.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <AlertCircle size={14} /> SMS eslatma ota-onaning telefon raqamiga yuboriladi va har biri uchun tasdiq so‘raladi.
        </div>
      )}
    </div>
  );
}
