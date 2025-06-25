"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserContext } from "@/context/UserContext";

export default function AnbefalingerOverview() {
  const [quizKeys, setQuizKeys] = useState<string[]>([]);
  const [overallRecommendation, setOverallRecommendation] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tableCount, setTableCount] = useState<number | null>(null);
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [weeklyMessage, setWeeklyMessage] = useState<string | null>(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);

  const { user } = useUserContext();

  useEffect(() => {
    setOverallRecommendation(null);
  }, []);

  useEffect(() => {
    const fetchCompletedQuizzes = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("quiz_responses")
        .select("quiz_key")
        .eq("user_id", user.id);

      if (data) {
        const keys = [...new Set(data.map((r) => r.quiz_key))];
        setQuizKeys(keys);
      }
    };

    fetchCompletedQuizzes();
  }, [user]);

  const fetchOverall = async () => {
    setLoading(true);
    const res = await fetch("/api/overall-recommendation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    const json = await res.json();

    setOverallRecommendation(json.recommendation || "Kunne ikke hente anbefaling.");
    setLastGenerated(new Date().toLocaleString("da-DK"));
    setTableCount(json.used_tables?.length ?? null);
    setRowCount(json.total_rows ?? null);
    setLoading(false);
  };

  const handleWeeklyGenerate = async () => {
    if (!user) return;
    setWeeklyMessage(null);
    setWeeklyLoading(true);

    const res = await fetch("/api/weekly-recommendation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id }),
    });

    const result = await res.json();

    if (result.recommendation) {
      setWeeklyMessage("✅ Ugentlig anbefaling er genereret og gemt.");
    } else {
      setWeeklyMessage("❌ Fejl ved generering.");
    }

    setWeeklyLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">📊 Anbefalinger & Svar</h1>
      <p className="text-sm text-muted-foreground">
        Her kan du se jeres gennemførte quizzer med svar, statistik og personlige anbefalinger. Brug det som et udgangspunkt for samtaler og refleksion.
      </p>

      {/* 🔶 Overordnet anbefaling */}
      <Card className="p-4 space-y-2">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
          <div className="font-semibold text-lg">🧠 Overordnet anbefaling</div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={fetchOverall} disabled={loading}>
              {loading ? "Henter..." : overallRecommendation ? "Klar" : "Generér ny"}
            </Button>

            <Link href="/fantasy/anbefalinger/generel">
              <Button variant="secondary">Gå til anbefaling</Button>
            </Link>
          </div>
        </div>

        {lastGenerated && (
          <p className="text-xs text-muted-foreground">
            Senest genereret: {lastGenerated}
          </p>
        )}

        {tableCount !== null && rowCount !== null && (
          <p className="text-xs text-muted-foreground">
            Anbefalingen er baseret på {tableCount} tabeller og {rowCount} datapunkter.
          </p>
        )}
      </Card>

      {/* 📅 Ugentlig anbefaling */}
      <Card className="p-4 space-y-2">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
          <div className="font-semibold text-lg">📅 Ugentlig anbefaling</div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleWeeklyGenerate} disabled={weeklyLoading}>
              {weeklyLoading ? "Genererer..." : "Generér ny"}
            </Button>

            <Link href="/dashboard">
              <Button variant="secondary">Se på dashboard</Button>
            </Link>
          </div>
        </div>

        {weeklyMessage && (
          <p className="text-xs text-muted-foreground">{weeklyMessage}</p>
        )}
      </Card>

      {/* 🔷 Quiz-specifikke anbefalinger */}
      <div className="grid gap-4">
        {quizKeys.length === 0 && (
          <p className="text-sm italic text-muted-foreground">
            Du har ikke gennemført nogle quizzer endnu.
          </p>
        )}

        {quizKeys.map((key) => (
          <Card key={key} className="p-4">
            <div className="flex justify-between items-center">
              <div className="capitalize font-medium">{key}</div>
              <Link href={`/fantasy/anbefalinger/${key}`}>
                <Button variant="primary">Se resultater</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
