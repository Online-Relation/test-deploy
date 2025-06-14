"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useUserContext } from "@/context/UserContext"
import { format } from "date-fns"


interface Theme {
  id: string
  title: string
  created_by: string
}

export default function ThemeSelector() {
  const { user } = useUserContext()
  const [themes, setThemes] = useState<Theme[]>([])
  const [newTheme, setNewTheme] = useState("")
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null)

  const today = format(new Date(), "yyyy-MM-dd")

  useEffect(() => {
    fetchThemes()
    fetchSelectedTheme()
  }, [user])

  async function fetchThemes() {
    const { data, error } = await supabase
      .from("memory_themes")
      .select("*")
      .order("created_at", { ascending: true })

    if (!error && data) {
      setThemes(data)
    }
  }

  async function fetchSelectedTheme() {
    const { data } = await supabase
      .from("memory_settings")
      .select("selected_theme_id")
      .eq("setting_date", today)
      .single()

    if (data?.selected_theme_id) {
      setSelectedThemeId(data.selected_theme_id)
    }
  }

  async function handleThemeSelect(themeId: string) {
    setSelectedThemeId(themeId)

    await supabase
      .from("memory_settings")
      .upsert({
        setting_date: today,
        selected_theme_id: themeId,
      }, { onConflict: "setting_date" })
  }

  async function handleAddTheme() {
    if (!user || !newTheme.trim()) return

    const { error } = await supabase.from("memory_themes").insert({
      title: newTheme,
      created_by: user.id,
    })

    if (!error) {
      setNewTheme("")
      fetchThemes()
    }
  }

  const selectedThemeTitle = themes.find((t) => t.id === selectedThemeId)?.title

  return (
    <div className="mb-6 bg-white shadow rounded-xl p-4 space-y-3">
      <h2 className="text-lg font-semibold">Dagens tema</h2>

      {selectedThemeTitle ? (
        <p className="text-sm">🔸 <strong>{selectedThemeTitle}</strong></p>
      ) : (
        <p className="text-sm text-gray-500">Intet tema valgt endnu</p>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Tilføj nyt tema"
          value={newTheme}
          onChange={(e) => setNewTheme(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
        />
        <button onClick={handleAddTheme} className="btn">
          Tilføj
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {themes.map((theme) => (
          <button
  key={theme.id}
  onClick={() => handleThemeSelect(theme.id)}
  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 shadow-sm
    ${theme.id === selectedThemeId 
      ? "bg-primary text-white"
      : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"}`}
>
  {theme.title}
</button>
        ))}
      </div>
    </div>
  )
}
