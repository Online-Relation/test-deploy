// /app/api/gpt-status/route.ts

import { NextResponse } from "next/server";
import openai from "@/lib/openaiClient";

export async function POST(req: Request) {
  try {
    const { model } = await req.json();

    if (!model) {
      return NextResponse.json({ error: "Model mangler" }, { status: 400 });
    }

    const res = await openai.chat.completions.create({
      model,
      messages: [{ role: "user", content: "Hej" }],
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("❌ GPT STATUS FEJL:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
