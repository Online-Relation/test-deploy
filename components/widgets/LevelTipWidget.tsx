// /components/widgets/LevelTipWidget.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useXp } from '@/context/XpContext';
import { supabase } from '@/lib/supabaseClient';
import { Sparkles, Trophy } from 'lucide-react'; // Eller andet ikon-bibliotek

type Suggested = {
  source: string;
  title: string;
  xp: number;
};

export default function LevelTipWidget() {
  const { xp, levelLength } = useXp();

  const safeXp = typeof xp === "number" && !isNaN(xp) ? xp : 0;
  const safeLevelLength = typeof levelLength === "number" && levelLength > 0 ? levelLength : 100;

  const level = Math.floor(safeXp / safeLevelLength) + 1;
  const nextLevelXp = level * safeLevelLength;

  const [suggestedTask, setSuggestedTask] = useState<Suggested | null>(null);

  useEffect(() => {
    async function fetchSuggestions() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .maybeSingle();
      if (!profile) return;

      const { data: xpSettings } = await supabase
        .from('xp_settings')
        .select('action, effort, xp')
        .eq('role', profile.role);

      const xpMap: Record<string, number> = {};
      xpSettings?.forEach((s) => {
        const key = `${s.action}_${s.effort?.toLowerCase() || ''}`;
        xpMap[key] = s.xp;
      });

      const { data: fantasies } = await supabase
        .from('fantasies')
        .select('id, title, effort, status')
        .eq('user_id', user.id)
        .in('status', ['idea', 'planned']);

      const fantasySuggestions: Suggested[] =
        fantasies?.map((f) => {
          const key = `${f.status === "idea" ? "add_fantasy" : "complete_fantasy"}_${f.effort?.toLowerCase() || ''}`;
          return {
            source: "fantasy",
            title: f.title || "Fantasy",
            xp: xpMap[key] || 0,
          };
        }) || [];

      const { data: buckets } = await supabase
        .from('bucketlist_couple')
        .select('goals');
      let bucketSuggestions: Suggested[] = [];
      buckets?.forEach((b: any) => {
        b.goals?.forEach((g: any) => {
          if (!g.done && g.owner === profile.id) {
            bucketSuggestions.push({
              source: "bucket",
              title: g.title || "Delmål",
              xp: xpMap['complete_subgoal_'] || 0,
            });
          }
        });
      });

      const { data: checkin } = await supabase
        .from('checkin')
        .select('id')
        .eq('status', 'pending')
        .eq('evaluator_id', profile.id);
      const checkinSuggestions: Suggested[] = (checkin || []).map((c: any) => ({
        source: "checkin",
        title: "Afventende behov",
        xp: xpMap['evaluate_partial_'] || 0,
      }));

      const { data: tasks } = await supabase
        .from('tasks_couple')
        .select('id, title, xp_value, done, assigned_to')
        .eq('done', false)
        .eq('assigned_to', profile.id);
      const taskSuggestions: Suggested[] = (tasks || []).map((t: any) => ({
        source: "task",
        title: t.title || "Opgave",
        xp: t.xp_value || (xpMap['complete_task_'] || 0),
      }));

      const all: Suggested[] = [
        ...fantasySuggestions,
        ...bucketSuggestions,
        ...checkinSuggestions,
        ...taskSuggestions,
      ].filter((s) => s.xp > 0);

      const xpNeeded = nextLevelXp - safeXp;

      // Prøv først at finde en opgave der præcis (eller mere) får dig til næste level:
      const candidates = all.filter(s => s.xp >= xpNeeded);
      let best = candidates.sort((a, b) => a.xp - b.xp)[0];

      // Ellers, find den nærmeste (mindst difference):
      if (!best) {
        best = all
          .sort((a, b) =>
            Math.abs(xpNeeded - a.xp) - Math.abs(xpNeeded - b.xp)
          )[0];
      }

      setSuggestedTask(best || null);
    }
    fetchSuggestions();
  }, [safeXp, safeLevelLength, level, nextLevelXp]);

  // --- VISUEL: sjov og motiverende ---
  return (
    <Card className="w-full rounded-2xl shadow-lg bg-white border border-yellow-100 px-0 py-0 mt-4 mb-8">
      <div className="flex flex-col items-center py-7 px-6">
        <div className="flex items-center gap-2 mb-2 animate-bounce">
          <Trophy className="text-yellow-400" size={32} />
          <h2 className="text-2xl sm:text-3xl font-extrabold text-yellow-700 drop-shadow-glow">
            Tip til næste level!
          </h2>
        </div>
        <CardContent className="w-full flex flex-col items-center">
          {suggestedTask ? (
            <div className="mt-2 bg-yellow-50 border border-yellow-300 rounded-2xl p-5 flex flex-col items-center shadow-lg max-w-md w-full">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="text-indigo-400" size={22} />
                <span className="font-bold text-lg text-gray-800">Fuldfør</span>
                <span className="font-bold text-indigo-700">{suggestedTask.title}</span>
                <span className="bg-indigo-100 text-indigo-700 rounded-full px-2 py-1 text-xs font-bold ml-2">
                  +{suggestedTask.xp} XP
                </span>
              </div>
              <div className="text-yellow-800 text-base font-semibold text-center">
                {safeXp < nextLevelXp && safeXp + suggestedTask.xp >= nextLevelXp ? (
                  <>
                    – og du stiger til <b>Level {level + 1}</b>!
                  </>
                ) : (
                  <>
                    – og du mangler <b>{nextLevelXp - (safeXp + suggestedTask.xp)}</b> XP til næste level
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-4 text-gray-400 text-center text-sm">
              Ingen opgaver fundet, der kan give XP til næste level.<br />
              Tjek dine boards for nye muligheder!
            </div>
          )}
          <div className="mt-3 text-xs text-yellow-500 font-semibold tracking-wide">
            🚀 <span className="italic">Små skridt = store fremskridt!</span>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
