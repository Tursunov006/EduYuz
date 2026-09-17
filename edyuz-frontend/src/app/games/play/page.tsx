'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { sound } from '@/lib/gameSound';
import { 
  Trophy, Flame, Clock, Award, ArrowRight, RotateCcw, 
  CheckCircle, XCircle, Volume2, VolumeX, Sparkles, Home
} from 'lucide-react';
import Link from 'next/link';

function GameArenaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialTopic = searchParams.get('topic') || 'Dasturlash asoslari';
  const initialStudentId = searchParams.get('studentId') || '';

  const [topic, setTopic] = useState(initialTopic);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Game state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [rewardResult, setRewardResult] = useState<any>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Ranglar va geometrik shakllar (Kahoot uslubi)
  const optionStyles = [
    { bg: 'bg-rose-600 hover:bg-rose-500', border: 'border-rose-400', shape: '▲' },
    { bg: 'bg-sky-600 hover:bg-sky-500', border: 'border-sky-400', shape: '◆' },
    { bg: 'bg-amber-600 hover:bg-amber-500', border: 'border-amber-400', shape: '●' },
    { bg: 'bg-emerald-600 hover:bg-emerald-500', border: 'border-emerald-400', shape: '■' },
  ];

  // Savollarni yuklash
  useEffect(() => {
    loadQuestions(topic);
  }, [topic]);

  const loadQuestions = async (t: string) => {
    setLoading(true);
    setIsFinished(false);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setCorrectCount(0);
    setSelectedOption(null);
    setIsAnswered(false);

    try {
      const res = await api.get(`/games/content?topic=${encodeURIComponent(t)}&type=quiz`);
      const qList = res.data?.questions || [];
      setQuestions(qList);
      setTimeLeft(qList[0]?.timeLimitSeconds || 15);
    } catch (err) {
      console.error('Failed to load game questions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Taymer mantig'i
  useEffect(() => {
    if (loading || isFinished || isAnswered || questions.length === 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeOut();
          return 0;
        }
        if (soundEnabled && prev <= 4) {
          sound.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isAnswered, loading, isFinished, questions]);

  const handleTimeOut = () => {
    if (isAnswered) return;
    setIsAnswered(true);
    setStreak(0);
    if (soundEnabled) sound.playWrong();
  };

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedOption(index);
    setIsAnswered(true);

    const currentQ = questions[currentIndex];
    const isCorrect = index === currentQ.correctIndex;

    if (isCorrect) {
      const timeBonus = Math.round(timeLeft * 10);
      const streakBonus = streak * 20;
      const pointsGained = currentQ.points + timeBonus + streakBonus;

      setScore((prev) => prev + pointsGained);
      setCorrectCount((prev) => prev + 1);
      const nextStreak = streak + 1;
      setStreak(nextStreak);

      if (soundEnabled) {
        if (nextStreak >= 2) {
          sound.playCombo(nextStreak);
        } else {
          sound.playCorrect();
        }
      }
    } else {
      setStreak(0);
      if (soundEnabled) sound.playWrong();
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(questions[nextIdx]?.timeLimitSeconds || 15);
    } else {
      finishGame();
    }
  };

  const finishGame = async () => {
    setIsFinished(true);
    if (soundEnabled) sound.playVictory();

    // Talabaga mukofot yuborish
    try {
      let stId = initialStudentId;
      if (!stId) {
        // Agar parametr berilmagan bo'lsa, bazadagi 1-o'quvchini olish
        const stdRes = await api.get('/students');
        stId = stdRes.data?.[0]?.id || '';
      }

      if (stId) {
        const res = await api.post('/games/submit-score', {
          studentId: stId,
          gameType: 'quiz',
          topic,
          score,
          correctCount,
          totalQuestions: questions.length,
          comboStreak: streak,
        });
        setRewardResult(res.data);
      }
    } catch (err) {
      console.error('Failed to submit score:', err);
    }
  };

  const currentQ = questions[currentIndex];
  const maxTime = currentQ?.timeLimitSeconds || 15;
  const progressPercent = Math.max(0, (timeLeft / maxTime) * 100);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-rose-500 selection:text-white relative overflow-hidden font-sans">
      {/* Background glow effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Navigation Bar */}
      <header className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <Link
            href="/lms"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <Home className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
                🎮 EduYuz Arena
              </span>
              <span className="text-xs text-slate-400">Mavzu:</span>
              <strong className="text-xs text-white truncate max-w-xs">{topic}</strong>
            </div>
          </div>
        </div>

        {/* Live Score & Streak */}
        <div className="flex items-center gap-4">
          {streak >= 2 && (
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-orange-500/40 text-orange-400 text-xs font-bold animate-pulse">
              <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
              <span>x{streak} On Fire!</span>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-amber-400">{score}</span>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title={soundEnabled ? 'Tovushni o‘chirish' : 'Tovushni yoqish'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
          </button>
        </div>
      </header>

      {/* Main Arena Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-5xl mx-auto w-full z-10">
        {loading && (
          <div className="py-24 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400 animate-bounce">
              <Sparkles className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-white">AI Savollarni Shakllantirmoqda...</h2>
            <p className="text-xs text-slate-400">"{topic}" mavzusi bo‘yicha interaktiv viktorina tayyorlanyapti</p>
          </div>
        )}

        {/* Finished / Victory Screen */}
        {!loading && isFinished && (
          <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 p-8 rounded-3xl text-center space-y-6 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 mx-auto shadow-xl shadow-amber-500/20">
              <Trophy className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-white">O‘yin Yakunlandi! 🎉</h2>
              <p className="text-sm text-slate-400 mt-1">"{topic}" mavzusi bo‘yicha natijangiz</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60">
                <span className="text-[11px] text-slate-400">To‘g‘ri</span>
                <p className="text-xl font-bold text-emerald-400 mt-1">
                  {correctCount}/{questions.length}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60">
                <span className="text-[11px] text-slate-400">Umumiy Ball</span>
                <p className="text-xl font-bold text-amber-400 mt-1">{score}</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60">
                <span className="text-[11px] text-slate-400">Aniqlik</span>
                <p className="text-xl font-bold text-sky-400 mt-1">
                  {Math.round((correctCount / (questions.length || 1)) * 100)}%
                </p>
              </div>
            </div>

            {/* EduCoins Award Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-500/40 text-amber-300 space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Award className="w-6 h-6 text-amber-400" />
                <span className="text-lg font-black text-white">
                  +{rewardResult?.earnedCoins || 20} EduCoin Yutib Oldingiz!
                </span>
              </div>
              <p className="text-xs text-amber-200/80">
                {rewardResult?.message || 'Tangalar balansingizga muvaffaqiyatli o‘tkazildi!'}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => loadQuestions(topic)}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
              >
                <RotateCcw className="w-4 h-4" />
                Qayta O‘ynash
              </button>
              <Link
                href="/leaderboard"
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition"
              >
                <Trophy className="w-4 h-4" />
                Reytingni Ko‘rish
              </Link>
            </div>
          </div>
        )}

        {/* Active Question Screen */}
        {!loading && !isFinished && currentQ && (
          <div className="w-full flex flex-col items-center space-y-6">
            {/* Timer & Question Counter Bar */}
            <div className="w-full max-w-3xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
                <span>
                  Savol <strong className="text-white">{currentIndex + 1}</strong> / {questions.length}
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-rose-400" />
                  <strong className={timeLeft <= 5 ? 'text-rose-500 animate-ping' : 'text-white'}>
                    {timeLeft}s
                  </strong>
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    timeLeft <= 5 ? 'bg-rose-500' : 'bg-gradient-to-r from-blue-500 to-emerald-400'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <div className="w-full max-w-3xl p-6 sm:p-8 bg-slate-900/90 border border-slate-800 rounded-3xl text-center shadow-xl backdrop-blur-md">
              <h2 className="text-xl sm:text-2xl font-bold text-white leading-relaxed">
                {currentQ.question}
              </h2>
            </div>

            {/* 4 Big Colorful Kahoot Buttons */}
            <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentQ.options?.map((opt: string, idx: number) => {
                const style = optionStyles[idx % optionStyles.length];
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQ.correctIndex;

                let cardClass = `${style.bg} ${style.border}`;

                if (isAnswered) {
                  if (isCorrect) {
                    cardClass = 'bg-emerald-600 border-emerald-300 ring-4 ring-emerald-500/40';
                  } else if (isSelected) {
                    cardClass = 'bg-rose-700/60 border-rose-500/40 opacity-70';
                  } else {
                    cardClass = 'bg-slate-800/40 border-slate-800 opacity-40';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(idx)}
                    className={`p-5 sm:p-6 rounded-2xl border text-left flex items-center justify-between text-white font-bold text-sm sm:text-base shadow-lg transition transform active:scale-95 ${cardClass}`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="w-8 h-8 rounded-xl bg-black/20 flex items-center justify-center text-sm font-black shrink-0">
                        {style.shape}
                      </span>
                      <span className="leading-snug">{opt}</span>
                    </div>

                    {isAnswered && isCorrect && (
                      <CheckCircle className="w-6 h-6 text-white shrink-0 ml-2" />
                    )}
                    {isAnswered && isSelected && !isCorrect && (
                      <XCircle className="w-6 h-6 text-white shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Answer Feedback Banner */}
            {isAnswered && (
              <div className="w-full max-w-3xl p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    {selectedOption === currentQ.correctIndex ? (
                      <span className="text-emerald-400 font-bold text-sm flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Ajoyib! To‘g‘ri javob!
                      </span>
                    ) : (
                      <span className="text-rose-400 font-bold text-sm flex items-center gap-1">
                        <XCircle className="w-4 h-4" />
                        {timeLeft === 0 ? 'Vaqt tugadi!' : 'Noto‘g‘ri javob!'}
                      </span>
                    )}
                  </div>
                  {currentQ.explanation && (
                    <p className="text-xs text-slate-400">{currentQ.explanation}</p>
                  )}
                </div>

                <button
                  onClick={handleNextQuestion}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white text-slate-950 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-100 transition shadow-lg shrink-0"
                >
                  <span>{currentIndex + 1 < questions.length ? 'Keyingi Savol' : 'Natijani Ko‘rish'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-3 text-center text-xs text-slate-600 border-t border-slate-900 z-10">
        EduYuz AI Interaktiv Ta'lim Arenasi • Bilim va O‘yin birgalikda
      </footer>
    </div>
  );
}

export default function GameArenaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Yuklanmoqda...</div>}>
      <GameArenaContent />
    </Suspense>
  );
}
