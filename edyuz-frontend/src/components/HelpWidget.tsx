'use client';

import { useState } from 'react';
import { MessageCircleQuestion, X, Send, Bot, MessagesSquare } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function HelpWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Yordam tugmasi ba'zi sahifalarda xalaqit bermasligi uchun yashirilishi mumkin (masalan login yoki o'yinlar)
  if (
    pathname === '/login' || 
    pathname.startsWith('/games/play')
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Ochiq menyu darchasi */}
      {isOpen && (
        <div className="mb-4 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col transform origin-bottom-right transition-all duration-200">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-4 text-white">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <MessageCircleQuestion size={18} />
              Yordam va Aloqa
            </h3>
            <p className="text-xs text-indigo-100 mt-1 opacity-90">Savollaringiz bo'lsa, biz yordam berishga tayyormiz.</p>
          </div>
          
          <div className="p-2 flex flex-col gap-1">
            <a 
              href="https://t.me/tursunov_husniddin" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition text-sm font-medium text-slate-200"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Send size={16} />
              </div>
              Telegram orqali yozish
            </a>
            
            <a 
              href="/ai" 
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition text-sm font-medium text-slate-200"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Bot size={16} />
              </div>
              AI Yordamchidan so'rash
            </a>
            
            <a 
              href="/faq" 
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition text-sm font-medium text-slate-200"
              onClick={(e) => {
                e.preventDefault();
                alert("Qo'llanmalar sahifasi tez orada ishga tushadi!");
              }}
            >
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <MessagesSquare size={16} />
              </div>
              Ko'p beriladigan savollar
            </a>
          </div>
        </div>
      )}

      {/* Floating Tugma */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 transition-transform hover:scale-105 active:scale-95"
      >
        {isOpen ? <X size={24} /> : <MessageCircleQuestion size={26} />}
      </button>
    </div>
  );
}
