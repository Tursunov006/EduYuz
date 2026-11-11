'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Gamepad2, Sparkles, Trophy, Play, Flame, Search, BookOpen, Star, Brain
} from 'lucide-react';
import Link from 'next/link';
import AcademicHubNav from '@/components/AcademicHubNav';

export default function GamesHubPage() {
  const router = useRouter();
  const [customTopic, setCustomTopic] = useState('');

  const featuredGames = [
    {
      title: 'Python Dasturlash Asoslari',
      desc: 'O‘zgaruvchilar, looplar, funksiyalar va algoritmlar bo‘yicha tezkor viktorina',
      tag: 'Dasturlash',
      difficulty: 'O‘rta',
      coins: '+25 Coin',
      plays: '142 marta o‘ynalgan',
      color: 'from-amber-500/20 via-orange-500/10 to-amber-500/20 border-amber-500/30 text-amber-600',
      btnColor: 'bg-amber-500 hover:bg-amber-400 text-slate-900',
    },
    {
      title: 'JavaScript & Web Dasturlash',
      desc: 'DOM, asinxronlik, array metodlari va brauzer hodisalari',
      tag: 'Frontend',
      difficulty: 'Oson',
      coins: '+20 Coin',
      plays: '98 marta o‘ynalgan',
      color: 'from-yellow-500/20 via-amber-500/10 to-yellow-500/20 border-yellow-500/30 text-yellow-600',
      btnColor: 'bg-yellow-500 hover:bg-yellow-400 text-slate-900',
    },
    {
      title: 'Ingliz Tili: Present & Past Tenses',
      desc: 'Zamonlar, fe\'l shakllari va kundalik gap tuzish qoidalari',
      tag: 'Tillar',
      difficulty: 'Oson',
      coins: '+20 Coin',
      plays: '215 marta o‘ynalgan',
      color: 'from-blue-500/20 via-sky-500/10 to-blue-500/20 border-blue-500/30 text-blue-600',
      btnColor: 'bg-blue-600 hover:bg-blue-500 text-white',
    },
    {
      title: 'Matematika & Mantiqiy Fikrlar',
      desc: 'Tezkor hisoblash, chiziqli tenglamalar va IQ mantiq jumboqlari',
      tag: 'Aniq fanlar',
      difficulty: 'Qiyin',
      coins: '+30 Coin',
      plays: '67 marta o‘ynalgan',
      color: 'from-purple-500/20 via-pink-500/10 to-purple-500/20 border-purple-500/30 text-purple-600',
      btnColor: 'bg-purple-600 hover:bg-purple-500 text-white',
    },
  ];

  const handleStartCustomGame = () => {
    if (!customTopic.trim()) return;
    router.push(`/games/play?topic=${encodeURIComponent(customTopic.trim())}`);
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
      <AcademicHubNav />

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 p-8 sm:p-10 shadow-sm bg-rose-50">
        <div className="relative z-10 max-w-2xl space-y-4">

          <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 leading-tight">Darslarni o‘yin orqali o‘rganing va <span className="text-indigo-600">EduCoin</span> yutib oling!</h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Har bir dars mavzusi bo‘yicha AI tayyorlagan taymerli viktorina va qiziqarli o‘yinlar. Tez va to‘g‘ri javob bering, combo ballar to‘plang va yetakchilar shohsupasiga ko‘tariling!
          </p>

          {/* Custom Topic Generator Search Bar */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStartCustomGame()}
                placeholder="Istalgan mavzuni yozing (Masalan: Robototexnika, Biologiya...)"
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-inner"
              />
            </div>
            <button
              onClick={handleStartCustomGame}
              disabled={!customTopic.trim()}
              className="px-6 py-3.5 rounded-2xl disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition shrink-0 bg-rose-600 hover:bg-rose-500"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI O‘yin Boshlash</span>
            </button>
          </div>
        </div>

        {/* Decorative graphic background */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 hidden lg:block pointer-events-none">
          <Gamepad2 className="w-96 h-96 text-rose-500" />
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Bitta o‘yinda yutuq</span>
            <p className="text-lg font-bold text-slate-900">+25 gacha EduCoin</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Combo Tizimi</span>
            <p className="text-lg font-bold text-slate-900">x2, x3 On Fire Bonusi</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Aqlli AI Generatsiya</span>
            <p className="text-lg font-bold text-slate-900">Cheksiz mavzular</p>
          </div>
        </div>
      </div>

      {/* Featured Lesson Games */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-600 fill-amber-600" />
            Tavsiya Qilinadigan O‘yinlar
          </h2>
          <span className="text-xs text-slate-500">O‘quvchilar eng ko‘p o‘ynagan mavzular</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featuredGames.map((game, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-2xl border ${game.color} flex flex-col justify-between space-y-4 backdrop-blur-sm shadow-sm hover:scale-[1.01] transition`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-white border border-slate-300/60 text-slate-600 font-semibold">
                    {game.tag}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-white text-slate-500">
                      {game.difficulty}
                    </span>
                    <span className="text-xs font-bold text-amber-700">
                      {game.coins}
                    </span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mt-1">{game.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{game.desc}</p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-300/40">
                <span className="text-xs text-slate-500">{game.plays}</span>
                <Link
                  href={`/games/play?topic=${encodeURIComponent(game.title)}`}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition ${game.btnColor}`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>O‘yinni Boshlash</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
