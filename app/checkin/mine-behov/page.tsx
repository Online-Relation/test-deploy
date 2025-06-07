// app/checkin/mine-behov/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function MineBehovPage() {
  const [madsNeeds, setMadsNeeds] = useState(['', '', '']);
  const [stineNeeds, setStineNeeds] = useState(['', '', '']);
  const [currentUserRole, setCurrentUserRole] = useState<'mads' | 'stine' | null>(null);

  // Faste UUID’er for Mads og Stine:
  const userIdMads = '190a3151-97bc-43be-9daf-1f3b3062f97f';
  const userIdStine = '5687c342-1a13-441c-86ca-f7e87e1edbd5';

  // Hent session for at sætte currentUserRole
  useEffect(() => {
    const getSessionUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const id = session?.user.id ?? null;
      if (id === userIdMads) setCurrentUserRole('mads');
      else if (id === userIdStine) setCurrentUserRole('stine');
    };
    getSessionUser();
  }, []);

  // Funktion til at gemme behov i databasen
  const handleSubmit = async (who: 'mads' | 'stine') => {
    const needs = who === 'mads' ? madsNeeds : stineNeeds;
    const ownerId = who === 'mads' ? userIdMads : userIdStine;

    const today = new Date();
    const weekNumber = getWeekNumber(today);
    const year = today.getFullYear();

    const insertPromises = needs
      .filter((need) => need.trim() !== '')
      .map((need) =>
        supabase.from('checkin').insert({
          user_id: ownerId,
          need_text: need,
          week_number: weekNumber,
          year,
          status: 'pending',
          evaluator_id: ownerId, // ejeren evaluerer senere
        })
      );

    if (insertPromises.length > 0) {
      await Promise.all(insertPromises);
      if (who === 'mads') setMadsNeeds(['', '', '']);
      else setStineNeeds(['', '', '']);
      // Vi kan eventuelt vise en notifikation eller blot lade brugeren navigere tilbage
    }
  };

  // ISO-week helper
  const getWeekNumber = (d: Date) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1) / 7);
  };

  return (
    <div className="pt-8 pb-10 px-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Mine behov</h1>

      {/* Mads’ formular */}
      {currentUserRole === 'mads' && (
        <div className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-blue-700">Mads</h2>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Mine behov</h3>
            {madsNeeds.map((need, idx) => (
              <input
                key={idx}
                type="text"
                value={need}
                onChange={(e) => {
                  const arr = [...madsNeeds];
                  arr[idx] = e.target.value;
                  setMadsNeeds(arr);
                }}
                placeholder={`Behov ${idx + 1}`}
                className="w-full p-2 border rounded"
              />
            ))}
            <button
              onClick={() => handleSubmit('mads')}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Gem behov
            </button>
          </div>
        </div>
      )}

      {/* Stine’s formular */}
      {currentUserRole === 'stine' && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-purple-700">Stine</h2>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Mine behov</h3>
            {stineNeeds.map((need, idx) => (
              <input
                key={idx}
                type="text"
                value={need}
                onChange={(e) => {
                  const arr = [...stineNeeds];
                  arr[idx] = e.target.value;
                  setStineNeeds(arr);
                }}
                placeholder={`Behov ${idx + 1}`}
                className="w-full p-2 border rounded"
              />
            ))}
            <button
              onClick={() => handleSubmit('stine')}
              className="mt-2 px-4 py-2 bg-purple-600 text-white rounded"
            >
              Gem behov
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
