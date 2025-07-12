// /app/personlighed/tanker/page.tsx
'use client';
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const defaultCategories = ["Parforhold", "Privat", "Arbejde"];
const initialTags = ["taknemmelig", "udfordring", "mål"];

type Entry = {
  id: string;
  created_at: string;
  title: string;
  category: string;
  tags: string[];
  text: string;
  reflection: string;
  followup_question?: string;
  followup_created_at?: string;
  followup_is_active?: boolean;
  followup_resolved_at?: string;
  followup_resolution_text?: string;
};

const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor'), { ssr: false });

export default function TankerPage() {
  // Kategorier + tilføj ny kategori
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [newCategory, setNewCategory] = useState("");
  // Dagbogsindhold og editor-states
  const [entries, setEntries] = useState<Entry[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(defaultCategories[0]);
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [reflection, setReflection] = useState("");
  const [followup, setFollowup] = useState("");
  const [streak, setStreak] = useState(0);
  // Sidebar/filtrering
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Hent entries fra Supabase ved første load
  useEffect(() => {
    async function fetchEntries() {
      setLoading(true);
      const { data, error } = await supabase
        .from('tanker_entries')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setEntries(data as Entry[]);
      setLoading(false);
    }
    fetchEntries();
    // Kategorier fra localStorage (valgfrit)
    const cat = localStorage.getItem("tanker_categories");
    if (cat) setCategories(JSON.parse(cat));
    const s = localStorage.getItem("tanker_streak");
    if (s) setStreak(Number(s));
  }, []);

  // Gem kategorier hvis de ændres
  useEffect(() => {
    localStorage.setItem("tanker_categories", JSON.stringify(categories));
  }, [categories]);

  // Tilføj ny kategori
  function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    const cat = newCategory.trim();
    if (!cat || categories.includes(cat)) return;
    setCategories([...categories, cat]);
    setCategory(cat);
    setNewCategory("");
  }

  // Tilføj nyt dagbogsindlæg inkl. opfølgning – GEMMER I SUPABASE
  async function handleAddEntry() {
    const hasFollowup = !!followup.trim();
    const newEntry = {
      title,
      category,
      tags,
      text,
      reflection,
      followup_question: hasFollowup ? followup : null,
      followup_created_at: hasFollowup ? new Date().toISOString() : null,
      followup_is_active: hasFollowup ? true : null,
      followup_resolved_at: null,
      followup_resolution_text: null,
    };

    // Gemmer i Supabase
    const { data, error } = await supabase
      .from('tanker_entries')
      .insert([newEntry])
      .select();

    if (error) {
      alert("Kunne ikke gemme indlæg: " + error.message);
      return;
    }

    // Tilføj det nye indlæg til visning
    setEntries([...(data || []), ...entries]);
    setTitle("");
    setCategory(categories[0] || "");
    setTags([]);
    setText("");
    setReflection("");
    setFollowup("");
    localStorage.removeItem("tanker_autosave");
    if (data && data[0]?.created_at) updateStreak(data[0].created_at.split("T")[0]);
  }

  // Opdater streak
  function updateStreak(today: string) {
    let currentStreak = streak;
    if (entries.length === 0 || (entries[0]?.created_at?.split("T")[0] !== today)) {
      currentStreak += 1;
      setStreak(currentStreak);
      localStorage.setItem("tanker_streak", String(currentStreak));
    }
  }

  // Filtrering
  const filteredEntries = entries.filter((entry) => {
    if (selectedCategory && entry.category !== selectedCategory) return false;
    if (selectedTag && (!entry.tags || !entry.tags.includes(selectedTag))) return false;
    return true;
  });
  const displayedEntries = filteredEntries.filter((entry) =>
    (entry.title + entry.text + entry.reflection)
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100">
      {/* Sidebar */}
      <aside className="w-64 p-4 border-r bg-white/90 flex flex-col gap-6">
        <div>
          <h3 className="font-semibold text-lg mb-2">Kategorier</h3>
          <ul>
            {categories.map((cat) => (
              <li key={cat}>
                <button
                  className={`block px-2 py-1 rounded ${selectedCategory === cat ? "bg-blue-200 font-bold" : "hover:bg-blue-100"}`}
                  onClick={() =>
                    setSelectedCategory(selectedCategory === cat ? null : cat)
                  }
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
          {/* Tilføj kategori */}
          <form onSubmit={handleAddCategory} className="mt-3 flex gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Ny kategori"
              className="flex-1 px-2 py-1 border rounded"
              maxLength={30}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-3 rounded hover:bg-blue-700"
              disabled={!newCategory.trim() || categories.includes(newCategory.trim())}
              title={categories.includes(newCategory.trim()) ? "Kategori findes allerede" : "Tilføj"}
            >
              +
            </button>
          </form>
        </div>
        <div>
          <h3 className="font-semibold text-lg mb-2">Tags</h3>
          <ul className="flex flex-wrap gap-2">
            {initialTags.map((tag) => (
              <li key={tag}>
                <button
                  className={`px-2 py-1 rounded text-sm ${selectedTag === tag ? "bg-green-200 font-bold" : "hover:bg-green-100"}`}
                  onClick={() =>
                    setSelectedTag(selectedTag === tag ? null : tag)
                  }
                >
                  #{tag}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6">
          <span className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-xl font-bold">
            🔥 {streak} dages streak
          </span>
        </div>
        <div className="mt-6">
          <input
            type="text"
            placeholder="Søg tanker…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-2 py-1 rounded border"
          />
        </div>
      </aside>

      {/* Hovedsektion */}
      <main className="flex-1 p-10">
        {/* Editor */}
        <section className="max-w-2xl mx-auto bg-white/70 p-8 rounded-2xl shadow mb-8">
          <h2 className="text-xl font-bold mb-3">Hvad vil du skrive om i dag?</h2>
          <input
            className="w-full border-b mb-3 p-2 text-lg bg-transparent"
            placeholder="Overskrift (valgfri)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="flex gap-4 mb-3">
            <select
              className="border px-2 py-1 rounded"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <input
              type="text"
              className="border px-2 py-1 rounded flex-1"
              placeholder="Tilføj tags (komma-adskilt)"
              value={tags.join(",")}
              onChange={(e) =>
                setTags(
                  e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                )
              }
            />
          </div>

          {/* Rich Text Editor */}
          <div className="mb-3">
            <RichTextEditor
              value={text}
              onChange={setText}
            />
          </div>

          {/* Refleksion */}
          <input
            className="w-full border-b mb-3 p-2"
            placeholder="Dagens læring eller taknemmelighed…"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
          />

          {/* Opfølgning */}
          <input
            className="w-full border-b mb-3 p-2"
            placeholder="Opfølgning (problem du vil følge op på…)"
            value={followup}
            onChange={(e) => setFollowup(e.target.value)}
          />

          <button
            onClick={handleAddEntry}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-700"
            disabled={!text}
          >
            Tilføj indlæg
          </button>
        </section>

        {/* Blogvisning */}
        <section className="max-w-2xl mx-auto">
          {loading ? (
            <div className="text-center text-gray-500">Indlæser…</div>
          ) : displayedEntries.length === 0 ? (
            <div className="text-center text-gray-400">Ingen tanker endnu…</div>
          ) : (
            displayedEntries.map((entry) => (
              <article
                key={entry.id}
                className="mb-8 p-6 rounded-xl bg-white/90 border shadow flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">{entry.created_at?.split("T")[0]}</span>
                  <span className="px-2 py-1 bg-blue-50 rounded text-blue-700 text-xs">
                    {entry.category}
                  </span>
                </div>
                {entry.title && (
                  <h3 className="text-xl font-bold">{entry.title}</h3>
                )}
                <div
                  className="text-gray-700 prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: entry.text }}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {entry.tags && entry.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                {entry.reflection && (
                  <div className="border-t pt-2 mt-2 text-sm text-purple-700 italic">
                    {entry.reflection}
                  </div>
                )}
                {/* Opfølgning visning */}
                {entry.followup_question && (
                  <div className="border-t pt-2 mt-2 text-sm text-blue-700">
                    <span className="font-semibold">Opfølgning: </span>
                    {entry.followup_question}
                  </div>
                )}
              </article>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
