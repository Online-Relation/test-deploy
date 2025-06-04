// context/UserContext.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const UserContext = createContext<any>(null);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const authUser = session?.user;

      if (authUser) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (error) {
          console.error('Fejl ved hentning af profil:', error.message);
        } else {
          const { data: accessData, error: accessError } = await supabase
            .from('access_control')
            .select('menu_key, allowed')
            .eq('user_id', authUser.id);

          const accessMap: Record<string, boolean> = {};
          accessData?.forEach((row) => {
            accessMap[row.menu_key] = row.allowed;
          });

          setUser({
            id: authUser.id,
            email: authUser.email,
            role: profile.role,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            access: accessMap, // ← her er adgangen
          });
        }
      } else {
        setUser(null);
      }

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

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
