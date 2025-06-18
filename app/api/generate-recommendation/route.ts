// /app/api/generate-recommendation/route.ts
import { NextResponse } from 'next/server';
import { generateAndStoreRecommendation } from '@/lib/generateWeeklyRecommendation';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const user_id = body.user_id;
    const for_partner = body.for_partner;

    if (!user_id || !for_partner) {
      console.error('⛔️ Mangler userId eller forPartner', body);
      return NextResponse.json({ error: 'Mangler userId eller forPartner' }, { status: 400 });
    }

    const text = await generateAndStoreRecommendation(user_id, for_partner);

    return NextResponse.json({ text });

  } catch (err: any) {
    console.error('FEJL I API:', err.message || err);
    return NextResponse.json(
      { error: err.message || 'Ukendt serverfejl' },
      { status: 500 }
    );
  }
}
