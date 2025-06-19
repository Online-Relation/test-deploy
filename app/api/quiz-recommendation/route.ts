// /app/api/quiz-recommendation/route.ts

import { NextResponse } from 'next/server';
import { generateGptRecommendation, getTokensForText } from '@/lib/gptHelper';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📨 quiz-recommendation body:", body);

    const { user_id, for_partner, quiz_summary, background, tone } = body;

    if (!user_id || !for_partner || !quiz_summary) {
      console.warn("⚠️ Manglende påkrævede felter", { user_id, for_partner, quiz_summary });
      return NextResponse.json({ error: 'Manglende data i request' }, { status: 400 });
    }

    const prompt = `
Du er parterapeut og skal lave én specifik anbefaling til ${for_partner}.
Information:
Baggrund:
${background || 'Ingen'}
Quiz-resumé:
${quiz_summary}
Tone: ${tone || 'varm og konkret'}

Svar med kun anbefalingen. Ikke noget andet.
    `.trim();

    const tokens = getTokensForText(prompt);

    const recommendation = await generateGptRecommendation(prompt, 'gpt-4');

    await supabase.from('gpt_logs').insert({
      user_id,
      widget: 'quiz_recommendation',
      prompt: prompt.slice(0, 2000),
      response: recommendation,
      model: 'gpt-4',
      total_tokens: tokens,
    });

    await supabase.from('quiz_recommendations').insert({
      user_id,
      recommendation,
      for_partner,
      generated_at: new Date().toISOString(),
    });

    return NextResponse.json({ recommendation });

  } catch (err: any) {
    console.error('❌ Fejl i quiz-anbefaling:', err.message || err);
    return NextResponse.json({ error: err.message || 'Ukendt fejl i anbefaling' }, { status: 500 });
  }
}
