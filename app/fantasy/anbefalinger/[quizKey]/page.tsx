// /app/quiz/resultater/[quizKey]/page.tsx
"use client";

import { useSearchParams, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Response = {
  question_id: number;
  answer: string; // Ændret til string for at matche frontend
};

type Question = {
  id: number;
  question: string;
};

export default function QuizResultPage() {
  const { quizKey: rawKey } = useParams();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");

  const quizKey = decodeURIComponent(rawKey as string);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"results" | "visual" | "recommendations">("results");

  useEffect(() => {
    const loadData = async () => {
      console.log("🔍 quizKey:", quizKey);
      console.log("🔍 sessionId:", sessionId);

      if (!quizKey) {
        console.error("❌ quizKey mangler");
        return;
      }

      setLoading(true);

      // Hent spørgsmål
      const { data: questionData, error: questionError } = await supabase
        .from("quiz_questions")
        .select("id, question")
        .eq("quiz_key", quizKey)
        .order("order", { ascending: true });

      if (questionError) {
        console.error("❌ Fejl ved hentning af spørgsmål:", questionError.message);
      } else {
        setQuestions(questionData || []);
        console.log("✅ Spørgsmål hentet:", questionData);
      }

      // Hent svar, filtrer på sessionId hvis til stede
      let query = supabase
        .from("quiz_responses")
        .select("question_id, answer")
        .eq("quiz_key", quizKey);

      if (sessionId) {
        query = query.eq("session_id", sessionId);
      }

      const { data: responseData, error: responseError } = await query;

      if (responseError) {
        console.error("❌ Fejl ved hentning af svar:", responseError.message);
      } else {
        setResponses(responseData || []);
        console.log("✅ Svar hentet:", responseData);
      }

      setLoading(false);
    };

    loadData();
  }, [quizKey, sessionId]);

  const getAnswer = (questionId: number) => {
    const found = responses.find((r) => r.question_id === questionId);
    return found?.answer ?? null;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">📋 Resultat: {quizKey}</h1>

      <div className="flex gap-4 border-b pb-2 text-sm">
        <button
          className={`font-semibold ${activeTab === "results" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
          onClick={() => setActiveTab("results")}
        >
          Resultater
        </button>
        <button
          className={`font-semibold ${activeTab === "visual" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
          onClick={() => setActiveTab("visual")}
        >
          Visuelt
        </button>
        <button
          className={`font-semibold ${activeTab === "recommendations" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}
          onClick={() => setActiveTab("recommendations")}
        >
          Anbefalinger
        </button>
      </div>

      {loading && <p>Indlæser...</p>}

      {!loading && activeTab === "results" && (
        <Card className="p-4 space-y-4">
          {questions.length === 0 && (
            <p className="text-sm italic text-muted-foreground">Ingen spørgsmål fundet.</p>
          )}

          {questions.map((q) => {
            const answer = getAnswer(q.id);
            return (
              <div key={q.id} className="space-y-1">
                <p className="font-medium">{q.question}</p>
                {answer !== null ? (
                  <Badge variant="default">Svar: {answer}</Badge>
                ) : (
                  <p className="text-sm italic text-muted-foreground">Intet svar</p>
                )}
              </div>
            );
          })}
        </Card>
      )}

      {!loading && activeTab === "visual" && (
        <div>
          {/* Her kan du indsætte den visuelle visning (grafer osv) når klar */}
          <p className="text-center text-muted-foreground">Visuel visning kommer snart.</p>
        </div>
      )}

      {!loading && activeTab === "recommendations" && (
        <div>
          {/* Her kan du indsætte anbefalingskomponenten når klar */}
          <p className="text-center text-muted-foreground">Anbefalinger kommer snart.</p>
        </div>
      )}
    </div>
  );
}
