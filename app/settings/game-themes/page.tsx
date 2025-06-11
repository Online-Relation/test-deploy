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

interface CustomCard {
  id: string;
  text: string;
  type: "truth" | "dare";
  difficulty?: string;
  category?: string;
}

const difficultyOptions = ["easy", "medium", "hard"];
const categoryOptions = ["romantik", "udfordring", "kreativ", "sjov"];

export default function GameThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [newName, setNewName] = useState("");
  const [bgClass, setBgClass] = useState("");
  const [cardClass, setCardClass] = useState("");
  const [btnClass, setBtnClass] = useState("");

  const [newCardText, setNewCardText] = useState("");
  const [newCardType, setNewCardType] = useState<"truth" | "dare">("truth");
  const [newCardDifficulty, setNewCardDifficulty] = useState("");
  const [newCardCategory, setNewCardCategory] = useState("");
  const [customCards, setCustomCards] = useState<CustomCard[]>([]);

  useEffect(() => {
    fetchThemes();
    fetchCards();
  }, []);

  const fetchThemes = async () => {
    const { data, error } = await supabase.from("game_themes").select("*");
    if (!error && data) setThemes(data);
  };

  const fetchCards = async () => {
    const { data, error } = await supabase.from("truth_dare_cards").select("id, text, type, difficulty, category").eq("custom", true);
    if (!error && data) setCustomCards(data);
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
        name: theme.name,
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

  const addCard = async () => {
    if (!newCardText.trim()) return;
    const { data, error } = await supabase
      .from("truth_dare_cards")
      .insert([{ text: newCardText, type: newCardType, difficulty: newCardDifficulty, category: newCardCategory, custom: true }])
      .select();
    if (!error && data) {
      setCustomCards((prev) => [...prev, ...data]);
      setNewCardText("");
      setNewCardType("truth");
      setNewCardDifficulty("");
      setNewCardCategory("");
    }
  };

  const deleteCard = async (id: string) => {
    const { error } = await supabase.from("truth_dare_cards").delete().eq("id", id);
    if (!error) setCustomCards((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-12">
      <div>
        <h1 className="text-2xl font-bold mb-4">Temaer til Sandhed eller Konsekvens</h1>
        <div className="grid gap-2">
          <input type="text" placeholder="Navn (f.eks. Dark)" value={newName} onChange={(e) => setNewName(e.target.value)} className="border px-4 py-2 rounded" />
          <input type="text" placeholder="Baggrund CSS class" value={bgClass} onChange={(e) => setBgClass(e.target.value)} className="border px-4 py-2 rounded" />
          <input type="text" placeholder="Kort CSS class" value={cardClass} onChange={(e) => setCardClass(e.target.value)} className="border px-4 py-2 rounded" />
          <input type="text" placeholder="Knap CSS class" value={btnClass} onChange={(e) => setBtnClass(e.target.value)} className="border px-4 py-2 rounded" />
          <button onClick={addTheme} className="bg-black text-white px-4 py-2 rounded">Tilføj tema</button>
        </div>

        <div className="pt-6 space-y-4">
          {themes.map((theme, idx) => (
            <div key={theme.id} className="border rounded p-4 space-y-2">
              <div className="flex justify-between items-center">
                <input type="text" value={theme.name} onChange={(e) => setThemes(prev => prev.map((t, i) => i === idx ? { ...t, name: e.target.value } : t))} placeholder="Navn" className="border px-3 py-1 rounded w-full font-semibold text-lg" />
                <button onClick={() => deleteTheme(theme.id)} className="text-red-600 hover:underline ml-2"><X size={16} /></button>
              </div>
              <input type="text" value={theme.background_class ?? ""} onChange={(e) => setThemes(prev => prev.map((t, i) => i === idx ? { ...t, background_class: e.target.value } : t))} placeholder="Baggrund CSS class" className="border px-3 py-1 rounded w-full" />
              <input type="text" value={theme.card_class ?? ""} onChange={(e) => setThemes(prev => prev.map((t, i) => i === idx ? { ...t, card_class: e.target.value } : t))} placeholder="Kort CSS class" className="border px-3 py-1 rounded w-full" />
              <input type="text" value={theme.button_class ?? ""} onChange={(e) => setThemes(prev => prev.map((t, i) => i === idx ? { ...t, button_class: e.target.value } : t))} placeholder="Knap CSS class" className="border px-3 py-1 rounded w-full" />
              <button onClick={() => updateTheme(theme)} className="text-sm text-white bg-black px-4 py-1 rounded">Gem ændringer</button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Tilføj egne kort</h2>
        <textarea value={newCardText} onChange={(e) => setNewCardText(e.target.value)} placeholder="Skriv dit kort her..." className="w-full border px-3 py-2 rounded mb-2" rows={3} />
        <div className="grid grid-cols-2 gap-2 mb-2">
          <select value={newCardDifficulty} onChange={(e) => setNewCardDifficulty(e.target.value)} className="border px-3 py-2 rounded">
            <option value="">Vælg sværhedsgrad</option>
            {difficultyOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <select value={newCardCategory} onChange={(e) => setNewCardCategory(e.target.value)} className="border px-3 py-2 rounded">
            <option value="">Vælg kategori</option>
            {categoryOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <label>
            <input type="radio" value="truth" checked={newCardType === "truth"} onChange={() => setNewCardType("truth")} /> Sandhed
          </label>
          <label>
            <input type="radio" value="dare" checked={newCardType === "dare"} onChange={() => setNewCardType("dare")} /> Konsekvens
          </label>
          <button onClick={addCard} className="bg-black text-white px-4 py-2 rounded">Tilføj kort</button>
        </div>
        <div className="space-y-2">
          {customCards.map((card) => (
            <div key={card.id} className="text-sm border px-3 py-2 rounded flex justify-between items-start">
              <div>
                <strong>{card.type === "truth" ? "Sandhed:" : "Konsekvens:"}</strong> {card.text}<br />
                <em className="text-xs text-gray-500">{card.difficulty} | {card.category}</em>
              </div>
              <button onClick={() => deleteCard(card.id)} className="ml-4 text-red-600 hover:underline">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
