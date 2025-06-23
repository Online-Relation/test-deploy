// /app/fantasy/anbefalinger/[quizKey]/page.tsx

"use client";

import { useSearchParams, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/card";
import QuizResultComponent from "@/app/quiz/resultater/[quizKey]/result-component";
import { useUserContext } from "@/context/UserContext";

export default function QuizResultPage() {
  const { quizKey: rawKey } = useParams();
  const searchParams = useSearchParams();
  const { user } = useUserContext();

  const quizKey = decodeURIComponent(rawKey as string);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [grouped, setGrouped] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const paramId = searchParams.get("session");
    if (paramId) {
      setSessionId(paramId);
    } else {
      const stored = localStorage.getItem(`quiz_session_${quizKey}`);
      if (stored) {
        setSessionId(stored);
      }
    }
  }, [quizKey, searchParams]);

  useEffect(() => {
    if (sessionId) fetchData();
  }, [quizKey, sessionId]);

  const fetchData = async () => {
    setLoading(true);

    const { data: questions } = await supabase
      .from("quiz_questions")
      .select("id, question, type, order")
      .eq("quiz_key", quizKey)
      .order("order", { ascending: true });

    const { data: answersData } = await supabase
      .from("quiz_responses")
      .select("question_id, answer, user_id, session_id, status")
      .eq("quiz_key", quizKey)
      .eq("status", "submitted")
      .eq("session_id", sessionId);

    const { data: meta } = await supabase
      .from("overall_meta")
      .select("recommendation")
      .eq("quiz_key", quizKey)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (meta?.recommendation) {
      setRecommendation(meta.recommendation);
    }

    if (!questions || !answersData) {
      setGrouped(null);
      setLoading(false);
      return;
    }

    setAnswers(answersData);

    const result = { green: [], yellow: [], red: [] } as {
      green: typeof questions;
      yellow: typeof questions;
      red: typeof questions;
    };

    for (const q of questions) {
      const related = answersData.filter((a) => a.question_id === q.id);
      const uniqueUsers = [...new Set(related.map((a) => a.user_id))];
      if (uniqueUsers.length !== 2) continue;

      const [a1, a2] = related.map((a) => a.answer.trim());
      if (a1 === a2) result.green.push(q);
      else if ((a1 === "Ja" && a2 === "Nej") || (a1 === "Nej" && a2 === "Ja")) result.red.push(q);
      else result.yellow.push(q);
    }

    setGrouped(result);
    setLoading(false);
  };

  const handleGenerate = async () => {
    setLoading(true);
    await fetch("/api/overall-recommendation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user?.id || "1",
        for_partner: "stine",
        gatheredData: JSON.stringify(grouped),
        tone: "kærlig og ærlig",
        quiz_key: quizKey,
      }),
    });
    await fetchData();
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">📋 Quizresultat</h1>

      {loading && <p className="text-muted-foreground text-sm">Indlæser data...</p>}

      {!loading && grouped && (
        <>
          <QuizResultComponent
            grouped={grouped}
            answers={answers}
            sessionId={sessionId || undefined}
          />

          <Card className="p-4 space-y-4">
            <div className="flex justify-end">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="px-4 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? "Genererer..." : "Generér ny anbefaling"}
              </button>
            </div>
            <p className="text-sm text-muted-foreground">Anbefaling fra GPT</p>
            <p className="whitespace-pre-line text-sm">{recommendation}</p>
          </Card>
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
