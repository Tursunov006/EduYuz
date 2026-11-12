'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Copy, Send } from 'lucide-react';
import { apiFetch } from '@/lib/api';

// O'quvchi profili: o'quvchilar ro'yxatida ism yoki "Otasining ismi" bosilganda ochiladi
const fmt = (n: number) => Math.round(n).toLocaleString('uz-UZ').replace(/,/g, ' ');
const fmtDate = (d?: string | null) => {
  if (!d) return '';
  const x = new Date(d);
  return `${String(x.getDate()).padStart(2, '0')}.${String(x.getMonth() + 1).padStart(2, '0')}.${x.getFullYear()}`;
};
const METHOD: Record<string, string> = { cash: 'Naqd', card: 'Karta', click: 'Click', payme: 'Payme' };
const ATT: Record<string, { label: string; cls: string }> = {
  present: { label: 'Keldi', cls: 'bg-emerald-500/10 text-emerald-600' },
  absent: { label: 'Kelmadi', cls: 'bg-rose-500/10 text-rose-600' },
  late: { label: 'Kechikdi', cls: 'bg-amber-500/10 text-amber-600' },
};

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-900 mt-0.5 break-words">{value || <span className="text-slate-400">—</span>}</p>
    </div>
  );
}

export default function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [s, setS] = useState<any>(null);
  const [error, setError] = useState('');
  const [anketaUrl, setAnketaUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // O'quvchi o'zi to'ldiradigan anketa havolasi
  async function makeAnketaLink() {
    try {
      const { key } = await apiFetch(`/students/${id}/anketa-link`);
      setAnketaUrl(`${window.location.origin}/anketa/${id}?k=${key}`);
      setCopied(false);
    } catch (e: any) {
      alert(e?.message || 'Havolani yaratib bo‘lmadi');
    }
  }

  async function copyAnketa() {
    try {
      await navigator.clipboard.writeText(anketaUrl);
      setCopied(true);
    } catch {
      prompt('Havolani nusxalang:', anketaUrl);
    }
  }

  useEffect(() => {
    apiFetch(`/students/${id}`)
      .then(setS)
      .catch((e: any) => setError(e?.message || 'O‘quvchi ma’lumotlarini yuklab bo‘lmadi'));
  }, [id]);

  if (error) {
    return (
      <div className="max-w-[1100px] mx-auto py-24 text-center">
        <p className="text-[15px] font-semibold text-slate-600">{error}</p>
        <Link href="/students" className="mt-3 inline-block text-sm font-semibold text-indigo-600 hover:underline">
          O‘quvchilarga qaytish
        </Link>
      </div>
    );
  }
  if (!s) return <div className="py-24 text-center text-sm text-slate-500">Yuklanmoqda...</div>;

  const bal = Number(s.balance || 0);
  const fullName = [s.fullName, s.middleName].filter(Boolean).join(' ');
  const groups = (s.groups || []).map((g: any) => g.group).filter(Boolean);

  return (
    <div className="space-y-6 max-w-[1100px] mx-auto pb-10">
      <Link href="/students" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft size={16} /> O‘quvchilar
      </Link>

      {/* Sarlavha */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <span className="w-14 h-14 rounded-full bg-indigo-500/10 text-indigo-700 flex items-center justify-center text-xl font-bold shrink-0">
          {(s.fullName || '?')[0]}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 leading-tight">{fullName}</h1>
          <p className="text-sm text-slate-500 mt-1">Qo‘shilgan: {fmtDate(s.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center h-7 px-3 rounded-full text-xs font-semibold ${
              s.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {s.status === 'active' ? 'Faol' : 'Kursni tugatgan'}
          </span>
          <span
            className={`inline-flex items-center h-7 px-3 rounded-full text-xs font-semibold ${
              bal < 0 ? 'bg-rose-500/10 text-rose-600' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {bal < 0 ? `Qarz: ${fmt(Math.abs(bal))} so‘m` : `Balans: ${fmt(bal)} so‘m`}
          </span>
        </div>
      </div>

      {/* Anketa: o'quvchiga havola yuboriladi, u ma'lumotlarini o'zi to'ldiradi */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">O‘quvchi anketasi</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Havolani o‘quvchiga yuboring: u ma’lumotlarini o‘zi to‘ldiradi va ular shu profilga avtomatik saqlanadi.
            </p>
          </div>
          {!anketaUrl && (
            <button
              type="button"
              onClick={makeAnketaLink}
              className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-500 transition shrink-0"
            >
              <Send size={16} /> Anketa havolasini olish
            </button>
          )}
        </div>
        {anketaUrl && (
          <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
            <input
              readOnly
              value={anketaUrl}
              onFocus={(e) => e.target.select()}
              className="flex-1 min-w-0 h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700"
            />
            <button
              type="button"
              onClick={copyAnketa}
              className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition"
            >
              {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />} {copied ? 'Nusxalandi' : 'Nusxalash'}
            </button>
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(anketaUrl)}&text=${encodeURIComponent('Iltimos, o‘quvchi anketasini to‘ldiring:')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-sky-500 text-sm font-semibold text-white hover:bg-sky-400 transition"
            >
              <Send size={16} /> Telegram orqali yuborish
            </a>
          </div>
        )}
      </div>

      {s.notes && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4">
          <p className="text-xs font-semibold text-amber-700">Izoh</p>
          <p className="text-sm text-amber-900 mt-1 whitespace-pre-wrap break-words">{s.notes}</p>
        </div>
      )}

      {/* Shaxsiy ma'lumotlar */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">Shaxsiy ma’lumotlar</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
          <Field label="Familiya va ism" value={s.fullName} />
          <Field label="Otasining ismi" value={s.middleName} />
          <Field label="Tug‘ilgan sana" value={fmtDate(s.birthDate)} />
          <Field label="Telefon" value={s.phone} />
          <Field label="Ota-ona telefoni" value={s.parentPhone} />
          <Field label="Telegram" value={s.parentChatId ? 'Ulangan' : 'Ulanmagan'} />
          <Field label="Pasport" value={s.passport} />
          <Field label="Manzil" value={s.address} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Guruhlar */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6">
          <h2 className="text-base font-bold text-slate-900 mb-3">Guruhlar</h2>
          {groups.length === 0 ? (
            <p className="text-sm text-slate-500">Guruhga biriktirilmagan</p>
          ) : (
            <ul className="space-y-2">
              {groups.map((g: any) => (
                <li key={g.id}>
                  <Link href={`/groups/${g.id}`} className="block rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50 transition">
                    <p className="text-sm font-semibold text-slate-900">{g.name}</p>
                    <p className="text-xs text-slate-500">
                      {g.course?.title || 'Kurs'} · {g.teacher?.fullName || 'O‘qituvchi biriktirilmagan'} · {g.startTime}–{g.endTime}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Sertifikatlar */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6">
          <h2 className="text-base font-bold text-slate-900 mb-3">Sertifikatlar</h2>
          {(s.certificates || []).length === 0 ? (
            <p className="text-sm text-slate-500">Sertifikat berilmagan</p>
          ) : (
            <ul className="space-y-2">
              {s.certificates.map((c: any) => (
                <li key={c.id} className="rounded-xl border border-slate-200 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{c.certificateNumber}</p>
                  <p className="text-xs text-slate-500">
                    {c.courseTitle} · {c.grade} · {fmtDate(c.issuedAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* To'lovlar */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6">
          <h2 className="text-base font-bold text-slate-900 mb-3">So‘nggi to‘lovlar</h2>
          {(s.payments || []).length === 0 ? (
            <p className="text-sm text-slate-500">To‘lovlar yo‘q</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {s.payments.map((p: any) => {
                const amt = Number(p.amount || 0);
                return (
                  <li key={p.id} className="flex items-center justify-between py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm text-slate-800 truncate">{p.comment || METHOD[p.paymentMethod] || 'To‘lov'}</p>
                      <p className="text-xs text-slate-500">{fmtDate(p.paidAt)}</p>
                    </div>
                    <span className={`text-sm font-semibold whitespace-nowrap ${amt < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {amt > 0 ? '+' : ''}
                      {fmt(amt)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Davomat */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6">
          <h2 className="text-base font-bold text-slate-900 mb-3">So‘nggi davomat</h2>
          {(s.attendances || []).length === 0 ? (
            <p className="text-sm text-slate-500">Davomat belgilanmagan</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {s.attendances.map((a: any) => {
                const meta = ATT[String(a.status).toLowerCase()] || { label: a.status, cls: 'bg-slate-100 text-slate-600' };
                return (
                  <li key={a.id} className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-slate-800">{fmtDate(a.date)}</span>
                    <span className={`inline-flex items-center h-6 px-2.5 rounded-full text-xs font-semibold ${meta.cls}`}>{meta.label}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
