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

    // Hent farveprofil
    const { data: profile, error: profileError } = await supabase
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
🎨 Farveprofil for parret:
Personligheden er sammensat af 4 farver i prioriteret rækkefølge:

${prioriteretListe}

Nøgleord: ${nøgleord.join(', ')}

Fokusér særligt på de øverste farver i din anbefaling.
      `.trim();
    }

    const prompt = `
Du er parterapeut og skal lave én specifik anbefaling til et par baseret på deres quizbesvarelser.
${farveProfilText ? farveProfilText + '\n\n' : ''}
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

    // Log til gpt_logs
    await supabase.from('gpt_logs').insert({
      user_id,
      widget: 'quiz_recommendation',
      prompt,
      response: recommendation,
      model: 'gpt-4',
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
