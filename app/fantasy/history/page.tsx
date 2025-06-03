// src/app/fantasy/history/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface RewardLog {
  id: string;
  title: string;
  required_xp: number;
  timestamp: string;
}

export default function FantasyRewardHistoryPage() {
  const [log, setLog] = useState<RewardLog[]>([]);

  useEffect(() => {
    const fetchLog = async () => {
      const { data, error } = await supabase
        .from('reward_log')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Fejl ved hentning af reward-log:', error.message);
      } else {
        setLog(data || []);
      }
    };

    fetchLog();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">🎁 Indløste præmier</h1>
      {log.length === 0 ? (
        <p className="text-gray-500">Ingen præmier er indløst endnu.</p>
      ) : (
        <ul className="space-y-4">
          {log.map((entry) => (
            <li
              key={entry.id}
              className="bg-white rounded shadow p-4 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{entry.title}</p>
                <p className="text-sm text-gray-500">XP: {entry.required_xp}</p>
              </div>
              <div className="text-sm text-gray-400">
                {new Date(entry.timestamp).toLocaleDateString('da-DK', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
