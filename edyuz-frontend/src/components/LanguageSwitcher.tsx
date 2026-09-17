'use client';

import { useTranslation } from '@/lib/i18n/LanguageContext';
import { Language } from '@/lib/i18n/translations';
import { Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'uz', label: 'O‘zbekcha', flag: '🇺🇿' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ];

  const current = languages.find((l) => l.code === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 transition active:scale-95 shadow-sm ${
          compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-xs font-semibold'
        }`}
        title="Tilni o‘zgartirish / Сменить язык / Change language"
      >
        <span>{current.flag}</span>
        <span className="uppercase font-bold tracking-wide">{current.code}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-150">
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLanguage(l.code);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between transition ${
                language === l.code
                  ? 'bg-blue-600/20 text-blue-400 font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{l.flag}</span>
                <span>{l.label}</span>
              </div>
              {language === l.code && <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
