'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';

// Kun / tun tugmasi
export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={dark ? 'Kunduzgi rejim' : 'Tungi rejim'}
      aria-label={dark ? 'Kunduzgi rejimga o‘tish' : 'Tungi rejimga o‘tish'}
      className={`w-10 h-10 shrink-0 rounded-[10px] bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 flex items-center justify-center transition ${className}`}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
