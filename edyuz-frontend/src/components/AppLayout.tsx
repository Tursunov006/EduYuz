'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import axios from 'axios';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import HelpWidget from '@/components/HelpWidget';
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

  // Standart CRM layout (sidebar va navbar) ko'rinmaydigan alohida sahifalar
  const isExcluded = 
    pathname === '/login' || 
    pathname === '/portal' || 
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

  return (
    <>
      {!isExcluded ? (
        <div className={`min-h-screen flex w-full transition-colors duration-300 ${
          isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-slate-100'
        }`}>
          {/* Sidebar (Desktopda yon tomonda, Telefonda yopiq drawer bo'lib turadi) */}
          <Sidebar />

          {/* Asosiy kontent maydoni: Telefonda 100% to'liq kenglikni egallaydi */}
          <div className="flex-1 flex flex-col min-h-screen min-w-0 w-full overflow-x-hidden">
            <Navbar />
            <main className={`flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto transition-colors duration-300 w-full ${
              isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
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
      <HelpWidget />
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
