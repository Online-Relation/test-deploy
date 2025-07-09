import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useXp } from '@/context/XpContext';
import { supabase } from '@/lib/supabaseClient';

type Suggested = {
  source: string; // fx "fantasy", "bucket", "checkin", "task"
  title: string;
  xp: number;
};

export default function XpMeter({ height, layout }: { height: string; layout: string; }) {
  const { xp, levelLength } = useXp();

  const safeXp = typeof xp === "number" && !isNaN(xp) ? xp : 0;
  const safeLevelLength = typeof levelLength === "number" && levelLength > 0 ? levelLength : 100;

  // Level starter ved 1, men man rykker op når xp >= level*levelLength
  const level = Math.floor(safeXp / safeLevelLength) + 1;
  const nextLevelXp = level * safeLevelLength;
  const prevLevelXp = (level - 1) * safeLevelLength;
  const progressValue = safeXp - prevLevelXp; // Progress i NUVÆRENDE level
  const progress = progressValue / safeLevelLength;

  // Vælg farve baseret på progress
  let pathColor = "#F59E42"; // orange
  if (progress >= 0.67) pathColor = "#10B981"; // grøn
  else if (progress >= 0.34) pathColor = "#FACC15"; // gul

  const [suggestedTask, setSuggestedTask] = useState<Suggested | null>(null);

  useEffect(() => {
    async function fetchSuggestions() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find din rolle/id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .maybeSingle();
      if (!profile) return;

      // XP settings
      const { data: xpSettings } = await supabase
        .from('xp_settings')
        .select('action, effort, xp')
        .eq('role', profile.role);

      const xpMap: Record<string, number> = {};
      xpSettings?.forEach((s) => {
        const key = `${s.action}_${s.effort?.toLowerCase() || ''}`;
        xpMap[key] = s.xp;
      });

      // Fantasies
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

      // Bucketlist subgoals
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

      // Checkins (pending for dig som evaluator)
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

      // Tasks
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

      // Saml og sortér
      const all: Suggested[] = [
        ...fantasySuggestions,
        ...bucketSuggestions,
        ...checkinSuggestions,
        ...taskSuggestions,
      ].filter((s) => s.xp > 0);

      // --- NY PRÆCIS LOGIK ---
      // Hvor mange XP mangler jeg til næste level?
      const xpNeeded = nextLevelXp - safeXp;

      // Find den mindste opgave der kan tage dig hele vejen til næste level (eller over)
      const candidates = all.filter(s => s.xp >= xpNeeded);
      let best = candidates.sort((a, b) => a.xp - b.xp)[0];

      // Hvis ingen kan det, find den opgave der kommer tættest på næste level (uden at gå over)
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

  const sizeClass = `
    w-[40vw] h-[40vw]
    max-w-[300px] max-h-[300px]
    min-w-[120px] min-h-[120px]
    mx-auto
    relative
  `;

  return (
    <Card className="text-center shadow flex flex-col justify-center relative">
      <div className="flex items-center justify-center pt-5 pb-2">
        <h2 className="text-xl font-bold text-indigo-700 mx-auto">XP-meter</h2>
        <div className="absolute right-6 top-6 sm:right-10 sm:top-6">
          <span className="bg-indigo-600 text-white rounded-full px-5 py-1 text-md font-bold shadow">
            Level {level}
          </span>
        </div>
      </div>
      <CardContent className="p-6 flex flex-col items-center space-y-8">
        <div className={sizeClass}>
          <CircularProgressbar
            value={progressValue}
            maxValue={safeLevelLength}
            text={`${safeXp} XP`}
            styles={buildStyles({
              textSize: '22px',
              pathColor: pathColor,
              textColor: '#374151',
              trailColor: '#D1D5DB',
              strokeLinecap: "round",
            })}
          />
        </div>
        {suggestedTask ? (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center text-yellow-900 shadow">
            <div className="font-bold">Tip til næste level!</div>
            <div>
              Fuldfør <b>{suggestedTask.title}</b> (+{suggestedTask.xp} XP)
              {safeXp < nextLevelXp && safeXp + suggestedTask.xp >= nextLevelXp ? (
                <>
                  <br />
                  – og du stiger til <b>Level {level + 1}</b>!
                </>
              ) : (
                <>
                  <br />
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
      </CardContent>
    </Card>
  );
}
