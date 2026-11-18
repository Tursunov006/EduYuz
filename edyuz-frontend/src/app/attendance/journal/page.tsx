'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { exportToExcel } from '@/lib/excelExport';

type Status = 'present' | 'absent' | 'late';

interface Journal {
  month: string;
  group: { id: string; name: string; days: any };
  students: { id: string; fullName: string }[];
  records: { studentId: string; date: string; status: Status }[];
}

const MARK: Record<Status, { sign: string; cls: string; label: string }> = {
  present: { sign: '✓', cls: 'bg-emerald-500/10 text-emerald-700', label: 'Keldi' },
  absent: { sign: '✗', cls: 'bg-rose-500/10 text-rose-600', label: 'Kelmadi' },
  late: { sign: 'K', cls: 'bg-amber-500/10 text-amber-700', label: 'Kechikdi' },
};

// Hafta kuni kalitlari (Date.getDay(): 0 = yakshanba)
const DOW = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];

function parseDays(raw: any): Set<string> {
  const text = (Array.isArray(raw) ? raw.join(' ') : String(raw || '')).toLowerCase();
  const set = new Set<string>();
  if (text.includes('har kuni')) ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'].forEach((k) => set.add(k));
  text.split(/[^a-z]+/).filter(Boolean).forEach((t) => {
    if (t.startsWith('dush')) set.add('Dush');
    else if (t.startsWith('sesh')) set.add('Sesh');
    else if (t.startsWith('chor')) set.add('Chor');
    else if (t.startsWith('pay')) set.add('Pay');
    else if (t.startsWith('jum')) set.add('Jum');
    else if (t.startsWith('shan')) set.add('Shan');
    else if (t.startsWith('yak')) set.add('Yak');
    else if (t === 'toq') ['Dush', 'Chor', 'Jum'].forEach((k) => set.add(k));
    else if (t === 'juft') ['Sesh', 'Pay', 'Shan'].forEach((k) => set.add(k));
  });
  return set;
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function shiftMonth(m: string, delta: number) {
  const [y, mo] = m.split('-').map(Number);
  const d = new Date(y, mo - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

export default function AttendanceJournalPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [groupId, setGroupId] = useState('');
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState<Journal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/groups')
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        setGroups(arr);
        const fromUrl = new URLSearchParams(window.location.search).get('groupId');
        if (fromUrl && arr.some((g: any) => g.id === fromUrl)) setGroupId(fromUrl);
        else if (arr[0]) setGroupId(arr[0].id);
      })
      .catch(() => setGroups([]));
  }, []);

  useEffect(() => {
    if (!groupId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    apiFetch(`/attendance/group/${groupId}/journal?month=${month}`)
      .then((d) => !cancelled && setData(d))
      .catch((e: any) => {
        if (cancelled) return;
        setData(null);
        setError(e?.message || 'Jurnalni yuklab bo‘lmadi');
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [groupId, month]);

  // Ustunlar: guruhning dars kunlari + davomat qo'yilgan boshqa kunlar
  const columns = useMemo(() => {
    if (!data) return [] as { date: string; day: number; dow: string }[];
    const [y, mo] = data.month.split('-').map(Number);
    const lessonDays = parseDays(data.group.days);
    const marked = new Set(data.records.map((r) => r.date));
    // Guruh ochilishidan oldingi kunlar ko'rsatilmaydi (davomat belgilangan kun bo'lsa — ko'rsatiladi)
    const createdAt = groups.find((g) => g.id === data.group.id)?.createdAt;
    const startDate = createdAt
      ? (() => {
          const c = new Date(createdAt);
          return `${c.getFullYear()}-${String(c.getMonth() + 1).padStart(2, '0')}-${String(c.getDate()).padStart(2, '0')}`;
        })()
      : '';
    const total = new Date(y, mo, 0).getDate();
    const cols = [];
    for (let d = 1; d <= total; d++) {
      const date = `${data.month}-${String(d).padStart(2, '0')}`;
      const dow = DOW[new Date(y, mo - 1, d).getDay()];
      if (marked.has(date) || (lessonDays.has(dow) && (!startDate || date >= startDate))) cols.push({ date, day: d, dow });
    }
    return cols;
  }, [data, groups]);

  const byKey = useMemo(() => {
    const m = new Map<string, Status>();
    data?.records.forEach((r) => m.set(`${r.studentId}|${r.date}`, r.status));
    return m;
  }, [data]);

  const rows = useMemo(
    () =>
      (data?.students || []).map((s) => {
        let present = 0, absent = 0, late = 0;
        columns.forEach((c) => {
          const st = byKey.get(`${s.id}|${c.date}`);
          if (st === 'present') present++;
          else if (st === 'absent') absent++;
          else if (st === 'late') late++;
        });
        const marked = present + absent + late;
        const pct = marked ? Math.round(((present + late) / marked) * 100) : null;
        return { ...s, present, absent, late, pct };
      }),
    [data, columns, byKey],
  );

  const [y, mo] = month.split('-').map(Number);
  const monthLabel = `${MONTHS[mo - 1]} ${y}`;
  const today = new Date().toISOString().slice(0, 10);

  function exportExcel() {
    if (!data) return;
    exportToExcel(
      `Davomat_jurnali_${data.group.name}_${data.month}`,
      [
        { header: 'O‘quvchi', key: 'fullName', width: 200 },
        ...columns.map((c) => ({
          header: `${c.day} ${c.dow}`,
          key: c.date,
          width: 48,
          align: 'center' as const,
          format: (_v: any, row: any) => {
            const st = byKey.get(`${row.id}|${c.date}`);
            return st ? MARK[st].sign : '';
          },
        })),
        { header: 'Keldi', key: 'present', width: 60, align: 'center' as const },
        { header: 'Kelmadi', key: 'absent', width: 70, align: 'center' as const },
        { header: 'Kechikdi', key: 'late', width: 70, align: 'center' as const },
        { header: 'Davomat %', key: 'pct', width: 80, align: 'center' as const, format: (v: any) => (v === null ? '—' : `${v}%`) },
      ],
      rows,
      { title: `Davomat jurnali — ${data.group.name}`, subtitle: `${monthLabel} • ✓ keldi, ✗ kelmadi, K kechikdi` },
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <Link href="/attendance" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600">
            <ArrowLeft className="w-3.5 h-3.5" /> Davomat belgilash
          </Link>
          <h1 className="mt-1 text-2xl sm:text-[26px] font-bold text-slate-900 leading-tight">Davomat jurnali</h1>
          <p className="text-sm text-slate-500 mt-1">Guruhning oylik davomati: o‘quvchilar × dars kunlari</p>
        </div>
        <button
          onClick={exportExcel}
          disabled={!data || rows.length === 0}
          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel
        </button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <select
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          className="h-10 w-full lg:w-72 px-3.5 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-400"
        >
          {groups.length === 0 && <option value="">Guruh yo‘q</option>}
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1 h-10 rounded-xl bg-white border border-slate-200 px-1 w-full lg:w-auto">
          <button onClick={() => setMonth((m) => shiftMonth(m, -1))} title="Oldingi oy" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="flex-1 lg:w-36 text-center text-sm font-semibold text-slate-800">{monthLabel}</span>
          <button onClick={() => setMonth((m) => shiftMonth(m, 1))} title="Keyingi oy" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 lg:ml-auto">
          {(Object.keys(MARK) as Status[]).map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <span className={`w-5 h-5 inline-flex items-center justify-center rounded-md text-[11px] font-bold ${MARK[k].cls}`}>{MARK[k].sign}</span>
              {MARK[k].label}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">Yuklanmoqda…</div>
        ) : error ? (
          <div className="p-12 text-center text-sm text-rose-600">{error}</div>
        ) : !data || data.students.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">Bu guruhda o‘quvchilar yo‘q</div>
        ) : columns.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">Bu oyda dars kunlari yo‘q (guruh hali ochilmagan bo‘lishi mumkin)</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500">
                  <th className="sticky left-0 z-10 bg-slate-50 text-left font-semibold text-xs px-4 py-2.5 min-w-[200px] border-b border-slate-200">
                    O‘quvchi
                  </th>
                  {columns.map((c) => (
                    <th
                      key={c.date}
                      className={`px-1 py-1.5 text-center font-semibold border-b border-slate-200 min-w-[38px] ${c.date === today ? 'bg-indigo-50 text-indigo-700' : ''}`}
                    >
                      <Link
                        href={`/attendance?groupId=${groupId}&date=${c.date}`}
                        title="Shu kunga davomat belgilash"
                        className="block rounded-md hover:bg-indigo-100 px-1 py-0.5"
                      >
                        <div className="text-[13px] text-slate-800">{c.day}</div>
                        <div className="text-[10px] font-medium">{c.dow}</div>
                      </Link>
                    </th>
                  ))}
                  <th className="px-2 py-2.5 text-center text-xs font-semibold border-b border-l border-slate-200 text-emerald-700">Keldi</th>
                  <th className="px-2 py-2.5 text-center text-xs font-semibold border-b border-slate-200 text-rose-600">Kelmadi</th>
                  <th className="px-2 py-2.5 text-center text-xs font-semibold border-b border-slate-200 text-amber-700">Kech</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold border-b border-slate-200">%</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s, idx) => (
                  <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="sticky left-0 z-10 bg-white px-4 py-2 font-medium text-slate-800 whitespace-nowrap">
                      <span className="inline-block w-6 text-right mr-2 text-xs text-slate-400 tabular-nums">{idx + 1}</span>
                      <Link href={`/students/${s.id}`} className="hover:text-indigo-600">
                        {s.fullName}
                      </Link>
                    </td>
                    {columns.map((c) => {
                      const st = byKey.get(`${s.id}|${c.date}`);
                      return (
                        <td key={c.date} className={`px-1 py-1.5 text-center ${c.date === today ? 'bg-indigo-50/50' : ''}`}>
                          {st ? (
                            <span title={MARK[st].label} className={`w-7 h-7 inline-flex items-center justify-center rounded-lg text-xs font-bold ${MARK[st].cls}`}>
                              {MARK[st].sign}
                            </span>
                          ) : (
                            <span className="text-slate-300">·</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-2 text-center font-semibold text-emerald-700 border-l border-slate-100 tabular-nums">{s.present}</td>
                    <td className="px-2 text-center font-semibold text-rose-600 tabular-nums">{s.absent}</td>
                    <td className="px-2 text-center font-semibold text-amber-700 tabular-nums">{s.late}</td>
                    <td className="px-3 text-center tabular-nums">
                      {s.pct === null ? (
                        <span className="text-slate-300">—</span>
                      ) : (
                        <span className={`font-bold ${s.pct >= 80 ? 'text-emerald-700' : s.pct >= 50 ? 'text-amber-700' : 'text-rose-600'}`}>{s.pct}%</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-slate-400">Kun raqamini bossangiz, o‘sha kunga davomat belgilash sahifasi ochiladi.</p>
    </div>
  );
}
