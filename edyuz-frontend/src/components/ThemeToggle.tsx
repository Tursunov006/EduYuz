'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label="Rejimni almashtirish"
      title={isLight ? 'Tungi rejimga o‘tish' : 'Kunduzgi rejimga o‘tish'}
      className={`relative w-14 h-7 rounded-full p-0.5 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 shadow-inner flex items-center ${
        isLight
          ? 'bg-gradient-to-r from-sky-400 to-cyan-400 border border-sky-300 shadow-sky-500/20'
          : 'bg-gradient-to-r from-cyan-600 to-blue-600 border border-cyan-500/40 shadow-cyan-500/30'
      }`}
    >
      {/* Background Icons */}
      <div className="absolute inset-0 flex items-center justify-between px-1.5 pointer-events-none text-[10px]">
        <Sun className={`w-3.5 h-3.5 transition-opacity duration-300 ${isLight ? 'text-amber-100 opacity-90' : 'text-slate-300 opacity-40'}`} />
        <Moon className={`w-3 h-3 transition-opacity duration-300 ${isLight ? 'text-slate-200 opacity-40' : 'text-cyan-100 opacity-90'}`} />
      </div>

      {/* Slider Knob */}
      <div
        className={`w-6 h-6 rounded-full bg-amber-400 shadow-md transform transition-transform duration-300 flex items-center justify-center text-slate-900 z-10 ${
          isLight ? 'translate-x-7 bg-amber-300' : 'translate-x-0 bg-yellow-400'
        }`}
      >
        {isLight ? (
          <Sun className="w-3.5 h-3.5 text-amber-900 animate-spin-slow" />
        ) : (
          <Moon className="w-3.5 h-3.5 text-slate-950 fill-slate-950" />
        )}
      </div>
    </button>
  );
}
