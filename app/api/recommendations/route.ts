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
    // Hent valgt GPT-model
    const { data: modelSetting } = await supabase
      .from('gpt_settings')
      .select('value')
      .eq('key', 'default_model')
      .maybeSingle();

    const selectedModel = modelSetting?.value || 'gpt-3.5-turbo';

    // Hent hele profilen (dynamisk)
    let dynamicProfileText = '';
    if (user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user_id)
        .maybeSingle();

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
    const promptProfile = dynamicProfileText ? `\n\n${dynamicProfileText}` : '';
    const promptData = `\n\n📊 Data:\n${tableData.join('\n\n')}`;
    const promptFooter = `\n\nGiv nu en personlig, ærlig og omsorgsfuld anbefaling. Brug dataene aktivt i analysen.`;

    const fullPrompt = `${promptHeader}${promptProfile}${promptGrouped}${promptData}${promptFooter}`;
    const promptTokens = getTokensForText(fullPrompt);

    const recommendation = await generateGptRecommendation(fullPrompt, selectedModel);

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

    await supabase.from('gpt_logs').insert({
      user_id,
      widget: 'quiz_recommendation',
      prompt: fullPrompt,
      response: recommendation,
      model: selectedModel,
      total_tokens: promptTokens,
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
