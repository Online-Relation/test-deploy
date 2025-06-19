// /app/quiz/parquiz/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useUserContext } from '@/context/UserContext'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import XpBadge from '@/components/ui/XpBadge'

type QuizState = {
  key: string
  status: 'not_started' | 'in_progress' | 'submitted'
  answered: number
  total: number
  session_id?: string
  xp?: number
  completedAt?: string
  datapoints?: number
}

export default function ParquizOverview() {
  const { user } = useUserContext()
  const [quizzes, setQuizzes] = useState<QuizState[]>([])
  const [role, setRole] = useState<string>('')

  useEffect(() => {
    if (!user) return

    const load = async () => {
      const [{ data: metaRes }, { data: questionRes }, { data: responseRes }, { data: profile }] = await Promise.all([
        supabase.from('quiz_meta').select('quiz_key, effort').eq('published', true),
        supabase.from('quiz_questions').select('quiz_key'),
        supabase.from('quiz_responses').select('quiz_key, status, session_id, created_at').eq('user_id', user.id),
        supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
      ])

      if (!profile) return
      setRole(profile.role)

      const { data: xpSettings } = await supabase
        .from('xp_settings')
        .select('action, effort, xp')
        .eq('action', 'complete_parquiz')
        .eq('role', profile.role)

      const totalMap: Record<string, number> = {}
      questionRes?.forEach(q => {
        totalMap[q.quiz_key] = (totalMap[q.quiz_key] || 0) + 1
      })

      const grouped: Record<string, { submitted: number; in_progress: number; session_id?: string; created_at?: string }> = {}

      responseRes?.forEach(r => {
        if (!grouped[r.quiz_key]) {
          grouped[r.quiz_key] = { submitted: 0, in_progress: 0 }
        }

        if (r.status === 'submitted') {
          grouped[r.quiz_key].submitted++
          grouped[r.quiz_key].created_at = r.created_at
          grouped[r.quiz_key].session_id = r.session_id
        }

        if (r.status === 'in_progress') {
          grouped[r.quiz_key].in_progress++
          grouped[r.quiz_key].session_id = r.session_id
        }
      })

      const compiled: QuizState[] = metaRes?.map(({ quiz_key, effort }) => {
        const total = totalMap[quiz_key] || 0
        const info = grouped[quiz_key] || { submitted: 0, in_progress: 0 }
        const xp = xpSettings?.find(x => x.effort === effort)?.xp || 0

        if (info.submitted >= total) {
          return {
            key: quiz_key,
            status: 'submitted',
            answered: total,
            total,
            completedAt: info.created_at,
            xp,
            datapoints: info.submitted,
            session_id: info.session_id ?? undefined
          }
        } else if (info.in_progress > 0) {
          return {
            key: quiz_key,
            status: 'in_progress',
            answered: info.in_progress,
            total,
            session_id: info.session_id,
            xp
          }
        } else {
          return {
            key: quiz_key,
            status: 'not_started',
            answered: 0,
            total,
            xp
          }
        }
      }) || []

      setQuizzes(compiled)
    }

    load()
  }, [user])

  const activeQuizzes = quizzes.filter(q => q.status !== 'submitted')
  const completedQuizzes = quizzes.filter(q => q.status === 'submitted')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">🧠 Parquiz</h1>
      <p className="text-sm text-muted-foreground">
        Her finder I små refleksionslege, der giver jer mulighed for at lære hinanden endnu bedre at kende.
        Svar hver for sig – og se bagefter, hvor I tænker ens og forskelligt.
      </p>

      <div className="grid gap-4">
        {activeQuizzes.map(({ key, status, answered, total, session_id, xp }) => (
          <Card key={key} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="capitalize font-medium">{key}</div>
                <div className="text-xs text-muted-foreground">{total} spørgsmål</div>
                <div className="mt-1"><XpBadge xp={xp || 0} /></div>
              </div>
              <div>
                {status === 'submitted' && (
                  <Link href={`/quiz/resultater/${key}?session=${session_id}`}>
                    <Button variant="secondary">Se resultat</Button>
                  </Link>
                )}
                {status === 'in_progress' && (
                  <Link href={`/quiz/${key}`}>
                    <Button>Fortsæt ({total - answered} tilbage)</Button>
                  </Link>
                )}
                {status === 'not_started' && (
                  <Link href={`/quiz/${key}`}>
                    <Button>Start quiz</Button>
                  </Link>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {completedQuizzes.length > 0 && (
        <div className="pt-10 space-y-4">
          <h2 className="text-lg font-semibold">✅ Gennemført quiz</h2>
          {completedQuizzes.map(({ key, completedAt, session_id }) => (
            <Card key={key} className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="capitalize font-medium">{key}</div>
                  <div className="text-sm text-muted-foreground">
                    Gennemført: {new Date(completedAt || '').toLocaleDateString('da-DK', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
                <Link href={`/quiz/resultater/${key}?session=${session_id}`}>
                  <Button variant="secondary">Se resultat</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
