import { supabase } from '@/lib/supabaseClient';

interface AwardQuizXpParams {
  userId: string;
  quizKey: string;
  effort: string;
  role: string; // <- tilføjet!
}

export async function awardQuizXpToUser({
  userId,
  quizKey,
  effort,
  role,
}: AwardQuizXpParams) {
  // Debug: Log hvad vi slår op på!
  console.log('XP lookup:', { action: 'complete_parquiz', effort, role });

  // 1. Hent XP fra xp_settings, nu baseret på rigtig rolle!
  const { data: xpSettings, error: xpSettingsError } = await supabase
    .from('xp_settings')
    .select('xp')
    .eq('action', 'complete_parquiz')
    .eq('effort', effort)
    .eq('role', role) // <-- dynamisk nu!
    .maybeSingle();

  if (xpSettingsError || !xpSettings) {
    console.error('Kunne ikke finde XP-værdi i xp_settings:', xpSettingsError, xpSettings);
    return;
  }
  const xpValue = xpSettings.xp;

  // 2. Skriv til xp_log
  const { error: insertError } = await supabase.from('xp_log').insert({
    user_id: userId,
    change: xpValue,
    description: `complete_parquiz: ${quizKey} (${effort})`,
    created_at: new Date().toISOString(),
  });

  if (insertError) {
    console.error('Fejl ved XP insert:', insertError);
  } else {
    console.log('XP tildelt!', { userId, quizKey, effort, xpValue });
  }
}
