// /components/widgets/FollowUpReminderWidget.tsx
'use client';
import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Entry = {
  id: string;
  followup_question: string;
  followup_created_at: string;
  followup_is_active: boolean;
  followup_resolved_at?: string;
  followup_resolution_text?: string;
};

function daysBetween(date: string) {
  const d1 = new Date(date);
  const d2 = new Date();
  const diff = d2.getTime() - d1.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function FollowUpReminderWidget() {
  const [pending, setPending] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolutionText, setResolutionText] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      const { data, error } = await supabase
        .from("tanker_entries")
        .select("id, followup_question, followup_created_at, followup_is_active, followup_resolved_at, followup_resolution_text")
        .eq("followup_is_active", true)
        .not("followup_question", "is", null)
        .order("followup_created_at", { ascending: true });
      if (!error && data) {
        // Filtrer til dem hvor der er gået 25+ dage siden oprettelse
        setPending(data.filter((e: Entry) => daysBetween(e.followup_created_at) >= 25));
      }
      setLoading(false);
    }
    fetch();
  }, []);

  async function markAsResolved(id: string) {
    if (!resolutionText.trim()) return;
    await supabase
      .from("tanker_entries")
      .update({
        followup_is_active: false,
        followup_resolved_at: new Date().toISOString(),
        followup_resolution_text: resolutionText.trim(),
      })
      .eq("id", id);
    setPending(pending.filter((p) => p.id !== id));
    setSelectedId(null);
    setResolutionText("");
  }

  async function postpone(id: string) {
    // Sæt followup_created_at til nu + 10 dage
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + 10);
    await supabase
      .from("tanker_entries")
      .update({ followup_created_at: newDate.toISOString() })
      .eq("id", id);
    setPending(pending.filter((p) => p.id !== id));
  }

  if (loading) return null;
  if (pending.length === 0) return null;

  // Viser kun én ad gangen (første i listen)
  const entry = pending[0];

 return (
  <div className="w-full h-full bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-2xl shadow flex flex-col gap-3">
    <div className="flex items-center gap-3 mb-2">
      <span className="text-lg font-bold text-yellow-700">Opfølgning</span>
      <span className="text-xs text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded">
        {new Date(entry.followup_created_at).toLocaleDateString("da-DK")}
      </span>
    </div>
    <div className="mb-3">{entry.followup_question}</div>
    {selectedId === entry.id ? (
      <div className="flex flex-col gap-2">
        <textarea
          className="border rounded px-2 py-1"
          rows={2}
          value={resolutionText}
          onChange={e => setResolutionText(e.target.value)}
          placeholder="Hvordan løste du det?"
        />
        <button
          className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
          onClick={() => markAsResolved(entry.id)}
          disabled={!resolutionText.trim()}
        >
          Gem og marker som løst
        </button>
      </div>
    ) : (
      <div className="flex gap-3">
        <button
          className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
          onClick={() => setSelectedId(entry.id)}
        >
          Løst
        </button>
        <button
          className="bg-gray-200 text-gray-700 px-4 py-1 rounded hover:bg-gray-300"
          onClick={() => postpone(entry.id)}
        >
          Udsæt 10 dage
        </button>
      </div>
    )}
  </div>
);

}
