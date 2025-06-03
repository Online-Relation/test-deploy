// app/fantasy/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@supabase/auth-helpers-react';

type Fantasy = {
  id: number;
  title: string;
  status: string;
  effort: number;
};

export default function FantasyPage() {
  const user = useUser();
  const [fantasies, setFantasies] = useState<Fantasy[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchFantasies = async () => {
      const { data, error } = await supabase
        .from('fantasies')
        .select('id, title, status, effort') // inkluderer title + id
        .in('status', ['idea', 'planned'])
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching fantasies:', error);
      } else {
        setFantasies(data as Fantasy[]);
      }
    };

    fetchFantasies();
  }, [user]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Fantasier</h1>
      <ul className="space-y-4">
        {fantasies.map((fantasy) => (
          <li key={fantasy.id} className="border p-4 rounded shadow">
            <div className="font-semibold">{fantasy.title}</div>
            <div className="text-sm text-gray-500">Status: {fantasy.status}</div>
            <div className="text-sm text-gray-500">Effort: {fantasy.effort}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
