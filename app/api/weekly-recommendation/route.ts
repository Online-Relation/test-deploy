// /app/api/weekly-recommendation/route.ts

import { NextResponse } from 'next/server';
import { generateGptRecommendation, getTokensForText } from '@/lib/gptHelper';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const user_id = body.user_id;
    const for_partner = body.for_partner;

    if (!user_id || !for_partner) {
      console.error('⛔️ Mangler userId eller forPartner', body);
      return NextResponse.json({ error: 'Mangler userId eller forPartner' }, { status: 400 });
    }

    const { data: widgetConfig } = await supabase
      .from('widget_config')
      .select('config')
      .eq('user_id', user_id)
      .eq('widget_key', 'weekly_recommendation')
      .maybeSingle();

    if (!widgetConfig?.config) {
      return NextResponse.json({ error: 'Ingen konfiguration fundet' }, { status: 404 });
    }

    const config = widgetConfig.config;
    const selectedTables: string[] = config.tables || [];
    const tone = config.tone || 'venlig og ærlig';
    const excludeWords: string[] = config.excludeWords || [];

    const { data: sources } = await supabase
      .from('recommendation_sources')
      .select('*')
      .in('table_name', selectedTables)
      .order('priority', { ascending: true });

    if (!sources || sources.length === 0) {
      return NextResponse.json({ error: 'Ingen datakilder fundet' }, { status: 400 });
    }

    const summaryLines: string[] = [];
    let tokenCount = 0;

    for (const source of sources) {
      const { table_name, description } = source;
      const { data } = await supabase.from(table_name).select('*');
      const count = data?.length || 0;

      const line = `- ${table_name} (${count} rækker): ${description || "Ingen beskrivelse."}`;
      const estimatedTokens = getTokensForText(line);

      if (tokenCount + estimatedTokens > 12000) {
        console.warn(`⛔️ Tokenbegrænsning nået ved ${table_name}`);
        break;
      }

      summaryLines.push(line);
      tokenCount += estimatedTokens;
    }

    const prompt = `
Du skal generere en kærlig og ærlig anbefaling til ${for_partner} baseret på deres seneste aktivitet.

📊 Aktivitetsoversigt:
${summaryLines.join('\n')}

Tone: ${tone}
Undgå følgende ord: ${excludeWords.join(', ')}

Svar med en varm, personlig anbefaling.
    `.trim();

    const recommendation = await generateGptRecommendation(prompt, 'gpt-3.5-turbo');

    await supabase.from('gpt_logs').insert({
      user_id,
      widget: 'weekly_recommendation',
      prompt: prompt.slice(0, 2000),
      response: recommendation,
      model: 'gpt-3.5-turbo',
      token_count: getTokensForText(prompt),
    });

    // ✅ Caching (valgfrit – fjern kommentartegn hvis du ønsker det)
    // await supabase.from('weekly_recommendations').insert({
    //   user_id,
    //   for_partner,
    //   recommendation,
    //   generated_at: new Date().toISOString(),
    // });

    return NextResponse.json({ recommendation });

  } catch (err: any) {
    console.error('❌ FEJL I weekly-recommendation API:', err.message || err);
    return NextResponse.json(
      { error: err.message || 'Ukendt serverfejl' },
      { status: 500 }
    );
  }
}
