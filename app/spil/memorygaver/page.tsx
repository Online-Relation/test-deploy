// /app/spil/memorygaver/page.tsx
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useUserContext } from "@/context/UserContext"
import Image from "next/image"
import { v4 as uuidv4 } from "uuid"

export default function MemoryGaverPage() {
  const { user: profile } = useUserContext()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [note, setNote] = useState("")
  const [cards, setCards] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchCards()
  }, [profile])

  async function fetchCards() {
    if (!profile) return

    const { data, error } = await supabase
      .from("memory_cards")
      .select("*")
      .or(`user_id.eq.${profile.id},recipient_id.eq.${profile.id}`)
      .order("created_at", { ascending: false })

    if (!error) setCards(data)
  }

  async function handleUpload() {
    if (!profile || !imageFile) return
    setUploading(true)

    const filename = `${uuidv4()}.jpg`
    const { data: storageData, error: storageError } = await supabase.storage
      .from("memory-cards")
      .upload(filename, imageFile)

    if (storageError) {
      console.error("Upload error", storageError)
      setUploading(false)
      return
    }

    const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/memory-cards/${filename}`

    const { error: insertError } = await supabase.from("memory_cards").insert({
      user_id: profile.id,
      recipient_id: profile.partner_id, // kræver partner_id i profiles!
      image_url: imageUrl,
      note,
    })

    if (insertError) {
      console.error("Insert error", insertError)
    }

    setImageFile(null)
    setNote("")
    setUploading(false)
    fetchCards()
  }

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Memorygaver i dag</h1>

      <div className="bg-white rounded-xl shadow p-4 space-y-3">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        />
        <textarea
          className="w-full border rounded p-2"
          rows={3}
          placeholder="Skriv en lille note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button
          onClick={handleUpload}
          className="btn btn-primary w-full"
          disabled={uploading}
        >
          {uploading ? "Uploader..." : "Upload billede"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        {cards.map((card) => {
            if (!profile) return <div>Indlæser...</div>

          const isMine = card.user_id === profile.id
          const showImage = isMine || card.revealed

          return (
            <div
              key={card.id}
              className="relative aspect-square border rounded overflow-hidden shadow"
            >
              {showImage ? (
                <Image
  src={card.image_url}
  alt="Memory"
  fill
  sizes="100vw"
  className="object-cover"
/>

              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-xl blur-md">
                  ?
                </div>
              )}
              {showImage && (
                <div className="absolute bottom-0 bg-white/80 text-sm p-2 w-full">
                  {card.note}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
