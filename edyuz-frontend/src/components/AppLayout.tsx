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
    pathname.startsWith('/verify') ||
    pathname.startsWith('/anketa') ||
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

  // Obuna holati: bepul sinov muddati yo'q. Markaz faqat superadmin uni qo'lda "expired" qilsa bloklanadi.
  let subStatus = 'active';
  let centerName = 'O‘quv Markazi';
  let centerId = '';
  let userPhone = '';

  try {
    const userRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (userRaw) {
      const user = JSON.parse(userRaw);
      subStatus = user.subscriptionStatus || 'active';
      centerName = user.centerName || user.fullName || 'O‘quv Markazi';
      centerId = user.centerId || '';
      userPhone = user.phone || '';
    }
  } catch (e) {}

  const isBlocked = subStatus === 'expired';

  return (
    <>
      {!isExcluded ? (
        <div className="min-h-screen flex w-full bg-background text-slate-900">
          {/* Sidebar (Desktopda yon tomonda, Telefonda yopiq drawer bo'lib turadi) */}
          <Sidebar />

          <div className="flex-1 flex flex-col min-h-screen min-w-0 w-full overflow-x-hidden relative">
            <Navbar />
            
            {/* Tariflar oynasi: tugma bosilganda yoki obuna to'xtatilgan (expired) bo'lsa ochiladi */}
            <SubscriptionModal
              isOpen={isBlocked || isPricingOpen}
              isExpired={isBlocked}
              daysLeft={0}
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
        <div className="min-h-screen w-full bg-background text-slate-900">
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
