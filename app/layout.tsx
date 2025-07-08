// app/layout.tsx
'use client';

import './globals.css';
import { useEffect } from 'react';
import { Poppins } from 'next/font/google';
import { UserProvider } from '@/context/UserContext';
import { XpProvider } from '@/context/XpContext';
import { CategoryProvider } from '@/context/CategoryContext';
import ClientSidebarWrapper from '@/components/ClientSidebarWrapper';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log('Client layout loaded');
  }, []);

  return (
    <html lang="da" className={poppins.className} suppressHydrationWarning>
      <head>
        <title>Mit Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Gamificeret dashboard for par" />
        {/* iPhone genvej-ikon */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        {/* Favicons */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        {/* Manifest og theme color */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        {/* iPhone web app meta */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Mit Dashboard" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="flex bg-gray-50 text-foreground min-h-screen">
        <UserProvider>
          <XpProvider>
            <CategoryProvider>
              <ClientSidebarWrapper />
              <main
                className="flex-1 min-h-screen bg-surface shadow-inner"
                style={{ marginTop: 'calc(env(safe-area-inset-top) + 3rem)' }} // 3rem for menuhøjde ca.
              >
                <div className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
                  {children}
                </div>
              </main>
            </CategoryProvider>
          </XpProvider>
        </UserProvider>
      </body>
    </html>
  );
}
