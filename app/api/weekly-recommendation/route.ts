// /app/api/weekly-recommendation/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { generateGptRecommendation } from "@/lib/gptHelper";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(isoWeek);

export async function POST(req: Request) {
  console.log('🟢 /api/weekly-recommendation kaldt');

  const { user_id } = await req.json();

  if (!user_id) {
    console.error("Mangler bruger-ID");
    return NextResponse.json({ error: "Mangler bruger-ID" }, { status: 400 });
  }

  // Hent HELE profilen (dynamisk)
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user_id)
    .maybeSingle();

  if (!profile?.partner_id) {
    console.error("Partner-ID mangler på profilen");
    return NextResponse.json({ error: "Partner-ID mangler på profilen" }, { status: 400 });
  }

  const partnerId = profile.partner_id;

  // Dynamisk profiltekst
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
      // Formatér label mere læsevenligt
      const label = key
        .replace(/_/g, " ")
        .replace(/\b\w/g, c => c.toUpperCase());
      return `${label}: ${value}`;
    });

  const dynamicProfileText = profileLines.length > 0
    ? `Profiloplysninger:\n${profileLines.join('\n')}`
    : "";

  // Hent widget config
  const { data: widgetData } = await supabase
    .from("widget_config")
    .select("config")
    .eq("user_id", user_id)
    .eq("widget_key", "weekly_recommendation")
    .maybeSingle();

  if (!widgetData?.config) {
    console.error("Ingen konfiguration fundet");
    return NextResponse.json({ error: "Ingen konfiguration fundet" }, { status: 404 });
  }

  const config = widgetData.config;
  const selectedTables: string[] = config.tables || [];
  const tone = config.tone || "varm og ærlig";
  const excludeWords: string[] = config.excludeWords || [];

  // Saml data fra tabellerne
  const summaryData: string[] = [];

  for (const table of selectedTables) {
    const { data } = await supabase.from(table).select("*");
    const rowCount = data?.length || 0;
    summaryData.push(`📊 ${table}: ${rowCount} rækker`);
  }

  // Byg prompt
  const prompt = `
Du er parterapeut. Din opgave er at skrive en kærlig og specifik anbefaling TIL personen med ID: ${partnerId}.
Brug den anden persons profiloplysninger og parrets data som kontekst, men skriv anbefalingen direkte til ${partnerId}, så det er dem der læser den.

${dynamicProfileText ? dynamicProfileText + '\n\n' : ''}
🧠 Dataoversigt:
${summaryData.join("\n")}

Tonens stil: ${tone}
Undgå ord: ${excludeWords.join(", ")}

Svar kun med selve anbefalingen – ingen forklaring.
`.trim();

 // Hent valgt GPT-model fra gpt_settings
const { data: modelSetting } = await supabase
  .from("gpt_settings")
  .select("value")
  .eq("key", "default_model")
  .maybeSingle();

const selectedModel = modelSetting?.value || "gpt-3.5-turbo";

  const recommendation = await generateGptRecommendation(prompt, selectedModel);

  const now = dayjs();
  const weekNumber = now.isoWeek();
  const year = now.year();

  // ✅ Gem i Supabase – korrekt modtager og afsender
  const { error: upsertError, data: upsertData } = await supabase.from("weekly_recommendations").upsert(
    {
      user_id: partnerId,        // modtager
      for_partner: user_id,      // afsender
      week_number: weekNumber,
      year,
      text: recommendation,
      fulfilled: false,
    },
    { onConflict: "user_id,for_partner,week_number,year" }
  );

  console.log('🟠 Upsert resultat:', upsertData, upsertError);

  if (upsertError) {
    console.error('🔴 Fejl ved upsert:', upsertError.message);
    return NextResponse.json({ error: "Database upsert-fejl: " + upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ recommendation });
}
