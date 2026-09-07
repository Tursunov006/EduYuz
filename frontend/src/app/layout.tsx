import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: "EduYuz - O'quv markazlari boshqaruvi",
  description: "Ta'lim CRM va ERP platformasi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="uz"
      translate="no"
      className={`${geistSans.variable} ${geistMono.variable} notranslate h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex bg-slate-950 text-slate-100 font-sans" suppressHydrationWarning>
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto bg-slate-950 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
