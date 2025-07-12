// /app/data/tanker/page.tsx
'use client';
import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';

// HUSK: brug dine egne env keys eller supabaseClient hvis du har den
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Entry = {
  id: string;
  created_at: string;
  title: string;
  category: string;
  tags: string[] | null;
  text: string;
  reflection: string;
  followup_question?: string;
  followup_created_at?: string;
  followup_is_active?: boolean;
  followup_resolved_at?: string;
  followup_resolution_text?: string;
};

export default function TankerDataPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEntries() {
      setLoading(true);
      const { data, error } = await supabase
        .from("tanker_entries")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setEntries(data as Entry[]);
      setLoading(false);
    }
    fetchEntries();
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-8">Alle tanker & opfølgninger</h1>
      {loading ? (
        <div className="text-center text-gray-500">Indlæser…</div>
      ) : entries.length === 0 ? (
        <div className="text-center text-gray-400">Ingen tanker fundet.</div>
      ) : (
        <ul className="flex flex-col gap-6">
          {entries.map(entry => (
            <li key={entry.id} className="bg-white rounded-xl p-6 border shadow">
              <div className="flex items-center gap-3 justify-between mb-1">
                <div className="text-xs text-gray-500">{new Date(entry.created_at).toLocaleDateString("da-DK")}</div>
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">{entry.category}</span>
              </div>
              {entry.title && <h2 className="text-lg font-bold mb-1">{entry.title}</h2>}
              <div className="text-gray-700 prose max-w-none mb-2" dangerouslySetInnerHTML={{ __html: entry.text }} />
              <div className="flex flex-wrap gap-2 mb-2">
                {entry.tags && entry.tags.map((tag) =>
                  <span key={tag} className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs">#{tag}</span>
                )}
              </div>
              {entry.reflection && (
                <div className="border-t pt-2 mt-2 text-sm text-purple-700 italic">
                  {entry.reflection}
                </div>
              )}
              {/* Opfølgning */}
              {entry.followup_question && (
                <div className="border-t pt-2 mt-2 text-sm text-blue-700 flex items-center gap-2">
                  <span className="font-semibold">Opfølgning:</span>
                  {entry.followup_question}
                  <span className={
                    entry.followup_is_active
                      ? "ml-3 inline-block px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800"
                      : "ml-3 inline-block px-2 py-1 rounded text-xs bg-green-100 text-green-800"
                  }>
                    {entry.followup_is_active ? "Åben" : "Løst"}
                  </span>
                </div>
              )}
              {/* Løsningsforklaring, hvis lukket */}
              {entry.followup_resolution_text && (
                <div className="mt-2 text-xs text-green-700 italic">
                  Løsning: {entry.followup_resolution_text}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
