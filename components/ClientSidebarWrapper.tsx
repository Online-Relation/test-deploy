// components/ClientSidebarWrapper.tsx
'use client';

import { useUserContext } from '@/context/UserContext';
import Sidebar from './Sidebar';
import { useHasMounted } from '@/hooks/useHasMounted';


export default function ClientSidebarWrapper() {
  const hasMounted = useHasMounted();
  const { user, loading } = useUserContext();

  if (!hasMounted) return null; // Forhindrer SSR-hydration-fejl
  if (loading) return null;
  if (!user) return null;

  return <Sidebar />;
}
