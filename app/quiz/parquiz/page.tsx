'use client'

import { useEffect, useState } from 'react'
import { useUserContext } from '@/context/UserContext'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type QuizItem = {
  key: string
  label: string
}

export default function ParquizOverview() {
  const { user } = useUserContext()
  const [quizKeys, setQuizKeys] = useState<string[]>([])
  const [completed, setCompleted] = useState<string[]>([])

  useEffect(() => {
    const fetchQuizKeys = async () => {
  const { data } = await supabase
    .from('quiz_meta')
    .select('quiz_key')
    .eq('published', true)

  if (data) {
    const keys = data.map(q => q.quiz_key)
    setQuizKeys(keys)
  }
}


    const fetchCompleted = async () => {
      if (!user) return

      const { data } = await supabase
        .from('quiz_responses')
        .select('quiz_key')
        .eq('user_id', user.id)

      if (data) {
        const keys = [...new Set(data.map(q => q.quiz_key))]
        setCompleted(keys)
      }
    }

    fetchQuizKeys()
    fetchCompleted()
  }, [user])

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">🧠 Parquiz</h1>
      <p className="text-sm text-muted-foreground">
        Her finder I små refleksionslege, der giver jer mulighed for at lære hinanden endnu bedre at kende. Svar hver for sig – og se bagefter, hvor I tænker ens og forskelligt. Ingen rigtige svar, bare ærlige.
      </p>

      <div className="grid gap-4">
        {quizKeys.map((key) => {
          const isDone = completed.includes(key)
          return (
            <Card key={key} className={`p-4 ${isDone ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="capitalize font-medium">{key}</div>
                <div className="flex gap-2">
                  {isDone ? (
                    <Link href={`/quiz/resultater/${key}`}>
                      <Button variant="secondary">Se resultat</Button>
                    </Link>
                  ) : (
                    <Link href={`/quiz/${key}`}>
                      <Button>Start quiz</Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
