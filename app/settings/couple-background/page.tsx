// /app/settings/background/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

export default function BackgroundPage() {
  const [text, setText] = useState('')
  const [lastSaved, setLastSaved] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchBackground = async () => {
      const { data } = await supabase
        .from('couple_background')
        .select('background')
        .single()
      if (data) {
        setText(data.background)
        setLastSaved(data.background)
      }
    }
    fetchBackground()
  }, [])

  const saveBackground = async () => {
    setLoading(true)
    const { error } = await supabase
      .from('couple_background')
      .upsert({ background: text })
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
          <li>🧑‍🤝‍🧑 <strong>Vores historie:</strong> Vi har været sammen i [x] år og har oplevet både dybe følelser og store udfordringer. Vores forhold har udviklet sig gennem [sæt nogle ord på jeres rejse – fx flytninger, børn, karriereændringer].</li>
          <li>🧨 <strong>Tidligere konflikter:</strong> Vi har tidligere oplevet [fx tillidsbrud, utroskab, jalousi, manglende kommunikation]. Det har påvirket os, og vi arbejder aktivt med det.</li>
          <li>💬 <strong>Kommunikation:</strong> Vi har samtaler hver uge, men har nogle gange svært ved at holde fokus. Den ene part kan blive overvældet hurtigt, og den anden savner dybde.</li>
          <li>🛏️ <strong>Seksualitet og intimitet:</strong> Vi har [beskriv niveauet af lyst, forskelligheder i behov, eller evt. svære følelser omkring sex]. Det er noget, vi gerne vil blive bedre til at tale om.</li>
          <li>🎯 <strong>Vores mål:</strong> Vi vil gerne styrke tillid, nærhed og følelsen af at være et team. Vi ønsker at være mere åbne, tage hinanden alvorligt og få nogle fælles rutiner.</li>
          <li>❤️ <strong>Værdier:</strong> Det er vigtigt for os med ærlighed, tryghed, respekt – og humor.</li>
          <li>⚠️ <strong>Særlige hensyn:</strong> [fx ADHD, traumer, børn fra tidligere forhold, mental sårbarhed]</li>
          <li>🔒<strong>Vigtige instruktioner til analysen:</strong> Brug aldrig ordene: utroskab, kold, svigt, fejl, skylde, forkert. Undgå alt der kan virke dømmende. Tag hensyn til, at der har været sår på tillid, men skriv nænsomt og med fokus på fremtid og styrker. Anbefalingerne må meget gerne motivere og støtte os – men skal ikke komme med råd som 'gå fra hinanden' eller lignende.</li>
        </ul>
      </div>
    </div>
  )
}
