'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowLeft, KeyRound } from 'lucide-react';
import OtpInput from '@/components/OtpInput';

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
};

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  // 2 bosqichli kirish: parol to'g'ri bo'lsa kod Telegramga yuboriladi va shu qadam chiqadi
  const [otp, setOtp] = useState<{ challengeId: string; redirect: string } | null>(null);
  const [otpCode, setOtpCode] = useState('');
  // Parolni unutdim: telefon raqam -> Telegramga kelgan kod + yangi parol
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [reset, setReset] = useState<{ challengeId: string } | null>(null);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [notice, setNotice] = useState('');
  const widgetBox = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);

  // Agar allaqachon tizimga kirgan bo'lsa -> to'g'ri Dashboard'ga yo'naltirish
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.replace('/');
    }
  }, [router]);

  // Cloudflare Turnstile ("Men robot emasman"): faqat sayt kaliti sozlangan bo'lsa ishlaydi
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    let cancelled = false;
    const w = window as unknown as { turnstile?: TurnstileApi };
    const mount = () => {
      if (cancelled || !w.turnstile || !widgetBox.current || widgetId.current) return;
      widgetId.current = w.turnstile.render(widgetBox.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (t: string) => setTurnstileToken(t),
        'expired-callback': () => setTurnstileToken(''),
        'error-callback': () => setTurnstileToken(''),
      });
    };
    if (w.turnstile) {
      mount();
    } else {
      let script = document.getElementById('cf-turnstile-script') as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = 'cf-turnstile-script';
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        document.head.appendChild(script);
      }
      script.addEventListener('load', mount);
    }
    return () => {
      cancelled = true;
    };
  }, []);

  function resetTurnstile() {
    setTurnstileToken('');
    const w = window as unknown as { turnstile?: TurnstileApi };
    if (TURNSTILE_SITE_KEY && w.turnstile) w.turnstile.reset(widgetId.current);
  }

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
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setError('Iltimos, "Men robot emasman" tekshiruvidan o‘ting');
      return;
    }
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
          password: password.trim(),
          ...(TURNSTILE_SITE_KEY ? { turnstileToken } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Login yoki parol noto‘g‘ri');
      }

      const redirect = isSuperAdminLogin ? '/superadmin' : '/';
      if (data.twoFactorRequired && data.challengeId) {
        setOtpCode('');
        setOtp({ challengeId: data.challengeId, redirect });
        return;
      }
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Agar "superadmin" yoki "dasturchi" deb kirilgan bo'lsa -> Dasturchi Paneliga (/superadmin), aks holda Boshqaruv Paneliga (/)
      window.location.href = redirect;
    } catch (err: any) {
      setError(err.message || 'Serverga ulanishda xatolik yuz berdi');
      resetTurnstile();
    } finally {
      setLoading(false);
    }
  }

  // Parolni unutgan xodim: Telegram botga tiklash kodi yuboriladi
  async function handleForgot(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError('');
    setNotice('');
    const phoneCheck = checkPhone(login);
    if (!phoneCheck.phone) {
      setError(phoneCheck.error || 'Telefon raqamingizni kiriting (+998 bilan)');
      return;
    }
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setError('Iltimos, "Men robot emasman" tekshiruvidan o‘ting');
      return;
    }
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://eduyuz-api.vercel.app/api/v1';
      const res = await fetch(`${apiUrl}/auth/password/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneCheck.phone, ...(TURNSTILE_SITE_KEY ? { turnstileToken } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'So‘rov yuborilmadi, qayta urinib ko‘ring');
      setResetCode('');
      setNewPassword('');
      setReset({ challengeId: data.challengeId });
    } catch (err: any) {
      setError(err.message || 'Serverga ulanishda xatolik yuz berdi');
    } finally {
      resetTurnstile();
      setLoading(false);
    }
  }

  async function handleResetPassword(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!reset || resetCode.length !== 6) return;
    if (newPassword.length < 6) {
      setError('Yangi parol kamida 6 belgidan iborat bo‘lishi kerak');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://eduyuz-api.vercel.app/api/v1';
      const res = await fetch(`${apiUrl}/auth/password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: reset.challengeId, code: resetCode, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(Array.isArray(data.message) ? data.message[0] : data.message || 'Kod noto‘g‘ri yoki muddati tugagan');
      setReset(null);
      setMode('login');
      setPassword('');
      setNewPassword('');
      setResetCode('');
      setNotice('Parol yangilandi. Yangi parol bilan kiring.');
    } catch (err: any) {
      setError(err.message || 'Serverga ulanishda xatolik yuz berdi');
      setResetCode('');
    } finally {
      setLoading(false);
    }
  }

  // 2-bosqich: Telegramga kelgan kodni tasdiqlash
  async function handleVerifyCode(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!otp || otpCode.length !== 6) return;
    setError('');
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://eduyuz-api.vercel.app/api/v1';
      const res = await fetch(`${apiUrl}/auth/login/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: otp.challengeId, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Kod noto‘g‘ri yoki muddati tugagan');
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = otp.redirect;
    } catch (err: any) {
      setError(err.message || 'Serverga ulanishda xatolik yuz berdi');
      setOtpCode('');
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

        {notice && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-medium text-center">
            {notice}
          </div>
        )}

        {reset && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <KeyRound size={22} />
              </div>
              <p className="text-sm text-slate-600">
                Agar raqam Telegram botga ulangan bo‘lsa, <strong className="text-slate-900">tiklash kodi</strong> yuborildi. Kodni va yangi parolni kiriting.
              </p>
            </div>
            <OtpInput value={resetCode} onChange={(v) => { setResetCode(v); setError(''); }} disabled={loading} autoFocus />
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 text-slate-500" size={18} />
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="Yangi parol (kamida 6 belgi)"
              />
            </div>
            <button
              type="submit"
              disabled={loading || resetCode.length !== 6 || newPassword.length < 6}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all shadow-sm flex items-center justify-center text-sm active:scale-95 cursor-pointer"
            >
              {loading ? 'Saqlanmoqda...' : 'Parolni yangilash'}
            </button>
            <button
              type="button"
              onClick={() => { setReset(null); setResetCode(''); setNewPassword(''); setError(''); }}
              className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition"
            >
              <ArrowLeft size={14} /> Orqaga
            </button>
          </form>
        )}

        {otp && !reset && (
          <form onSubmit={handleVerifyCode} className="space-y-5">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <ShieldCheck size={22} />
              </div>
              <p className="text-sm text-slate-600">
                Tasdiqlash kodi <strong className="text-slate-900">Telegram botga</strong> yuborildi. 6 xonali kodni kiriting.
              </p>
            </div>
            <OtpInput value={otpCode} onChange={(v) => { setOtpCode(v); setError(''); }} disabled={loading} autoFocus />
            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all shadow-sm flex items-center justify-center text-sm active:scale-95 cursor-pointer"
            >
              {loading ? 'Tekshirilmoqda...' : 'Tasdiqlash'}
            </button>
            <button
              type="button"
              onClick={() => { setOtp(null); setOtpCode(''); setError(''); resetTurnstile(); }}
              className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition"
            >
              <ArrowLeft size={14} /> Orqaga
            </button>
          </form>
        )}

        {/* Forma har doim o'rnatilgan turadi (Turnstile vidjeti yo'qolmasligi uchun), boshqa qadamlarda yashiriladi */}
        <div className={otp || reset ? 'hidden' : ''}>
        <form onSubmit={mode === 'forgot' ? handleForgot : handleLogin} className="space-y-4">
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
          {mode === 'login' && (
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
            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={() => { setMode('forgot'); setError(''); setNotice(''); }}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-500 transition"
              >
                Parolni unutdingizmi?
              </button>
            </div>
          </div>
          )}

          {mode === 'forgot' && (
            <p className="text-xs text-slate-500 -mt-1">
              Telefon raqamingizni kiriting. Telegram botga ulangan bo‘lsangiz, parolni tiklash kodi shu bot orqali yuboriladi.
            </p>
          )}

          {TURNSTILE_SITE_KEY && <div ref={widgetBox} className="flex justify-center min-h-[65px]" />}

          <button
            type="submit"
            disabled={loading || (!!TURNSTILE_SITE_KEY && !turnstileToken)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all shadow-sm flex items-center justify-center text-sm active:scale-95 cursor-pointer"
          >
            {loading ? 'Tekshirilmoqda...' : mode === 'forgot' ? 'Tiklash kodini yuborish' : 'Tizimga kirish'}
          </button>
          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition"
            >
              <ArrowLeft size={14} /> Kirishga qaytish
            </button>
          )}
        </form>
        </div>
      </div>
    </div>
  );
}
