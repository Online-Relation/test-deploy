// /lib/gptHelper.ts

import openai from "@/lib/openaiClient";
import { supabase } from "@/lib/supabaseClient";

export async function generateGptRecommendation(prompt: string, model: "gpt-4" | "gpt-3.5-turbo" = "gpt-3.5-turbo") {
  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const text = response.choices[0]?.message?.content || "Ingen svar genereret.";
    const tokens = response.usage?.total_tokens || getTokensForText(prompt);

    await supabase.from("gpt_log").insert({
      prompt_preview: prompt.slice(0, 2000),
      tokens,
      model,
    });

    return text;
  } catch (err: any) {
    console.error("❌ GPT-fejl:", err?.message || err);
    throw new Error("GPT-fejl: " + (err?.message || "ukendt fejl"));
  }
}

export function getTokensForText(text: string): number {
  return Math.ceil(text.length / 4);
}
