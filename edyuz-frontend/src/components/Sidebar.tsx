'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Archive, LogOut, X } from 'lucide-react';
import { useSidebar } from '@/lib/context/SidebarContext';

// Figma: "EduYuz Dashboard v2" — yon menyu
const ACADEMIC_PATHS = ['/lms', '/certificates', '/announcements'];

const items = [
  { name: 'Boshqaruv paneli', href: '/' },
  { name: 'Lidlar', href: '/leads' },
  { name: 'O‘quvchilar', href: '/students' },
  { name: 'Guruhlar va jadval', href: '/groups' },
  { name: 'O‘qituvchilar', href: '/teachers' },
  { name: 'Davomat', href: '/attendance' },
  { name: 'Moliya va kassa', href: '/payments' },
  { name: 'Sertifikatlar', href: '/certificates', academic: true },
  { name: 'O‘quvchi portali', href: '/portal' },
];

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Superadmin',
  admin: 'Direktor',
  teacher: 'O‘qituvchi',
};

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 select-none">
      <img src="/logo-icon-transparent.png" alt="EduYuz" className="w-11 h-11 object-contain shrink-0" />
      <span className="flex flex-col leading-none">
        <span className="text-xl font-bold tracking-tight text-slate-900">
          Edu<span className="text-blue-600">Yuz</span>
        </span>
        <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">CRM Platform</span>
      </span>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();
  const [user, setUser] = useState<{ fullName?: string; role?: string }>({});

  useEffect(() => {
    try {
      setUser(JSON.parse(localStorage.getItem('user') || '{}'));
    } catch {
      setUser({});
    }
  }, []);

  if (
    pathname === '/login' ||
    pathname === '/portal' ||
    pathname.startsWith('/app') ||
    pathname.startsWith('/verify') ||
    pathname.startsWith('/anketa')
  ) {
    return null;
  }

  const isActive = (item: (typeof items)[number]) =>
    item.academic ? ACADEMIC_PATHS.includes(pathname) : item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  const name = user.fullName || 'Administrator';

  const content = (onItemClick?: () => void) => (
    <>
      <nav className="flex-1 px-5 overflow-y-auto">
        <div className="pt-3 pb-1.5 text-[11px] font-semibold uppercase text-slate-500">Asosiy</div>
        <ul className="space-y-1.5">
          {items.map((item) => {
            const active = isActive(item);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onItemClick}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-3 h-[42px] px-3 rounded-[10px] text-sm transition-colors ${
                    active ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${active ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 pt-3 border-t border-slate-100">
          <Link
            href="/archive"
            onClick={onItemClick}
            aria-current={pathname.startsWith('/archive') ? 'page' : undefined}
            className={`flex items-center gap-3 h-[42px] px-3 rounded-[10px] text-sm transition-colors ${
              pathname.startsWith('/archive') ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Archive size={16} className={pathname.startsWith('/archive') ? 'text-indigo-600' : 'text-slate-400'} />
            Arxiv
          </Link>
        </div>
      </nav>

      {/* Foydalanuvchi va chiqish */}
      <div className="px-5 py-4 border-t border-slate-100 flex items-center gap-3">
        <span className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
          {name.trim()[0]?.toUpperCase() || 'A'}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-sm font-semibold text-slate-900 truncate">{name}</p>
          <p className="text-xs text-slate-500">{ROLE_LABELS[user.role || ''] || 'Boshqaruvchi'}</p>
        </div>
        <button
          onClick={logout}
          title="Chiqish"
          aria-label="Chiqish"
          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
        >
          <LogOut size={18} />
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Kompyuter */}
      <aside className="hidden md:flex w-[248px] bg-white flex-col h-screen sticky top-0 shrink-0">
        <div className="px-5 pt-7 pb-3">
          <Brand />
        </div>
        {content()}
      </aside>

      {/* Telefon: orqa fon */}
      {isOpen && <div onClick={close} className="fixed inset-0 bg-slate-900/40 z-40 md:hidden" />}

      {/* Telefon: chapdan chiquvchi menyu */}
      <aside
        className={`fixed inset-y-0 left-0 w-[260px] max-w-[85vw] bg-white flex flex-col z-50 shadow-xl transform transition-transform duration-300 md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <Brand />
          <button onClick={close} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Menyuni yopish">
            <X size={20} />
          </button>
        </div>
        {content(close)}
      </aside>
    </>
  );
}
