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

const menuItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'O‘quvchilar', href: '/students', icon: Users },
  { name: 'Guruhlar', href: '/groups', icon: BookOpen },
  { name: 'O‘qituvchilar', href: '/teachers', icon: UserCheck },
  { name: 'Davomat', href: '/attendance', icon: CalendarCheck },
  { name: 'To‘lovlar', href: '/payments', icon: CreditCard },
  { name: 'Moliya & Chiqim', href: '/expenses', icon: Wallet },
  { name: 'LMS Darslar', href: '/lms', icon: GraduationCap },
  { name: 'Mavzuli O‘yinlar', href: '/games', icon: Gamepad2 },
  { name: 'Reyting & Coins', href: '/leaderboard', icon: Trophy },
  { name: 'Sertifikatlar', href: '/certificates', icon: Award },
  { name: 'O‘quvchi Portali', href: '/portal', icon: Smartphone },
];

export default function Sidebar() {
  const pathname = usePathname();

  // Agar login, portal yoki verify sahifasida bo'lsa sidebar ko'rinmasin
  if (pathname === '/login' || pathname === '/portal' || pathname.startsWith('/verify')) return null;

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
              {item.name}
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
          Chiqish
        </button>
      </div>
    </aside>
  );
}
