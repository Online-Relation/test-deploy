// app/settings/points/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type XPLog = {
  id: number;
  change: number;
  reason: string;
  created_at: string;
};

export default function PointsPage() {
  const [xpLog, setXpLog] = useState<XPLog[]>([]);

  useEffect(() => {
  const fetchXpLog = async () => {
    const { data, error } = await supabase
      .from('xp_log')
      .select('id, change, description, created_at');

    if (!error && data) {
      setXpLog(
  data.map((entry) => ({
    ...entry,
    reason: entry.description,
  }))
);

    }
  };

  fetchXpLog();
}, []);


  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">XP Log</h1>
      <ul className="space-y-4">
        {xpLog.map((entry) => (
          <li key={entry.id} className="border p-4 rounded shadow">
            <div className="text-sm text-gray-600">{new Date(entry.created_at).toLocaleString()}</div>
            <div className="font-semibold">+{entry.change} XP</div>
            <div className="text-sm">{entry.reason}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
