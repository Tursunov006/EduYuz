'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  CalendarCheck,
  BookOpen,
  LayoutDashboard,
  LogOut,
  GraduationCap,
  Smartphone,
  UserCheck,
  Wallet,
  X,
  HelpCircle,
  UserPlus,
} from 'lucide-react';

import { useTranslation } from '@/lib/i18n/LanguageContext';
import { useSidebar } from '@/lib/context/SidebarContext';

const ACADEMIC_PATHS = ['/lms', '/certificates', '/leaderboard', '/games', '/announcements'];

// Menyu bo'limlarga ajratilgan (Figma: EduYuz Dashboard v3)
const sections = [
  {
    key: 'main',
    title: 'Asosiy',
    items: [
      { key: 'dashboard', name: 'Boshqaruv paneli', href: '/', icon: LayoutDashboard },
      { key: 'leads', name: 'Lidlar', href: '/leads', icon: UserPlus },
      { key: 'students', name: 'O‘quvchilar', href: '/students', icon: Users },
      { key: 'groups', name: 'Guruhlar va jadval', href: '/groups', icon: BookOpen },
      { key: 'teachers', name: 'O‘qituvchilar', href: '/teachers', icon: UserCheck },
      { key: 'attendance', name: 'Davomat', href: '/attendance', icon: CalendarCheck },
    ],
  },
  {
    key: 'finance',
    title: 'Moliya va ta’lim',
    items: [
      { key: 'payments', name: 'Moliya va kassa', href: '/payments', icon: Wallet },
      { key: 'lms', name: 'Ta’lim va sertifikatlar', href: '/lms', icon: GraduationCap },
      { key: 'portal', name: 'O‘quvchi portali', href: '/portal', icon: Smartphone },
    ],
  },
];

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 select-none">
      <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-base font-bold shadow-sm">
        E
      </span>
      <span className="text-lg font-bold tracking-tight text-slate-800">EduYuz</span>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { isOpen, close } = useSidebar();

  // Login, portal, mini-ilova, o'yin va tekshirish sahifalarida menyu ko'rinmaydi
  if (
    pathname === '/login' ||
    pathname === '/portal' ||
    pathname.startsWith('/app') ||
    pathname.startsWith('/games/play') ||
    pathname.startsWith('/verify')
  ) {
    return null;
  }

  const isActive = (key: string, href: string) =>
    key === 'lms' ? ACADEMIC_PATHS.includes(pathname) : href === '/' ? pathname === '/' : pathname.startsWith(href);

  const renderNav = (onItemClick?: () => void) => (
    <nav className="flex-1 px-4 py-2 space-y-5 overflow-y-auto">
      {sections.map((section) => (
        <div key={section.key} className="space-y-1">
          <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {section.title}
          </div>
          {section.items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.key, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onItemClick}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  active
                    ? 'bg-indigo-500/10 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Icon size={18} className={active ? 'text-indigo-600' : 'text-slate-500'} />
                <span>{t(`nav.${item.key}`, item.name)}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  const renderFooter = () => (
    <div className="p-4 space-y-2">
      <a
        href="https://t.me/Dasturchi_76"
        target="_blank"
        rel="noreferrer"
        className="block rounded-xl bg-indigo-500/10 p-4 hover:bg-indigo-500/15 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
          <HelpCircle size={16} /> Yordam kerakmi?
        </div>
        <p className="mt-1 text-xs text-slate-500">Telegram orqali tez javob beramiz</p>
      </a>
      <button
        onClick={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }}
        className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-500/10 transition-colors"
      >
        <LogOut size={18} />
        <span>{t('nav.logout', 'Chiqish')}</span>
      </button>
    </div>
  );

  return (
    <>
      {/* Kompyuter va planshet */}
      <aside className="hidden md:flex w-64 bg-white flex-col min-h-screen border-r border-slate-200 shrink-0 sticky top-0 h-screen">
        <div className="px-6 pt-6 pb-4">
          <Brand />
        </div>
        {renderNav()}
        {renderFooter()}
      </aside>

      {/* Telefon: orqa fon */}
      {isOpen && (
        <div onClick={close} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden" />
      )}

      {/* Telefon: chapdan chiquvchi menyu */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white flex flex-col z-50 border-r border-slate-200 shadow-sm transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <Brand />
          <button
            onClick={close}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            aria-label="Menyuni yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {renderNav(close)}
        {renderFooter()}
      </aside>
    </>
  );
}
