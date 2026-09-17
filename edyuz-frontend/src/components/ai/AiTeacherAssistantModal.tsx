'use client';

import { useState } from 'react';
import { Sparkles, BookOpen, HelpCircle, Copy, Check, Loader2, X } from 'lucide-react';
import { api } from '@/lib/api';

interface AiTeacherAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTopic?: string;
  onApplyLesson?: (lessonData: any) => void;
}

export default function AiTeacherAssistantModal({
  isOpen,
  onClose,
  defaultTopic = '',
  onApplyLesson,
}: AiTeacherAssistantModalProps) {
  const [topic, setTopic] = useState(defaultTopic);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'plan' | 'quiz'>('plan');
  const [lessonResult, setLessonResult] = useState<any>(null);
  const [quizResult, setQuizResult] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const quickTopics = [
    'Python: Funksiyalar va Looplar',
    'JavaScript: Asinxronlik va Promise',
    'English: Present Perfect Tense',
    'Matematika: Chiziqli tenglamalar',
    'Robototexnika: Arduino asoslari',
  ];

  const handleGenerate = async (selectedTopic?: string) => {
    const t = selectedTopic || topic;
    if (!t.trim()) return;

    setLoading(true);
    try {
      // 1. Dars rejasi
      const lessonRes = await api.post('/ai/generate-lesson', { topic: t });
      setLessonResult(lessonRes.data);

      // 2. Viktorina savollari
      const quizRes = await api.post('/ai/generate-quiz', { topic: t, count: 5 });
      setQuizResult(quizRes.data || []);
    } catch (err) {
      console.error('AI generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                EduYuz AI Yordamchi
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-semibold">
                  O‘qituvchi vositasi
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Mavzu nomini kiriting — AI dars konspekti, misollar va interaktiv testni 2 soniyada tuzadi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Topic Input Bar */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-900/60 space-y-3">
          <div className="flex gap-3">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Masalan: Python Looplar, English Past Simple, Grafika..."
              className="flex-1 bg-slate-800/90 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <button
              onClick={() => handleGenerate()}
              disabled={loading || !topic.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/20 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Tuzilmoqda...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>AI Darsni Tuzish</span>
                </>
              )}
            </button>
          </div>

          {/* Quick suggestions */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-500 whitespace-nowrap">Tezkor namunalar:</span>
            {quickTopics.map((q, i) => (
              <button
                key={i}
                onClick={() => {
                  setTopic(q);
                  handleGenerate(q);
                }}
                className="whitespace-nowrap px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Content Tabs */}
        {lessonResult && (
          <div className="px-6 pt-4 border-b border-slate-800 flex items-center gap-4">
            <button
              onClick={() => setActiveTab('plan')}
              className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition ${
                activeTab === 'plan'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Dars Rejasi va Konspekt
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition ${
                activeTab === 'quiz'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              Mavzuli Viktorina ({quizResult.length} savol)
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!lessonResult && !loading && (
            <div className="py-16 text-center text-slate-500">
              <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30 text-blue-400" />
              <p className="text-base font-medium text-slate-400">Yuqoriga mavzu nomini yozing va "AI Darsni Tuzish" tugmasini bosing</p>
              <p className="text-xs text-slate-600 mt-1">Sun'iy intellekt dars konspekti va viktorinani avtomatik tayyorlaydi</p>
            </div>
          )}

          {loading && (
            <div className="py-20 text-center text-slate-400 space-y-3">
              <Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-500" />
              <p className="text-sm font-semibold text-white">Mavzu tahlil qilinmoqda va konspekt tuzilmoqda...</p>
              <p className="text-xs text-slate-500">Savollar, amaliy qoidalar va uy vazifalari shakllanmoqda</p>
            </div>
          )}

          {lessonResult && activeTab === 'plan' && (
            <div className="space-y-6 text-slate-300">
              <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-800/40">
                <span className="text-xs uppercase font-bold tracking-wider text-blue-400">Mavzu Xulosasi</span>
                <h3 className="text-lg font-bold text-white mt-1">{lessonResult.topic}</h3>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed">{lessonResult.summary}</p>
              </div>

              {lessonResult.sections?.map((sec: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <h4 className="text-md font-semibold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    {sec.title}
                  </h4>
                  <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                    {sec.content}
                  </pre>
                </div>
              ))}

              {/* Homework Block */}
              {lessonResult.homework && (
                <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-bold tracking-wider text-purple-400">Uyga Vazifa</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">Max: {lessonResult.homework.maxScore} ball</span>
                  </div>
                  <h4 className="text-md font-bold text-white">{lessonResult.homework.title}</h4>
                  <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                    {lessonResult.homework.description}
                  </pre>
                </div>
              )}
            </div>
          )}

          {lessonResult && activeTab === 'quiz' && (
            <div className="space-y-4">
              {quizResult.map((q, idx) => (
                <div key={q.id || idx} className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs">
                        {idx + 1}
                      </span>
                      Savol (Vaqt: {q.timeLimitSeconds} soniya)
                    </span>
                    <span className="text-xs text-amber-400 font-semibold">+{q.points} ball</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{q.question}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options?.map((opt: string, optIdx: number) => {
                      const isCorrect = optIdx === q.correctIndex;
                      return (
                        <div
                          key={optIdx}
                          className={`p-2.5 rounded-lg text-xs font-medium border flex items-center justify-between ${
                            isCorrect
                              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                              : 'bg-slate-900/60 border-slate-700/50 text-slate-400'
                          }`}
                        >
                          <span>{opt}</span>
                          {isCorrect && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <p className="text-xs text-slate-400 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
                      💡 <strong className="text-slate-300">Tushuntirish:</strong> {q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {lessonResult && (
          <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
            <button
              onClick={() => copyToClipboard(JSON.stringify(lessonResult, null, 2))}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-2 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Nusxalandi!' : 'Konspektni nusxalash'}</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium transition"
              >
                Yopish
              </button>
              {onApplyLesson && (
                <button
                  onClick={() => {
                    onApplyLesson(lessonResult);
                    onClose();
                  }}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition"
                >
                  Dars sifatida saqlash
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
