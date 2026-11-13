'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import Script from 'next/script';
import Image from 'next/image';
import { 
  Sparkles, Search, ArrowRight, BookOpen, Loader2
} from 'lucide-react';
import Link from 'next/link';

import MobileBottomNav, { MobileTab } from '@/components/mobile/MobileBottomNav';
import HomeTab from '@/components/mobile/HomeTab';
import LessonsTab from '@/components/mobile/LessonsTab';
import ProfileTab from '@/components/mobile/ProfileTab';
import AiStudentTutorChat from '@/components/ai/AiStudentTutorChat';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from '@/lib/i18n/LanguageContext';

function MiniWebAppContent() {
  const { t } = useTranslation();
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
        // Ro'yxat faqat tizimga kirgan xodimga beriladi (ko'rib chiqish rejimi)
        if (!stId && localStorage.getItem('token')) {
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
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-600">
      {/* Telegram WebApp script */}
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />

      {/* Main Mobile Screen Wrapper (Phone viewport on desktop, full on mobile) */}
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col justify-between bg-slate-50 shadow-sm relative">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 px-4 py-3 bg-white backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md overflow-hidden bg-indigo-600">
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
              <div className="text-xs font-bold tracking-tight text-slate-900 flex items-center gap-1">
                <span>Edu<span className="text-blue-600">Yuz</span></span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-700 font-bold">App</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-none">{t('nav.portal', 'O‘quvchi portali')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tilni almashtirish */}
            <LanguageSwitcher compact />
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 p-4 pb-24 overflow-y-auto">
          {loading ? (
            <div className="py-36 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
              <p className="text-xs text-slate-500 font-semibold">Ilova yuklanmoqda...</p>
            </div>
          ) : !student ? (
            <div className="py-28 px-4 text-center space-y-3">
              <div className="text-3xl"></div>
              <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 leading-tight">Shaxsiy havola kerak</h1>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ilovani EduYuz Telegram botidagi «Mini Ilova» tugmasi yoki o‘quv markazingiz
                bergan shaxsiy havola orqali oching.
              </p>
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
        />
      </div>
    </div>
  );
}

export default function MiniWebAppPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center text-xs">Yuklanmoqda...</div>}>
      <MiniWebAppContent />
    </Suspense>
  );
}
