// components/ClientSidebarWrapper.tsx
'use client';

import { useUserContext } from '@/context/UserContext';
import Sidebar from './Sidebar';

export default function ClientSidebarWrapper() {
  const { user, loading } = useUserContext();

  if (loading) return null;  // Auth loader stadig
  if (!user) return null;    // Ikke logget ind

  return <Sidebar />;
}
