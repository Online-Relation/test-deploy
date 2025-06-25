// /app/api/quiz-recommendation/route.ts

import { NextResponse } from 'next/server';
import { generateGptRecommendation, getTokensForText } from '@/lib/gptHelper';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, quiz_summary, background, tone } = body;

    if (!user_id || !quiz_summary) {
      return NextResponse.json({ error: 'Manglende data' }, { status: 400 });
    }

    // Hent GPT-model fra gpt_settings
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

    const prompt = `
Du er parterapeut og skal lave én specifik anbefaling til et par baseret på deres quizbesvarelser.

${dynamicProfileText ? dynamicProfileText + '\n\n' : ''}
Information:
Baggrund:
${background || 'Ingen'}
Quiz-resumé:
${quiz_summary}
Tone: ${tone || 'varm og konkret'}

Svar med kun anbefalingen. Ikke noget andet.
    `.trim();

    const tokens = getTokensForText(prompt);

    const recommendation = await generateGptRecommendation(prompt, selectedModel);

    // Log til gpt_logs
    await supabase.from('gpt_logs').insert({
      user_id,
      widget: 'quiz_recommendation',
      prompt,
      response: recommendation,
      model: selectedModel,
      total_tokens: tokens,
    });

    // Gem i quiz_recommendations
    await supabase.from('quiz_recommendations').insert({
      user_id,
      recommendation,
      generated_at: new Date().toISOString(),
    });

    return NextResponse.json({ recommendation });
  } catch (err: any) {
    console.error('❌ Fejl i quiz-anbefaling:', err);
    return NextResponse.json({ error: err.message || 'Ukendt fejl' }, { status: 500 });
  }
}
