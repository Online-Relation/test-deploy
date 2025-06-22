// /app/api/generate-recommendation/route.ts

import { NextResponse } from 'next/server';
import { generateGptRecommendation, getTokensForText } from '@/lib/gptHelper';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const user_id = body.user_id;

    if (!user_id) {
      console.error('⛔️ Mangler userId', body);
      return NextResponse.json({ error: 'Mangler userId' }, { status: 400 });
    }

    // 🎨 Hent farveprofil
    const { data: profile } = await supabase
      .from('profiles')
      .select(
        'red, yellow, green, blue, primary_color, keyword_1, keyword_2, keyword_3, keyword_4, keyword_5, red_description, yellow_description, green_description, blue_description'
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

      const farveBeskrivelser: Record<string, string> = {
        red: profile.red_description || 'handlekraftig og målrettet',
        yellow: profile.yellow_description || 'kreativ, legende og idérig',
        green: profile.green_description || 'omsorgsfuld og harmonisøgende',
        blue: profile.blue_description || 'struktureret og analytisk',
      };

      const prioriteretListe = rækkefølge
        .map((farve, index) => {
          const beskrivelse = farveBeskrivelser[farve] || 'personlighedstræk';
          return `${index + 1}. ${farve} – ${beskrivelse}`;
        })
        .join('\n');

      farveProfilText = `
🎨 Farveprofil:
Brugerens personlighed er sammensat af 4 farver i prioriteret rækkefølge:

${prioriteretListe}

Nøgleord: ${nøgleord.join(', ')}

Fokusér særligt på de øverste farver i din anbefaling.
      `.trim();
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

    if (!sources) {
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
Du skal generere en kærlig og ærlig anbefaling til et par baseret på deres seneste aktivitet.

${farveProfilText ? farveProfilText + '\n\n' : ''}

📊 Aktivitetsoversigt:
${summaryLines.join('\n')}

Tone: ${tone}
Undgå følgende ord: ${excludeWords.join(', ')}

Svar med en varm, personlig anbefaling til parret.
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

    return NextResponse.json({ recommendation });

  } catch (err: any) {
    console.error('FEJL I API:', err.message || err);
    return NextResponse.json(
      { error: err.message || 'Ukendt serverfejl' },
      { status: 500 }
    );
  }
}
