// /app/api/overall-recommendation/route.ts

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import openai from "@/lib/openaiClient";

export async function POST(req: Request) {
  const { testMode = false } = await req.json();

  if (testMode) {
    return NextResponse.json({ ok: true });
  }

  // 1. Hent aktiverede kilder
  const { data: sources, error: sourceError } = await supabase
    .from("recommendation_sources")
    .select("*")
    .eq("enabled", true);

  if (sourceError || !sources) {
    return NextResponse.json({ error: "Failed to load sources" }, { status: 500 });
  }

  // 2. Hent baggrund
  const { data: backgroundMeta } = await supabase
    .from("quiz_meta")
    .select("background")
    .eq("quiz_key", "parquiz")
    .maybeSingle();

  const background = backgroundMeta?.background || "Ingen baggrundsbeskrivelse fundet.";

  // 3. Hent data fra tabeller
  const rowCounts: Record<string, number> = {};
  const tableData: string[] = [];

  for (const source of sources) {
    const { table_name, description } = source;
    const { data, error } = await supabase.from(table_name).select("*");

    if (!error && data) {
      rowCounts[table_name] = data.length;
      tableData.push(`### Tabel: ${table_name}\n${description || "Ingen beskrivelse."}\nAntal rækker: ${data.length}\nData:\n${JSON.stringify(data, null, 2)}`);
    } else {
      console.error(`❌ Fejl ved hentning af data fra ${table_name}:`, error?.message);
    }
  }

  const totalRows = Object.values(rowCounts).reduce((sum, n) => sum + n, 0);
  const usedTables = Object.keys(rowCounts);

  // 4. Byg prompt
  const fullPrompt = `
Du er parterapeut og skal give en personlig anbefaling til et par baseret på deres data.

🧠 Baggrund:
${background}

📊 Data:
${tableData.join("\n\n")}

Giv nu en personlig, ærlig og omsorgsfuld anbefaling. Brug dataene aktivt i analysen.
  `.trim();

  // 5. Kald OpenAI
  const openaiRes = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: fullPrompt }],
    temperature: 0.7,
  });

  const recommendation = openaiRes.choices[0]?.message?.content || "Ingen anbefaling genereret.";

  // 6. Gem anbefaling + metadata i overall_meta
  const { error: insertError } = await supabase.from("overall_meta").insert({
    recommendation,
    generated_at: new Date().toISOString(),
    table_count: usedTables.length,
    row_count: totalRows,
  });

  if (insertError) {
    console.error("❌ Fejl ved indsættelse i overall_meta:", insertError.message);
  }

  // 7. Returnér data
  return NextResponse.json({
    recommendation,
    used_tables: usedTables,
    row_counts: rowCounts,
    total_rows: totalRows,
  });
}
