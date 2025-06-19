// lib/gptHelper.ts
import openai from "@/lib/openaiClient";
import { supabase } from "@/lib/supabaseClient";

export async function generateGptRecommendation(
  prompt: string,
  model: "gpt-4" | "gpt-3.5-turbo" = "gpt-3.5-turbo",
  route: string = '',
  userId: string = ''
) {
  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const text = response.choices[0]?.message?.content || "Ingen svar genereret.";
    const total_tokens = response.usage?.total_tokens || Math.ceil(prompt.length / 4);
    const prompt_tokens = response.usage?.prompt_tokens || null;
    const completion_tokens = response.usage?.completion_tokens || null;

    console.log("📤 Logger GPT-opkald til database...");

    const { error } = await supabase.from("gpt_logs").insert({
      prompt: prompt.slice(0, 2000),
      model,
      total_tokens,
      prompt_tokens,
      completion_tokens,
      route,
      user_id: userId,
    });

    if (error) {
      console.error("❌ Fejl ved indsættelse i gpt_logs:", error.message);
    } else {
      console.log("✅ gpt_logs opdateret");
    }

    return text;
  } catch (err: any) {
    console.error("❌ GPT-fejl:", err?.message || err);
    throw new Error("GPT-fejl: " + (err?.message || "ukendt fejl"));
  }
}

export function getTokensForText(text: string): number {
  return Math.ceil(text.length / 4);
}
