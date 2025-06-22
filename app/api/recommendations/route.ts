// /app/api/recommendations/route.ts

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { generateGptRecommendation, getTokensForText } from '@/lib/gptHelper';

const MAX_TOKENS = 16000;

export async function POST(req: Request) {
  let testMode = false;
  let quizKey = 'parquiz';
  let groupedQuestions = null;
  let isAdmin = false;
  let user_id = null;

  try {
    const body = await req.json();
    testMode = body?.testMode || false;
    quizKey = body?.quizKey || 'parquiz';
    groupedQuestions = body?.groupedQuestions || null;
    isAdmin = body?.isAdmin || false;
    user_id = body?.user_id || null;
  } catch {}

  if (testMode) return NextResponse.json({ ok: true });

  try {
    // Hent farveprofil
    let farveProfilText = '';

    if (user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('red, yellow, green, blue, primary_color, keyword_1, keyword_2, keyword_3, keyword_4, keyword_5, red_description, yellow_description, green_description, blue_description')
        .eq('id', user_id)
        .maybeSingle();

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
    }

    const { data: sources } = await supabase
      .from('recommendation_sources')
      .select('*')
      .eq('enabled', true)
      .order('priority', { ascending: true });

    const rowCounts: Record<string, number> = {};
    const tableData: string[] = [];
    let totalTokens = 0;

    for (const source of sources || []) {
      const { table_name, description } = source;
      const { data, error } = await supabase
        .from(table_name)
        .select('*')
        .limit(5);

      if (error || !data) continue;

      const text = `### Tabel: ${table_name}\n${description || ''}\n${JSON.stringify(data, null, 2)}`;
      const tokens = getTokensForText(text);

      if (totalTokens + tokens > 12000) break;

      totalTokens += tokens;
      rowCounts[table_name] = data.length;
      tableData.push(text);
    }

    if (tableData.length === 0) throw new Error('Ingen data kunne hentes.');

    const groupedText = groupedQuestions
      ? `🟩 Enige:\n${groupedQuestions.green.map((q: any) => q.question).join('\n')}\n\n🟨 Små forskelle:\n${groupedQuestions.yellow.map((q: any) => q.question).join('\n')}\n\n🟥 Store forskelle:\n${groupedQuestions.red.map((q: any) => q.question).join('\n')}`
      : '';

    const promptHeader = `Du er parterapeut og skal give en personlig anbefaling til et par baseret på deres data.`;
    const promptGrouped = groupedText ? `\n\n📋 Deres besvarelser:\n${groupedText}` : '';
    const promptData = `\n\n📊 Data:\n${tableData.join('\n\n')}`;
    const promptFooter = `\n\nGiv nu en personlig, ærlig og omsorgsfuld anbefaling. Brug dataene aktivt i analysen.`;

    const fullPrompt = `${promptHeader}${farveProfilText ? '\n\n' + farveProfilText : ''}${promptGrouped}${promptData}${promptFooter}`;
    const promptTokens = getTokensForText(fullPrompt);

    const recommendation = await generateGptRecommendation(fullPrompt, 'gpt-3.5-turbo');

    await supabase.from('overall_meta').insert({
      quiz_key: quizKey,
      recommendation,
      generated_at: new Date().toISOString(),
      table_count: tableData.length,
      row_count: Object.values(rowCounts).reduce((sum, n) => sum + n, 0),
      row_counts: rowCounts,
      used_tables: Object.keys(rowCounts),
      user_id,
      grouped_questions_hash: null,
      token_count: promptTokens,
    });

    return NextResponse.json({
      recommendation,
      used_tables: Object.keys(rowCounts),
      row_counts: rowCounts,
      total_rows: Object.values(rowCounts).reduce((sum, n) => sum + n, 0),
      cached: false,
    });
  } catch (err: any) {
    console.error('❌ RECOMMENDATIONS API ERROR:', err);
    return NextResponse.json({ error: 'Serverfejl i anbefaling' }, { status: 500 });
  }
}
