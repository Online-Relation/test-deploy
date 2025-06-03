// src/context/XpContext.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface XpContextType {
  xp: number;
  setXp: (value: number) => void;
  addXp: (value: number) => void;
}

const XpContext = createContext<XpContextType>({
  xp: 0,
  setXp: () => {},
  addXp: () => {},
});

export const XpProvider = ({ children }: { children: React.ReactNode }) => {
  const [xp, setXpState] = useState<number>(0);

  useEffect(() => {
    const loadXp = async () => {
      const { data, error } = await supabase.from('xp').select('*').limit(1).maybeSingle();
      if (error) {
        console.error('Fejl ved hentning af XP:', error.message);
      } else if (data) {
        setXpState(data.value);
      } else {
        const { error: insertError } = await supabase.from('xp').insert([{ value: 0 }]);
        if (insertError) console.error('Fejl ved oprettelse af XP-række:', insertError.message);
      }
    };
    loadXp();
  }, []);

  const setXp = async (value: number) => {
    const { error } = await supabase.from('xp').update({ value }).neq('value', value);
    if (error) {
      console.error('Fejl ved opdatering af XP:', error.message);
    } else {
      setXpState(value);
    }
  };

  const addXp = async (value: number) => {
    const newXp = xp + value;
    const { error } = await supabase.from('xp').update({ value: newXp }).neq('value', newXp);
    if (error) {
      console.error('Fejl ved tilføjelse af XP:', error.message);
    } else {
      setXpState(newXp);
    }
  };

  return (
    <XpContext.Provider value={{ xp, setXp, addXp }}>
      {children}
    </XpContext.Provider>
  );
};

export const useXp = () => useContext(XpContext);