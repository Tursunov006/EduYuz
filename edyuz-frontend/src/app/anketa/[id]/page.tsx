'use client';

import { use, useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { API_URL } from '@/lib/api';

// O'quvchi o'zi to'ldiradigan anketa. Havolani admin o'quvchi profilidan yuboradi:
// /anketa/<id>?k=<kalit>. Login talab qilinmaydi; saqlangan ma'lumot darhol platformaga yoziladi.
type Form = {
  fullName: string;
  middleName: string;
  phone: string;
  parentPhone: string;
  passport: string;
  birthDate: string;
  address: string;
};

const EMPTY: Form = { fullName: '', middleName: '', phone: '', parentPhone: '', passport: '', birthDate: '', address: '' };

async function request(path: string, init?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, { ...init, headers: { 'Content-Type': 'application/json' } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || data?.error;
    throw new Error(Array.isArray(msg) ? msg.join(', ') : msg || 'Xatolik yuz berdi');
  }
  return data;
}

const input =
  'w-full h-11 px-3.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-indigo-400';

export default function AnketaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [key, setKey] = useState('');
  const [form, setForm] = useState<Form>(EMPTY);
  const [centerName, setCenterName] = useState('');
  const [state, setState] = useState<'loading' | 'ready' | 'invalid' | 'saving' | 'done'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const k = new URLSearchParams(window.location.search).get('k') || '';
    setKey(k);
    request(`/students/anketa/${id}?k=${encodeURIComponent(k)}`)
      .then((d) => {
        setForm({
          fullName: d.fullName || '',
          middleName: d.middleName || '',
          phone: d.phone || '',
          parentPhone: d.parentPhone || '',
          passport: d.passport || '',
          birthDate: d.birthDate || '',
          address: d.address || '',
        });
        setCenterName(d.centerName || '');
        setState('ready');
      })
      .catch(() => setState('invalid'));
  }, [id]);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: k === 'passport' ? e.target.value.toUpperCase() : e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setState('saving');
    try {
      await request(`/students/anketa/${id}?k=${encodeURIComponent(key)}`, {
        method: 'POST',
        body: JSON.stringify({ ...form, birthDate: form.birthDate || undefined }),
      });
      setState('done');
    } catch (err: any) {
      setError(err.message);
      setState('ready');
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-start sm:items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2.5 justify-center mb-6">
          <img src="/logo-icon-transparent.png" alt="EduYuz" className="w-10 h-10 object-contain" />
          <span className="text-xl font-bold text-slate-900">
            Edu<span className="text-blue-600">Yuz</span>
          </span>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-7">
          {state === 'loading' ? (
            <p className="py-16 text-center text-sm text-slate-500">Yuklanmoqda...</p>
          ) : state === 'invalid' ? (
            <div className="py-12 text-center">
              <p className="text-[15px] font-semibold text-slate-700">Havola noto‘g‘ri yoki eskirgan</p>
              <p className="text-sm text-slate-500 mt-1">O‘quv markazidan yangi havola so‘rang.</p>
            </div>
          ) : state === 'done' ? (
            <div className="py-12 text-center">
              <CheckCircle2 size={48} className="mx-auto text-emerald-500" />
              <p className="text-lg font-bold text-slate-900 mt-3">Rahmat! Ma’lumotlaringiz saqlandi</p>
              <p className="text-sm text-slate-500 mt-1">
                {centerName ? `${centerName} ma’lumotlaringizni oldi.` : 'O‘quv markazi ma’lumotlaringizni oldi.'} Kerak bo‘lsa,
                shu havola orqali ularni keyin ham o‘zgartirishingiz mumkin.
              </p>
              <button
                type="button"
                onClick={() => setState('ready')}
                className="mt-4 text-sm font-semibold text-indigo-600 hover:underline"
              >
                Ma’lumotlarni o‘zgartirish
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900">O‘quvchi anketasi</h1>
                <p className="text-sm text-slate-500 mt-1">
                  {centerName ? `${centerName} uchun` : 'O‘quv markazi uchun'} ma’lumotlaringizni to‘ldiring va «Saqlash»ni bosing.
                </p>
              </div>

              <label className="block">
                <span className="block text-xs font-medium text-slate-500 mb-1">Familiya va ism *</span>
                <input required maxLength={100} value={form.fullName} onChange={set('fullName')} className={input} placeholder="Masalan: Valiyev Ali" />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-slate-500 mb-1">Otasining ismi</span>
                <input maxLength={100} value={form.middleName} onChange={set('middleName')} className={input} placeholder="Masalan: Karimovich" />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="block text-xs font-medium text-slate-500 mb-1">Telefoningiz</span>
                  <input type="tel" maxLength={20} value={form.phone} onChange={set('phone')} className={input} placeholder="+998901234567" />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-slate-500 mb-1">Ota-onangiz telefoni *</span>
                  <input required type="tel" maxLength={20} value={form.parentPhone} onChange={set('parentPhone')} className={input} placeholder="+998901234567" />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-slate-500 mb-1">Pasport (seriya va raqam)</span>
                  <input maxLength={20} value={form.passport} onChange={set('passport')} className={`${input} uppercase`} placeholder="AA1234567" />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-slate-500 mb-1">Tug‘ilgan sana</span>
                  <input type="date" value={form.birthDate} onChange={set('birthDate')} className={input} />
                </label>
              </div>
              <label className="block">
                <span className="block text-xs font-medium text-slate-500 mb-1">Manzil</span>
                <input maxLength={255} value={form.address} onChange={set('address')} className={input} placeholder="Shahar, tuman, ko‘cha, uy" />
              </label>

              {error && <p className="text-sm text-rose-600">{error}</p>}

              <button
                type="submit"
                disabled={state === 'saving'}
                className="w-full h-11 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 transition"
              >
                {state === 'saving' ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
              <p className="text-[11px] text-slate-400 text-center">Ma’lumotlaringiz faqat o‘quv markazi uchun saqlanadi.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
