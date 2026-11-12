'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Link2, Search, Send, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';

// "Havola yaratish": o'quvchini tanlab, unga yuboriladigan anketa havolasini (public/anketa.html) yaratadi.
// O'quvchi havolani ochib, ma'lumotlarini o'zi to'ldiradi va ular o'quvchi profiliga tushadi.
export default function AnketaLinkButton({ students }: { students: any[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<any>(null);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  function close() {
    setOpen(false);
    setQ('');
    setPicked(null);
    setUrl('');
    setCopied(false);
    setError('');
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return students
      .filter((s) => s.status !== 'inactive')
      .filter((s) => !t || `${s.fullName} ${s.phone || ''} ${s.parentPhone || ''}`.toLowerCase().includes(t))
      .slice(0, 50);
  }, [students, q]);

  async function pick(s: any) {
    setPicked(s);
    setUrl('');
    setError('');
    setCopied(false);
    setBusy(true);
    try {
      const { key } = await apiFetch(`/students/${s.id}/anketa-link`);
      setUrl(`${window.location.origin}/anketa.html?id=${encodeURIComponent(s.id)}&k=${encodeURIComponent(key)}`);
    } catch (e: any) {
      setError(e?.message || 'Havolani yaratib bo‘lmadi');
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      prompt('Havolani nusxalang:', url);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-[10px] bg-indigo-600 text-[13px] font-semibold text-white hover:bg-indigo-500 transition"
        title="O‘quvchiga anketa havolasini yaratish"
      >
        <Link2 size={16} /> <span className="hidden sm:inline">Havola yaratish</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <div className="w-full max-w-md max-h-[88vh] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-xl">
            <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Anketa havolasi</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  O‘quvchini tanlang, uning shaxsiy havolasi yaratiladi. O‘quvchi to‘ldirgan ma’lumotlar profiliga tushadi.
                </p>
              </div>
              <button type="button" onClick={close} aria-label="Yopish" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <div className="px-5 pb-5 overflow-y-auto space-y-3">
              {!picked ? (
                <>
                  <label className="flex items-center gap-2.5 h-10 px-3.5 rounded-xl bg-white border border-slate-200 focus-within:border-indigo-400">
                    <Search size={16} className="text-slate-500 shrink-0" />
                    <input
                      autoFocus
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Ism yoki telefon bo‘yicha qidirish"
                      className="flex-1 min-w-0 bg-transparent text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none"
                    />
                  </label>
                  {list.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-500">
                      {students.length === 0 ? 'Hali o‘quvchi qo‘shilmagan' : 'Hech narsa topilmadi'}
                    </p>
                  ) : (
                    <ul className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                      {list.map((s) => (
                        <li key={s.id}>
                          <button
                            type="button"
                            onClick={() => pick(s)}
                            className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition"
                          >
                            <p className="text-sm font-semibold text-slate-900">{s.fullName}</p>
                            <p className="text-xs text-slate-500">{s.phone || s.parentPhone || '—'}</p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">O‘quvchi</p>
                      <p className="text-sm font-semibold text-slate-900 truncate">{picked.fullName}</p>
                    </div>
                    <button type="button" onClick={() => { setPicked(null); setUrl(''); setError(''); }} className="text-xs font-semibold text-indigo-600 hover:underline shrink-0">
                      Boshqa o‘quvchi
                    </button>
                  </div>

                  {busy && <p className="py-6 text-center text-sm text-slate-500">Havola yaratilmoqda…</p>}
                  {error && <p className="text-sm text-rose-600">{error}</p>}

                  {url && (
                    <div className="space-y-2.5">
                      <input
                        readOnly
                        value={url}
                        onFocus={(e) => e.target.select()}
                        className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700"
                      />
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={copy}
                          className="inline-flex items-center justify-center gap-1.5 h-10 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition"
                        >
                          {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                          {copied ? 'Nusxalandi' : 'Nusxalash'}
                        </button>
                        <a
                          href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent('Iltimos, o‘quvchi anketasini to‘ldiring:')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 h-10 rounded-xl bg-sky-500 text-sm font-semibold text-white hover:bg-sky-400 transition"
                        >
                          <Send size={16} /> Telegram
                        </a>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
