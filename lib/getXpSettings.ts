// lib/getXpSettings.ts
import { supabase } from './supabaseClient';

export async function getXpSettings() {
  const { data, error } = await supabase
    .from('xp_settings')
    .select('add_fantasy_xp, complete_fantasy_xp')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    console.error('Kunne ikke hente xp_settings:', error.message);
    return { add_fantasy_xp: 5, complete_fantasy_xp: 10 }; // fallback
  }

  return data || { add_fantasy_xp: 5, complete_fantasy_xp: 10 };
}
