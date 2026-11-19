'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Agar allaqachon tizimga kirgan bo'lsa -> to'g'ri Dashboard'ga yo'naltirish
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.replace('/');
    }
  }, [router]);

  // Telefon raqam ko'rinishidagi loginni tekshiradi va +998XXXXXXXXX shakliga keltiradi.
  // Matnli login (masalan "admin") bo'lsa — o'zgarishsiz qaytaradi.
  function checkPhone(value: string): { phone?: string; error?: string } {
    const v = value.trim();
    if (!/^[+\d\s()-]+$/.test(v) || !/\d/.test(v)) return {};
    const digits = v.replace(/\D/g, '');
    const local = digits.startsWith('998') ? digits.slice(3) : digits;
    if (!digits.startsWith('998') && digits.length > 9) {
      return { error: 'Telefon raqam +998 bilan boshlanishi kerak' };
    }
    if (local.length < 9) {
      return { error: `Telefon raqam to‘liq emas: +998 dan keyin 9 ta raqam bo‘lishi kerak (siz ${local.length} ta yozdingiz)` };
    }
    if (local.length > 9) {
      return { error: `Telefon raqamda ortiqcha raqam bor: +998 dan keyin 9 ta raqam bo‘lishi kerak (siz ${local.length} ta yozdingiz)` };
    }
    return { phone: '+998' + local };
  }

  async function handleLogin(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError('');
    const phoneCheck = checkPhone(login);
    // Xato matni login maydoni ostida ko'rinib turadi — serverga yuborilmaydi
    if (phoneCheck.error) return;
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://eduyuz-api.vercel.app/api/v1';

      // Login kiritilganda (masalan, admin yoki superadmin), tizimdagi mos hisobga yo'naltirish
      let accountLogin = phoneCheck.phone || login.trim();
      const lowerLogin = accountLogin.toLowerCase();
      const isSuperAdminLogin =
        lowerLogin === 'tursunov1976' || lowerLogin === 'superadmin' || lowerLogin === 'dasturchi';

      if (isSuperAdminLogin || lowerLogin === 'admin') {
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
      
      // Agar "superadmin" yoki "dasturchi" deb kirilgan bo'lsa -> Dasturchi Paneliga (/superadmin), aks holda Boshqaruv Paneliga (/)
      window.location.href = isSuperAdminLogin ? '/superadmin' : '/';
    } catch (err: any) {
      setError(err.message || 'Serverga ulanishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 w-full max-w-md space-y-6 shadow-sm">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-white rounded-2xl px-5 py-3 shadow-sm inline-flex items-center justify-center border border-slate-200 hover:scale-[1.02] transition-transform">
              <img
                src="/logo-full.png"
                alt="EduYuz CRM Platform"
                className="h-12 sm:h-14 w-auto object-contain"
              />
            </div>
          </div>
          <div>
            <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 leading-tight">EduYuz Tizimiga Kirish</h1>
            <p className="text-xs text-slate-500 mt-1">Xodimlar va administratorlar uchun boshqaruv tizimi</p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Login maydoni */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Login</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 text-slate-500" size={18} />
              <input
                required
                type="text"
                value={login}
                onChange={(e) => { setLogin(e.target.value); setError(''); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="Login yoki telefon raqamingiz"
              />
            </div>
            {login.trim() && checkPhone(login).error && (
              <p className="mt-1.5 text-[11px] text-amber-600">{checkPhone(login).error}</p>
            )}
          </div>

          {/* Parol maydoni */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Parol</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 text-slate-500" size={18} />
              <input
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-11 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="Parolni kiriting"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-2.5 p-1 rounded-lg text-slate-500 hover:text-slate-700 transition focus:outline-none"
                title={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all shadow-sm flex items-center justify-center text-sm active:scale-95 cursor-pointer"
          >
            {loading ? 'Tekshirilmoqda...' : 'Tizimga kirish'}
          </button>
        </form>
      </div>
    </div>
  );
}
