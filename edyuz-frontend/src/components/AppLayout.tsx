'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import axios from 'axios';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import SubscriptionModal from '@/components/SubscriptionModal';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import { ThemeProvider, useTheme } from '@/lib/theme/ThemeContext';
import { SidebarProvider } from '@/lib/context/SidebarContext';

// Global API router: Har qanday localhost:3000 so'rovlarini avtomatik jonli serverga yo'naltirish
const LIVE_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eduyuz.onrender.com/api/v1';

if (typeof window !== 'undefined') {
  axios.interceptors.request.use((config) => {
    if (config.url && config.url.includes('http://localhost:3000/api/v1')) {
      config.url = config.url.replace('http://localhost:3000/api/v1', LIVE_API_URL);
    }
    const token = localStorage.getItem('token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
}

function InnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isPricingOpen, setIsPricingOpen] = useState(false);

  // Standart CRM layout (sidebar va navbar) ko'rinmaydigan alohida sahifalar
  const isExcluded = 
    pathname === '/login' || 
    pathname === '/portal' || 
    pathname.startsWith('/insta') ||
    pathname.startsWith('/app') || 
    pathname.startsWith('/games/play') || 
    pathname.startsWith('/verify') ||
    pathname.startsWith('/superadmin');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (!isExcluded && !token) {
      // 1. Agar foydalanuvchi tizimga kirmagan bo'lsa -> Zudlik bilan /login sahifasiga yo'naltirish
      router.replace('/login');
    } else if (pathname === '/login' && token) {
      // 2. Agar foydalanuvchi allaqachon tizimga kirgan bo'lsa -> Boshqaruv Paneliga yo'naltirish
      router.replace('/');
    } else {
      setIsAuthChecking(false);
    }
  }, [pathname, isExcluded, router]);

  // Agar login tekshirilayotgan bo'lsa va login qilinmagan bo'lsa, xavfsiz yuklanish oynasi
  if (isAuthChecking && !isExcluded) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <div className="text-xs text-slate-400 font-medium tracking-wide">EduYuz tizimiga ulanmoqda...</div>
      </div>
    );
  }

  // 14 kunlik sinov muddati va obuna holatini hisoblash
  let subStatus = 'trial';
  let daysLeft = 14;
  let centerName = 'O‘quv Markazi';
  let centerId = '';
  let userPhone = '';

  try {
    const userRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userRaw) {
      const user = JSON.parse(userRaw);
      subStatus = user.subscriptionStatus || 'trial';
      centerName = user.centerName || user.fullName || 'O‘quv Markazi';
      centerId = user.centerId || '';
      userPhone = user.phone || '';

      if (user.trialEndsAt) {
        daysLeft = Math.ceil(
          (new Date(user.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 3600 * 24)
        );
      }
    }
  } catch (e) {}

  const isTrialExpired = subStatus === 'expired' || (subStatus === 'trial' && daysLeft <= 0);

  return (
    <>
      {!isExcluded ? (
        <div className={`min-h-screen flex w-full transition-colors duration-300 ${
          isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
        }`}>
          {/* Sidebar (Desktopda yon tomonda, Telefonda yopiq drawer bo'lib turadi) */}
          <Sidebar />

          <div className={`flex-1 flex flex-col min-h-screen min-w-0 w-full overflow-x-hidden relative ${
            isLight ? 'bg-slate-50' : 'bg-slate-950'
          }`}>
            <Navbar />
            
            {/* 14-kunlik Bepul Sinov (Trial) Banneri */}
            {subStatus === 'trial' && daysLeft > 0 && (
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-amber-500 text-white text-[11px] sm:text-xs font-bold py-2 px-4 flex flex-wrap items-center justify-center gap-2 shadow-sm z-30 relative">
                <span>
                  🎁 Siz <b>14-kunlik bepul sinov (Free Trial)</b> versiyasidan foydalanyapsiz. Tugashiga: <b>{daysLeft} kun</b> qoldi.
                </span>
                <button
                  type="button"
                  onClick={() => setIsPricingOpen(true)}
                  className="bg-white text-slate-950 hover:bg-amber-100 px-3 py-1 rounded-full text-[11px] font-extrabold transition shadow cursor-pointer"
                >
                  💎 Tariflar ro‘yxati va Faollashtirish
                </button>
              </div>
            )}

            {/* 14 kun tugaganda avtomatik chiqadigan (yoki tugma bosilganda ochiladigan) Tariflar Ro'yxati Modali */}
            <SubscriptionModal
              isOpen={isTrialExpired || isPricingOpen}
              isExpired={isTrialExpired}
              daysLeft={Math.max(daysLeft, 0)}
              centerName={centerName}
              centerId={centerId}
              userPhone={userPhone}
              onClose={() => setIsPricingOpen(false)}
            />

            <main className={`flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto transition-colors duration-300 w-full ${
              isLight ? 'bg-slate-100/80 text-slate-900' : 'bg-slate-950 text-slate-100'
            }`}>
              {children}
            </main>
          </div>
        </div>
      ) : (
        <div className={`min-h-screen w-full transition-colors duration-300 ${
          isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
        }`}>
          {children}
        </div>
      )}
    </>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <SidebarProvider>
          <InnerLayout>{children}</InnerLayout>
        </SidebarProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
