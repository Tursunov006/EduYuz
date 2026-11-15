'use client';

import { useEffect, useState } from 'react';
import { Megaphone, Trash2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';

// Superadmin: platforma yangiligini yozish va o'chirish. Yangilik barcha markazlarning bosh sahifasida chiqadi.
export default function PlatformNewsAdmin() {
  const [items, setItems] = useState<any[]>([]);
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
      await load();
    } catch (err: any) {
      setError(err?.message || 'Yangilikni saqlab bo‘lmadi');
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

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6 space-y-5">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <Megaphone size={18} className="text-indigo-600" /> Platforma yangiliklari
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Bu yerda yozilgan yangilik barcha o‘quv markazlarining bosh sahifasida ko‘rinadi.
        </p>
      </div>

      <form onSubmit={publish} className="grid gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sarlavha, masalan: Yangi funksiya — davomat Telegram xabari"
          maxLength={150}
          required
          className="h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Yangilik matni"
          rows={3}
          maxLength={5000}
          required
          className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900"
        />
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Havola (ixtiyoriy), masalan https://t.me/..."
          className="h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900"
        />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="justify-self-start h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-60"
        >
          {busy ? 'Saqlanmoqda…' : 'E’lon qilish'}
        </button>
      </form>

      {items.length > 0 && (
        <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
          {items.map((n) => (
            <li key={n.id} className="flex items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                <p className="text-[11px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString('uz-UZ')}</p>
              </div>
              <button
                type="button"
                onClick={() => remove(n.id)}
                title="O‘chirish"
                className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
