'use client';

import { Moon, Sparkles, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';

// Mavzu tugmasi: kunduzgi -> tungi -> shisha -> kunduzgi
const NEXT_LABEL = { light: 'Tungi rejim', dark: 'Shisha rejimi', glass: 'Kunduzgi rejim' } as const;

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const label = NEXT_LABEL[theme];
  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={label}
      aria-label={`${label}ga o‘tish`}
      className={`w-10 h-10 shrink-0 rounded-[10px] bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 flex items-center justify-center transition ${className}`}
    >
      {theme === 'light' ? <Moon size={18} /> : theme === 'dark' ? <Sparkles size={18} /> : <Sun size={18} />}
    </button>
  );
}
