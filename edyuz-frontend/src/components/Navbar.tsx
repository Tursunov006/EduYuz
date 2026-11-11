'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { useSidebar } from '@/lib/context/SidebarContext';

// Figma dizaynida yuqori panel yo'q. Faqat telefonda menyuni ochish uchun ingichka qator.
export default function Navbar() {
  const { toggle } = useSidebar();
  return (
    <header className="md:hidden h-14 px-4 flex items-center gap-3 bg-white border-b border-slate-200 sticky top-0 z-20">
      <button
        type="button"
        onClick={toggle}
        className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100"
        aria-label="Menyuni ochish"
      >
        <Menu size={20} />
      </button>
      <Link href="/" className="flex items-center gap-2">
        <img src="/logo-icon-transparent.png" alt="EduYuz" className="w-8 h-8 object-contain" />
        <span className="font-bold text-slate-900">
          Edu<span className="text-blue-600">Yuz</span>
        </span>
      </Link>
    </header>
  );
}
