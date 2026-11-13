'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap, Award, Megaphone } from 'lucide-react';

const TABS = [
  { href: '/lms', label: 'LMS Darslar', icon: GraduationCap },
  { href: '/certificates', label: 'QR-Sertifikatlar', icon: Award },
  { href: '/announcements', label: "E'lonlar", icon: Megaphone },
];

export default function AcademicHubNav() {
  const pathname = usePathname();

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-1.5 mb-6 shadow-sm backdrop-blur-md">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                isActive
                  ? 'text-white shadow-sm bg-indigo-600'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
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
