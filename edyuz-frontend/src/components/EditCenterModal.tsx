'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Trash2, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';

// Rasmni brauzerda 256×256 gacha kichraytirib, data URL qilib beradi (bazaga yengil saqlanishi uchun)
function resizeImage(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Faylni o‘qib bo‘lmadi'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Bu fayl rasm emas'));
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        // Markazdan kvadrat qilib kesiladi
        ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function EditCenterModal({
  center,
  onClose,
  onSaved,
}: {
  center: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState<string>(center.name || '');
  const [logo, setLogo] = useState<string | null>(center.logoUrl || null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return setError('Rasm 10 MB dan kichik bo‘lsin');
    try {
      setError('');
      setLogo(await resizeImage(file));
    } catch (err: any) {
      setError(err?.message || 'Rasmni yuklab bo‘lmadi');
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return setError('Nom kamida 2 harf bo‘lsin');
    setBusy(true);
    setError('');
    try {
      await apiFetch(`/centers/${center.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: name.trim(), logoUrl: logo }),
      });
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Saqlab bo‘lmadi');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <form onSubmit={save} className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">O‘quv markazini tahrirlash</h2>
            <p className="text-xs text-slate-500 mt-0.5">Nomi va profil rasmi</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Yopish" className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-4">
          {logo ? (
            <img src={logo} alt="" className="w-20 h-20 rounded-2xl object-cover border border-slate-200" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold">
              {(name || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={pickFile} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100"
            >
              <ImagePlus size={15} /> {logo ? 'Rasmni almashtirish' : 'Rasm yuklash'}
            </button>
            {logo && (
              <button
                type="button"
                onClick={() => setLogo(null)}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold hover:bg-rose-100"
              >
                <Trash2 size={15} /> Rasmni o‘chirish
              </button>
            )}
          </div>
        </div>

        <label className="block">
          <span className="block text-xs font-medium text-slate-500 mb-1">Markaz nomi</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={150}
            required
            className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900"
          />
        </label>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Bekor qilish
          </button>
          <button type="submit" disabled={busy} className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold disabled:opacity-60">
            {busy ? 'Saqlanmoqda…' : 'Saqlash'}
          </button>
        </div>
      </form>
    </div>
  );
}
