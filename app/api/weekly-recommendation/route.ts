// /app/api/weekly-recommendation/route.ts

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { generateGptRecommendation, getTokensForText } from "@/lib/gptHelper";

export async function POST(req: Request) {
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: "Mangler bruger-ID" }, { status: 400 });
  }

  const { data: widgetData, error } = await supabase
    .from("widget_config")
    .select("config")
    .eq("user_id", userId)
    .eq("widget_key", "weekly_recommendation")
    .maybeSingle();

  if (error || !widgetData?.config) {
    return NextResponse.json({ error: "Ingen konfiguration fundet" }, { status: 404 });
  }

  const config = widgetData.config;
  let selectedTables: string[] = config.tables || [];

  const { data: priorities } = await supabase
    .from("recommendation_sources")
    .select("table_name, priority")
    .in("table_name", selectedTables);

  if (priorities) {
    selectedTables = priorities
      .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))
      .map((row) => row.table_name);
  }

  const tone = config.tone || "varm og ærlig";
  const excludeWords: string[] = config.excludeWords || [];

  async function getRecentRows(table: string, days: number) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await supabase.from(table).select("*");
    if (error || !data || data.length === 0) return [];
    if (!("created_at" in data[0])) return data;

    return data.filter((row) => new Date(row.created_at) >= since);
  }

  const summaryData: Record<string, { d14: any[]; d30: any[]; d90: any[] }> = {};
  let tokenCounter = 0;

  for (const table of selectedTables) {
    const d14 = await getRecentRows(table, 14);
    const d30 = await getRecentRows(table, 30);
    const d90 = await getRecentRows(table, 90);

    const preview = `🗂️ ${table}\n- Sidste 14 dage: ${d14.length}\n- Sidste 30 dage: ${d30.length}\n- Sidste 90 dage: ${d90.length}\n\n`;
    const estimatedTokens = getTokensForText(preview);

    if (tokenCounter + estimatedTokens > 12000) {
      console.warn(`⛔️ Tokengrænse nået ved ${table}`);
      break;
    }

    tokenCounter += estimatedTokens;
    summaryData[table] = { d14, d30, d90 };
  }

  function generateSummaryText() {
    const lines: string[] = [];

    for (const [table, d] of Object.entries(summaryData)) {
      lines.push(`🗂️ ${table}`);
      lines.push(`- Sidste 14 dage: ${d.d14.length}`);
      lines.push(`- Sidste 30 dage: ${d.d30.length}`);
      lines.push(`- Sidste 90 dage: ${d.d90.length}`);
      lines.push("");
    }

    return lines.join("\n");
  }

  const prompt = `
Du skal skrive en personlig og kærlig anbefaling til en partners dashboard-widget.

🧠 Dataoversigt:
${generateSummaryText()}

Tonens stil: ${tone}
Undgå ord: ${excludeWords.join(", ")}

Svar ærligt, kærligt og konstruktivt med en kort anbefaling.
`.trim();

  try {
    const recommendation = await generateGptRecommendation(prompt, "gpt-3.5-turbo");

    return NextResponse.json({
      recommendation,
      summary: generateSummaryText(),
    });
  } catch (err: any) {
    console.error("❌ GPT-fejl:", err.message);
    return NextResponse.json({ error: "GPT-fejl" }, { status: 500 });
  }
}
