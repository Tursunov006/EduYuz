'use client';

import { 
  Award, ChevronRight, BookOpen, Clock, 
  Bot, CalendarCheck, CreditCard, Sparkles, CheckCircle
} from 'lucide-react';

interface HomeTabProps {
  student: any;
  groupInfo?: any;
  lessons?: any[];
  attendances?: any[];
  onNavigateTab: (tab: 'home' | 'lessons' | 'ai' | 'profile') => void;
}

export default function HomeTab({
  student,
  groupInfo,
  lessons = [],
  attendances = [],
  onNavigateTab,
}: HomeTabProps) {
  const isDebt = Number(student?.balance || 0) < 0;
  const formattedDebt = Math.abs(Number(student?.balance || 0)).toLocaleString('uz-UZ') + " so'm";

  // Eng so'nggi dars
  const latestLesson = lessons[lessons.length - 1] || lessons[0];

  // Davomat hisobi
  const presentCount = attendances.filter((a) => a.status === 'present').length;
  const totalAtt = attendances.length || 1;
  const attPercent = Math.round((presentCount / totalAtt) * 100);

  return (
    <div className="space-y-4 pb-4">
      {/* 1. Student Profile Header Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 p-5 shadow-sm bg-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-sm bg-indigo-600">
              {student?.fullName ? student.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  {student?.fullName || 'O‘quvchi'}
                </h2>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {groupInfo?.name || 'Guruh'} • {groupInfo?.course?.title || 'Kurs'}
              </p>
            </div>
          </div>
        </div>

        {/* Davomat */}
        <div className="grid grid-cols-1 gap-2 mt-4 pt-3 border-t border-slate-200/80">
          <div className="p-2.5 rounded-2xl bg-white border border-slate-200/60 text-center">
            <span className="text-[10px] text-slate-500 font-medium block">Davomat</span>
            <span className="text-sm font-bold text-emerald-600">{attPercent}%</span>
          </div>
        </div>
      </div>

      {/* 2. Balance / Debt Card */}
      <div
        className={`p-4 rounded-2xl border flex items-center justify-between ${
          isDebt
            ? 'border-rose-200 bg-rose-50'
            : 'border-emerald-200 bg-emerald-50'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isDebt
                ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
            }`}
          >
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium">
              {isDebt ? 'Oylik To‘lov Holati' : 'Balans Holati'}
            </span>
            <div className={`text-base font-bold ${isDebt ? 'text-rose-600' : 'text-emerald-600'}`}>
              {isDebt ? formattedDebt : 'To‘lovlar to‘liq amalga oshirilgan '}
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('profile')}
          className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:text-slate-900"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 4. AI Repetitor Teaser Card */}
      <div
        onClick={() => onNavigateTab('ai')}
        className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between cursor-pointer active:scale-98 transition bg-indigo-50"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-600 shadow-md">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-slate-900">EduYuz AI Repetitor</h4>
              <span className="text-[10px] px-2 py-0.2 rounded bg-blue-500/20 text-blue-700 font-semibold">24/7 Onlayn</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Dars bo‘yicha tushunmagan savollaringizga bir zumda javob oling
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-500" />
      </div>

      {/* 5. Darslar bo'limi tezkor ko'rinishi */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Oxirgi O‘tilgan Darslar
          </h3>
          <button
            onClick={() => onNavigateTab('lessons')}
            className="text-xs font-semibold text-blue-600 flex items-center gap-0.5"
          >
            <span>Barchasi</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {lessons.slice(0, 3).map((ls, idx) => (
            <div
              key={ls.id || idx}
              onClick={() => onNavigateTab('lessons')}
              className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3 active:scale-98 transition cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{ls.title}</h4>
                  <span className="text-[10px] text-slate-500">
                    {ls.homeworks?.length || 0} ta vazifa
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-blue-600 font-medium shrink-0">Ochish →</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
