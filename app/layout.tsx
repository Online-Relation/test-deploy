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
      <body className="flex bg-gray-100">
        <UserProvider>
          <XpProvider>
            <CategoryProvider>
              <ClientSidebarWrapper />
              <main className="flex-1 min-h-screen p-6 bg-white shadow-inner">
                {children}
              </main>
            </CategoryProvider>
          </XpProvider>
        </UserProvider>
      </body>
    </html>
  );
}
