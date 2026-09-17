'use client';

import { useState } from 'react';
import { BookOpen, Video, FileText, ChevronDown, ChevronUp, Gamepad2, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';

interface LessonsTabProps {
  lessons?: any[];
  studentId: string;
}

export default function LessonsTab({ lessons = [], studentId }: LessonsTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(lessons[0]?.id || null);

  const getEmbedUrl = (url?: string) => {
    if (!url) return null;
    try {
      if (url.includes('youtube.com/watch?v=')) {
        const videoId = url.split('v=')[1]?.split('&')[0];
        return `https://www.youtube.com/embed/${videoId}`;
      }
      if (url.includes('youtu.be/')) {
        const videoId = url.split('youtu.be/')[1]?.split('?')[0];
        return `https://www.youtube.com/embed/${videoId}`;
      }
      return url;
    } catch {
      return url;
    }
  };

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-400" />
          Darslar va Uyga Vazifalar ({lessons.length})
        </h2>
      </div>

      {lessons.length === 0 ? (
        <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-500 space-y-2">
          <BookOpen className="w-8 h-8 mx-auto text-slate-700" />
          <p>Hozircha darslar yuklanmagan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((ls, idx) => {
            const isExpanded = expandedId === ls.id;
            const embedUrl = getEmbedUrl(ls.videoUrl);

            return (
              <div
                key={ls.id || idx}
                className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden transition-all shadow-sm"
              >
                {/* Accordion header */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : ls.id)}
                  className="p-4 flex items-center justify-between cursor-pointer active:bg-slate-800/40 select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-2xl bg-blue-500/10 text-blue-400 font-black text-xs flex items-center justify-center shrink-0 border border-blue-500/20">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-white truncate">{ls.title}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        {ls.videoUrl && (
                          <span className="text-[10px] text-red-400 font-medium">Video</span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {ls.homeworks?.length || 0} ta vazifa
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-slate-400">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-slate-800/60 space-y-4 bg-slate-950/40">
                    {/* Video Embed */}
                    {embedUrl && (
                      <div className="pt-3">
                        <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-800">
                          <iframe
                            src={embedUrl}
                            title={ls.title}
                            className="w-full h-full"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    )}

                    {/* Lesson notes */}
                    {ls.content && (
                      <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {ls.content}
                      </div>
                    )}

                    {/* Interactive Game Button */}
                    <Link
                      href={`/games/play?topic=${encodeURIComponent(ls.title)}&studentId=${studentId}`}
                      className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition active:scale-98"
                    >
                      <Gamepad2 className="w-4 h-4" />
                      <span>Ushbu Dars O‘yini (+25 Coin)</span>
                    </Link>

                    {/* Homework tasks */}
                    {ls.homeworks?.map((hw: any) => {
                      const mySub = hw.submissions?.find((s: any) => s.studentId === studentId);

                      return (
                        <div
                          key={hw.id}
                          className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-300">📝 {hw.title}</span>
                            <span className="text-[10px] text-amber-400 font-semibold">
                              Max {hw.maxScore} ball
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-400">{hw.description}</p>

                          {mySub ? (
                            <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs space-y-1">
                              <div className="flex justify-between font-bold">
                                <span>Holati: {mySub.status === 'reviewed' ? 'Baholandi ✅' : 'Kutilmoqda ⏳'}</span>
                                {mySub.score !== null && <span>{mySub.score} ball</span>}
                              </div>
                              {mySub.feedback && (
                                <p className="text-[10px] text-slate-300">Ustoz: "{mySub.feedback}"</p>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] text-slate-500 italic">Topshirilmagan</span>
                              <span className="text-[11px] text-blue-400 font-semibold">Vazifani yuklash</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
