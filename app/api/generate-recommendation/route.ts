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

    // Hent valgt GPT-model
    const { data: modelSetting } = await supabase
      .from('gpt_settings')
      .select('value')
      .eq('key', 'default_model')
      .maybeSingle();

    const selectedModel = modelSetting?.value || 'gpt-3.5-turbo';

    // 🎨 Hent hele profilen dynamisk
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .maybeSingle();

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

${dynamicProfileText ? dynamicProfileText + '\n\n' : ''}

📊 Aktivitetsoversigt:
${summaryLines.join('\n')}

Tone: ${tone}
Undgå følgende ord: ${excludeWords.join(', ')}

Svar med en varm, personlig anbefaling til parret.
    `.trim();

    const recommendation = await generateGptRecommendation(prompt, selectedModel);

    await supabase.from('gpt_logs').insert({
      user_id,
      widget: 'weekly_recommendation',
      prompt: prompt.slice(0, 2000),
      response: recommendation,
      model: selectedModel,
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
