// /app/settings/background/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useUserContext } from '@/context/UserContext'

export default function BackgroundPage() {
  const { user } = useUserContext()
  const [text, setText] = useState('')
  const [lastSaved, setLastSaved] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchBackground = async () => {
      if (!user) return

      const { data, error } = await supabase
        .from('couple_background')
        .select('background')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.error("❌ Fejl ved hentning:", error.message)
        return
      }

      if (data) {
        setText(data.background)
        setLastSaved(data.background)
      }
    }

    fetchBackground()
  }, [user])

  const saveBackground = async () => {
    if (!user) return

    setLoading(true)

    const { error } = await supabase
      .from('couple_background')
      .upsert({
        user_id: user.id,
        background: text
      })

    setLoading(false)

    if (!error) {
      setLastSaved(text)
      alert('Historie gemt ✅')
    } else {
      alert('Noget gik galt ❌')
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">🧠 Forholdets baggrund</h1>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={12}
        placeholder="Skriv jeres historie her..."
      />

      <Button onClick={saveBackground} disabled={loading}>
        Gem
      </Button>

      {lastSaved && (
        <div className="mt-8 border-t pt-6">
          <h2 className="font-semibold text-muted-foreground text-sm mb-2">Sidst gemt tekst:</h2>
          <div className="bg-muted p-4 rounded text-sm whitespace-pre-wrap border">
            {lastSaved}
          </div>
        </div>
      )}
       <div className="text-sm text-muted-foreground space-y-4 mt-8">
        <p className="font-semibold">🔍 Inspiration til hvad du kan skrive:</p>
        <ul className="list-disc pl-4 space-y-2">
          <li><strong>Vores historie:</strong> Vi har været sammen i [x] år...</li>
          <li><strong>Tidligere konflikter:</strong> Vi har tidligere oplevet...</li>
          <li><strong>Kommunikation:</strong> Vi har samtaler hver uge...</li>
          <li><strong>Seksualitet og intimitet:</strong> Vi har [beskriv niveauet af lyst...]</li>
          <li><strong>Vores mål:</strong> Vi vil gerne styrke tillid...</li>
          <li><strong>Værdier:</strong> Det er vigtigt for os med ærlighed...</li>
          <li><strong>Særlige hensyn:</strong> [fx ADHD, traumer, børn fra tidligere forhold...]</li>
          <li><strong>Vigtige instruktioner:</strong> Undgå ord som "utroskab", "fejl"...</li>
        </ul>
      </div>
    </div>
  )
}


     