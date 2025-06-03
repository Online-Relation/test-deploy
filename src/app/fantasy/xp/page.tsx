// src/app/fantasy/xp/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface RewardLog {
  title: string;
  required_xp: number;
  timestamp: string;
}

export default function FantasyXpPage() {
  const [rewardLog, setRewardLog] = useState<RewardLog[]>([]);

  useEffect(() => {
    const fetchLog = async () => {
      const { data, error } = await supabase
        .from('reward_log')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Fejl ved hentning af reward-log:', error.message);
      } else {
        setRewardLog(data);
      }
    };

    fetchLog();
  }, []);

  const totalRewards = rewardLog.length;
  const totalXpSpent = rewardLog.reduce((acc, curr) => acc + curr.required_xp, 0);
  const averageXp = totalRewards > 0 ? Math.round(totalXpSpent / totalRewards) : 0;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">🎯 XP Belønningsoversigt</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">🔢 Indløste præmier</h2>
          <p className="text-3xl font-bold text-purple-600">{totalRewards}</p>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">💸 Samlet XP brugt</h2>
          <p className="text-3xl font-bold text-purple-600">{totalXpSpent}</p>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">📊 Gennemsnit pr. præmie</h2>
          <p className="text-3xl font-bold text-purple-600">{averageXp}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">📜 Seneste indløsninger</h2>
        <ul className="divide-y divide-gray-200">
          {rewardLog.map((entry, index) => (
            <li key={index} className="py-3">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium text-gray-800">{entry.title}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(entry.timestamp).toLocaleDateString('da-DK', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <p className="text-purple-700 font-semibold">-{entry.required_xp} XP</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}