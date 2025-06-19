// /app/api/overall-recommendation/route.ts
import { NextResponse } from 'next/server';
import { generateGptRecommendation, getTokensForText } from '@/lib/gptHelper';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, for_partner, gatheredData, tone, quiz_key } = body;

    if (!user_id || !for_partner || !gatheredData) {
      return NextResponse.json({ error: 'Manglende data' }, { status: 400 });
    }

    const prompt = `
Du skal generere én personlig anbefaling til ${for_partner}.
Data:
${gatheredData}

Tone: ${tone || 'kærlig og ærlig'}.
Svar med kun anbefalingen – ingen forklaring.
    `.trim();

    const tokens = getTokensForText(prompt);

    const recommendation = await generateGptRecommendation(prompt, 'gpt-4');

    // Log til gpt_logs
    await supabase.from('gpt_logs').insert({
      user_id,
      route: 'overall-recommendation',
      quiz_key: quiz_key || null,
      prompt,
      response: recommendation,
      model: 'gpt-4',
      total_tokens: tokens,
      tables_used: null,
    });

    // Gem anbefaling i overall_meta
    await supabase.from('overall_meta').insert({
      user_id,
      quiz_key: quiz_key || null,
      recommendation,
      generated_at: new Date().toISOString(),
      table_count: 0,
      row_count: 0,
    });

    return NextResponse.json({ recommendation });
  } catch (err: any) {
    console.error('❌ Fejl i overall-recommendation:', err.message || err);
    return NextResponse.json({ error: err.message || 'Ukendt fejl' }, { status: 500 });
  }
}
