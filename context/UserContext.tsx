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
    if (isAuthPage) {
      // Hvis vi er på login/signup skal vi ikke have bruger data
      setUser(null);
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const fetchUser = async () => {
      setLoading(true);

      // Hent auth bruger fra Supabase
      const authRes = await supabase.auth.getUser();

      if (authRes.error) {
        // Log kun fejl der ikke er "Auth session missing"
        if (authRes.error.message !== "Auth session missing!") {
          console.error('❌ Fejl ved hentning af bruger fra Supabase:', authRes.error.message);
        }
        setUser(null);
        setLoading(false);
        return;
      }

      const authUser = authRes.data?.user;
      if (!authUser) {
        // Ikke logget ind
        setUser(null);
        setLoading(false);
        return;
      }

      const userId = authUser.id;

      // Hent profil-data
      const profileResult = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, role, partner_id')
        .eq('id', userId)
        .maybeSingle();

      if (profileResult.error || !profileResult.data) {
        console.error('❌ Fejl ved hentning af profil:', profileResult.error?.message);
        setUser(null);
        setLoading(false);
        return;
      }

      const profileData = profileResult.data;

      // Hent adgangsrettigheder, hvis nødvendigt
      let accessMap: AccessMap = {};
      try {
        const accessResult = await supabase
          .from('access_control')
          .select('menu_key, allowed')
          .eq('user_id', userId);

        if (accessResult.error) {
          console.error('❌ Fejl ved hentning af access_control:', accessResult.error.message);
        } else if (Array.isArray(accessResult.data)) {
          accessResult.data.forEach((row) => {
            if (row.menu_key) accessMap[row.menu_key] = !!row.allowed;
          });
        }
      } catch (err) {
        console.error('❌ Fejl i access-control fetch:', err);
      }

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

    fetchUser();

    // Lyt til auth state changes og opdater bruger
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });
    unsubscribe = () => listener?.subscription?.unsubscribe();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthPage]);

  return <UserContext.Provider value={{ user, loading }}>{children}</UserContext.Provider>;
};

export const useUserContext = () => useContext(UserContext);
