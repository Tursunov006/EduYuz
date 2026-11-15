'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Megaphone, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';

const SEEN_KEY = 'eduyuz_news_seen';

// Bosh sahifadagi "Platforma yangiliklari": superadmin yozgan eng so'nggi yangiliklar.
// Foydalanuvchi "Ko'rdim" bossa, keyingi yangilik chiqquncha blok yashiriladi.
export default function PlatformNewsFeed() {
  const [items, setItems] = useState<any[]>([]);
  const [seen, setSeen] = useState<string>('');

  useEffect(() => {
    try {
      setSeen(localStorage.getItem(SEEN_KEY) || '');
    } catch {}
    apiFetch('/news')
      .then((d) => setItems(Array.isArray(d) ? d.slice(0, 3) : []))
      .catch(() => setItems([]));
  }, []);

  if (items.length === 0 || items[0].id === seen) return null;

  const dismiss = () => {
    setSeen(items[0].id);
    try {
      localStorage.setItem(SEEN_KEY, items[0].id);
    } catch {}
  };

  return (
    <section className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-indigo-700">
          <Megaphone size={16} /> Platforma yangiliklari
        </h2>
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
        >
          <X size={14} /> Ko‘rdim
        </button>
      </div>
      <ul className="space-y-3">
        {items.map((n) => (
          <li key={n.id} className="rounded-xl bg-white border border-indigo-100 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">{n.title}</p>
              <span className="text-[11px] text-slate-500 shrink-0">
                {new Date(n.createdAt).toLocaleDateString('uz-UZ')}
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-1 whitespace-pre-line">{n.body}</p>
            {n.link && (
              <a
                href={n.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-indigo-600 hover:underline"
              >
                Batafsil <ExternalLink size={12} />
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
