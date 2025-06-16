// /components/widgets/TaskSummary.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';

export default function TaskSummary({
  height,
  layout,
}: {
  height: string;
  layout: string;
}) {
  const [fantasyCount, setFantasyCount] = useState(0);
  const [potentialXp, setPotentialXp] = useState(0);

useEffect(() => {
  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle();
    if (!profile) return;

    const { data: otherProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', profile.role === 'mads' ? 'stine' : 'mads')
      .maybeSingle();

    const { data: fantasies } = await supabase
      .from('fantasies')
      .select('effort, status, xp_granted, user_id')
      .in('status', ['idea', 'planned'])
      .in('user_id', [user.id, otherProfile?.id]);

    const { data: checkin } = await supabase
      .from('checkin')
      .select('id')
      .eq('status', 'pending')
      .eq('evaluator_id', profile.id);

    const { data: buckets } = await supabase
      .from('bucketlist_couple')
      .select('goals');

    const { data: tasks } = await supabase
      .from('tasks_couple')
      .select('id, assigned_to, done')
      .eq('done', false);

    const { data: xpSettings } = await supabase
      .from('xp_settings')
      .select('action, effort, xp')
      .eq('role', profile.role);

    const xpMap: Record<string, number> = {};
    xpSettings?.forEach((s) => {
      const key = `${s.action}_${s.effort?.toLowerCase() || ''}`;
      xpMap[key] = s.xp;
    });

    let fantasyXp = 0;
    if (profile.role === 'stine') {
      fantasyXp = fantasies?.reduce((sum, f) => {
        const effort = f.effort?.toLowerCase();
        let xp = 0;
        if (effort) {
          if (f.status === 'idea') xp += xpMap[`add_fantasy_${effort}`] || 0;
          if (f.status === 'planned' && f.xp_granted !== true)
            xp += xpMap[`complete_fantasy_${effort}`] || 0;
        }
        return sum + xp;
      }, 0) || 0;
    }

    const checkinXp = (checkin?.length || 0) * (xpMap['evaluate_partial_'] || 0);

    let subgoalCount = 0;
    buckets?.forEach((b: any) => {
      b.goals?.forEach((g: any) => {
        if (!g.done && g.owner === profile.id) subgoalCount++;
      });
    });

    const subgoalXp = subgoalCount * (xpMap['complete_subgoal_'] || 0);

    const userTasks = tasks?.filter((t) => t.assigned_to === profile.id) || [];
    const taskXp = userTasks.length * (xpMap['complete_task_'] || 0);

    setFantasyCount((fantasies?.length || 0) + userTasks.length);
    setPotentialXp(fantasyXp + checkinXp + subgoalXp + taskXp);
  };

  fetchData();
}, []);


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
        <h2 className={`font-bold ${textSizeClass}`}>💡 Opgaver klar</h2>
        <p className="text-sm text-gray-600">
          {fantasyCount} opgave{fantasyCount !== 1 && 'r'} klar til opfyldelse
        </p>
        <p className="text-sm font-semibold">
          🎯 Potentielle point: {potentialXp} XP
        </p>
      </CardContent>
    </Card>
  );
}
