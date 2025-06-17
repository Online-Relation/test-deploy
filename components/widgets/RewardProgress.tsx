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
  const progressPercent = reward ? Math.min((xp / reward.required_xp) * 100, 100) : 0;

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

  return (
    <Card className={`shadow ${heightClass} flex flex-col justify-center`}>
      <CardContent className="p-6 flex flex-col items-center space-y-4 text-center">
        <h2 className="text-xl font-extrabold text-purple-600 flex items-center gap-2">
          🎁 Næste gave
        </h2>

        {reward ? (
          <>
            <p className="text-2xl font-semibold text-gray-800">{reward.title}</p>
            <p className="text-sm text-gray-500">Kræver: {reward.required_xp} XP</p>

            <div className="w-full bg-gray-200 rounded-full h-4 mt-2 overflow-hidden">
              <div
                className="bg-green-500 h-4 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-sm italic text-gray-500">
              {canRedeem ? 'Klar til indløsning!' : `Mangler ${reward.required_xp - xp} XP`}
            </p>

            <button
              onClick={handleRedeem}
              disabled={!canRedeem}
              className={`px-5 py-2 rounded-full font-semibold transition shadow ${
                canRedeem
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-300 text-gray-600 cursor-not-allowed'
              }`}
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
