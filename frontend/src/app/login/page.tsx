'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Phone, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('+998901234567');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Kirishda xatolik');
      }

      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function fillAdmin() {
    setPhone('+998901234567');
    setPassword('admin123');
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 w-full max-w-md space-y-6 shadow-2xl">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-white rounded-2xl px-5 py-3 shadow-xl shadow-blue-500/10 inline-flex items-center justify-center border border-white/20 hover:scale-[1.02] transition-transform">
              <img
                src="/logo-full.png"
                alt="EduYuz CRM Platform"
                className="h-14 w-auto object-contain"
              />
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-400">Xodimlar va administratorlar uchun boshqaruv tizimi</p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Telefon raqam</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3 text-slate-500" size={18} />
              <input
                required
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="+998901234567"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Parol</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 text-slate-500" size={18} />
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center text-sm"
          >
            {loading ? 'Tekshirilmoqda...' : 'Tizimga kirish'}
          </button>
        </form>

        {/* Demo login tugmasi */}
        <div className="pt-2 border-t border-slate-800/80 text-center">
          <button
            onClick={fillAdmin}
            type="button"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-3 py-1.5 rounded-lg transition"
          >
            <Sparkles size={13} /> Demo Admin ma'lumotlarini to'ldirish
          </button>
        </div>
      </div>
    </div>
  );
}
