// /app/api/overall-recommendation/route.ts
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

    // Hent brugerens farveprofil
    const { data: profile } = await supabase
      .from('profiles')
      .select(
        'red, yellow, green, blue, primary_color, keyword_1, keyword_2, keyword_3, keyword_4, keyword_5'
      )
      .eq('id', user_id)
      .maybeSingle();

    let farveProfilText = '';
    if (profile) {
      const rækkefølge = [profile.red, profile.yellow, profile.green, profile.blue].filter(Boolean);
      const nøgleord = [
        profile.keyword_1,
        profile.keyword_2,
        profile.keyword_3,
        profile.keyword_4,
        profile.keyword_5,
      ].filter(Boolean);
      farveProfilText = `🎨 Farveprofil:\nPrimærfarve: ${profile.primary_color}\nRækkefølge: ${rækkefølge.join(', ')}\nNøgleord: ${nøgleord.join(', ')}`;
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
${farveProfilText ? farveProfilText + '\n\n' : ''}
Data:
${gatheredData}

Tone: ${tone}.
Svar med kun anbefalingen – ingen forklaring.
    `.trim();

    const tokens = getTokensForText(prompt);
    const recommendation = await generateGptRecommendation(prompt, 'gpt-4');

    await supabase.from('gpt_logs').insert({
      user_id,
      route: 'overall-recommendation',
      quiz_key: null,
      prompt,
      response: recommendation,
      model: 'gpt-4',
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
