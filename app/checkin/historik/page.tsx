// app/checkin/historik/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function CheckinHistorikPage() {
  const [madsHistory, setMadsHistory] = useState<any[]>([]);
  const [stineHistory, setStineHistory] = useState<any[]>([]);

  // Faste UUIDs (brug samme som i CheckinPage)
  const userIdMads = '190a3151-97bc-43be-9daf-1f3b3062f97f';
  const userIdStine = '5687c342-1a13-441c-86ca-f7e87e1edbd5';

  useEffect(() => {
    const fetchHistory = async () => {
      // Hent alle checkins for Mads, hvor status ≠ 'pending'
      const { data: madsData } = await supabase
        .from('checkin')
        .select('*')
        .eq('user_id', userIdMads)
        .neq('status', 'pending')
        .order('updated_at', { ascending: false });

      // Hent alle checkins for Stine, hvor status ≠ 'pending'
      const { data: stineData } = await supabase
        .from('checkin')
        .select('*')
        .eq('user_id', userIdStine)
        .neq('status', 'pending')
        .order('updated_at', { ascending: false });

      setMadsHistory(madsData ?? []);
      setStineHistory(stineData ?? []);
    };

    fetchHistory();
  }, []);

  const getBgColor = (status: string) => {
    if (status === 'evaluate_fulfilled') return 'bg-green-100 border-green-400';
    if (status === 'evaluate_partial') return 'bg-yellow-100 border-yellow-400';
    if (status === 'evaluate_rejected') return 'bg-red-100 border-red-400';
    return 'bg-gray-100';
  };

  return (
    <div className="pt-8 pb-10 px-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Check-in Historik</h1>

      {/* Mads’ Historik */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-blue-700">Mads’ Historik</h2>
        {madsHistory.length > 0 ? (
          <div className="space-y-3">
            {madsHistory.map((item) => (
              <div
                key={item.id}
                className={`p-3 border rounded ${getBgColor(item.status)}`}
              >
                <div className="font-medium">{item.need_text}</div>
                <div className="text-sm mt-1">
                  {item.xp_awarded} point tildelt{' '}
                  <span className="ml-2 text-gray-500">
                    Uge {item.week_number}
                    {item.updated_at
                      ? ` – ${new Date(item.updated_at).toLocaleDateString('da-DK')}`
                      : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Ingen historiske behov for Mads.</p>
        )}
      </section>

      {/* Stine’s Historik */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-purple-700">Stine’s Historik</h2>
        {stineHistory.length > 0 ? (
          <div className="space-y-3">
            {stineHistory.map((item) => (
              <div
                key={item.id}
                className={`p-3 border rounded ${getBgColor(item.status)}`}
              >
                <div className="font-medium">{item.need_text}</div>
                <div className="text-sm mt-1">
                  {item.xp_awarded} point tildelt{' '}
                  <span className="ml-2 text-gray-500">
                    Uge {item.week_number}
                    {item.updated_at
                      ? ` – ${new Date(item.updated_at).toLocaleDateString('da-DK')}`
                      : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Ingen historiske behov for Stine.</p>
        )}
      </section>
    </div>
  );
}
