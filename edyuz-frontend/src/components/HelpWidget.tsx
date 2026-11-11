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
        <div className="mb-4 w-72 bg-white border border-slate-300 rounded-2xl shadow-sm overflow-hidden flex flex-col transform origin-bottom-right transition-all duration-200">
          <div className="p-4 text-white bg-indigo-600">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <MessageCircleQuestion size={18} />
              Yordam va Aloqa
            </h3>
            <p className="text-xs text-indigo-700 mt-1 opacity-90">Savollaringiz bo'lsa, biz yordam berishga tayyormiz.</p>
          </div>
          
          <div className="p-2 flex flex-col gap-1">
            <a 
              href="https://t.me/Dasturchi_76" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 transition text-sm font-medium text-slate-700"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center">
                <Send size={16} />
              </div>
              <div>
                <div className="font-bold text-slate-800">Telegram (@Dasturchi_76)</div>
                <div className="text-[11px] text-slate-500">Ibrohim Tursunov • +998 94 769 07 76</div>
              </div>
            </a>
            
            <a 
              href="/ai" 
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 transition text-sm font-medium text-slate-700"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                <Bot size={16} />
              </div>
              AI Yordamchidan so'rash
            </a>
            
            <a 
              href="/faq" 
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 transition text-sm font-medium text-slate-700"
              onClick={(e) => {
                e.preventDefault();
                alert("Qo'llanmalar sahifasi tez orada ishga tushadi!");
              }}
            >
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center">
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
        className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-sm transition-transform hover:scale-105 active:scale-95"
      >
        {isOpen ? <X size={24} /> : <MessageCircleQuestion size={26} />}
      </button>
    </div>
  );
}
