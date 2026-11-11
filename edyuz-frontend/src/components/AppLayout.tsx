'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import '@/lib/api';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import SubscriptionModal from '@/components/SubscriptionModal';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { SidebarProvider } from '@/lib/context/SidebarContext';

// Axios sozlamalari (token, 401 holati, xato matnlari) bitta joyda: '@/lib/api'

function InnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

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
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-900 gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
        <div className="text-xs text-slate-500 font-medium tracking-wide">EduYuz tizimiga ulanmoqda...</div>
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
        <div className="min-h-screen flex w-full bg-[#F5F7FB] text-slate-900">
          {/* Sidebar (Desktopda yon tomonda, Telefonda yopiq drawer bo'lib turadi) */}
          <Sidebar />

          <div className="flex-1 flex flex-col min-h-screen min-w-0 w-full overflow-x-hidden relative">
            <Navbar />
            
            {/* 14-kunlik Bepul Sinov (Trial) Banneri */}
            {subStatus === 'trial' && daysLeft > 0 && (
              <div className="mx-4 sm:mx-6 md:mx-8 mt-4 md:mt-6 px-4 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs sm:text-sm flex flex-wrap items-center justify-between gap-2">
                <span>
                  Bepul sinov muddati: <b>{daysLeft} kun</b> qoldi
                </span>
                <button
                  type="button"
                  onClick={() => setIsPricingOpen(true)}
                  className="font-semibold text-indigo-600 hover:underline"
                >
                  Tariflarni ko‘rish
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

            <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto w-full">
              {children}
            </main>
          </div>
        </div>
      ) : (
        <div className="min-h-screen w-full bg-[#F5F7FB] text-slate-900">
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
