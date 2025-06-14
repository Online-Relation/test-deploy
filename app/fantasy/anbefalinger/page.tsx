// /app/parforhold/anbefalinger/page.tsx
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useUserContext } from '@/context/UserContext'

export default function AnbefalingerOverview() {
  const [quizKeys, setQuizKeys] = useState<string[]>([])
  const { user } = useUserContext()

  useEffect(() => {
    const fetchCompletedQuizzes = async () => {
      if (!user) return

      const { data, error } = await supabase
        .from('quiz_responses')
        .select('quiz_key')
        .eq('user_id', user.id)

      if (data) {
        const keys = [...new Set(data.map((r) => r.quiz_key))]
        setQuizKeys(keys)
      }
    }

    fetchCompletedQuizzes()
  }, [user])

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">📊 Anbefalinger & Svar</h1>
      <p className="text-sm text-muted-foreground">
        Her kan du se jeres gennemførte quizzer med svar, statistik og personlige anbefalinger. Brug det som et udgangspunkt for samtaler og refleksion.
      </p>

      <div className="grid gap-4">
        {quizKeys.length === 0 && (
          <p className="text-sm italic text-muted-foreground">Du har ikke gennemført nogle quizzer endnu.</p>
        )}

        {quizKeys.map((key) => (
          <Card key={key} className="p-4">
            <div className="flex justify-between items-center">
              <div className="capitalize font-medium">{key}</div>
              <Link href={`/fantasy/anbefalinger/${key}`}>

                <Button variant="primary">Se resultater</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
