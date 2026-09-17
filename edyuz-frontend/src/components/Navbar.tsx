'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Smartphone, Shield, User } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import NotificationCenter from './NotificationCenter';

export default function Navbar() {
  const pathname = usePathname();

  // Agar login, portal, app yoki verify sahifasida bo'lsa navbar ko'rinmasin
  if (pathname === '/login' || pathname === '/portal' || pathname.startsWith('/app') || pathname.startsWith('/verify') || pathname.startsWith('/games/play')) {
    return null;
  }

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Chap tomon: CRM holati */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-400 font-medium hidden sm:inline">EduYuz CRM Enterprise</span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-slate-300 font-semibold capitalize">
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
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-bold transition active:scale-95"
          title="O‘quvchi mobil ilovasi (/app)"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Mini Ilova (/app)</span>
        </Link>

        {/* Til Tanlagich (UZ / RU / EN) */}
        <LanguageSwitcher />

        {/* Bildirishnomalar Markazi */}
        <NotificationCenter />

        {/* Admin Profil badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            A
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-bold text-white leading-tight">Admin</div>
            <div className="text-[10px] text-slate-400">Boshqaruvchi</div>
          </div>
        </div>
      </div>
    </header>
  );
}
