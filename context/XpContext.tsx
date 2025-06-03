// src/context/XpContext.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUserContext } from './UserContext';

interface XpContextType {
  xp: number;
  addXp: (amount: number) => void;
  fetchXp: () => void;
}

const XpContext = createContext<XpContextType>({
  xp: 0,
  addXp: () => {},
  fetchXp: () => {},
});

export const useXp = () => useContext(XpContext);

export const XpProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useUserContext();
  const [xp, setXp] = useState(0);

  const fetchXp = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('xp_log')
      .select('change')
      .eq('user_id', user.id);

    if (error) {
      console.error('Fejl ved hentning af XP-log:', error.message);
      return;
    }

    const total = data?.reduce((sum, entry) => sum + entry.change, 0) || 0;
    setXp(total);
  };

  const addXp = (amount: number) => {
    setXp((prev) => prev + amount);
  };

  useEffect(() => {
    fetchXp();
  }, [user?.id]);

  return (
    <XpContext.Provider value={{ xp, addXp, fetchXp }}>
      {children}
    </XpContext.Provider>
  );
};
