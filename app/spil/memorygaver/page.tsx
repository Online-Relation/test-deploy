"use client"

import { useEffect, useState, useRef } from "react"
import { supabase, SUPABASE_PUBLIC_URL } from "@/lib/supabaseClient"
import { useUserContext } from "@/context/UserContext"
import { v4 as uuidv4 } from "uuid"
import Modal from "@/components/ui/ImageModal"
import confetti from "canvas-confetti"
import ThemeSelector from "@/components/memory/ThemeSelector"


export default function MemoryGaverPage() {
  const { user: profile } = useUserContext()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [note, setNote] = useState("")
  const [cards, setCards] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [userNames, setUserNames] = useState<Record<string, string>>({})
  const [selectedCard, setSelectedCard] = useState<any | null>(null)
  const [revealingId, setRevealingId] = useState<string | null>(null)
  const confettiRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (profile) {
      fetchCards()
      fetchUsers()
    }
  }, [profile])

  async function fetchCards() {
    const { data, error } = await supabase
      .from("memory_cards")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error) setCards(data)
  }

  async function fetchUsers() {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name")

    if (!error && data) {
      const nameMap: Record<string, string> = {}
      data.forEach((u) => {
        nameMap[u.id] = u.display_name
      })
      setUserNames(nameMap)
    }
  }

  async function handleUpload() {
    if (!profile || !imageFile) return
    setUploading(true)

    const filename = `${uuidv4()}.jpg`
    const { error: storageError } = await supabase.storage
      .from("memory-cards")
      .upload(filename, imageFile)

    if (storageError) {
      console.error("Upload error", storageError)
      setUploading(false)
      return
    }

    const imageUrl = `${SUPABASE_PUBLIC_URL}/storage/v1/object/public/memory-cards/${filename}`

    const { error: insertError } = await supabase.from("memory_cards").insert({
      user_id: profile.id,
      recipient_id: profile.partner_id,
      image_url: imageUrl,
      note,
      revealed: false,
    })

    if (insertError) {
      console.error("Insert error", insertError)
    }

    setImageFile(null)
    setNote("")
    setUploading(false)
    fetchCards()
  }

  async function revealCard(cardId: string) {
    setRevealingId(cardId)

    // 🎊 Trigger confetti
    confetti({
      particleCount: 80,
      spread: 90,
      origin: { y: 0.6 },
    })

    setTimeout(async () => {
      const { error } = await supabase
        .from("memory_cards")
        .update({ revealed: true })
        .eq("id", cardId)

      if (error) {
        console.error("Reveal error", error.message)
      } else {
        fetchCards()
      }

      setRevealingId(null)
    }, 600)
  }

  async function deleteCard(cardId: string, imagePath: string) {
    const { error: deleteError } = await supabase
      .from("memory_cards")
      .delete()
      .eq("id", cardId)

    if (deleteError) {
      console.error("Delete error", deleteError.message)
    }

    const filename = imagePath.split("/").pop() || ""
    await supabase.storage
      .from("memory-cards")
      .remove([filename])

    fetchCards()
  }

  if (!profile) return <div>Indlæser...</div>

  return (
    <div className="max-w-xl mx-auto p-4 relative" ref={confettiRef}>
         <ThemeSelector />
      <h1 className="text-xl font-bold mb-4">Memorygaver i dag</h1>

      <div className="bg-white rounded-xl shadow p-4 space-y-3">
  <input
    ref={fileInputRef}
    type="file"
    accept="image/*"
    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
    className="hidden"
  />
  <button
    onClick={() => fileInputRef.current?.click()}
    className="btn btn-secondary w-full"
  >
    Vælg billede
  </button>
  {imageFile && (
  <p className="text-sm text-muted-foreground text-center mt-1">
    Valgt fil: <span className="font-medium">{imageFile.name}</span>
  </p>
)}


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
    disabled={uploading || !imageFile}
  >
    {uploading ? "Uploader..." : "Upload billede"}
  </button>
</div>


      <div className="grid grid-cols-2 gap-4 mt-6">
        {cards.map((card) => {
          const isMine = card.user_id === profile.id
          const showImage = card.revealed
          const uploaderName = userNames[card.user_id] || "Ukendt"
          const isRevealing = revealingId === card.id

          return (
            <div
              key={card.id}
              className={`relative aspect-square border rounded overflow-hidden shadow group bg-gray-100 cursor-pointer transition-all duration-500 ${
                isRevealing ? "animate-pingOnce" : ""
              }`}
              onClick={() => showImage && setSelectedCard(card)}
            >
              <img
                src={card.image_url}
                alt="Memory"
                className={`w-full h-full object-cover transition-all duration-500 ease-in-out
  ${showImage || isRevealing
    ? "blur-0 grayscale-0"
    : "blur-md grayscale"}
`}

              />

              <div className="absolute top-1 left-1 bg-white/80 text-xs px-2 py-1 rounded z-10">
                {uploaderName}
              </div>

              {isMine && !card.revealed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    revealCard(card.id)
                  }}
                  className="absolute bottom-2 left-2 text-xs bg-blue-600 text-white rounded px-2 py-1 z-10"
                >
                  🔓 Afslør
                </button>
              )}

              {isMine && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteCard(card.id, card.image_url)
                  }}
                  className="absolute bottom-2 right-2 text-xs bg-red-600 text-white rounded px-2 py-1 z-10"
                >
                  🗑 Slet
                </button>
              )}

              {/* ✨ Magisk glød */}
              {isRevealing && (
                <div className="absolute inset-0 rounded ring-4 ring-pink-400 animate-pulse z-10 pointer-events-none"></div>
              )}
            </div>
          )
        })}
      </div>

      {selectedCard && (
        <Modal
          title={userNames[selectedCard.user_id] || "Memory"}
          onClose={() => setSelectedCard(null)}
          imageUrl={selectedCard.image_url}
          note={selectedCard.note}
        />
      )}
    </div>
  )
}
