'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Agar allaqachon tizimga kirgan bo'lsa -> to'g'ri Dashboard'ga yo'naltirish
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.replace('/');
    }
  }, [router]);

  async function handleLogin(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://eduyuz.onrender.com/api/v1';

      // Login kiritilganda (masalan, admin yoki superadmin), tizimdagi mos hisobga yo'naltirish
      let accountLogin = login.trim();
      if (
        accountLogin.toLowerCase() === 'admin' || 
        accountLogin.toLowerCase() === 'superadmin' || 
        accountLogin.toLowerCase() === 'admin123'
      ) {
        accountLogin = '+998901234567';
      }

      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: accountLogin, 
          password: password.trim() 
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Login yoki parol noto‘g‘ri');
      }

      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Yangi token bilan to'g'ridan-to'g'ri Boshqaruv Paneliga yo'naltirish
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Serverga ulanishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  function fillAdmin() {
    setLogin('admin');
    setPassword('admin123');
    setError('');
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-md space-y-6 shadow-2xl">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-white rounded-2xl px-5 py-3 shadow-xl shadow-blue-500/10 inline-flex items-center justify-center border border-white/20 hover:scale-[1.02] transition-transform">
              <img
                src="/logo-full.png"
                alt="EduYuz CRM Platform"
                className="h-12 sm:h-14 w-auto object-contain"
              />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">EduYuz Tizimiga Kirish</h1>
            <p className="text-xs text-slate-400 mt-1">Xodimlar va administratorlar uchun boshqaruv tizimi</p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Login maydoni */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Login</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 text-slate-500" size={18} />
              <input
                required
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="admin yoki login kiriting"
              />
            </div>
          </div>

          {/* Parol maydoni */}
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
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center text-sm active:scale-95 cursor-pointer"
          >
            {loading ? 'Tekshirilmoqda...' : 'Tizimga kirish'}
          </button>
        </form>

        {/* Demo login tugmasi */}
        <div className="pt-2 border-t border-slate-800/80 text-center">
          <button
            onClick={fillAdmin}
            type="button"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-3.5 py-2 rounded-xl transition cursor-pointer"
          >
            <Sparkles size={14} /> Demo Login ma'lumotlarini to'ldirish (admin / admin123)
          </button>
        </div>
      </div>
    </div>
  );
}
