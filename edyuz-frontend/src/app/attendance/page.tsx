'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCheck, Save } from 'lucide-react';
import { api, apiFetch } from '@/lib/api';

type Status = 'PRESENT' | 'ABSENT' | 'LATE';

interface Student {
  id: string;
  fullName: string;
  phone?: string;
}

const STATUS_META: Record<Status, { label: string; active: string }> = {
  PRESENT: { label: 'Keldi', active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' },
  ABSENT: { label: 'Kelmadi', active: 'bg-rose-500/10 text-rose-600 border-rose-500/30' },
  LATE: { label: 'Kechikdi', active: 'bg-amber-500/10 text-amber-600 border-amber-500/30' },
};

export default function AttendancePage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [groupId, setGroupId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Record<string, Status>>({});
  const [saved, setSaved] = useState<Record<string, Status>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Guruhlar ro'yxati. ?groupId=... bilan kelinsa (bosh sahifadagi "Davomat" tugmasi) o'sha tanlanadi.
  useEffect(() => {
    apiFetch('/groups')
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        setGroups(arr);
        const fromUrl = new URLSearchParams(window.location.search).get('groupId');
        if (fromUrl && arr.some((g: any) => g.id === fromUrl)) setGroupId(fromUrl);
      })
      .catch(() => setGroups([]));
  }, []);

  // Tanlangan guruh a'zolari va shu kungi saqlangan davomat
  useEffect(() => {
    if (!groupId) {
      setStudents([]);
      setMarks({});
      setSaved({});
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [group, prev] = await Promise.all([
          apiFetch(`/groups/${groupId}`),
          apiFetch(`/attendance/group/${groupId}?date=${date}`).catch(() => []),
        ]);
        if (cancelled) return;
        // Faqat shu guruhga biriktirilgan o'quvchilar (boshqa o'quvchilarga davomat qo'yib bo'lmaydi)
        const members: Student[] = (group?.students || []).map((gs: any) => gs.student).filter(Boolean);
        const savedMap: Record<string, Status> = {};
        (Array.isArray(prev) ? prev : []).forEach((r: any) => {
          savedMap[r.studentId] = String(r.status).toUpperCase() as Status;
        });
        const initial: Record<string, Status> = {};
        members.forEach((s) => {
          initial[s.id] = savedMap[s.id] || 'PRESENT';
        });
        setStudents(members);
        setSaved(savedMap);
        setMarks(initial);
      } catch (err: any) {
        if (!cancelled) alert(err?.message || 'Guruh ma’lumotlarini yuklab bo‘lmadi');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [groupId, date]);

  const counts = useMemo(() => {
    const v = Object.values(marks);
    return {
      present: v.filter((s) => s === 'PRESENT').length,
      absent: v.filter((s) => s === 'ABSENT').length,
      late: v.filter((s) => s === 'LATE').length,
    };
  }, [marks]);
  const alreadySaved = Object.keys(saved).length > 0;
  const changed = students.some((s) => saved[s.id] !== marks[s.id]);

  function markAll() {
    const all: Record<string, Status> = {};
    students.forEach((s) => (all[s.id] = 'PRESENT'));
    setMarks(all);
  }

  async function save() {
    if (!groupId || students.length === 0) return;
    setSaving(true);
    try {
      await api.post('/attendance/mark', {
        groupId,
        date,
        records: students.map((s) => ({ studentId: s.id, status: marks[s.id] || 'PRESENT' })),
      });
      setSaved({ ...marks });
      alert('Davomat saqlandi');
    } catch (err: any) {
      alert(err?.message || 'Davomatni saqlab bo‘lmadi');
    } finally {
      setSaving(false);
    }
  }

  const selectedGroup = groups.find((g) => g.id === groupId);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      {/* Sarlavha */}
      <div>
        <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 leading-tight">Davomat</h1>
        <p className="text-sm text-slate-500 mt-1">Guruh bo‘yicha davomat belgilash</p>
      </div>

      {/* Asboblar paneli */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <select
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          className="h-10 w-full lg:w-72 px-3.5 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-400"
          aria-label="Guruhni tanlang"
        >
          <option value="">Guruhni tanlang</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} {g.startTime ? `• ${g.startTime}` : ''}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          max={new Date().toISOString().split('T')[0]}
          onChange={(e) => setDate(e.target.value)}
          className="h-10 w-full lg:w-48 px-3.5 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-400"
          aria-label="Sana"
        />
        <div className="lg:ml-auto flex gap-2.5">
          <button
            onClick={markAll}
            disabled={students.length === 0}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50 transition"
          >
            <CheckCheck size={16} /> Hammasini «Keldi»
          </button>
          <button
            onClick={save}
            disabled={saving || students.length === 0 || (alreadySaved && !changed)}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition"
          >
            <Save size={16} /> {saving ? 'Saqlanmoqda...' : alreadySaved && !changed ? 'Saqlangan' : 'Saqlash'}
          </button>
        </div>
      </div>

      {/* Qisqa hisob */}
      {students.length > 0 && (
        <div className="flex flex-wrap gap-2.5 text-sm">
          <span className="inline-flex items-center h-8 px-3 rounded-full bg-white border border-slate-200 text-slate-600">
            Jami: <b className="ml-1 text-slate-800">{students.length}</b>
          </span>
          <span className="inline-flex items-center h-8 px-3 rounded-full bg-emerald-500/10 text-emerald-600">Keldi: <b className="ml-1">{counts.present}</b></span>
          <span className="inline-flex items-center h-8 px-3 rounded-full bg-rose-500/10 text-rose-600">Kelmadi: <b className="ml-1">{counts.absent}</b></span>
          <span className="inline-flex items-center h-8 px-3 rounded-full bg-amber-500/10 text-amber-600">Kechikdi: <b className="ml-1">{counts.late}</b></span>
          {alreadySaved && (
            <span className="inline-flex items-center h-8 px-3 rounded-full bg-indigo-500/10 text-indigo-700">
              Bu kun uchun davomat avval saqlangan
            </span>
          )}
        </div>
      )}

      {/* Jadval */}
      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <div className="hidden sm:grid grid-cols-[1.6fr_1fr_repeat(3,0.8fr)] gap-2 px-5 h-11 items-center bg-slate-50 text-xs font-semibold text-slate-500">
          <span>O‘quvchi</span>
          <span>Holat</span>
          <span className="text-center">Keldi</span>
          <span className="text-center">Kelmadi</span>
          <span className="text-center">Kechikdi</span>
        </div>

        {!groupId ? (
          <div className="py-24 px-4 text-center">
            <p className="text-[15px] font-semibold text-slate-600">Guruh tanlanmagan</p>
            <p className="text-xs text-slate-500 mt-1">Avval yuqoridan guruhni tanlang, o‘quvchilar ro‘yxati shu yerda chiqadi</p>
          </div>
        ) : loading ? (
          <div className="py-24 text-center text-sm text-slate-500">Yuklanmoqda...</div>
        ) : students.length === 0 ? (
          <div className="py-24 px-4 text-center">
            <p className="text-[15px] font-semibold text-slate-600">Bu guruhda o‘quvchi yo‘q</p>
            <p className="text-xs text-slate-500 mt-1">
              «{selectedGroup?.name}» guruhiga o‘quvchi biriktiring, keyin davomat belgilash mumkin bo‘ladi
            </p>
            <Link href={`/groups/${groupId}`} className="mt-3 inline-block text-xs font-semibold text-indigo-600 hover:underline">
              Guruhga o‘tish
            </Link>
          </div>
        ) : (
          <ul>
            {students.map((s) => {
              const current = marks[s.id] || 'PRESENT';
              return (
                <li
                  key={s.id}
                  className="grid grid-cols-1 sm:grid-cols-[1.6fr_1fr_repeat(3,0.8fr)] gap-2 sm:items-center px-5 py-3.5 border-t border-slate-200"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{s.fullName}</p>
                    {s.phone && <p className="text-xs text-slate-500">{s.phone}</p>}
                  </div>
                  <div>
                    <span className={`inline-flex items-center h-6 px-2.5 rounded-full border text-xs font-semibold ${STATUS_META[current].active}`}>
                      {STATUS_META[current].label}
                    </span>
                  </div>
                  <div className="flex sm:contents gap-2">
                    {(['PRESENT', 'ABSENT', 'LATE'] as Status[]).map((st) => (
                      <div key={st} className="sm:flex sm:justify-center flex-1">
                        <button
                          onClick={() => setMarks((m) => ({ ...m, [s.id]: st }))}
                          aria-pressed={current === st}
                          className={`w-full sm:w-24 h-9 rounded-lg border text-xs font-semibold transition ${
                            current === st ? STATUS_META[st].active : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          {STATUS_META[st].label}
                        </button>
                      </div>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
