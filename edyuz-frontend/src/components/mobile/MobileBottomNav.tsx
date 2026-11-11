'use client';

import { Home, BookOpen, Gamepad2, Bot, User } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export type MobileTab = 'home' | 'lessons' | 'games' | 'ai' | 'profile';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onChangeTab: (tab: MobileTab) => void;
  coins?: number;
}

export default function MobileBottomNav({
  activeTab,
  onChangeTab,
}: MobileBottomNavProps) {
  const { t } = useTranslation();

  const tabs = [
    { id: 'home' as MobileTab, label: t('app.home', 'Asosiy'), icon: Home },
    { id: 'lessons' as MobileTab, label: t('app.lessons', 'Darslar'), icon: BookOpen },
    { id: 'games' as MobileTab, label: t('app.games', 'O‘yinlar'), icon: Gamepad2, highlight: true },
    { id: 'ai' as MobileTab, label: t('app.aiTutor', 'AI Tutor'), icon: Bot },
    { id: 'profile' as MobileTab, label: t('app.profile', 'Profil'), icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white backdrop-blur-lg border-t border-slate-200/80 shadow-sm">
      <div className="max-w-md mx-auto px-3 py-2 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 select-none ${
                isActive
                  ? 'text-slate-900'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {/* Active Indicator Glow */}
              {isActive && (
                <span className="absolute -top-2 w-8 h-1 rounded-full shadow-sm bg-indigo-600" />
              )}

              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                  isActive
                    ? tab.highlight
                      ? 'text-white shadow-sm scale-105 bg-rose-600'
                      : 'text-white shadow-sm scale-105 bg-indigo-600'
                    : 'bg-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              </div>

              <span
                className={`text-[10px] font-semibold mt-1 tracking-tight ${
                  isActive ? 'text-slate-900 font-bold' : 'text-slate-500'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
