'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Smartphone, Shield, User } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import NotificationCenter from './NotificationCenter';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '@/lib/theme/ThemeContext';

export default function Navbar() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Agar login, portal, app yoki verify sahifasida bo'lsa navbar ko'rinmasin
  if (pathname === '/login' || pathname === '/portal' || pathname.startsWith('/app') || pathname.startsWith('/verify') || pathname.startsWith('/games/play')) {
    return null;
  }

  return (
    <header className={`h-16 px-6 flex items-center justify-between sticky top-0 z-20 transition-colors duration-300 border-b ${
      isLight 
        ? 'bg-white/90 backdrop-blur-md border-slate-200 text-slate-800 shadow-sm' 
        : 'bg-slate-900/80 backdrop-blur-md border-slate-800 text-slate-100'
    }`}>
      {/* Chap tomon: CRM holati */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className={isLight ? 'text-slate-500 font-medium hidden sm:inline' : 'text-slate-400 font-medium hidden sm:inline'}>EduYuz CRM Enterprise</span>
          <span className={isLight ? 'text-slate-400 hidden sm:inline' : 'text-slate-600 hidden sm:inline'}>•</span>
          <span className={`font-semibold capitalize ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
            {pathname === '/' ? 'Dashboard' : pathname.replace('/', '').replace('-', ' ')}
          </span>
        </div>
      </div>

      {/* O'ng tomon: Asboblar, Til, Bildirishnoma, Profil */}
      <div className="flex items-center gap-3">
        {/* Quick link to Mobile Mini App */}
        <Link
          href="/app"
          target="_blank"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-500 text-xs font-bold transition active:scale-95"
          title="O‘quvchi mobil ilovasi (/app)"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Mini Ilova (/app)</span>
        </Link>

        {/* Tungi / Kunduzgi Rejim Switcher */}
        <ThemeToggle />

        {/* Til Tanlagich (UZ / RU / EN) */}
        <LanguageSwitcher />

        {/* Bildirishnomalar Markazi */}
        <NotificationCenter />

        {/* Admin Profil badge */}
        <div className={`flex items-center gap-2 pl-2 border-l ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            A
          </div>
          <div className="hidden lg:block text-left">
            <div className={`text-xs font-bold leading-tight ${isLight ? 'text-slate-800' : 'text-white'}`}>Admin</div>
            <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Boshqaruvchi</div>
          </div>
        </div>
      </div>
    </header>
  );
}
