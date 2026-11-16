'use client';

import { useEffect, useState } from 'react';
import { Megaphone, Plus, Trash2, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';

// Superadmin: platforma yangiligini yozish va o'chirish (ixcham ko'rinish).
// Yangilik barcha markazlarning bosh sahifasida chiqadi.
export default function PlatformNewsAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = () =>
    apiFetch('/news')
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]));

  useEffect(() => {
    load();
  }, []);

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await apiFetch('/news', {
        method: 'POST',
        body: JSON.stringify({ title, body, ...(link.trim() ? { link: link.trim() } : {}) }),
      });
      setTitle('');
      setBody('');
      setLink('');
      setOpen(false);
      await load();
    } catch (err: any) {
      const msg = String(err?.message || '');
      setError(
        /forbidden/i.test(msg)
          ? 'Ruxsat yo‘q: tizimdan chiqib, superadmin login bilan qayta kiring'
          : msg || 'Yangilikni saqlab bo‘lmadi',
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Bu yangilik o‘chirilsinmi?')) return;
    try {
      await apiFetch(`/news/${id}`, { method: 'DELETE' });
      await load();
    } catch (err: any) {
      alert(err?.message || 'O‘chirib bo‘lmadi');
    }
  }

  const input = 'h-9 px-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Megaphone size={16} className="text-indigo-600" /> Platforma yangiliklari
          <span className="text-xs font-normal text-slate-500">({items.length})</span>
        </h2>
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            setError('');
          }}
          className="inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
        >
          {open ? <X size={14} /> : <Plus size={14} />} {open ? 'Yopish' : 'Yangilik'}
        </button>
      </div>

      {open && (
        <form onSubmit={publish} className="grid gap-2 sm:grid-cols-[1fr_2fr_1fr_auto] items-start">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Sarlavha" maxLength={150} required className={input} />
          <input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Matn" maxLength={5000} required className={input} />
          <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Havola (ixtiyoriy)" className={input} />
          <button type="submit" disabled={busy} className="h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-60">
            {busy ? '…' : 'E’lon qilish'}
          </button>
          {error && <p className="sm:col-span-4 text-xs text-rose-600">{error}</p>}
        </form>
      )}

      {items.length > 0 && (
        <ul className="divide-y divide-slate-100">
          {items.map((n) => (
            <li key={n.id} className="flex items-center justify-between gap-3 py-2">
              <p className="min-w-0 text-sm text-slate-800 truncate">
                <span className="font-semibold">{n.title}</span>
                <span className="text-slate-500"> — {n.body}</span>
              </p>
              <span className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-slate-400">{new Date(n.createdAt).toLocaleDateString('uz-UZ')}</span>
                <button type="button" onClick={() => remove(n.id)} title="O‘chirish" className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50">
                  <Trash2 size={14} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
