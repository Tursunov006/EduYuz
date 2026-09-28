'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import { ThemeProvider, useTheme } from '@/lib/theme/ThemeContext';
import { SidebarProvider } from '@/lib/context/SidebarContext';

function InnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const isExcluded = 
    pathname === '/login' || 
    pathname === '/portal' || 
    pathname.startsWith('/app') || 
    pathname.startsWith('/games/play') || 
    pathname.startsWith('/verify');

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
