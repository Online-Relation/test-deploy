// components/AppShell.tsx
'use client';

import Sidebar from '@/components/Sidebar';
import { XpProvider } from '@/context/XpContext';
import { CategoryProvider } from '@/context/CategoryContext';
import { useUser } from '@/context/UserContext';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();

  if (loading) return null;

  const isLoggedIn = !!user;

  return isLoggedIn ? (
    <XpProvider>
      <CategoryProvider>
        <Sidebar />
        <div className="flex-1 min-h-screen p-6 bg-white shadow-inner">{children}</div>
      </CategoryProvider>
    </XpProvider>
  ) : (
    <div className="flex-1 min-h-screen bg-white">{children}</div>
  );
}
