'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

export default function DashboardPage() {
  const [xpLog, setXpLog] = useState<{ change: number; assigned_to: string }[]>([]);
  const [rewards, setRewards] = useState<{ assigned_to: string; required_xp: number; title: string }[]>([]);
  const [settings, setSettings] = useState({
    add_fantasy_xp: 0,
    complete_fantasy_xp_low: 0,
    complete_fantasy_xp_medium: 0,
    complete_fantasy_xp_high: 0,
  });
  const [stineOpportunities, setStineOpportunities] = useState<number>(0);
  const [stinePotentialXp, setStinePotentialXp] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      const { data: logData } = await supabase.from('xp_log').select('change, assigned_to');
      const { data: rewardData } = await supabase
        .from('rewards')
        .select('assigned_to, required_xp, title')
        .eq('redeemed', false);
      const { data: settingsData } = await supabase
        .from('xp_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      const { data: fantasies } = await supabase
        .from('fantasies')
        .select('id, effort, status')
        .in('status', ['idea', 'planned']);

      setXpLog(logData || []);
      setRewards(rewardData || []);
      if (settingsData) setSettings(settingsData);

      const count = fantasies?.length || 0;
      setStineOpportunities(count);

      const potentialXp =
        fantasies?.reduce((sum, f) => {
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

      setStinePotentialXp(potentialXp);
    };

    fetchData();
  }, []);

  const calculateXp = (user: 'mads' | 'stine') =>
    xpLog.filter((entry) => entry.assigned_to === user).reduce((sum, e) => sum + e.change, 0);

  const getNextReward = (user: 'mads' | 'stine', currentXp: number) => {
    const relevant = rewards.filter((r) => r.assigned_to === user);
    const next = relevant.sort((a, b) => a.required_xp - b.required_xp).find((r) => r.required_xp > currentXp);
    return next;
  };

  const madsXp = calculateXp('mads');
  const stineXp = calculateXp('stine');
  const madsNext = getNextReward('mads', madsXp);
  const stineNext = getNextReward('stine', stineXp);

  const users = [
    { id: 'mads', name: 'Mads', xp: madsXp, next: madsNext },
    { id: 'stine', name: 'Stine', xp: stineXp, next: stineNext },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
      {users.map(({ id, name, xp, next }) => (
        <Card key={id} className="text-center shadow border border-gray-200">
          <CardContent className="p-8 flex flex-col items-center justify-center space-y-4">
            <h2 className="text-2xl font-bold">{name}</h2>
            <div className="w-48 h-48">
              <CircularProgressbar
                value={xp % 100}
                maxValue={100}
                text={`${xp} XP`}
                styles={buildStyles({
                  textSize: '16px',
                  pathColor: '#10B981',
                  textColor: '#374151',
                  trailColor: '#D1D5DB',
                })}
              />
            </div>

            {next ? (
              <>
                <p className="text-sm text-gray-500">
                  Næste præmie: <strong>{next.title}</strong> ({next.required_xp} XP)
                </p>
                {xp >= next.required_xp ? (
                  <p className="text-green-600 font-semibold">🎉 Klar til indløsning!</p>
                ) : (
                  <p className="text-sm text-gray-500">Mangler {next.required_xp - xp} XP</p>
                )}
              </>
            ) : (
              <p className="text-sm text-green-600">🎯 Alle præmier indløst</p>
            )}

            {id === 'stine' && (
              <div className="text-sm text-pink-600 font-medium text-center">
                💡 {stineOpportunities} opgave{id === 'stine' && stineOpportunities !== 1 && 'r'} klar til opfyldelse <br />
                🎯 Potentielle point: <strong>{stinePotentialXp} XP</strong>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
