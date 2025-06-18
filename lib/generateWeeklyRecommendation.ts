// /lib/generateAndStoreRecommendation.ts

import { supabase } from './supabaseClient';
import openai from '@/lib/openaiClient';

export async function generateAndStoreRecommendation(userId: string, forPartner: 'mads' | 'stine') {
  const now = new Date();
  const week_number = getWeekNumber(now);
  const year = now.getFullYear();

  // check om der allerede er en anbefaling for ugen
  const { data: existing } = await supabase
    .from('weekly_recommendations')
    .select('*')
    .eq('user_id', userId)
    .eq('for_partner', forPartner)
    .eq('week_number', week_number)
    .eq('year', year)
    .maybeSingle();

  if (existing) return existing.text;

  // hent konfiguration for brugeren
  const { data: configRow, error: configError } = await supabase
    .from('widget_config')
    .select('*')
    .eq('user_id', userId)
    .eq('widget_key', 'weekly_recommendation')
    .maybeSingle();

  if (configError) {
    console.error('🔴 Fejl ved hentning af widget_config:', configError.message);
    throw new Error('Fejl ved hentning af konfiguration');
  }

  console.log('🧩 Raw widget_config row:', configRow);

  const selectedTables = configRow?.selected_tables;
  console.log('📊 Valgte tabeller:', selectedTables);

  if (!selectedTables || selectedTables.length === 0) {
    throw new Error('Ingen konfiguration fundet for anbefaling');
  }

  // hent data fra de valgte tabeller
  let gatheredInfo = '';

  for (const table of selectedTables) {
    console.log(`📦 Henter fra tabel: ${table}`);
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn(`⚠️ Fejl ved læsning af ${table}:`, error.message);
        continue;
      }
      if (data) {
        gatheredInfo += `\nFra ${table}:\n` + JSON.stringify(data, null, 2);
      }
    } catch (err) {
      console.error(`❌ Exception under læsning af ${table}:`, err);
    }
  }

  const tone = configRow?.tone || 'kærlig og initiativrig';

  const prompt = `
    Du skal give én anbefaling til hvad man kan gøre for sin partner i denne uge.
    Brug følgende data:\n${gatheredInfo}
    Tonen skal være: ${tone}.
    Returnér kun selve anbefalingen, ikke forklaring.
  `;

  const chatResponse = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
  });

  const text = chatResponse.choices[0]?.message.content?.trim();
  if (!text) throw new Error('Ingen anbefaling genereret');

  const { error } = await supabase.from('weekly_recommendations').insert({
    user_id: userId,
    for_partner: forPartner,
    text,
    week_number,
    year,
  });

  if (error) throw new Error('Kunne ikke gemme anbefaling');
  return text;
}

function getWeekNumber(d: Date) {
  const date = new Date(d.getTime());
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date as any) - (yearStart as any)) / 86400000 + 1) / 7);
}
