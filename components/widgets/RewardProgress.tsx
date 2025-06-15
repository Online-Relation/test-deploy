// /components/widgets/RewardProgress.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';

export default function RewardProgress({
  height,
  layout,
}: {
  height: string;
  layout: string;
}) {
  const [reward, setReward] = useState<any>(null);
  const [xp, setXp] = useState(0);
  const [role, setRole] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (!profile) return;
      setRole(profile.role);

      const { data: rewards } = await supabase
        .from('rewards')
        .select('*')
        .eq('user_id', user.id)
        .eq('redeemed', false);

      const { data: xpLog } = await supabase
        .from('xp_log')
        .select('change')
        .eq('user_id', user.id);

      const total = xpLog?.reduce((sum, e) => sum + e.change, 0) || 0;
      setXp(total);

      const next = rewards
        ?.filter((r) => r.assigned_to === profile.role)
        .sort((a, b) => a.required_xp - b.required_xp)[0];

      setReward(next);
    };
    fetchData();
  }, []);

  const canRedeem = reward && xp >= reward.required_xp;

  const handleRedeem = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !reward) return;

    await supabase.from('xp_log').insert({
      user_id: user.id,
      change: -reward.required_xp,
      description: `Indløst: ${reward.title}`,
      role,
    });

    await supabase
      .from('rewards')
      .update({ redeemed: true, redeemed_at: new Date().toISOString() })
      .eq('id', reward.id)
      .eq('user_id', user.id);

    window.location.reload();
  };

  const heightClass = {
    auto: 'h-auto',
    medium: 'min-h-[250px]',
    large: 'min-h-[400px]',
  }[height] || 'h-auto';

  const textSizeClass = {
    small: 'text-base',
    medium: 'text-lg',
    large: 'text-xl',
  }[layout] || 'text-base';

  const spacingClass = {
    small: 'space-y-2',
    medium: 'space-y-4',
    large: 'space-y-6',
  }[layout] || 'space-y-2';

  return (
    <Card className={`shadow ${heightClass} flex flex-col justify-center`}>
      <CardContent className={`p-6 text-center ${spacingClass}`}>
        <h2 className={`font-bold ${textSizeClass}`}>🎁 Næste gave</h2>
        {reward ? (
          <>
            <p className="text-base font-semibold">{reward.title}</p>
            <p className="text-sm text-gray-500">Kræver: {reward.required_xp} XP</p>
            {!canRedeem && (
              <p className="text-sm text-gray-500 italic">
                Mangler {reward.required_xp - xp} XP
              </p>
            )}
            <button
              onClick={handleRedeem}
              disabled={!canRedeem}
              className={`px-4 py-2 rounded text-white transition ${canRedeem ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
            >
              Indløs gave
            </button>
          </>
        ) : (
          <p className="text-sm text-gray-600 italic">Ingen uindløste gaver</p>
        )}
      </CardContent>
    </Card>
  );
}
