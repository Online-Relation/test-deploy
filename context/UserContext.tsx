// context/UserContext.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type AccessMap = Record<string, boolean>;

interface UserProfile {
  id: string;
  email: string | null;
  role: string | null;
  display_name: string | null;
  avatar_url: string | null;
  access: AccessMap;
  partner_id: string | null;
}

interface UserContextValue {
  user: UserProfile | null;
  loading: boolean;
}

const UserContext = createContext<UserContextValue>({ user: null, loading: true });

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  useEffect(() => {
    if (isAuthPage) return;

    const fetchUser = async () => {
      setLoading(true);

      const { data: { user: authUser }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('❌ Fejl ved hentning af bruger fra Supabase:', error.message);
      }

      if (!authUser) {
        console.warn('⚠️ Ingen authUser fundet – bruger er ikke logget ind');
        setUser(null);
        setLoading(false);
        return;
      }

      const userId = authUser.id;

      const profileResult = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, role, partner_id')
        .eq('id', userId)
        .single();

      if (profileResult.error || !profileResult.data) {
        console.error('❌ Fejl ved hentning af profil:', profileResult.error?.message);
        setUser(null);
        setLoading(false);
        return;
      }

      const profileData = profileResult.data;

      const accessResult = await supabase
        .from('access_control')
        .select('menu_key, allowed')
        .eq('user_id', userId);

      if (accessResult.error) {
        console.error('❌ Fejl ved hentning af access_control:', accessResult.error.message);
      }

      const accessRows = accessResult.data || [];
      const accessMap: AccessMap = {};
      accessRows.forEach((row) => {
        if (row.menu_key) {
          accessMap[row.menu_key] = row.allowed === true;
        }
      });

      setUser({
        id: userId,
        email: authUser.email ?? null,
        role: profileData.role ?? null,
        display_name: profileData.display_name ?? null,
        avatar_url: profileData.avatar_url ?? null,
        access: accessMap,
        partner_id: profileData.partner_id ?? null,
      });

      setLoading(false);
    };

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [isAuthPage]);

  return <UserContext.Provider value={{ user, loading }}>{children}</UserContext.Provider>;
};

export const useUserContext = () => useContext(UserContext);
