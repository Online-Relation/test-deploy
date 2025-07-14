// /components/BetProgressForm.tsx

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface BetProgress {
  id: string;
  date: string;
  value: number;
}

export default function BetProgressForm({ betId }: { betId: string }) {
  const [progress, setProgress] = useState<BetProgress[]>([]);
  const [form, setForm] = useState({
    date: "",
    value: "",
  });
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);

  // Hent eksisterende likes pr dag
  useEffect(() => {
    if (!betId) return;
    (async () => {
      const { data, error } = await supabase
        .from("bet_progress")
        .select("id, date, value")
        .eq("bet_id", betId)
        .order("date", { ascending: true });
      if (!error) setProgress(data || []);
    })();
  }, [betId, refresh]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.value) return;
    setLoading(true);

    // Check om der findes en entry for den dato
    const { data: existing } = await supabase
      .from("bet_progress")
      .select("id")
      .eq("bet_id", betId)
      .eq("date", form.date)
      .single();

    if (existing?.id) {
      // Opdater eksisterende entry
      await supabase
        .from("bet_progress")
        .update({ value: Number(form.value) })
        .eq("id", existing.id);
    } else {
      // Opret ny entry
      await supabase
        .from("bet_progress")
        .insert([
          {
            bet_id: betId,
            date: form.date,
            value: Number(form.value),
          },
        ]);
    }

    setForm({ date: "", value: "" });
    setLoading(false);
    setRefresh((c) => c + 1);
  };

  return (
    <div className="bg-white rounded-2xl shadow p-5 my-4 max-w-md mx-auto">
      <h4 className="font-semibold text-lg mb-2">Registrer antal likes pr. dag</h4>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={handleChange}
          required
          className="p-2 border rounded w-36"
        />
        <input
          type="number"
          name="value"
          min={0}
          placeholder="Likes i alt"
          value={form.value}
          onChange={handleChange}
          required
          className="p-2 border rounded w-32"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? "Gemmer..." : "Gem"}
        </button>
      </form>
      <div>
        <h5 className="font-semibold mb-2 text-sm">Historik:</h5>
        <ul className="text-sm space-y-1">
          {progress.length === 0 && <li className="text-gray-400">Ingen data endnu.</li>}
          {progress.map((row) => (
            <li key={row.id}>
              <span className="inline-block w-24">{row.date}</span>
              <span className="inline-block font-mono">{row.value} likes</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
