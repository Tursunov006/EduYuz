import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import AppLayout from '@/components/AppLayout';

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
  icons: {
    icon: [
      { url: '/logo-icon.png' },
      { url: '/logo-icon-transparent.png', type: 'image/png' },
    ],
    shortcut: '/logo-icon.png',
    apple: '/logo-icon.png',
  },
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
      <head>
        {/* Tungi rejimni sahifa chizilishidan oldin qo'yish (miltillamasligi uchun) */}
        <script
          dangerouslySetInnerHTML={{
            __html: "try{if(localStorage.getItem('eduyuz_theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}",
          }}
        />
      </head>
      <body className="min-h-full bg-background text-slate-900 font-sans" suppressHydrationWarning>
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}
