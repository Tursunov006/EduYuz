'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  CalendarCheck, 
  CreditCard, 
  BookOpen, 
  LayoutDashboard, 
  LogOut, 
  GraduationCap, 
  Trophy, 
  Award, 
  Smartphone, 
  UserCheck, 
  Wallet, 
  Gamepad2, 
  Megaphone,
  TrendingUp,
  Bot,
  X,
  HelpCircle,
  UserPlus
} from 'lucide-react';

import Logo from './Logo';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { useSidebar } from '@/lib/context/SidebarContext';

const ACADEMIC_PATHS = ['/lms', '/certificates', '/leaderboard', '/games', '/announcements'];

const menuItems = [
  { key: 'dashboard', name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { key: 'leads', name: 'Lidlar (Voronka)', href: '/leads', icon: UserPlus },
  { key: 'students', name: 'O‘quvchilar', href: '/students', icon: Users },
  { key: 'groups', name: 'Guruhlar va Jadval', href: '/groups', icon: BookOpen },
  { key: 'teachers', name: 'O‘qituvchilar', href: '/teachers', icon: UserCheck },
  { key: 'attendance', name: 'Davomat', href: '/attendance', icon: CalendarCheck },
  { key: 'payments', name: 'Moliya va Kassa', href: '/payments', icon: Wallet },
  { key: 'lms', name: 'Ta‘lim va Sertifikatlar', href: '/lms', icon: GraduationCap },
  { key: 'portal', name: 'O‘quvchi Portali', href: '/portal', icon: Smartphone },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { isOpen, close } = useSidebar();

  // Agar login, portal, app, games/play yoki verify sahifasida bo'lsa sidebar ko'rinmasin
  if (
    pathname === '/login' || 
    pathname === '/portal' || 
    pathname.startsWith('/app') || 
    pathname.startsWith('/games/play') || 
    pathname.startsWith('/verify')
  ) {
    return null;
  }

  const renderNavLinks = (onItemClick?: () => void) => (
    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.key === 'lms'
            ? ACADEMIC_PATHS.includes(pathname)
            : pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              isActive
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <Icon size={18} />
            <span>{t(`nav.${item.key}`, item.name)}</span>
          </Link>
        );
      })}
    </nav>
  );

  const renderLogoutButton = () => (
    <div className="p-4 border-t border-slate-800 space-y-2">
      <Link
        href="https://t.me/Dasturchi_76"
        target="_blank"
        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
      >
        <HelpCircle size={18} className="text-sky-400" />
        <span>Yordam (@Dasturchi_76)</span>
      </Link>
      <button
        onClick={() => {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }}
        className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
      >
        <LogOut size={18} />
        <span>{t('nav.logout', 'Chiqish')}</span>
      </button>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Sidebar (faqat kompyuter va planshetda ko'rinadi) */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-100 flex-col min-h-screen border-r border-slate-800 shrink-0">
        <div className="p-5 border-b border-slate-800">
          <Logo />
        </div>
        {renderNavLinks()}
        {renderLogoutButton()}
      </aside>

      {/* 2. Mobile Drawer Backdrop (telefonda ochilganda orqa fonni xiralashtirish) */}
      {isOpen && (
        <div
          onClick={close}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* 3. Mobile Drawer Panel (telefonda ekranning chap tomonidan silliq chiqib keladi) */}
      <aside
        className={`fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-slate-900 text-slate-100 flex flex-col z-50 border-r border-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <Logo />
          <button
            onClick={close}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Menyuni yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {renderNavLinks(close)}
        {renderLogoutButton()}
      </aside>
    </>
  );
}
