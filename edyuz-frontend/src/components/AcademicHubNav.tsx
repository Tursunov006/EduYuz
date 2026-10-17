'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap, Award, Trophy, Gamepad2, Megaphone } from 'lucide-react';

const TABS = [
  { href: '/lms', label: 'LMS Darslar', icon: GraduationCap },
  { href: '/certificates', label: 'QR-Sertifikatlar', icon: Award },
  { href: '/leaderboard', label: 'Reyting & Coins', icon: Trophy },
  { href: '/games', label: "Mavzuli O'yinlar", icon: Gamepad2 },
  { href: '/announcements', label: "E'lonlar", icon: Megaphone },
];

export default function AcademicHubNav() {
  const pathname = usePathname();

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-1.5 mb-6 shadow-lg backdrop-blur-md">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon size={15} />
              <span className="truncate">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
