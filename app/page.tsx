// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

export default function DashboardPage() {
  const [xpLog, setXpLog] = useState<{ change: number }[]>([]);
  const [rewards, setRewards] = useState<{
    id: string;
    required_xp: number;
    title: string;
    assigned_to: string;
    redeemed: boolean;
  }[]>([]);

  const [settings, setSettings] = useState({
    add_fantasy_xp: 0,
    complete_fantasy_xp_low: 0,
    complete_fantasy_xp_medium: 0,
    complete_fantasy_xp_high: 0,
  });
  const [fantasyCount, setFantasyCount] = useState<number>(0);
  const [potentialXp, setPotentialXp] = useState<number>(0);
  const [displayName, setDisplayName] = useState<string>('');
  const [role, setRole] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, role')
        .eq('id', user.id)
        .maybeSingle();

      setDisplayName(profile?.display_name || user.email || '');
      setRole(profile?.role || '');

      const { data: logData } = await supabase
        .from('xp_log')
        .select('change')
        .eq('user_id', user.id);

      const { data: rewardData } = await supabase
        .from('rewards')
        .select('*')
        .eq('redeemed', false)
        .eq('user_id', user.id);

      const { data: otherProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', profile?.role === 'mads' ? 'stine' : 'mads')
        .maybeSingle();

      const { data: fantasies } = await supabase
        .from('fantasies')
        .select('effort, status')
        .in('status', ['idea', 'planned'])
        .in('user_id', [user.id, otherProfile?.id]);

      const { data: xpSettings } = await supabase
        .from('xp_settings')
        .select('*')
        .eq('role', profile?.role)
        .in('action', ['plan_fantasy', 'complete_fantasy']);

      const xpMap: Record<string, number> = {};
      xpSettings?.forEach((s) => {
        if (s.action && s.effort) {
          const key = `${s.action}_${s.effort.toLowerCase()}`;
          xpMap[key] = s.xp;
        }
      });

      const total = fantasies?.reduce((sum, f) => {
        let xp = 0;
        const effort = f.effort?.toLowerCase();

        if (effort) {
          if (f.status === 'idea' || f.status === 'planned') {
            xp += xpMap[`plan_fantasy_${effort}`] || 0;
          }
          if (f.status === 'planned') {
            xp += xpMap[`complete_fantasy_${effort}`] || 0;
          }
        }

        return sum + xp;
      }, 0) || 0;

      setXpLog(logData || []);
      setRewards(rewardData || []);
      setFantasyCount(fantasies?.length || 0);
      setPotentialXp(total);
    };

    fetchData();
  }, []);

  const totalXp = xpLog.reduce((sum, e) => sum + e.change, 0);

  const nextReward = rewards
    .filter((r) => r.assigned_to === role && !r.redeemed)
    .sort((a, b) => a.required_xp - b.required_xp)[0];

  const canRedeem = nextReward && totalXp >= nextReward.required_xp;

  const handleRedeem = async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user || !nextReward) return;

    const { error: xpError } = await supabase.from('xp_log').insert({
      user_id: user.id,
      change: -nextReward.required_xp,
      description: `Indløst: ${nextReward.title}`,
      role,
    });

    const { error: redeemError } = await supabase
      .from('rewards')
      .update({ redeemed: true, redeemed_at: new Date().toISOString() })
      .eq('id', nextReward.id)
      .eq('user_id', user.id);

    if (!xpError && !redeemError) {
      window.location.reload();
    } else {
      console.error('Fejl ved indløsning:', xpError || redeemError);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {!displayName ? (
        <div className="text-center mt-20 text-gray-500">
          <p className="text-xl font-semibold">Velkommen til dashboardet</p>
          <p className="mt-2 mb-6">Log ind for at se dit indhold og følge din udvikling.</p>
          <a
            href="/login"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Log ind
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
          <Card className="text-center shadow border border-gray-200">
            <CardContent className="p-8 flex flex-col items-center justify-center space-y-4 h-full">
              <h2 className="text-2xl font-bold">{displayName}</h2>
              <div className="w-48 h-48">
                <CircularProgressbar
                  value={totalXp % 100}
                  maxValue={100}
                  text={`${totalXp} XP`}
                  styles={buildStyles({
                    textSize: '16px',
                    pathColor: '#10B981',
                    textColor: '#374151',
                    trailColor: '#D1D5DB',
                  })}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6 h-full">
            <Card className="shadow border border-gray-200 flex-1">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-xl font-bold">🎁 Næste gave</h2>
                {nextReward ? (
                  <>
                    <p className="text-lg font-semibold">{nextReward.title}</p>
                    <p className="text-sm text-gray-500">
                      Kræver: <strong>{nextReward.required_xp} XP</strong>
                    </p>
                    {!canRedeem && (
                      <p className="text-sm text-gray-500 italic">
                        Du mangler {nextReward.required_xp - totalXp} XP
                      </p>
                    )}
                    <button
                      onClick={handleRedeem}
                      disabled={!canRedeem}
                      className={`px-4 py-2 rounded text-white transition ${
                        canRedeem
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-gray-400 cursor-not-allowed'
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

            <Card className="shadow border border-gray-200 flex-1">
              <CardContent className="p-6 space-y-2 text-center">
                <h2 className="text-xl font-bold">💡 Opgaver klar</h2>
                <p className="text-sm text-gray-600">
                  {fantasyCount} opgave{fantasyCount !== 1 && 'r'} klar til opfyldelse
                </p>
                <p className="text-sm text-gray-800 font-semibold">
                  🎯 Potentielle point: {potentialXp} XP
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
