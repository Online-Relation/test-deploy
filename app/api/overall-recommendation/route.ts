import { NextResponse } from 'next/server';
import { generateGptRecommendation, getTokensForText } from '@/lib/gptHelper';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, tone = 'kærlig og ærlig', for_partner } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'Manglende data' }, { status: 400 });
    }

    // Hent valgt GPT-model
    const { data: modelSetting } = await supabase
      .from('gpt_settings')
      .select('value')
      .eq('key', 'default_model')
      .maybeSingle();

    const selectedModel = modelSetting?.value || 'gpt-3.5-turbo';

    // Hent hele profilen dynamisk
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .maybeSingle();

    // Byg dynamisk profiltekst
    let dynamicProfileText = '';
    if (profile) {
      const profileFieldsToIgnore = [
        "id", "partner_id", "created_at", "updated_at", "user_id", "avatar_url", "display_name"
      ];
      const profileLines = Object.entries(profile)
        .filter(([key, value]) =>
          value !== null &&
          value !== "" &&
          !profileFieldsToIgnore.includes(key)
        )
        .map(([key, value]) => {
          const label = key
            .replace(/_/g, " ")
            .replace(/\b\w/g, c => c.toUpperCase());
          return `${label}: ${value}`;
        });
      if (profileLines.length > 0) {
        dynamicProfileText = `Profiloplysninger:\n${profileLines.join('\n')}`;
      }
    }

    // Hent aktiverede tabeller fra recommendation_sources
    const { data: sources } = await supabase
      .from('recommendation_sources')
      .select('table_name, description')
      .eq('enabled', true)
      .order('priority', { ascending: true });

    let gatheredData = '';
    let totalRows = 0;
    const usedTables: string[] = [];

    if (sources) {
      for (const source of sources) {
        const { data: rows } = await supabase.from(source.table_name).select('*').limit(50);
        if (!rows || rows.length === 0) continue;

        usedTables.push(source.table_name);
        totalRows += rows.length;

        gatheredData += `\n\n📊 Tabel: ${source.table_name}\nBeskrivelse: ${source.description || 'Ingen'}\nData (maks 50 rækker):\n${JSON.stringify(rows, null, 2)}`;
      }
    }

    const prompt = `
Du skal generere én personlig anbefaling til et par baseret på deres data.

${dynamicProfileText ? dynamicProfileText + '\n\n' : ''}
Data:
${gatheredData}

Tone: ${tone}.
Svar med kun anbefalingen – ingen forklaring.
    `.trim();

    const tokens = getTokensForText(prompt);
    const recommendation = await generateGptRecommendation(prompt, selectedModel);

    await supabase.from('gpt_logs').insert({
      user_id,
      route: 'overall-recommendation',
      quiz_key: null,
      prompt,
      response: recommendation,
      model: selectedModel,
      total_tokens: tokens,
      tables_used: usedTables,
    });

    await supabase.from('overall_meta').insert({
      user_id,
      quiz_key: null,
      recommendation,
      generated_at: new Date().toISOString(),
      table_count: usedTables.length,
      row_count: totalRows,
    });

    return NextResponse.json({ recommendation });
  } catch (err: any) {
    console.error('Full error:', err);
    return NextResponse.json({ error: err.message || 'Ukendt fejl' }, { status: 500 });
  }
}
