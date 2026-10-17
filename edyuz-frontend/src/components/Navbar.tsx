'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Smartphone, Menu } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import NotificationCenter from './NotificationCenter';
import ThemeToggle from './ThemeToggle';
import AdminProfileMenu from './AdminProfileMenu';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useSidebar } from '@/lib/context/SidebarContext';

export default function Navbar() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const { toggle: toggleSidebar } = useSidebar();
  const isLight = theme === 'light';

  // Agar login, portal, app yoki verify sahifasida bo'lsa navbar ko'rinmasin
  if (
    pathname === '/login' || 
    pathname === '/portal' || 
    pathname.startsWith('/app') || 
    pathname.startsWith('/verify') || 
    pathname.startsWith('/games/play')
  ) {
    return null;
  }

  return (
    <header className={`h-16 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 transition-colors duration-300 border-b ${
      isLight 
        ? 'bg-white/95 backdrop-blur-md border-slate-200 text-slate-800 shadow-sm' 
        : 'bg-slate-900/85 backdrop-blur-md border-slate-800 text-slate-100'
    }`}>
      {/* Chap tomon: Hamburger tugmasi (faqat telefonlarda) + CRM holati */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={toggleSidebar}
          className={`p-2 rounded-xl md:hidden transition active:scale-95 ${
            isLight 
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' 
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          }`}
          aria-label="Menyuni ochish"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
          <span className={isLight ? 'text-slate-500 font-medium hidden sm:inline' : 'text-slate-400 font-medium hidden sm:inline'}>
            EduYuz CRM
          </span>
          <span className={isLight ? 'text-slate-400 hidden sm:inline' : 'text-slate-600 hidden sm:inline'}>•</span>
          <span className={`font-semibold capitalize truncate max-w-[120px] sm:max-w-none ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
            {pathname === '/' ? 'Dashboard' : pathname.replace('/', '').replace('-', ' ')}
          </span>
        </div>
      </div>

      {/* O'ng tomon: Asboblar, Rejim, Til, Bildirishnoma, Interaktiv Admin Profil */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Quick link to Mobile Mini App (faqat planshet/kompyuterda) */}
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

        {/* Interaktiv Admin Profil va Markaz Sozlamalari */}
        <AdminProfileMenu />
      </div>
    </header>
  );
}
