'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import Script from 'next/script';
import Image from 'next/image';
import { 
  Coins, Sparkles, Gamepad2, Trophy, Flame, 
  Search, ArrowRight, BookOpen, Loader2
} from 'lucide-react';
import Link from 'next/link';

import MobileBottomNav, { MobileTab } from '@/components/mobile/MobileBottomNav';
import HomeTab from '@/components/mobile/HomeTab';
import LessonsTab from '@/components/mobile/LessonsTab';
import ProfileTab from '@/components/mobile/ProfileTab';
import AiStudentTutorChat from '@/components/ai/AiStudentTutorChat';

function MiniWebAppContent() {
  const searchParams = useSearchParams();
  const urlStudentId = searchParams.get('studentId');

  const [activeTab, setActiveTab] = useState<MobileTab>('home');
  const [student, setStudent] = useState<any>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(urlStudentId || '');
  const [lessons, setLessons] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Telegram WebApp Auto-expand & init
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready();
      tg.expand();
      try {
        tg.setHeaderColor('#0b1329');
        tg.setBackgroundColor('#020617');
      } catch {}
    }
  }, []);

  // Talaba ma'lumotlarini yuklash
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        let stId = selectedStudentId;

        // Agar stId bo'lmasa, dastlabki o'quvchini olish
        if (!stId) {
          const allRes = await axios.get('http://localhost:3000/api/v1/students');
          const list = allRes.data || [];
          if (list.length > 0) {
            stId = list[0].id;
            setSelectedStudentId(stId);
          }
        }

        if (stId) {
          const [stRes, attRes, payRes, certRes] = await Promise.all([
            axios.get(`http://localhost:3000/api/v1/students/${stId}`),
            axios.get(`http://localhost:3000/api/v1/attendance/student/${stId}`).catch(() => ({ data: [] })),
            axios.get(`http://localhost:3000/api/v1/payments?studentId=${stId}`).catch(() => ({ data: [] })),
            axios.get(`http://localhost:3000/api/v1/certificates/student/${stId}`).catch(() => ({ data: [] })),
          ]);

          const studentObj = stRes.data;
          setStudent(studentObj);
          setAttendances(attRes.data || []);
          setPayments(payRes.data || []);
          setCertificates(certRes.data || []);

          const grpId = studentObj.groups?.[0]?.groupId;
          if (grpId) {
            const lmsRes = await axios.get(`http://localhost:3000/api/v1/lms/groups/${grpId}/lessons`).catch(() => ({ data: [] }));
            setLessons(lmsRes.data || []);
          }
        }
      } catch (err) {
        console.error('Failed to load student app data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedStudentId]);

  const groupInfo = student?.groups?.[0]?.group;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600">
      {/* Telegram WebApp script */}
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />

      {/* Main Mobile Screen Wrapper (Phone viewport on desktop, full on mobile) */}
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col justify-between bg-slate-950 shadow-2xl relative">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 px-4 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 overflow-hidden">
              <Image
                src="/eduyuz-logo.jpg"
                alt="EduYuz"
                width={32}
                height={32}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="text-xs font-black tracking-tight text-white flex items-center gap-1">
                <span>Edu<span className="text-blue-400">Yuz</span></span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-bold">App</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-none">O‘quvchi portali</p>
            </div>
          </div>

          {/* Top Coins & Ranking Pill */}
          <Link
            href="/leaderboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-black text-xs active:scale-95 transition"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>{student?.coins || 0}</span>
            <span className="text-[9px] text-amber-400/80 font-normal">Coin</span>
          </Link>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 p-4 pb-24 overflow-y-auto">
          {loading ? (
            <div className="py-36 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
              <p className="text-xs text-slate-400 font-semibold">Ilova yuklanmoqda...</p>
            </div>
          ) : (
            <>
              {/* Tab 1: Asosiy (Home) */}
              {activeTab === 'home' && (
                <HomeTab
                  student={student}
                  groupInfo={groupInfo}
                  lessons={lessons}
                  attendances={attendances}
                  onNavigateTab={setActiveTab}
                />
              )}

              {/* Tab 2: Darslar (Lessons) */}
              {activeTab === 'lessons' && (
                <LessonsTab
                  lessons={lessons}
                  studentId={selectedStudentId}
                />
              )}

              {/* Tab 3: O'yinlar Arenasi (Games) */}
              {activeTab === 'games' && (
                <div className="space-y-4 pb-6">
                  <div className="p-5 rounded-3xl bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-slate-900 border border-rose-800/40 space-y-3 shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                        <span>Mavzuli Viktorina Arenasi</span>
                      </span>
                      <span className="text-xs font-black text-amber-300">+25 EduCoin</span>
                    </div>

                    <h2 className="text-base font-black text-white">
                      Darslarni o‘yin orqali mustahkamlang!
                    </h2>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      15 soniyalik harakatlanuvchi savollar, Combo ballar va ovoz effektlari bilan bilimingizni sinang.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                      Guruh Darslari Bo‘yicha O‘yinlar
                    </h3>

                    {lessons.length === 0 ? (
                      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-500">
                        Hozircha darslar yuklanmagan
                      </div>
                    ) : (
                      lessons.map((ls, idx) => (
                        <div
                          key={ls.id || idx}
                          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 shadow-sm"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-white truncate">{ls.title}</h4>
                            <span className="text-[10px] text-amber-400 font-semibold block">
                              +25 gacha EduCoin mukofoti
                            </span>
                          </div>

                          <Link
                            href={`/games/play?topic=${encodeURIComponent(ls.title)}&studentId=${selectedStudentId}`}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/20 active:scale-95 transition shrink-0"
                          >
                            <Gamepad2 className="w-3.5 h-3.5" />
                            <span>O‘ynash</span>
                          </Link>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 4: AI Repetitor Chat (AI) */}
              {activeTab === 'ai' && (
                <div className="pb-6">
                  <AiStudentTutorChat
                    studentName={student?.fullName}
                    topic={groupInfo?.course?.title || groupInfo?.name}
                  />
                </div>
              )}

              {/* Tab 5: Profil & Hamyon (Profile) */}
              {activeTab === 'profile' && (
                <ProfileTab
                  student={student}
                  attendances={attendances}
                  payments={payments}
                  certificates={certificates}
                  groupInfo={groupInfo}
                />
              )}
            </>
          )}
        </main>

        {/* Bottom Fixed Navigation Bar */}
        <MobileBottomNav
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          coins={student?.coins}
        />
      </div>
    </div>
  );
}

export default function MiniWebAppPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center text-xs">Yuklanmoqda...</div>}>
      <MiniWebAppContent />
    </Suspense>
  );
}
