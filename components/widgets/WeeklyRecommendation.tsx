// /components/widgets/WeeklyRecommendation.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUserContext } from '@/context/UserContext';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import XpBadge from '@/components/ui/XpBadge';

dayjs.extend(isoWeek);

declare module 'dayjs' {
  interface Dayjs {
    isoWeek(): number;
  }
}

export default function WeeklyRecommendation() {
  const { user } = useUserContext();
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [xpEarned, setXpEarned] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    if (!user.partner_id) {
      console.error('Fejl ved hentning af partner_id: partner_id mangler på profilen');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      const now = dayjs();
      const weekNumber = now.isoWeek();
      const year = now.year();

      const [{ data: recData, error: recError }, { data: xpData }] = await Promise.all([
        supabase
          .from('weekly_recommendations')
          .select('text, fulfilled')
          .eq('user_id', user.id)
          .eq('for_partner', user.partner_id)
          .eq('week_number', weekNumber)
          .eq('year', year)
          .maybeSingle(),

        supabase
          .from('xp_settings')
          .select('xp')
          .eq('role', user.role)
          .eq('action', 'complete_recommendation')
          .maybeSingle(),
      ]);

      if (recError) {
        console.error('Fejl ved hentning af anbefaling:', recError.message);
        setRecommendation('Kunne ikke hente anbefaling.');
      } else if (recData) {
        setRecommendation(recData.text);
        if (recData.fulfilled) setCompleted(true);
      } else {
        setRecommendation('Ingen anbefaling tilgængelig endnu.');
      }

      setXpEarned(xpData?.xp ?? 0);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const handleComplete = async () => {
    if (!user || !user.partner_id) return;

    const now = dayjs();
    const weekNumber = now.isoWeek();
    const year = now.year();

    const { data: xpData } = await supabase
      .from('xp_settings')
      .select('xp')
      .eq('role', user.role)
      .eq('action', 'complete_recommendation')
      .maybeSingle();

    const xp = xpData?.xp || 0;

    await supabase.from('xp_log').insert({
      user_id: user.id,
      role: user.role,
      action: 'complete_recommendation',
      effort: null,
      xp,
    });

    await supabase
      .from('weekly_recommendations')
      .update({ fulfilled: true })
      .eq('user_id', user.id)
      .eq('for_partner', user.partner_id)
      .eq('week_number', weekNumber)
      .eq('year', year);

    setCompleted(true);
    setXpEarned(xp);
  };

  if (!user) return null;

  const heading =
    user.role === 'mads'
      ? '❤️ Ugens parforholds-anbefaling til Stine'
      : '❤️ Ugens parforholds-anbefaling til Mads';

  return (
    <div className="bg-white rounded-2xl shadow p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{heading}</h3>
        {!completed && xpEarned !== null && <XpBadge xp={xpEarned} />}
      </div>

      <p className="text-sm text-muted-foreground">
        Et kærligt forslag baseret på jeres relation og partnerens behov:
      </p>
      <div className="bg-muted rounded p-3 text-sm min-h-[80px] flex items-center">
        {loading ? 'Henter anbefaling...' : recommendation}
      </div>

      {!loading && !completed && (
        <button
          onClick={handleComplete}
          className="mt-2 bg-green-600 text-white text-sm px-3 py-1 rounded hover:bg-green-700"
        >
          ✅ Fuldført og optjen XP
        </button>
      )}

      {completed && (
        <div className="text-sm text-green-700 font-medium">
          ✅ Fuldført og XP optjent ({xpEarned || '✓'})
        </div>
      )}
    </div>
  );
}
