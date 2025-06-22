// /lib/gptHelper.ts
import openai from "@/lib/openaiClient";
import { supabase } from "@/lib/supabaseClient";

export async function generateGptRecommendation(
  prompt: string,
  model: "gpt-4" | "gpt-3.5-turbo" = "gpt-3.5-turbo",
  userId?: string
) {
  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const text = response.choices[0]?.message?.content || "Ingen svar genereret.";
    const tokens = response.usage?.total_tokens || Math.ceil(prompt.length / 4);

    await supabase.from("gpt_logs").insert({
      prompt_preview: prompt.slice(0, 2000),
      tokens,
      model,
      user_id: userId ?? null,
    });

    return text;
  } catch (err: any) {
    console.error("❌ GPT-fejl:", err?.message || err);
    throw new Error("GPT-fejl: " + (err?.message || "ukendt fejl"));
  }
}
