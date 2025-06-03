// app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import UserStatus from '@/components/UserStatus';

export default function DashboardPage() {
  const [xpLog, setXpLog] = useState<{ change: number }[]>([]);
  const [rewards, setRewards] = useState<{ required_xp: number; title: string }[]>([]);
  const [settings, setSettings] = useState({
    add_fantasy_xp: 0,
    complete_fantasy_xp_low: 0,
    complete_fantasy_xp_medium: 0,
    complete_fantasy_xp_high: 0,
  });
  const [fantasyCount, setFantasyCount] = useState<number>(0);
  const [potentialXp, setPotentialXp] = useState<number>(0);
  const [displayName, setDisplayName] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .maybeSingle();

      setDisplayName(profile?.display_name || user.email || '');

      const { data: logData } = await supabase
        .from('xp_log')
        .select('change')
        .eq('user_id', user.id);

      const { data: rewardData } = await supabase
        .from('rewards')
        .select('required_xp, title')
        .eq('redeemed', false)
        .eq('user_id', user.id);

      const { data: settingsData } = await supabase
        .from('xp_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      const { data: fantasies } = await supabase
        .from('fantasies')
        .select('effort, status')
        .in('status', ['idea', 'planned'])
        .eq('user_id', user.id);

      setXpLog(logData || []);
      setRewards(rewardData || []);
      if (settingsData) setSettings(settingsData);

      const count = fantasies?.length || 0;
      setFantasyCount(count);

      const total = fantasies?.reduce((sum, f) => {
        switch (f.effort) {
          case 'Low':
            return sum + settingsData.complete_fantasy_xp_low;
          case 'Medium':
            return sum + settingsData.complete_fantasy_xp_medium;
          case 'High':
            return sum + settingsData.complete_fantasy_xp_high;
          default:
            return sum;
        }
      }, 0) || 0;

      setPotentialXp(total);
    };

    fetchData();
  }, []);

  const totalXp = xpLog.reduce((sum, e) => sum + e.change, 0);

  const nextReward = rewards
    .sort((a, b) => a.required_xp - b.required_xp)
    .find((r) => r.required_xp > totalXp);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <UserStatus />

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="text-center shadow border border-gray-200">
            <CardContent className="p-8 flex flex-col items-center justify-center space-y-4">
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

              {nextReward ? (
                <>
                  <p className="text-sm text-gray-500">
                    Næste præmie: <strong>{nextReward.title}</strong> ({nextReward.required_xp} XP)
                  </p>
                  {totalXp >= nextReward.required_xp ? (
                    <p className="text-green-600 font-semibold">🎉 Klar til indløsning!</p>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Mangler {nextReward.required_xp - totalXp} XP
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-green-600">🎯 Alle præmier indløst</p>
              )}

              <div className="text-sm text-pink-600 font-medium text-center">
                💡 {fantasyCount} opgave{fantasyCount !== 1 && 'r'} klar til opfyldelse <br />
                🎯 Potentielle point: <strong>{potentialXp} XP</strong>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
