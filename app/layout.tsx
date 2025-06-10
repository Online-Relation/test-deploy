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
        <meta name="description" content="Gamificeret dashboard for par" />
        {/* iPhone genvej-ikon */}
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        {/* Favicon til browsere */}
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        {/* Web manifest */}

      </head>
      <body className="flex bg-background text-foreground">
        <UserProvider>
          <XpProvider>
            <CategoryProvider>
              <ClientSidebarWrapper />
              <main className="flex-1 min-h-screen p-6 pt-14 md:pt-6 bg-surface shadow-inner">
                {children}
              </main>
            </CategoryProvider>
          </XpProvider>
        </UserProvider>
      </body>
    </html>
  );
}
