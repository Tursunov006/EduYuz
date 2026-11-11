'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Search } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import NotificationCenter from './NotificationCenter';
import { useSidebar } from '@/lib/context/SidebarContext';

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || 'A') + (parts[1]?.[0] || '')).toUpperCase();
}

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Superadmin',
  admin: 'Direktor',
  teacher: 'O‘qituvchi',
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toggle: toggleSidebar } = useSidebar();
  const [query, setQuery] = useState('');
  const [user, setUser] = useState<{ fullName?: string; role?: string }>({});
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      setUser(JSON.parse(localStorage.getItem('user') || '{}'));
    } catch {
      setUser({});
    }
  }, []);

  // Ctrl+K / Cmd+K — qidiruvga o'tish
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (
    pathname === '/login' ||
    pathname === '/portal' ||
    pathname.startsWith('/app') ||
    pathname.startsWith('/verify') ||
    pathname.startsWith('/games/play')
  ) {
    return null;
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/students?search=${encodeURIComponent(q)}` : '/students');
    // O'quvchilar sahifasi allaqachon ochiq bo'lsa ham qidiruv yangilansin
    window.dispatchEvent(new CustomEvent('eduyuz:search', { detail: q }));
  }

  const name = user.fullName || 'Administrator';

  return (
    <header className="h-16 px-3 sm:px-6 md:px-8 flex items-center gap-3 sticky top-0 z-20 bg-slate-50 backdrop-blur-md border-b border-slate-200/70">
      <button
        type="button"
        onClick={toggleSidebar}
        className="p-2 rounded-xl md:hidden text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition"
        aria-label="Menyuni ochish"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Global qidiruv */}
      <form onSubmit={submitSearch} className="flex-1 max-w-2xl">
        <label className="flex items-center gap-2.5 h-11 px-4 rounded-xl bg-white border border-slate-200 focus-within:border-indigo-400 transition-colors">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="O‘quvchi ismi yoki telefon raqamini qidiring"
            className="flex-1 min-w-0 bg-transparent text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none"
            aria-label="Qidirish"
          />
          <kbd className="hidden lg:inline-flex items-center px-2 h-6 rounded-md border border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-500">
            Ctrl K
          </kbd>
        </label>
      </form>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <LanguageSwitcher />
        <NotificationCenter />
        <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
            {initials(name)}
          </div>
          <div className="hidden lg:block leading-tight">
            <div className="text-sm font-semibold text-slate-800 max-w-[160px] truncate">{name}</div>
            <div className="text-[11px] text-slate-500">{ROLE_LABELS[user.role || ''] || 'Boshqaruvchi'}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
