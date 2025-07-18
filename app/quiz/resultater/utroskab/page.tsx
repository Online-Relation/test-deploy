'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useUserContext } from '@/context/UserContext'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Doughnut, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

interface Answer {
  question_id: string
  answer: string
  user_id: string
}

interface Question {
  id: string
  question: string
  type: string
  order: number
}

interface Profile {
  id: string
  display_name: string
  avatar_url: string | null
}

export default function QuizResultPage() {
  const { quizKey } = useParams()
  const { user } = useUserContext()
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [view, setView] = useState<'results' | 'visual' | 'recommendations'>('results')
  const [recommendations, setRecommendations] = useState<string[] | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!quizKey || !user) return

      const { data: qData } = await supabase
        .from('quiz_questions')
        .select('id, question, type, order')
        .eq('quiz_key', quizKey)
        .order('order', { ascending: true })

      const { data: aData } = await supabase
        .from('quiz_responses')
        .select('question_id, answer, user_id')
        .eq('quiz_key', quizKey)

      const userIds = [...new Set(aData?.map(a => a.user_id) || [])]
      const { data: pData } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds)

      if (qData) setQuestions(qData)
      if (aData) setAnswers(aData)
      if (pData) {
        const map: Record<string, Profile> = {}
        pData.forEach(p => map[p.id] = p)
        setProfiles(map)
      }
    }

    fetchData()
  }, [quizKey, user])

  const groupByAgreement = () => {
    const grouped = {
      green: [] as Question[],
      yellow: [] as Question[],
      red: [] as Question[],
    }

    for (const q of questions) {
      const related = answers.filter(a => a.question_id === q.id)
      if (related.length !== 2) continue
      const [a1, a2] = related.map(a => a.answer)
      if (a1 === a2) grouped.green.push(q)
      else if ((a1 === 'Ja' && a2 === 'Nej') || (a1 === 'Nej' && a2 === 'Ja')) grouped.red.push(q)
      else grouped.yellow.push(q)
    }

    return grouped
  }

  const grouped = groupByAgreement()

  useEffect(() => {
    const totalQuestions =
      grouped.green.length + grouped.yellow.length + grouped.red.length

    if (totalQuestions === 0 || recommendations !== null) return

    const fetchRecommendations = async () => {
      try {
        const res = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupedQuestions: grouped, quizKey }),
        })

        const text = await res.text()
        const resData = JSON.parse(text)
        setRecommendations(resData.recommendations || [])
      } catch (error) {
        console.error('Fejl ved hentning af anbefalinger:', error)
        setRecommendations([])
      }
    }

    fetchRecommendations()
  }, [grouped, recommendations, quizKey])

  const chartData = {
    labels: ['Enige', 'Små forskelle', 'Store forskelle'],
    datasets: [
      {
        data: [grouped.green.length, grouped.yellow.length, grouped.red.length],
        backgroundColor: ['#22c55e', '#eab308', '#ef4444'],
        borderWidth: 1
      }
    ]
  }

  const perUserStats = Object.values(profiles).map(profile => {
    const userAnswers = answers.filter(a => a.user_id === profile.id)
    const counts = { Ja: 0, Nej: 0, Andet: 0 }
    for (const a of userAnswers) {
      if (a.answer === 'Ja') counts.Ja++
      else if (a.answer === 'Nej') counts.Nej++
      else counts.Andet++
    }
    return {
      name: profile.display_name,
      ja: counts.Ja,
      nej: counts.Nej,
      andet: counts.Andet,
    }
  })

  const barData = {
    labels: perUserStats.map(s => s.name),
    datasets: [
      {
        label: 'Ja',
        data: perUserStats.map(s => s.ja),
        backgroundColor: '#22c55e'
      },
      {
        label: 'Nej',
        data: perUserStats.map(s => s.nej),
        backgroundColor: '#ef4444'
      },
      {
        label: 'Andet',
        data: perUserStats.map(s => s.andet),
        backgroundColor: '#3b82f6'
      },
    ]
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold capitalize">📋 Resultat: {quizKey}</h1>

      <div className="flex justify-between gap-2 text-sm">
        <Button onClick={() => setView('results')} variant={view === 'results' ? 'secondary' : 'ghost'}>Resultater</Button>
        <Button onClick={() => setView('visual')} variant={view === 'visual' ? 'secondary' : 'ghost'}>Visuelt</Button>
        <Button onClick={() => setView('recommendations')} variant={view === 'recommendations' ? 'secondary' : 'ghost'}>Anbefalinger</Button>
      </div>

      {view === 'results' && <div>[Resultatvisning her]</div>}

      {view === 'visual' && (
        <div className="space-y-6">
          <div className="w-64 mx-auto">
            <Doughnut data={chartData} />
          </div>
          <div className="text-sm text-center">Antal spørgsmål i hver kategori</div>
          <div>
            <h2 className="text-lg font-semibold mt-6 mb-2">Svarfordeling</h2>
            <Bar data={barData} />
          </div>
        </div>
      )}

      {view === 'recommendations' && (
        <div className="space-y-4 text-sm bg-muted/50 p-4 rounded-xl shadow-inner">
          <h2 className="text-xl font-semibold text-center">📚 Anbefalinger til jer</h2>
          {recommendations === null ? (
            <p className="italic text-muted-foreground text-center">Analyserer jeres svar...</p>
          ) : recommendations.length === 0 ? (
            <p className="italic text-muted-foreground text-center">Ingen anbefalinger fundet.</p>
          ) : (
            <ul className="space-y-4">
              {recommendations.map((r, i) => (
                <li key={i} className="bg-white rounded-lg p-4 shadow border-l-4 border-blue-300">
                  <div className="text-base leading-snug">{r}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
