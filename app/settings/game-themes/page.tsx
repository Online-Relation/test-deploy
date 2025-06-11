// /app/settings/game-themes/page.tsx

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { X } from "lucide-react";

interface Theme {
  id: string;
  name: string;
  background_class: string | null;
  card_class: string | null;
  button_class: string | null;
}

export default function GameThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [newName, setNewName] = useState("");
  const [bgClass, setBgClass] = useState("");
  const [cardClass, setCardClass] = useState("");
  const [btnClass, setBtnClass] = useState("");

  useEffect(() => {
    fetchThemes();
  }, []);

  const fetchThemes = async () => {
    const { data, error } = await supabase.from("game_themes").select("*");
    if (!error && data) setThemes(data);
  };

  const addTheme = async () => {
    if (!newName.trim()) return;
    const { data, error } = await supabase
      .from("game_themes")
      .insert([{ name: newName, background_class: bgClass, card_class: cardClass, button_class: btnClass }])
      .select();
    if (!error && data) {
      setThemes((prev) => [...prev, ...data]);
      setNewName("");
      setBgClass("");
      setCardClass("");
      setBtnClass("");
    }
  };

  const updateTheme = async (theme: Theme) => {
    const { error } = await supabase
      .from("game_themes")
      .update({
        background_class: theme.background_class,
        card_class: theme.card_class,
        button_class: theme.button_class,
      })
      .eq("id", theme.id);
    if (error) console.error("Fejl ved opdatering:", error.message);
  };

  const deleteTheme = async (id: string) => {
    const { error } = await supabase.from("game_themes").delete().eq("id", id);
    if (!error) setThemes((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Temaer til Sandhed eller Konsekvens</h1>

      <div className="grid gap-2">
        <input
          type="text"
          placeholder="Navn (f.eks. Dark)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="border px-4 py-2 rounded"
        />
        <input
          type="text"
          placeholder="Baggrund CSS class (f.eks. bg-black text-white)"
          value={bgClass}
          onChange={(e) => setBgClass(e.target.value)}
          className="border px-4 py-2 rounded"
        />
        <input
          type="text"
          placeholder="Kort CSS class (f.eks. border-gray-800)"
          value={cardClass}
          onChange={(e) => setCardClass(e.target.value)}
          className="border px-4 py-2 rounded"
        />
        <input
          type="text"
          placeholder="Knap CSS class (f.eks. bg-gray-700 text-white)"
          value={btnClass}
          onChange={(e) => setBtnClass(e.target.value)}
          className="border px-4 py-2 rounded"
        />
        <button onClick={addTheme} className="bg-black text-white px-4 py-2 rounded">
          Tilføj tema
        </button>
      </div>

      <div className="pt-6 space-y-4">
        {themes.map((theme, idx) => (
          <div
            key={theme.id}
            className="border rounded p-4 space-y-2"
          >
            <div className="flex justify-between items-center">
              <div className="font-semibold text-lg">{theme.name}</div>
              <button onClick={() => deleteTheme(theme.id)} className="text-red-600 hover:underline">
                <X size={16} />
              </button>
            </div>
            <input
              type="text"
              value={theme.background_class ?? ""}
              onChange={(e) => setThemes(prev => prev.map((t, i) => i === idx ? { ...t, background_class: e.target.value } : t))}
              placeholder="Baggrund CSS class"
              className="border px-3 py-1 rounded w-full"
            />
            <input
              type="text"
              value={theme.card_class ?? ""}
              onChange={(e) => setThemes(prev => prev.map((t, i) => i === idx ? { ...t, card_class: e.target.value } : t))}
              placeholder="Kort CSS class"
              className="border px-3 py-1 rounded w-full"
            />
            <input
              type="text"
              value={theme.button_class ?? ""}
              onChange={(e) => setThemes(prev => prev.map((t, i) => i === idx ? { ...t, button_class: e.target.value } : t))}
              placeholder="Knap CSS class"
              className="border px-3 py-1 rounded w-full"
            />
            <button
              onClick={() => updateTheme(theme)}
              className="text-sm text-white bg-black px-4 py-1 rounded"
            >
              Gem ændringer
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
