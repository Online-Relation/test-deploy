// /app/fantasy/anbefalinger/generel/page.tsx

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/card";
import { useUserContext } from "@/context/UserContext";

type Recommendation = {
  recommendation: string;
  generated_at: string;
  table_count: number | null;
  row_count: number | null;
};

export default function GenerelAnbefalingPage() {
  const { user } = useUserContext();
  const [latest, setLatest] = useState<Recommendation | null>(null);
  const [previous, setPrevious] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchRecommendations = async () => {
    const { data } = await supabase
      .from("overall_meta")
      .select("recommendation, generated_at, table_count, row_count")
      .order("generated_at", { ascending: false })
      .limit(2);

    if (data && data.length > 0) {
      setLatest(data[0] ?? null);
      setPrevious(data[1] ?? null);
    } else {
      setLatest(null);
      setPrevious(null);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleGenerate = async () => {
    if (!user) return;

    setLoading(true);

    const forPartner = user.role === "mads" ? "stine" : "mads";

    await fetch("/api/overall-recommendation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        for_partner: forPartner,
        gatheredData: "", // opdater senere
        tone: "kærlig og ærlig",
        force: true, // 🔁 Tving ny anbefaling
      }),
    });

    await fetchRecommendations();
    setLoading(false);
  };

  const renderDataComparison = () => {
    if (!latest || latest.table_count == null || latest.row_count == null) return null;

    return (
      <Card className="p-4 bg-blue-50 border border-blue-200 text-sm text-gray-700">
        <p>
          Denne anbefaling er baseret på <strong>{latest.table_count}</strong> tabeller og{" "}
          <strong>{latest.row_count}</strong> datapunkter.
        </p>
      </Card>
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold">🧠 Overordnet anbefaling</h1>

      <div className="flex justify-end">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Genererer..." : "Generér ny anbefaling"}
        </button>
      </div>

      {loading && (
        <p className="text-sm italic text-muted-foreground text-center">Genererer anbefaling...</p>
      )}

      {renderDataComparison()}

      {latest && (
        <Card className="p-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            Genereret: {new Date(latest.generated_at).toLocaleString("da-DK")}
          </p>
          <p className="whitespace-pre-line text-sm text-muted-foreground">
            {latest.recommendation}
          </p>
          <p className="text-xs text-muted-foreground italic text-right">
            — Hentet data fra Supabase
          </p>
        </Card>
      )}

      {!latest && (
        <p className="text-sm italic text-muted-foreground">
          Ingen anbefaling fundet endnu.
        </p>
      )}
    </div>
  );
}
