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
  banner_image_url?: string | null;
};

const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor'), { ssr: false });

export default function TankerPage() {
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [newCategory, setNewCategory] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(defaultCategories[0]);
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [reflection, setReflection] = useState("");
  const [followup, setFollowup] = useState("");
  const [streak, setStreak] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Redigeringstilstand
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editText, setEditText] = useState<string>('');
  const [editReflection, setEditReflection] = useState<string>('');
  const [editFollowup, setEditFollowup] = useState<string>('');
  const [editBannerUrl, setEditBannerUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Oprettelse - nyt billede URL og upload-status
  const [bannerImageUrl, setBannerImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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
    const cat = localStorage.getItem("tanker_categories");
    if (cat) setCategories(JSON.parse(cat));
    const s = localStorage.getItem("tanker_streak");
    if (s) setStreak(Number(s));
  }, []);

  useEffect(() => {
    localStorage.setItem("tanker_categories", JSON.stringify(categories));
  }, [categories]);

  function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    const cat = newCategory.trim();
    if (!cat || categories.includes(cat)) return;
    setCategories([...categories, cat]);
    setCategory(cat);
    setNewCategory("");
  }

  async function handleUploadImage(file: File) {
    setUploading(true);
    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from('tanker-images')
      .upload(fileName, file);
    if (error) {
      alert("Fejl ved upload: " + error.message);
      setUploading(false);
      return null;
    }
    const publicUrl = supabase.storage.from('tanker-images').getPublicUrl(fileName).data.publicUrl;
    setUploading(false);
    return publicUrl;
  }

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
      banner_image_url: bannerImageUrl,
    };
    const { data, error } = await supabase
      .from('tanker_entries')
      .insert([newEntry])
      .select();

    if (error) {
      alert("Kunne ikke gemme indlæg: " + error.message);
      return;
    }

    setEntries([...(data || []), ...entries]);
    setTitle("");
    setCategory(categories[0] || "");
    setTags([]);
    setText("");
    setReflection("");
    setFollowup("");
    setBannerImageUrl(null);
    localStorage.removeItem("tanker_autosave");
    if (data && data[0]?.created_at) updateStreak(data[0].created_at.split("T")[0]);
  }

  function updateStreak(today: string) {
    let currentStreak = streak;
    if (entries.length === 0 || (entries[0]?.created_at?.split("T")[0] !== today)) {
      currentStreak += 1;
      setStreak(currentStreak);
      localStorage.setItem("tanker_streak", String(currentStreak));
    }
  }

  async function handleSaveEdit(entryId: string) {
    setSaving(true);
    const { error } = await supabase
      .from("tanker_entries")
      .update({
        title: editTitle,
        text: editText,
        reflection: editReflection,
        followup_question: editFollowup || null,
        banner_image_url: editBannerUrl,
      })
      .eq("id", entryId);
    if (!error) {
      setEntries(prev =>
        prev.map(e =>
          e.id === entryId
            ? {
                ...e,
                title: editTitle,
                text: editText,
                reflection: editReflection,
                followup_question: editFollowup || null,
                banner_image_url: editBannerUrl,
              } as Entry
            : e
        )
      );

      setEditId(null);
      setEditBannerUrl(null);
    } else {
      alert("Kunne ikke opdatere indlæg");
    }
    setSaving(false);
  }

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

  // Fil for redigering upload
  async function onEditFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    const url = await handleUploadImage(e.target.files[0]);
    if (url) setEditBannerUrl(url);
  }

  // Fil til oprettelse upload
  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    const url = await handleUploadImage(e.target.files[0]);
    if (url) setBannerImageUrl(url);
  }

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

          <div className="mb-3">
            <RichTextEditor
              value={text}
              onChange={setText}
            />
          </div>

          <input
            className="w-full border-b mb-3 p-2"
            placeholder="Dagens læring eller taknemmelighed…"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
          />

          <input
            className="w-full border-b mb-3 p-2"
            placeholder="Opfølgning (problem du vil følge op på…)"
            value={followup}
            onChange={(e) => setFollowup(e.target.value)}
          />

          <div className="mb-3">
            <label className="block mb-1 font-semibold">Bannerbillede (valgfrit)</label>
            <input type="file" onChange={onFileChange} disabled={uploading} />
            {bannerImageUrl && (
              <img
                src={bannerImageUrl}
                alt="Banner"
                className="mt-2 w-full h-48 object-cover rounded"
              />
            )}
          </div>

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
                {/* Banner billede */}
                {entry.banner_image_url && (
                  <img
                    src={entry.banner_image_url}
                    alt="Banner"
                    className="w-full h-48 object-cover rounded mb-4"
                  />
                )}

                <div className="flex items-center justify-between">
                  {editId === entry.id ? (
                    <input
                      className="text-gray-500 border-b px-1 py-0.5 text-sm w-48"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      disabled={saving}
                    />
                  ) : (
                    <span className="text-gray-500">{entry.created_at?.split("T")[0]}</span>
                  )}

                  {editId !== entry.id && (
                    <span className="px-2 py-1 bg-blue-50 rounded text-blue-700 text-xs">
                      {entry.category}
                    </span>
                  )}
                </div>

                {editId === entry.id ? (
                  <>
                    <RichTextEditor
                      value={editText}
                      onChange={setEditText}
                    />
                    <div className="mt-3">
                      <label className="block mb-1 font-semibold">Bannerbillede (valgfrit)</label>
                      <input type="file" onChange={onEditFileChange} disabled={saving || uploading} />
                      {editBannerUrl && (
                        <img
                          src={editBannerUrl}
                          alt="Banner"
                          className="mt-2 w-full h-48 object-cover rounded"
                        />
                      )}
                      {editBannerUrl && (
                        <button
                          className="mt-2 px-4 py-1 bg-red-600 text-white rounded"
                          onClick={() => setEditBannerUrl(null)}
                          disabled={saving}
                        >
                          Fjern billede
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <h3 className="text-xl font-bold" dangerouslySetInnerHTML={{ __html: entry.title }} />
                )}

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

                {editId === entry.id ? (
                  <input
                    className="w-full border-b mb-3 p-2"
                    placeholder="Dagens læring eller taknemmelighed…"
                    value={editReflection}
                    onChange={(e) => setEditReflection(e.target.value)}
                    disabled={saving}
                  />
                ) : (
                  entry.reflection && (
                    <div className="border-t pt-2 mt-2 text-sm text-purple-700 italic">
                      {entry.reflection}
                    </div>
                  )
                )}

                {editId === entry.id ? (
                  <input
                    className="w-full border-b mb-3 p-2"
                    placeholder="Opfølgning (problem du vil følge op på…)"
                    value={editFollowup}
                    onChange={(e) => setEditFollowup(e.target.value)}
                    disabled={saving}
                  />
                ) : (
                  entry.followup_question && (
                    <div className="border-t pt-2 mt-2 text-sm text-blue-700">
                      <span className="font-semibold">Opfølgning: </span>
                      {entry.followup_question}
                    </div>
                  )
                )}

                {editId === entry.id ? (
                  <div className="flex gap-2 mt-2">
                    <button
                      className="bg-blue-600 text-white px-4 py-1 rounded"
                      onClick={() => handleSaveEdit(entry.id)}
                      disabled={saving || !editText.trim()}
                    >
                      Gem
                    </button>
                    <button
                      className="bg-gray-300 px-4 py-1 rounded"
                      onClick={() => setEditId(null)}
                      disabled={saving}
                    >
                      Annullér
                    </button>
                  </div>
                ) : (
                  <button
                    className="mt-2 text-xs text-blue-700 underline"
                    onClick={() => {
                      setEditId(entry.id);
                      setEditTitle(entry.title);
                      setEditText(entry.text);
                      setEditReflection(entry.reflection);
                      setEditFollowup(entry.followup_question || '');
                      setEditBannerUrl(entry.banner_image_url || null);
                    }}
                  >
                    Rediger
                  </button>
                )}
              </article>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
