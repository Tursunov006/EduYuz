'use client';

import { Home, BookOpen, Gamepad2, Bot, User } from 'lucide-react';

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
  const tabs = [
    { id: 'home' as MobileTab, label: 'Asosiy', icon: Home },
    { id: 'lessons' as MobileTab, label: 'Darslar', icon: BookOpen },
    { id: 'games' as MobileTab, label: 'O‘yinlar', icon: Gamepad2, highlight: true },
    { id: 'ai' as MobileTab, label: 'AI Tutor', icon: Bot },
    { id: 'profile' as MobileTab, label: 'Profil', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/80 shadow-2xl">
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
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Active Indicator Glow */}
              {isActive && (
                <span className="absolute -top-2 w-8 h-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/50" />
              )}

              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                  isActive
                    ? tab.highlight
                      ? 'bg-gradient-to-tr from-rose-600 to-purple-600 text-white shadow-lg shadow-rose-600/30 scale-105'
                      : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 scale-105'
                    : 'bg-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              </div>

              <span
                className={`text-[10px] font-semibold mt-1 tracking-tight ${
                  isActive ? 'text-white font-bold' : 'text-slate-400'
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
