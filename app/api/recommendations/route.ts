// /app/api/recommendations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import openai from '@/lib/openaiClient'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: NextRequest) {
  try {
    const { groupedQuestions, quizKey } = await req.json()
    if (!quizKey || !groupedQuestions) {
      return NextResponse.json({ error: 'Missing input' }, { status: 400 })
    }

    // Tjek om anbefalinger allerede findes
    const { data: existing } = await supabase
      .from('quiz_results')
      .select('recommendations')
      .eq('quiz_key', quizKey)
      .limit(1)
      .single()

    if (existing && existing.recommendations && existing.recommendations.length > 0) {
  return NextResponse.json({ recommendations: existing.recommendations })
}


    // Hent baggrundstekst fra couple_background
    const { data: backgroundRow } = await supabase
      .from('couple_background')
      .select('content')
      .limit(1)
      .single()

    const background = backgroundRow?.content || ''

    const summary = [
      groupedQuestions.red.length > 0 ? `Store forskelle:\n${groupedQuestions.red.map((q: any) => `- ${q.question}`).join('\n')}` : '',
      groupedQuestions.yellow.length > 0 ? `Små forskelle:\n${groupedQuestions.yellow.map((q: any) => `- ${q.question}`).join('\n')}` : '',
      groupedQuestions.green.length > 0 ? `Enige:\n${groupedQuestions.green.map((q: any) => `- ${q.question}`).join('\n')}` : ''
    ].filter(Boolean).join('\n\n')

    const prompt = `
Baggrund:
${background}

Quiz-opsummering:
${summary}

Lav 5-8 konkrete, empatiske anbefalinger til parret. Fokusér på samtale, respekt og udvikling. Brug en varm tone.
`

    const chat = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    })

    const reply = chat.choices[0]?.message.content || ''
    const recommendations = reply
      .split(/\n[-•]\s?|\n\d+\.\s?/)
      .map((s) => s.trim())
      .filter(Boolean)

    // Gem anbefalingerne i Supabase
    await supabase.from('quiz_results').insert({
      quiz_key: quizKey,
      recommendations,
    })

    return NextResponse.json({ recommendations })
  } catch (err) {
    console.error('Fejl i /api/recommendations:', err)
    return NextResponse.json({ recommendations: [] }, { status: 500 })
  }
}
