'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Clock, CreditCard, UserPlus, Gamepad2, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  type: 'payment' | 'student' | 'game' | 'alert';
  read: boolean;
}

export default function NotificationCenter() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'Yangi to‘lov qabul qilindi',
      desc: 'Jasur Bekmurodov — 450 000 so‘m (Naqd)',
      time: '12 daqiqa oldin',
      type: 'payment',
      read: false,
    },
    {
      id: '2',
      title: 'Mavzuli O‘yin yutug‘i',
      desc: 'Dasturlash asoslari bo‘yicha +25 EduCoin yutildi',
      time: '45 daqiqa oldin',
      type: 'game',
      read: false,
    },
    {
      id: '3',
      title: 'Davomat SMS xabarnomasi',
      desc: '3 ta o‘quvchining ota-onasiga yo‘qlama SMS yuborildi',
      time: '2 soat oldin',
      type: 'alert',
      read: true,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <CreditCard className="w-4 h-4 text-emerald-400" />;
      case 'game':
        return <Gamepad2 className="w-4 h-4 text-rose-400" />;
      case 'student':
        return <UserPlus className="w-4 h-4 text-blue-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl border border-slate-700/80 bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 transition active:scale-95 shadow-sm"
        title="Bildirishnomalar / Уведомления / Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Bildirishnomalar</span>
              {unreadCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold">
                  {unreadCount} ta yangi
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
              >
                O‘qilgan deb belgilash
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">Bildirishnomalar yo‘q</div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 flex items-start gap-3 transition ${
                    item.read ? 'bg-slate-900/40 opacity-70' : 'bg-slate-800/30'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center shrink-0 mt-0.5">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-white leading-tight">{item.title}</h5>
                    <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2">{item.desc}</p>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {item.time}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
