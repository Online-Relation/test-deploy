'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@supabase/auth-helpers-react';

type Reward = {
  id: number;
  title: string;
  required_xp: number;
  redeemed: boolean;
};

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const user = useUser();

  useEffect(() => {
    if (!user) return;

    const fetchRewards = async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select('id, title, required_xp, redeemed')
        .eq('redeemed', false)
        .eq('user_id', user.id); // filtrér på den aktuelle bruger

      if (!error && data) {
        setRewards(data);
      } else {
        console.error('Error fetching rewards:', error);
      }
    };

    fetchRewards();
  }, [user]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Uindløste Rewards</h1>
      <ul className="space-y-4">
        {rewards.map((reward) => (
          <li key={reward.id} className="border p-4 rounded shadow">
            <div className="font-semibold">{reward.title}</div>
            <div className="text-sm text-gray-500">XP: {reward.required_xp}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
