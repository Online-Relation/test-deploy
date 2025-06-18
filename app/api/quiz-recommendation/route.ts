// /app/api/quiz-recommendation/route.ts

import { NextResponse } from 'next/server';
import { generateGptRecommendation } from '@/lib/gptHelper';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, for_partner, quiz_summary, background, tone } = body;

    if (!user_id || !for_partner || !quiz_summary) {
      return NextResponse.json({ error: 'Manglende data' }, { status: 400 });
    }

    const prompt = `
Du er parterapeut og skal lave én specifik anbefaling til ${for_partner}.
Information:
Baggrund:\n${background || 'Ingen'}
Quiz-resumé:\n${quiz_summary}
Tone: ${tone || 'varm og konkret'}

Svar med kun anbefalingen. Ikke noget andet.
    `.trim();

    const text = await generateGptRecommendation(prompt, 'gpt-4');

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error('❌ Fejl i quiz-anbefaling:', err);
    return NextResponse.json({ error: err.message || 'Ukendt fejl' }, { status: 500 });
  }
}
