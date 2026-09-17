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
  Gamepad2
} from 'lucide-react';

import Logo from './Logo';
import { useTranslation } from '@/lib/i18n/LanguageContext';

const menuItems = [
  { key: 'dashboard', name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { key: 'students', name: 'O‘quvchilar', href: '/students', icon: Users },
  { key: 'groups', name: 'Guruhlar', href: '/groups', icon: BookOpen },
  { key: 'teachers', name: 'O‘qituvchilar', href: '/teachers', icon: UserCheck },
  { key: 'attendance', name: 'Davomat', href: '/attendance', icon: CalendarCheck },
  { key: 'payments', name: 'To‘lovlar', href: '/payments', icon: CreditCard },
  { key: 'expenses', name: 'Moliya & Chiqim', href: '/expenses', icon: Wallet },
  { key: 'lms', name: 'LMS Darslar', href: '/lms', icon: GraduationCap },
  { key: 'games', name: 'Mavzuli O‘yinlar', href: '/games', icon: Gamepad2 },
  { key: 'leaderboard', name: 'Reyting & Coins', href: '/leaderboard', icon: Trophy },
  { key: 'certificates', name: 'Sertifikatlar', href: '/certificates', icon: Award },
  { key: 'portal', name: 'O‘quvchi Portali', href: '/portal', icon: Smartphone },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  // Agar login, portal, app, games/play yoki verify sahifasida bo'lsa sidebar ko'rinmasin
  if (pathname === '/login' || pathname === '/portal' || pathname.startsWith('/app') || pathname.startsWith('/games/play') || pathname.startsWith('/verify')) return null;

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col min-h-screen border-r border-slate-800 shrink-0">
      {/* Brend va Logo */}
      <div className="p-5 border-b border-slate-800">
        <Logo />
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Icon size={18} />
              {t(`nav.${item.key}`, item.name)}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={18} />
          {t('nav.logout', 'Chiqish')}
        </button>
      </div>
    </aside>
  );
}
