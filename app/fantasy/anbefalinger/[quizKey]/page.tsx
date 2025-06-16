// /app/quiz/resultater/[quizKey]/page.tsx
"use client";

import { useSearchParams, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Response = {
  question_id: number;
  answer: number;
};

type Question = {
  id: number;
  text: string;
};

export default function QuizResultPage() {
  const { quizKey: rawKey } = useParams();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");

  const quizKey = decodeURIComponent(rawKey as string);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      console.log("🔍 quizKey:", quizKey);
      console.log("🔍 sessionId:", sessionId);

      if (!quizKey || !sessionId) {
        console.error("❌ quizKey eller session mangler");
        return;
      }

      setLoading(true);

      const { data: questionData, error: questionError } = await supabase
        .from("quiz_questions")
        .select("id, text")
        .eq("quiz_key", quizKey)
        .order("order", { ascending: true });

      if (questionError) {
        console.error("❌ Fejl ved hentning af spørgsmål:", questionError.message);
      } else {
        console.log("✅ Spørgsmål hentet:", questionData);
        setQuestions(questionData || []);
      }

      const { data: responseData, error: responseError } = await supabase
        .from("quiz_responses")
        .select("question_id, answer")
        .eq("quiz_key", quizKey)
        .eq("session_id", sessionId);

      if (responseError) {
        console.error("❌ Fejl ved hentning af svar:", responseError.message);
      } else {
        console.log("✅ Svar hentet:", responseData);
        setResponses(responseData || []);
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
        <span className="font-semibold text-primary">Resultater</span>
        <span className="text-muted-foreground">Visuelt</span>
        <span className="text-muted-foreground">Anbefalinger</span>
      </div>

      {loading ? (
        <p>Indlæser...</p>
      ) : (
        <Card className="p-4 space-y-4">
          {questions.length === 0 && (
            <p className="text-sm italic text-muted-foreground">Ingen spørgsmål fundet.</p>
          )}

          {questions.map((q) => {
            const answer = getAnswer(q.id);
            return (
              <div key={q.id} className="space-y-1">
                <p className="font-medium">{q.text}</p>
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
    </div>
  );
}
