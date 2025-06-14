'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Card } from '@/components/ui/card'

type Response = {
  question_id: string
  answer: string
  user_id: string
}

type Question = {
  id: string
  question: string
  type: string
}

export default function QuizResultPage() {
  const { quiz_key } = useParams()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')
  const [responses, setResponses] = useState<Response[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [userIds, setUserIds] = useState<string[]>([])

  useEffect(() => {
    const fetchData = async () => {
      if (!sessionId || !quiz_key) return

      const { data: resp } = await supabase
        .from('quiz_responses')
        .select('question_id, answer, user_id')
        .eq('quiz_key', quiz_key as string)
        .eq('session_id', sessionId)

      const { data: qs } = await supabase
        .from('quiz_questions')
        .select('id, question, type')
        .eq('quiz_key', quiz_key as string)

      if (resp && qs) {
        setResponses(resp)
        setQuestions(qs)
        const uniqueUsers = Array.from(new Set(resp.map(r => r.user_id)))
        setUserIds(uniqueUsers)
      }
    }

    fetchData()
  }, [sessionId, quiz_key])

  if (userIds.length !== 2) {
    return <p className="p-4">Begge personer har ikke besvaret endnu.</p>
  }

  const scaleOptions = ['Meget vigtigt', 'Vigtigt', 'Mindre vigtigt', 'Ikke vigtigt']

  const result = questions.map((q) => {
    const a1 = responses.find(r => r.question_id === q.id && r.user_id === userIds[0])?.answer || ''
    const a2 = responses.find(r => r.question_id === q.id && r.user_id === userIds[1])?.answer || ''

    let level: 'green' | 'yellow' | 'red' = 'green'

    if (q.type === 'boolean') {
      level = a1 === a2 ? 'green' : 'red'
    } else {
      const index1 = scaleOptions.indexOf(a1)
      const index2 = scaleOptions.indexOf(a2)
      const diff = Math.abs(index1 - index2)

      if (diff === 0) level = 'green'
      else if (diff === 1) level = 'yellow'
      else level = 'red'
    }

    return {
      question: q.question,
      a1,
      a2,
      level,
    }
  })

  const green = result.filter(r => r.level === 'green')
  const yellow = result.filter(r => r.level === 'yellow')
  const red = result.filter(r => r.level === 'red')

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Resultat – Parquiz: {quiz_key}</h1>

      <Card className="p-4 space-y-2">
        <p className="font-semibold">🔵 Enige ({green.length})</p>
        {green.map((r, i) => (
          <p key={i} className="text-sm">✓ {r.question}</p>
        ))}

        <p className="font-semibold pt-4">🟡 Små forskelle ({yellow.length})</p>
        {yellow.map((r, i) => (
          <p key={i} className="text-sm">~ {r.question}</p>
        ))}

        <p className="font-semibold pt-4">🔴 Store forskelle ({red.length})</p>
        {red.map((r, i) => (
          <p key={i} className="text-sm">✗ {r.question}</p>
        ))}
      </Card>

      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-2">🧠 Analyse</h2>
        <p><strong>Styrker:</strong> {green.length > 0 ? `${green.length} spørgsmål med høj enighed.` : 'Ingen klare styrker.'}</p>
        <p><strong>Små justeringer:</strong> {yellow.length > 0 ? `${yellow.length} spørgsmål med små forskelle.` : 'I virker helt enige eller helt uenige.'}</p>
        <p><strong>Udfordringer:</strong> {red.length > 0 ? `${red.length} spørgsmål med markant uenighed.` : 'Ingen store uenigheder fundet.'}</p>
      </Card>

      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-2">💬 Refleksionsspørgsmål</h2>
        <ul className="list-disc pl-4 text-sm space-y-1">
          <li>Hvilke spørgsmål overraskede jer mest?</li>
          <li>Hvorfor tror I, I svarede forskelligt?</li>
          <li>Er der spørgsmål I har lyst til at tale mere om?</li>
          <li>Hvordan kan I bruge det her til at forstå hinanden bedre?</li>
        </ul>
      </Card>
    </div>
  )
}
