'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { api, apiFetch } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';

// Figma: "EduYuz Dashboard v2"
const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
const DAY_SHORT = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];
const METHOD_LABELS: Record<string, string> = { cash: 'Naqd', card: 'Karta', click: 'Click', payme: 'Payme' };
const TARGET_KEY = 'eduyuz_revenue_target';

const fmt = (n: number) => Math.round(n).toLocaleString('uz-UZ').replace(/,/g, ' ');

// Guruh kunlari turli ko'rinishda saqlangan: ["Dushanba", ...], "Dush-Chor-Jum", "toq kunlar", "har kuni"
function hasLessonOn(group: any, day: number) {
  const raw = (Array.isArray(group.days) ? group.days.join(' ') : String(group.days || '')).toLowerCase();
  if (!raw) return false;
  if (raw.includes('har kuni')) return true;
  if (raw.includes('toq')) return [1, 3, 5].includes(day);
  if (raw.includes('juft')) return [2, 4, 6].includes(day);
  return raw.includes(DAY_SHORT[day].toLowerCase());
}
const minutes = (t: string) => {
  const [h, m] = String(t || '0:0').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white border border-slate-200 rounded-2xl ${className}`}>{children}</div>;
}
function Pill({ children, tone }: { children: React.ReactNode; tone: 'indigo' | 'green' | 'violet' | 'rose' }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
    rose: 'bg-rose-50 text-rose-600',
  };
  return <span className={`inline-flex items-center h-6 px-2.5 rounded-full text-xs font-medium ${tones[tone]}`}>{children}</span>;
}
function Empty({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex-1 min-h-[160px] rounded-xl bg-slate-50 flex flex-col items-center justify-center text-center px-4 gap-1.5">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="text-xs text-slate-500">{hint}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(0);
  const [initial, setInitial] = useState('A');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      setInitial((u.fullName || 'A').trim()[0]?.toUpperCase() || 'A');
      setTarget(Number(localStorage.getItem(TARGET_KEY)) || 0);
    } catch {}
    const timer = setInterval(() => setNow(new Date()), 60_000);
    (async () => {
      const [st, gr, pa] = await Promise.all([
        apiFetch('/students').catch(() => []),
        apiFetch('/groups').catch(() => []),
        apiFetch('/payments').catch(() => []),
      ]);
      setStudents(Array.isArray(st) ? st : []);
      setGroups(Array.isArray(gr) ? gr : []);
      setPayments(Array.isArray(pa) ? pa : []);
      setLoading(false);
    })();
    return () => clearInterval(timer);
  }, []);

  const income = useMemo(() => payments.filter((p) => Number(p.amount) > 0), [payments]);
  const debtors = useMemo(
    () => students.filter((s) => Number(s.balance) < 0).sort((a, b) => Number(a.balance) - Number(b.balance)),
    [students],
  );
  const activeStudents = students.filter((s) => s.status !== 'inactive');
  const studentsInGroups = activeStudents.filter((s) => (s.groups || []).length > 0).length;

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
    return { cur, delta: prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null };
  }, [income, now]);

  const week = useMemo(() => {
    const days: { key: string; label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      days.push({ key: d.toDateString(), label: DAY_SHORT[d.getDay()], value: 0 });
    }
    income.forEach((p) => {
      const slot = days.find((d) => d.key === new Date(p.paidAt).toDateString());
      if (slot) slot.value += Number(p.amount);
    });
    return days;
  }, [income, now]);
  const weekMax = Math.max(...week.map((d) => d.value), 0);

  const lessons = useMemo(() => {
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return groups
      .filter((g) => hasLessonOn(g, now.getDay()))
      .map((g) => ({ ...g, start: minutes(g.startTime), done: nowMin >= minutes(g.endTime), live: nowMin >= minutes(g.startTime) && nowMin < minutes(g.endTime) }))
      .sort((a, b) => a.start - b.start);
  }, [groups, now]);

  function editTarget() {
    const v = prompt('Oylik kassa rejasini kiriting (so‘mda):', target ? String(target) : '');
    if (v === null) return;
    const n = Number(v.replace(/\D/g, ''));
    setTarget(n);
    try {
      localStorage.setItem(TARGET_KEY, String(n));
    } catch {}
  }

  async function sendSms(d: any) {
    if (!d.parentPhone) return alert('Ota-ona telefon raqami kiritilmagan');
    if (!confirm(`${d.fullName}ning ota-onasiga qarzdorlik haqida SMS yuborilsinmi?`)) return;
    try {
      await api.post('/sms/send', {
        phone: d.parentPhone,
        message: `EduYuz: Hurmatli ota-ona! Farzandingiz ${d.fullName}ning ${fmt(Math.abs(Number(d.balance)))} so'm qarzdorligi mavjud. Iltimos, to'lovni amalga oshiring.`,
      });
      alert('SMS yuborildi');
    } catch (err: any) {
      alert(err?.message || 'SMS yuborishda xatolik');
    }
  }

  const dateLabel = `${now.getDate()}-${MONTHS[now.getMonth()]}, ${now.getFullYear()}`;
  const progress = target > 0 ? Math.round((month.cur / target) * 100) : null;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Sarlavha */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 leading-tight">Boshqaruv paneli</h1>
          <p className="text-sm text-slate-500 mt-0.5">Markaz holati va asosiy ko‘rsatkichlar</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex items-center h-10 px-3.5 rounded-[10px] bg-white border border-slate-200 text-[13px] font-medium text-slate-700">
            {dateLabel}
          </span>
          <ThemeToggle />
          <span className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[15px] font-bold">
            {initial}
          </span>
        </div>
      </div>

      {/* Ko'rsatkichlar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <button onClick={editTarget} className="text-left" title="Oylik rejani o‘zgartirish">
          <Card className="h-full px-5 py-[18px] space-y-1.5 hover:border-indigo-300 transition">
            <p className="text-[13px] font-medium text-slate-500">Oylik kassa rejasi</p>
            <p className="flex items-baseline gap-1.5">
              <span className="text-[30px] font-bold text-slate-900 leading-tight">{fmt(target)}</span>
              <span className="text-[13px] text-slate-500">so‘m</span>
            </p>
            {target > 0 ? <Pill tone="indigo">Reja belgilangan</Pill> : <Pill tone="indigo">Rejani belgilash</Pill>}
          </Card>
        </button>

        <Card className="px-5 py-[18px] space-y-1.5">
          <p className="text-[13px] font-medium text-slate-500">Joriy oy tushumi</p>
          <p className="flex items-baseline gap-1.5">
            <span className="text-[30px] font-bold text-slate-900 leading-tight">{loading ? '…' : fmt(month.cur)}</span>
            <span className="text-[13px] text-slate-500">so‘m</span>
          </p>
          {month.cur === 0 ? (
            <Pill tone="green">Hali to‘lov qabul qilinmagan</Pill>
          ) : progress !== null ? (
            <Pill tone="green">Rejaning {progress}% bajarildi</Pill>
          ) : month.delta !== null ? (
            <Pill tone={month.delta >= 0 ? 'green' : 'rose'}>{month.delta >= 0 ? '+' : ''}{month.delta}% o‘tgan oyga nisbatan</Pill>
          ) : (
            <Pill tone="green">{income.filter((p) => new Date(p.paidAt).getMonth() === now.getMonth()).length} ta to‘lov</Pill>
          )}
        </Card>

        <Card className="px-5 py-[18px] space-y-1.5">
          <p className="text-[13px] font-medium text-slate-500">Faol o‘quvchilar</p>
          <p className="flex items-baseline gap-1.5">
            <span className="text-[30px] font-bold text-slate-900 leading-tight">{loading ? '…' : activeStudents.length}</span>
            <span className="text-[13px] text-slate-500">nafar</span>
          </p>
          {studentsInGroups > 0 ? (
            <Pill tone="violet">{studentsInGroups} nafari {groups.length} ta guruhda</Pill>
          ) : (
            <Pill tone="violet">Guruhga biriktirilgan o‘quvchi yo‘q</Pill>
          )}
        </Card>
      </div>

      {/* Grafik va tezkor amallar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        <Card className="px-6 py-[22px] flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Haftalik tushum</h2>
              <p className="text-xs text-slate-500 mt-0.5">Oxirgi 7 kun, so‘mda</p>
            </div>
            <span className="inline-flex items-center h-[26px] px-2.5 rounded-full bg-indigo-50 text-xs font-medium text-indigo-600">Tushum</span>
          </div>
          <div className="mt-4 h-[220px] flex items-end gap-3.5">
            {week.map((d) => {
              const h = weekMax > 0 ? Math.max(6, Math.round((d.value / weekMax) * 170)) : 6;
              return (
                <div key={d.key} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
                  {d.value > 0 && <span className="text-[11px] font-medium text-slate-500">{fmt(d.value / 1000)} ming</span>}
                  <div
                    className={`w-full rounded ${d.value > 0 && d.value === weekMax ? 'bg-indigo-600' : 'bg-indigo-200'}`}
                    style={{ height: h }}
                    title={`${fmt(d.value)} so‘m`}
                  />
                  <span className="text-xs text-slate-500">{d.label}</span>
                </div>
              );
            })}
          </div>
          {weekMax === 0 && <p className="mt-3.5 text-xs text-slate-500">Tushum bo‘lganda ustunlar shu yerda chiqadi</p>}
        </Card>

        <Card className="px-[22px] py-[22px]">
          <h2 className="text-base font-semibold text-slate-900">Tezkor amallar</h2>
          <div className="mt-3.5 space-y-2.5">
            {[
              { label: 'To‘lov qabul qilish', href: '/payments', primary: true },
              { label: 'O‘quvchi qo‘shish', href: '/students' },
              { label: 'Guruh yaratish', href: '/groups' },
              { label: 'Davomat belgilash', href: '/attendance' },
            ].map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className={`flex items-center gap-3 h-[52px] px-3.5 rounded-xl text-sm font-semibold transition ${
                  a.primary
                    ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                    : 'bg-slate-50 border border-slate-200 text-slate-900 hover:border-indigo-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${a.primary ? 'bg-white' : 'bg-indigo-600'}`} />
                {a.label}
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* Bugungi darslar, qarzdorlar, so'nggi to'lovlar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="px-[22px] py-5 flex flex-col gap-3 min-h-[250px]">
          <h2 className="text-base font-semibold text-slate-900">Bugungi darslar</h2>
          {lessons.length === 0 ? (
            <Empty title="Bugun rejalashtirilgan dars yo‘q" hint="Guruh va jadval qo‘shilgach shu yerda ko‘rinadi" />
          ) : (
            <ul className="space-y-2">
              {lessons.slice(0, 4).map((l) => (
                <li key={l.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
                  <span className={`w-14 h-10 rounded-lg flex items-center justify-center text-[13px] font-semibold shrink-0 ${l.live ? 'bg-indigo-600 text-white' : 'bg-white text-slate-900 border border-slate-200'}`}>
                    {l.startTime}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{l.name}</p>
                    <p className="text-xs text-slate-500 truncate">{l.teacher?.fullName || 'O‘qituvchi yo‘q'} • {l._count?.students ?? 0} o‘quvchi</p>
                  </div>
                  {l.live ? (
                    <Link href={`/attendance?groupId=${l.id}`} className="text-xs font-semibold text-indigo-600 hover:underline shrink-0">Davomat</Link>
                  ) : l.done ? (
                    <span className="text-xs text-slate-400 shrink-0">Tugadi</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="px-[22px] py-5 flex flex-col gap-3 min-h-[250px]">
          <h2 className="text-base font-semibold text-slate-900">Qarzdor o‘quvchilar</h2>
          {debtors.length === 0 ? (
            <Empty title="Qarzdorlik yo‘q" hint="Balansi manfiy o‘quvchilar shu yerda chiqadi" />
          ) : (
            <>
              <ul className="space-y-2">
                {debtors.slice(0, 4).map((d) => (
                  <li key={d.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">{d.fullName}</p>
                      <p className="text-xs font-medium text-rose-600">-{fmt(Math.abs(Number(d.balance)))} so‘m</p>
                    </div>
                    <button
                      onClick={() => sendSms(d)}
                      title="Ota-onaga SMS eslatma"
                      className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-indigo-300 shrink-0"
                    >
                      <MessageSquare size={13} /> SMS
                    </button>
                  </li>
                ))}
              </ul>
              {debtors.length > 4 && (
                <Link href="/payments" className="text-xs font-semibold text-indigo-600 hover:underline">
                  Barcha {debtors.length} ta qarzdorni ko‘rish
                </Link>
              )}
            </>
          )}
        </Card>

        <Card className="px-[22px] py-5 flex flex-col gap-3 min-h-[250px]">
          <h2 className="text-base font-semibold text-slate-900">So‘nggi to‘lovlar</h2>
          {income.length === 0 ? (
            <Empty title="Hali to‘lovlar yo‘q" hint="Birinchi to‘lov qabul qilingach ro‘yxat shu yerda chiqadi" />
          ) : (
            <ul className="space-y-2">
              {income.slice(0, 4).map((p) => {
                const d = new Date(p.paidAt);
                const when =
                  d.toDateString() === now.toDateString()
                    ? d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
                    : `${d.getDate()}-${MONTHS[d.getMonth()]}`;
                return (
                  <li key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">{p.student?.fullName || 'O‘quvchi'}</p>
                      <p className="text-xs text-slate-500">{METHOD_LABELS[p.paymentMethod] || p.paymentMethod} • {when}</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600 shrink-0">+{fmt(Number(p.amount))}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
