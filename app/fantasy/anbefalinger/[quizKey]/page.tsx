// /app/fantasy/anbefalinger/page.tsx

"use client";

import { useSearchParams, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import QuizResultComponent from "@/app/quiz/resultater/[quizKey]/result-component";


export default function QuizResultPage() {
  const { quizKey: rawKey } = useParams();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");

  const quizKey = decodeURIComponent(rawKey as string);

  const [grouped, setGrouped] = useState<any>(null);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"results" | "compare" | "recommendation">("results");

useEffect(() => {
  const fetchData = async () => {
    const { data, error } = await supabase
      .from("overall_meta")
      .select("recommendation, grouped")
      .eq("quiz_key", quizKey)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Fejl ved hentning:", error.message);
    } else {
      setRecommendation(data?.recommendation ?? null);
      setGrouped(data?.grouped ?? null); // 👈 tilføjet
    }

    setLoading(false);
  };

  fetchData();
}, [quizKey]);



  const tabs = [
    { key: "results", label: "Resultater" },
    { key: "compare", label: "Sammenligning" },
    { key: "recommendation", label: "Anbefaling" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">📋 Quizresultat</h1>

      <div className="flex gap-4 border-b pb-2 text-sm">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`font-semibold ${
              activeTab === tab.key
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground"
            }`}
            onClick={() => setActiveTab(tab.key as any)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-muted-foreground text-sm">Indlæser data...</p>}

      {!loading && grouped && (
        <>
          {activeTab === "results" && (
            <QuizResultComponent grouped={grouped} />
          )}

          {activeTab === "compare" && (
            <Card className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground">Visualisering af enighed/uenighed</p>
              <QuizResultComponent grouped={grouped} showGraphsOnly />
            </Card>
          )}

          {activeTab === "recommendation" && (
            <Card className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground">Anbefaling fra GPT</p>
              <p className="whitespace-pre-line text-sm">{recommendation}</p>
            </Card>
          )}
        </>
      )}

      {!loading && !grouped && (
        <p className="text-muted-foreground text-sm italic">
          Ingen analyseret data fundet endnu for denne quiz.
        </p>
      )}
    </div>
  );
}
