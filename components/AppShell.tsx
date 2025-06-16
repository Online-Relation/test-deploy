// components/AppShell.tsx

'use client';

import Sidebar from '@/components/Sidebar';
import { XpProvider } from '@/context/XpContext';
import { CategoryProvider } from '@/context/CategoryContext';
import { useUserContext } from '@/context/UserContext';
import GptStatus from '@/components/GptStatus';
import { usePathname } from 'next/navigation';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUserContext();
  const pathname = usePathname();

  if (loading) return null;

  const isLoggedIn = !!user;

  const gptRelevantPaths = [
    '/settings/tables',
    '/fantasy/anbefalinger',
    '/quiz',
    '/parforhold/anbefalinger',
    '/settings/game',
  ];

  const shouldShowGptStatus =
    user?.role === 'mads' &&
    gptRelevantPaths.some((path) => pathname.startsWith(path));

  return isLoggedIn ? (
    <XpProvider>
      <CategoryProvider>
        <Sidebar />
        <div className="flex-1 min-h-screen p-6 bg-white shadow-inner relative">
          {children}
          {shouldShowGptStatus && (
            <div className="absolute bottom-4 right-4 z-50">
              <GptStatus />
            </div>
          )}
        </div>
      </CategoryProvider>
    </XpProvider>
  ) : (
    <div className="flex-1 min-h-screen bg-white">{children}</div>
  );
}
