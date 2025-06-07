// app/checkin/evaluering/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function CheckinEvalueringPage() {
  const [pendingMads, setPendingMads] = useState<any[]>([]);
  const [pendingStine, setPendingStine] = useState<any[]>([]);

  // UUID’er for eksemplet
  const userIdMads = '190a3151-97bc-43be-9daf-1f3b3062f97f';
  const userIdStine = '5687c342-1a13-441c-86ca-f7e87e1edbd5';

  useEffect(() => {
    const fetchPending = async () => {
      const today = new Date();
      const week = getWeekNumber(today);
      const year = today.getFullYear();

      // Hent alle “pending” behov, som Mads skal evaluere (ejeren = Mads)
      const { data: madsData } = await supabase
        .from('checkin')
        .select('*')
        .eq('week_number', week)
        .eq('year', year)
        .eq('user_id', userIdMads)
        .eq('status', 'pending');

      // Hent alle “pending” behov, som Stine skal evaluere (ejeren = Stine)
      const { data: stineData } = await supabase
        .from('checkin')
        .select('*')
        .eq('week_number', week)
        .eq('year', year)
        .eq('user_id', userIdStine)
        .eq('status', 'pending');

      setPendingMads(madsData ?? []);
      setPendingStine(stineData ?? []);
    };

    fetchPending();
  }, []);

  // Hjælpefunktion til ugenummer (ISO-week)
  const getWeekNumber = (d: Date) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1) / 7);
  };

  return (
    <div className="pt-8 pb-10 px-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Check-in: Evaluering</h1>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-blue-700">Mads skal evaluere</h2>
        {pendingMads.length > 0 ? (
          <ul className="space-y-2">
            {pendingMads.map((item) => (
              <li key={item.id} className="p-3 border rounded bg-green-50 flex justify-between">
                <span>{item.need_text}</span>
                {/* Her kan du indsætte knapper eller komponent, der udfører valutering */}
                <div className="flex gap-2">
                  <button className="px-2 py-1 rounded bg-green-500 text-white">✅</button>
                  <button className="px-2 py-1 rounded bg-yellow-500 text-white">⚖️</button>
                  <button className="px-2 py-1 rounded bg-red-500 text-white">❌</button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">Ingen behov at evaluere for Mads</p>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-purple-700">Stine skal evaluere</h2>
        {pendingStine.length > 0 ? (
          <ul className="space-y-2">
            {pendingStine.map((item) => (
              <li key={item.id} className="p-3 border rounded bg-green-50 flex justify-between">
                <span>{item.need_text}</span>
                {/* Her kan du også lave knapper til Stine */}
                <div className="flex gap-2">
                  <button className="px-2 py-1 rounded bg-green-500 text-white">✅</button>
                  <button className="px-2 py-1 rounded bg-yellow-500 text-white">⚖️</button>
                  <button className="px-2 py-1 rounded bg-red-500 text-white">❌</button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">Ingen behov at evaluere for Stine</p>
        )}
      </section>
    </div>
  );
}
