// context/UserContext.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
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

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);

      // 1) Hent auth bruger direkte
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      if (error || !authUser) {
        console.error('❌ Fejl ved hentning af bruger:', error?.message);
        setUser(null);
        setLoading(false);
        return;
      }

      // 2) Hent profil‐data
      const profileResult = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, role, partner_id')
        .eq('id', authUser.id)
        .single();

      if (profileResult.error || !profileResult.data) {
        console.error('❌ Fejl ved hentning af profil:', profileResult.error?.message);
        setUser(null);
        setLoading(false);
        return;
      }

      const profileData = profileResult.data;

      // 3) Hent adgangskontrol‐data
      const accessResult = await supabase
        .from('access_control')
        .select('menu_key, allowed')
        .eq('user_id', authUser.id);

      if (accessResult.error) {
        console.error('❌ Fejl ved hentning af access_control:', accessResult.error.message);
      }

      const accessRows = accessResult.data || [];

      // 4) Byg accessMap
      const accessMap: AccessMap = {};
      accessRows.forEach((row) => {
        if (row.menu_key) {
          accessMap[row.menu_key] = row.allowed === true;
        }
      });

      // 5) Sæt user‐state
      setUser({
        id: authUser.id,
        email: authUser.email ?? null,
        role: profileData.role ?? null,
        display_name: profileData.display_name ?? null,
        avatar_url: profileData.avatar_url ?? null,
        access: accessMap,
        partner_id: profileData.partner_id ?? null,
      });

      setLoading(false);
    };

    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return <UserContext.Provider value={{ user, loading }}>{children}</UserContext.Provider>;
};

export const useUserContext = () => useContext(UserContext);
