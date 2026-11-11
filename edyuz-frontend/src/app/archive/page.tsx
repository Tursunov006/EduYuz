'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { RotateCcw, Search, Trash2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';

// Arxiv: kursni tugatgan o'quvchilar va yopilgan guruhlar.
// Bu yerdan ularni qayta faollashtirish yoki butunlay o'chirish mumkin.
type Tab = 'students' | 'groups';

const fmt = (n: number) => Math.round(n).toLocaleString('uz-UZ').replace(/,/g, ' ');
const fmtDate = (d?: string) => {
  if (!d) return '';
  const x = new Date(d);
  return `${String(x.getDate()).padStart(2, '0')}.${String(x.getMonth() + 1).padStart(2, '0')}.${x.getFullYear()}`;
};

export default function ArchivePage() {
  const [tab, setTab] = useState<Tab>('students');
  const [students, setStudents] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [st, gr] = await Promise.all([
        apiFetch('/students').catch(() => []),
        apiFetch('/groups?archived=true').catch(() => []),
      ]);
      setStudents((Array.isArray(st) ? st : []).filter((s: any) => s.status !== 'active'));
      setGroups((Array.isArray(gr) ? gr : []).filter((g: any) => g.archivedAt));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('tab');
    if (fromUrl === 'groups') setTab('groups');
    load();
  }, []);

  const q = search.trim().toLowerCase();
  const visibleStudents = useMemo(
    () => students.filter((s) => !q || `${s.fullName} ${s.phone || ''} ${s.parentPhone || ''}`.toLowerCase().includes(q)),
    [students, q],
  );
  const visibleGroups = useMemo(
    () =>
      groups.filter(
        (g) => !q || `${g.name} ${g.course?.title || ''} ${g.teacher?.fullName || ''}`.toLowerCase().includes(q),
      ),
    [groups, q],
  );

  async function restoreStudent(s: any) {
    setBusy(s.id);
    try {
      await apiFetch(`/students/${s.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'active' }) });
      setStudents((prev) => prev.filter((x) => x.id !== s.id));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function deleteStudent(s: any) {
    const ok = confirm(
      `"${s.fullName}"ni butunlay o'chirmoqchimisiz?\n\n` +
        `Diqqat: o'quvchining barcha to'lovlari ham o'chadi va kassa hisobotidan chiqib ketadi. Bu amalni qaytarib bo'lmaydi.`,
    );
    if (!ok) return;
    setBusy(s.id);
    try {
      await apiFetch(`/students/${s.id}`, { method: 'DELETE' });
      setStudents((prev) => prev.filter((x) => x.id !== s.id));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function restoreGroup(g: any) {
    setBusy(g.id);
    try {
      await apiFetch(`/groups/${g.id}`, { method: 'PATCH', body: JSON.stringify({ archived: false }) });
      setGroups((prev) => prev.filter((x) => x.id !== g.id));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBusy(null);
    }
  }

  async function deleteGroup(g: any) {
    const count = g._count?.students || 0;
    const ok = confirm(
      `"${g.name}" guruhini butunlay o'chirmoqchimisiz?\n\n` +
        (count > 0 ? `Guruhdagi ${count} ta o'quvchi o'chirilmaydi, faqat guruhdan chiqariladi.\n` : '') +
        `Guruhning davomat tarixi ham o'chadi. Bu amalni qaytarib bo'lmaydi.`,
    );
    if (!ok) return;
    setBusy(g.id);
    try {
      await apiFetch(`/groups/${g.id}`, { method: 'DELETE' });
      setGroups((prev) => prev.filter((x) => x.id !== g.id));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBusy(null);
    }
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'students', label: 'O‘quvchilar', count: students.length },
    { key: 'groups', label: 'Guruhlar', count: groups.length },
  ];

  const actionBtn =
    'inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 text-xs font-semibold transition disabled:opacity-50';

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      <div>
        <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 leading-tight">Arxiv</h1>
        <p className="text-sm text-slate-500 mt-1">Kursni tugatgan o‘quvchilar va yopilgan guruhlar</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold transition ${
                tab === t.key ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t.label}
              <span className={`text-xs ${tab === t.key ? 'text-indigo-100' : 'text-slate-400'}`}>{t.count}</span>
            </button>
          ))}
        </div>
        <label className="sm:ml-auto flex items-center gap-2.5 h-10 w-full sm:w-80 px-3.5 rounded-xl bg-white border border-slate-200 focus-within:border-indigo-400 transition-colors">
          <Search size={16} className="text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder={tab === 'students' ? 'Ism yoki telefon bo‘yicha qidirish' : 'Guruh, kurs yoki o‘qituvchi'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-0 bg-transparent text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none"
          />
        </label>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-24 text-center text-sm text-slate-500">Yuklanmoqda...</div>
        ) : tab === 'students' ? (
          visibleStudents.length === 0 ? (
            <Empty
              title={q ? 'Hech narsa topilmadi' : 'Arxivda o‘quvchi yo‘q'}
              text={
                q
                  ? `«${search}» bo‘yicha o‘quvchi topilmadi`
                  : 'O‘quvchilar sahifasida «Arxivga olish» tugmasini bosgan o‘quvchilar shu yerda saqlanadi'
              }
              link={{ href: '/students', label: 'O‘quvchilarga o‘tish' }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[680px]">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                  <tr>
                    <th className="h-11 px-5 font-semibold">O‘quvchi</th>
                    <th className="h-11 px-5 font-semibold">Telefon</th>
                    <th className="h-11 px-5 font-semibold">Balans</th>
                    <th className="h-11 px-5" />
                  </tr>
                </thead>
                <tbody>
                  {visibleStudents.map((s) => {
                    const bal = Number(s.balance || 0);
                    return (
                      <tr key={s.id} className="border-t border-slate-200">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-sm font-bold shrink-0">
                              {(s.fullName || '?')[0]}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate">{s.fullName}</p>
                              <p className="text-xs text-slate-500">
                                {(s.groups || []).map((x: any) => x.group?.name).filter(Boolean).join(', ') || 'Guruhsiz'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">{s.phone || s.parentPhone || '—'}</td>
                        <td
                          className={`px-5 py-3.5 font-semibold whitespace-nowrap ${
                            bal < 0 ? 'text-rose-600' : 'text-slate-600'
                          }`}
                        >
                          {bal < 0 ? `Qarz: ${fmt(Math.abs(bal))} so‘m` : `${fmt(bal)} so‘m`}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              disabled={busy === s.id}
                              onClick={() => restoreStudent(s)}
                              className={`${actionBtn} text-slate-700 hover:text-indigo-600 hover:border-indigo-300`}
                            >
                              <RotateCcw size={14} /> Qayta faollashtirish
                            </button>
                            <button
                              type="button"
                              disabled={busy === s.id}
                              onClick={() => deleteStudent(s)}
                              className={`${actionBtn} text-slate-500 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50`}
                            >
                              <Trash2 size={14} /> O‘chirish
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : visibleGroups.length === 0 ? (
          <Empty
            title={q ? 'Hech narsa topilmadi' : 'Arxivda guruh yo‘q'}
            text={
              q
                ? `«${search}» bo‘yicha guruh topilmadi`
                : 'Kursi tugagan guruhlarni «Guruhlar va jadval» sahifasidagi «Arxivga olish» tugmasi bilan shu yerga o‘tkazing'
            }
            link={{ href: '/groups', label: 'Guruhlarga o‘tish' }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[760px]">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="h-11 px-5 font-semibold">Guruh</th>
                  <th className="h-11 px-5 font-semibold">O‘qituvchi</th>
                  <th className="h-11 px-5 font-semibold">Vaqti</th>
                  <th className="h-11 px-5 font-semibold">Arxivga olingan</th>
                  <th className="h-11 px-5" />
                </tr>
              </thead>
              <tbody>
                {visibleGroups.map((g) => (
                  <tr key={g.id} className="border-t border-slate-200">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900">{g.name}</p>
                      <p className="text-xs text-slate-500">
                        {g.course?.title || 'Kurs'} · {g._count?.students || 0} o‘quvchi
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{g.teacher?.fullName || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                      <p>{Array.isArray(g.days) ? g.days.join(', ') : g.days}</p>
                      <p className="text-xs text-slate-500">
                        {g.startTime}–{g.endTime}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">{fmtDate(g.archivedAt)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={busy === g.id}
                          onClick={() => restoreGroup(g)}
                          className={`${actionBtn} text-slate-700 hover:text-indigo-600 hover:border-indigo-300`}
                        >
                          <RotateCcw size={14} /> Qaytarish
                        </button>
                        <button
                          type="button"
                          disabled={busy === g.id}
                          onClick={() => deleteGroup(g)}
                          className={`${actionBtn} text-slate-500 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50`}
                        >
                          <Trash2 size={14} /> O‘chirish
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Empty({ title, text, link }: { title: string; text: string; link: { href: string; label: string } }) {
  return (
    <div className="py-24 px-4 text-center">
      <p className="text-[15px] font-semibold text-slate-600">{title}</p>
      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">{text}</p>
      <Link href={link.href} className="mt-3 inline-block text-xs font-semibold text-indigo-600 hover:underline">
        {link.label}
      </Link>
    </div>
  );
}
