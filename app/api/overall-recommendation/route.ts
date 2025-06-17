// /app/api/overall-recommendation/route.ts
console.log("ENV OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "SET" : "NOT SET");

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import openai from "@/lib/openaiClient";

export async function POST(req: Request) {
  let testMode = false;
  let quizKey = "parquiz";
  let groupedQuestions = null;

  try {
    const body = await req.json();
    console.log("📩 REQUEST BODY:", JSON.stringify(body, null, 2));

    testMode = body?.testMode || false;
    quizKey = body?.quizKey || "parquiz";
    groupedQuestions = body?.groupedQuestions || null;
  } catch {
    // ingen body sendt
  }

  if (testMode) return NextResponse.json({ ok: true });

  try {
    // 1. Hent aktiverede kilder
    const { data: sources, error: sourceError } = await supabase
      .from("recommendation_sources")
      .select("*")
      .eq("enabled", true);

    if (sourceError || !sources) throw new Error("Failed to load sources");

    // 2. Hent baggrund fra quiz_meta
    const { data: backgroundMeta } = await supabase
      .from("quiz_meta")
      .select("background")
      .eq("quiz_key", quizKey)
      .maybeSingle();

    const background = backgroundMeta?.background || "Ingen baggrundsbeskrivelse fundet.";

    // 3. Hent data fra hver tabel
    const rowCounts: Record<string, number> = {};
    const tableData: string[] = [];

    for (const source of sources) {
      const { table_name, description } = source;
      const { data, error } = await supabase.from(table_name).select("*");

      if (!error && data) {
        rowCounts[table_name] = data.length;
        tableData.push(
          `### Tabel: ${table_name}\n${description || "Ingen beskrivelse."}\nAntal rækker: ${data.length}\nData:\n${JSON.stringify(data, null, 2)}`
        );
      } else {
        console.error(`❌ Fejl i tabel ${table_name}:`, error?.message);
      }
    }

    const totalRows = Object.values(rowCounts).reduce((sum, n) => sum + n, 0);
    const usedTables = Object.keys(rowCounts);

    if (tableData.length === 0) {
      throw new Error("Ingen datakilder kunne hentes – alle fejlede.");
    }

    // 4. Byg prompt
    const groupedSection = groupedQuestions
      ? `🟩 Enige:\n${groupedQuestions.green.map((q: any) => q.question).join("\n")}\n\n🟨 Små forskelle:\n${groupedQuestions.yellow.map((q: any) => q.question).join("\n")}\n\n🟥 Store forskelle:\n${groupedQuestions.red.map((q: any) => q.question).join("\n")}`
      : "";

    const fullPrompt = `
Du er parterapeut og skal give en personlig anbefaling til et par baseret på deres data.

🧠 Baggrund:
${background}

${groupedSection ? `📋 Deres besvarelser fordeler sig sådan:\n${groupedSection}\n` : ''}

📊 Data:
${tableData.join("\n\n")}

Giv nu en personlig, ærlig og omsorgsfuld anbefaling. Brug dataene aktivt i analysen.
    `.trim();

    // 5. Kald OpenAI
    let recommendation = "Ingen anbefaling genereret.";
    try {
      const openaiRes = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: fullPrompt }],
        temperature: 0.7,
      });

      recommendation = openaiRes.choices[0]?.message?.content || recommendation;
    } catch (err: any) {
      console.error("❌ OpenAI fejl:", err?.message || err);
      throw new Error("OpenAI API fejlede – tjek din nøgle eller prompt.");
    }

    // 6. Gem resultat
    const { error: insertError } = await supabase.from("overall_meta").insert({
      recommendation,
      generated_at: new Date().toISOString(),
      table_count: usedTables.length,
      row_count: totalRows,
    });

    if (insertError) throw new Error("Fejl ved indsættelse i Supabase: " + insertError.message);

    return NextResponse.json({
      recommendation,
      used_tables: usedTables,
      row_counts: rowCounts,
      total_rows: totalRows,
    });
  } catch (err: any) {
    console.error("❌ RECOMMENDATIONS API ERROR:", JSON.stringify(err, null, 2));
    return NextResponse.json({ error: "Serverfejl i anbefaling" }, { status: 500 });
  }
}
