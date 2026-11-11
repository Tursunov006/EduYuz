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
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-600" />
          Darslar va Uyga Vazifalar ({lessons.length})
        </h2>
      </div>

      {lessons.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-500 space-y-2">
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
                className="rounded-2xl bg-white border border-slate-200 overflow-hidden transition-all shadow-sm"
              >
                {/* Accordion header */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : ls.id)}
                  className="p-4 flex items-center justify-between cursor-pointer active:bg-slate-50 select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-2xl bg-blue-500/10 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-500/20">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-slate-900 truncate">{ls.title}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        {ls.videoUrl && (
                          <span className="text-[10px] text-red-600 font-medium">Video</span>
                        )}
                        <span className="text-[10px] text-slate-500">
                          {ls.homeworks?.length || 0} ta vazifa
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-slate-500">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-slate-200/60 space-y-4 bg-slate-50">
                    {/* Video Embed */}
                    {embedUrl && (
                      <div className="pt-3">
                        <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-200">
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
                      <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                        {ls.content}
                      </div>
                    )}

                    {/* Interactive Game Button */}
                    <Link
                      href={`/games/play?topic=${encodeURIComponent(ls.title)}&studentId=${studentId}`}
                      className="w-full py-2.5 px-4 rounded-2xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-98 bg-rose-600 hover:bg-rose-500"
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
                          className="p-3.5 rounded-2xl bg-white border border-slate-200/80 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-700">{hw.title}</span>
                            <span className="text-[10px] text-amber-600 font-semibold">
                              Max {hw.maxScore} ball
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500">{hw.description}</p>

                          {mySub ? (
                            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-500/30 text-emerald-700 text-xs space-y-1">
                              <div className="flex justify-between font-bold">
                                <span>Holati: {mySub.status === 'reviewed' ? 'Baholandi ' : 'Kutilmoqda '}</span>
                                {mySub.score !== null && <span>{mySub.score} ball</span>}
                              </div>
                              {mySub.feedback && (
                                <p className="text-[10px] text-slate-600">Ustoz: "{mySub.feedback}"</p>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] text-slate-500 italic">Topshirilmagan</span>
                              <span className="text-[11px] text-blue-600 font-semibold">Vazifani yuklash</span>
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
