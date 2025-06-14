'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useUserContext } from '@/context/UserContext'
import { v4 as uuidv4 } from 'uuid'

type Question = {
  id: string
  question: string
  type: string
}

const QUESTIONS_PER_PAGE = 10

export default function QuizPage() {
  const { quiz_key } = useParams()
  const { user } = useUserContext()
  const router = useRouter()
  const searchParams = useSearchParams()
  const page = parseInt(searchParams.get('page') || '1')

  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchQuestions = async () => {
      const { data } = await supabase
        .from('quiz_questions')
        .select('id, question, type')
        .eq('quiz_key', quiz_key as string)
        .order('created_at', { ascending: true })

      if (data) setQuestions(data)
    }

    fetchQuestions()
  }, [quiz_key])

  const handleChange = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  const startIndex = (page - 1) * QUESTIONS_PER_PAGE
  const pageQuestions = questions.slice(startIndex, startIndex + QUESTIONS_PER_PAGE)

  const handleNext = () => {
    router.push(`/quiz/${quiz_key}?page=${page + 1}`)
  }

  const handleBack = () => {
    router.push(`/quiz/${quiz_key}?page=${page - 1}`)
  }

  const handleSaveAnswers = async () => {
    if (!user) return
    const sessionId = uuidv4()

    const payload = Object.entries(answers).map(([question_id, answer]) => ({
      quiz_key: quiz_key as string,
      question_id,
      user_id: user.id,
      answer,
      session_id: sessionId,
    }))

    const { error } = await supabase.from('quiz_responses').insert(payload)
    if (!error) {
      router.push(`/quiz/resultater/${quiz_key}?session=${sessionId}`)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Parquiz – {quiz_key}</h1>
      <div className="space-y-2">
  <p className="text-sm text-muted-foreground">
    {startIndex + 1} – {Math.min(startIndex + QUESTIONS_PER_PAGE, questions.length)} af {questions.length} spørgsmål
  </p>
  <div className="w-full h-2 bg-gray-300 rounded">
    <div
      className="h-full bg-purple-600 rounded"
      style={{
        width: `${Math.min(((startIndex + QUESTIONS_PER_PAGE) / questions.length) * 100, 100)}%`,
        transition: 'width 0.3s ease',
      }}
    />
  </div>
</div>


      {pageQuestions.map((q, index) => (
        <Card key={q.id} className="p-4">
          <p className="mb-2 font-medium">{startIndex + index + 1}. {q.question}</p>
          {q.type === 'boolean' ? (
            <div className="flex gap-4">
              <Button
                variant={answers[q.id] === 'Ja' ? 'primary' : 'ghost'}
                onClick={() => handleChange(q.id, 'Ja')}
              >
                Ja
              </Button>
              <Button
                variant={answers[q.id] === 'Nej' ? 'primary' : 'ghost'}
                onClick={() => handleChange(q.id, 'Nej')}
              >
                Nej
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {['Meget vigtigt', 'Vigtigt', 'Mindre vigtigt', 'Ikke vigtigt'].map((option) => (
                <Button
                  key={option}
                  variant={answers[q.id] === option ? 'primary' : 'ghost'}
                  onClick={() => handleChange(q.id, option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          )}
        </Card>
      ))}

      <div className="flex justify-between pt-4">
        <Button onClick={handleBack} disabled={page === 1}>Tilbage</Button>
        {startIndex + QUESTIONS_PER_PAGE < questions.length ? (
          <Button onClick={handleNext}>Næste</Button>
        ) : (
          <Button onClick={handleSaveAnswers}>Send og vis resultat</Button>
        )}
      </div>
    </div>
  )
}
