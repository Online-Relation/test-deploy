// /app/settings/game/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import TextareaAutosize from 'react-textarea-autosize'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type Question = {
  id: string
  question: string
  quiz_key: string
  type: string
  order: number | null
}

export default function QuizAdminPage() {
  const [quizKey, setQuizKey] = useState('')
  const [availableKeys, setAvailableKeys] = useState<string[]>([])
  const [questionText, setQuestionText] = useState('')
  const [type, setType] = useState('boolean')
  const [effort, setEffort] = useState('medium')
  const [questions, setQuestions] = useState<Question[]>([])
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [published, setPublished] = useState(false)
  const [loadedPublished, setLoadedPublished] = useState(false)
  const router = useRouter()
  const sensors = useSensors(useSensor(PointerSensor))

  const fetchAvailableKeys = async () => {
    const [metaRes, questionsRes] = await Promise.all([
      supabase.from('quiz_meta').select('quiz_key'),
      supabase.from('quiz_questions').select('quiz_key'),
    ])

    const allKeys = new Set<string>()
    metaRes.data?.forEach(q => allKeys.add(q.quiz_key))
    questionsRes.data?.forEach(q => allKeys.add(q.quiz_key))

    setAvailableKeys([...allKeys])
  }

  const fetchQuestions = async () => {
    if (!quizKey.trim()) return
    const { data } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_key', quizKey.trim())
      .order('order', { ascending: true })

    if (data) setQuestions(data)
  }

  const fetchDescription = async () => {
    const key = quizKey.trim()
    if (!key) return

    const { data, error } = await supabase
      .from('quiz_meta')
      .select('description, published, effort')
      .eq('quiz_key', key)
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Fejl ved hentning af description:', error)
      return
    }

    if (data) {
      setDescription(data.description || '')
      setPublished(data.published ?? false)
      setEffort(data.effort || 'medium')
    } else {
      setDescription('')
      setPublished(false)
      setEffort('medium')
    }

    setLoadedPublished(true)
  }

const saveDescription = async () => {
  await supabase.from('quiz_meta').upsert({
    quiz_key: quizKey.trim(),
    description,
    published,
    effort
  }, { onConflict: 'quiz_key' })

  await fetchAvailableKeys()
  await fetchQuestions()
  await fetchDescription()

  router.push('/quiz/parquiz')
}


  const publishQuiz = async () => {
    const trimmedKey = quizKey.trim()
    if (!trimmedKey) return

    const { data: existing, error: fetchError } = await supabase
      .from('quiz_meta')
      .select('quiz_key')
      .eq('quiz_key', trimmedKey)

    if (fetchError) {
      console.error('Fejl ved hentning:', fetchError)
      return
    }

    let error = null

    if (!existing || existing.length === 0) {
      const res = await supabase.from('quiz_meta').insert({
        quiz_key: trimmedKey,
        description,
        published: true,
        effort
      })
      error = res.error
    } else {
      const res = await supabase.from('quiz_meta').update({
        description,
        published: true,
        effort
      }).eq('quiz_key', trimmedKey)
      error = res.error
    }

    if (!error) {
      setPublished(true)
      fetchAvailableKeys()
    }
  }

  const deleteQuiz = async () => {
    if (!confirm('Er du sikker på, at du vil slette hele quizzen?')) return
    await supabase.from('quiz_questions').delete().eq('quiz_key', quizKey.trim())
    await supabase.from('quiz_meta').delete().eq('quiz_key', quizKey.trim())
    setQuizKey('')
    setQuestions([])
    setDescription('')
    setPublished(false)
    setEffort('medium')
    fetchAvailableKeys()
  }

  useEffect(() => {
    fetchAvailableKeys()
  }, [])

  useEffect(() => {
    fetchQuestions()
    fetchDescription()
  }, [quizKey])

  const handleAdd = async () => {
    if (!questionText.trim()) return
    const { error } = await supabase.from('quiz_questions').insert({
      quiz_key: quizKey.trim(),
      question: questionText,
      type,
      order: questions.length,
    })
    if (!error) {
      setQuestionText('')
      fetchQuestions()
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('quiz_questions').delete().eq('id', id)
    fetchQuestions()
  }

  const handleEdit = async (id: string) => {
    if (!editingText.trim()) return
    await supabase.from('quiz_questions').update({ question: editingText }).eq('id', id)
    setEditingId(null)
    setEditingText('')
    fetchQuestions()
  }

  const handleDragEnd = async (event: any) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = questions.findIndex(q => q.id === active.id)
    const newIndex = questions.findIndex(q => q.id === over.id)

    const newOrder = arrayMove(questions, oldIndex, newIndex)
    setQuestions(newOrder)

    for (let i = 0; i < newOrder.length; i++) {
      await supabase.from('quiz_questions').update({ order: i }).eq('id', newOrder[i].id)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Quiz Admin</h1>

      <Card className="p-4 space-y-4">
        <div>
          <Label>Quiz nøgle</Label>
          <select
            className="w-full border rounded p-2 mt-1"
            value={quizKey}
            onChange={(e) => setQuizKey(e.target.value)}
            onBlur={() => setQuizKey(prev => prev.trim())}
          >
            <option value="">Vælg eller opret ny quiz</option>
            {availableKeys.map((key) => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
          <Input
            value={quizKey}
            onChange={(e) => setQuizKey(e.target.value)}
            onBlur={() => setQuizKey(prev => prev.trim())}
            className="mt-2"
            placeholder="Eller skriv en ny quiznøgle..."
          />
        </div>

        {quizKey && (
          <>
            <div>
              <Label>Beskrivelse</Label>
              <TextareaAutosize
                className="w-full border rounded p-2 mt-1 text-sm"
                minRows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Skriv beskrivelsen af quizzen her"
              />
   

            </div>

            <div>
              <Label>Sværhedsgrad</Label>
              <select
                className="w-full border rounded p-2 mt-1"
                value={effort}
                onChange={(e) => setEffort(e.target.value)}
              >
                <option value="easy">Nem</option>
                <option value="medium">Middel</option>
                <option value="hard">Svær</option>
              </select>
            </div>

            <div>
              <Label>Spørgsmålstype</Label>
              <select
                className="w-full border rounded p-2 mt-1"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="boolean">Ja / Nej</option>
                <option value="scale">4 valgmuligheder</option>
              </select>
            </div>

            <div>
              <Label>Nyt spørgsmål</Label>
              <Input
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Skriv spørgsmålet her..."
              />
              <Button onClick={handleAdd} className="mt-2">Tilføj spørgsmål</Button>
            </div>
            
          </>
        )}
      </Card>

      {quizKey && (
        <Card className="p-4">
          <h2 className="font-semibold mb-2">Spørgsmål (drag & drop for at ændre rækkefølge)</h2>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
              {questions.map((q, i) => {
                const isEditing = editingId === q.id
                return (
                  <SortableItem key={q.id} id={q.id}>
                    <div className="flex justify-between items-center text-sm py-1 w-full">
                      {isEditing ? (
                        <div className="flex gap-2 w-full">
                          <Input
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="text-sm flex-1"
                          />
                          <Button size="sm" onClick={() => handleEdit(q.id)}>Gem</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Annuller</Button>
                        </div>
                      ) : (
                        <>
                          <span className="flex-1">{i + 1}. {q.question} ({q.type})</span>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingId(q.id)
                                setEditingText(q.question)
                              }}
                            >
                              Rediger
                            </Button>
                            
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(q.id)}>Slet</Button>
                          </div>
                          
                        </>
                      )}
                    </div>
                  </SortableItem>
                )
              })}
            </SortableContext>
          </DndContext>

          {quizKey && loadedPublished && !published && (
            <Button onClick={publishQuiz} className="mt-4">📢 Udgiv quiz</Button>
          )}
        </Card>
      )}

     {quizKey && (
  <div className="pt-4 flex gap-4">
    {published && (
      <Button onClick={saveDescription}>Opdater quiz</Button>
    )}
    <Button onClick={deleteQuiz} variant="destructive">🗑️ Slet hele quizzen</Button>
  </div>
)}

    </div>
  )
}

function SortableItem({ id, children }: { id: string, children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <div className="cursor-grab pr-2" {...attributes} {...listeners}>☰</div>
      <div className="flex-1">{children}</div>
    </div>
  )
}
