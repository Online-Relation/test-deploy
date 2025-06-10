'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function KomplimentPage() {
  const [compliments, setCompliments] = useState<string[]>([]);
  const [current, setCurrent] = useState<string>('');

  // 1) Hent fra Supabase
  useEffect(() => {
    async function loadCompliments() {
      const { data, error } = await supabase
        .from('compliments')
        .select('text');
      if (error) console.error(error);
      else setCompliments(data.map((r) => r.text));
    }
    loadCompliments();
  }, []);

  // 2) Samme logik som før: én om dagen, ingen gentagelser (gemt i localStorage)
  useEffect(() => {
    if (compliments.length === 0) return;

    const today = new Date().toISOString().split('T')[0];
    const storedDate = localStorage.getItem('complimentDate');
    const storedIndex = Number(localStorage.getItem('complimentIndex'));

    if (storedDate === today && !isNaN(storedIndex) && compliments[storedIndex]) {
      setCurrent(compliments[storedIndex]);
      return;
    }

    const used: number[] = JSON.parse(localStorage.getItem('usedCompliments') || '[]');
    let available = compliments.map((_, i) => i).filter((i) => !used.includes(i));
    if (available.length === 0) {
      localStorage.removeItem('usedCompliments');
      available = compliments.map((_, i) => i);
    }

    const choice = available[Math.floor(Math.random() * available.length)];
    const newUsed = [...used, choice];
    localStorage.setItem('usedCompliments', JSON.stringify(newUsed));
    localStorage.setItem('complimentDate', today);
    localStorage.setItem('complimentIndex', String(choice));

    setCurrent(compliments[choice]);
  }, [compliments]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Kompliment</h1>
      {current ? (
        <blockquote className="mt-4 italic text-lg">“{current}”</blockquote>
      ) : (
        <p className="mt-4">Henter kompliment…</p>
      )}
    </div>
  );
}
