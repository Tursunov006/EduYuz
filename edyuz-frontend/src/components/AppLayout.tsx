'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Navbar from '@/components/Navbar';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isExcluded = 
    pathname === '/login' || 
    pathname === '/portal' || 
    pathname.startsWith('/app') || 
    pathname.startsWith('/games/play') || 
    pathname.startsWith('/verify');

  return (
    <LanguageProvider>
      {!isExcluded ? (
        <div className="min-h-screen flex w-full bg-slate-950 text-slate-100">
          <Sidebar />
          <div className="flex-1 flex flex-col min-h-screen min-w-0">
            <Navbar />
            <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-950">
              {children}
            </main>
          </div>
        </div>
      ) : (
        <div className="min-h-screen w-full bg-slate-950 text-slate-100">
          {children}
        </div>
      )}
    </LanguageProvider>
  );
}
