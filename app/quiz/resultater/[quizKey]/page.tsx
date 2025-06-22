// /app/quiz/resultater/[quizKey]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Card } from '@/components/ui/card';
import QuizResultComponent from '@/app/quiz/resultater/[quizKey]/result-component';

interface Question {
  id: string;
  question: string;
  type: string;
  order: number;
}

interface Answer {
  question_id: string;
  answer: string;
  user_id: string;
  session_id: string;
  status: string;
}

export default function GenerelAnbefalingPage() {
  const { quizKey: rawKey } = useParams();
  const quizKey = decodeURIComponent(rawKey as string);
const searchParams = useSearchParams();
let sessionId = searchParams.get('session');

if (!sessionId && typeof window !== 'undefined') {
  sessionId = localStorage.getItem(`quiz_session_${quizKey}`);
}




  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [grouped, setGrouped] = useState<{
    green: Question[];
    yellow: Question[];
    red: Question[];
  } | null>(null);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEverything = async () => {
      if (!sessionId) return;

      setLoading(true);

      const { data: questions } = await supabase
  .from("quiz_questions")
  .select("id, question, type, order")
  .eq("quiz_key", quizKey)
  .order("order", { ascending: true });

const { data: answers } = await supabase
  .from("quiz_responses")
  .select("question_id, answer, user_id, session_id, status")
  .eq("quiz_key", quizKey)
  .eq("session_id", sessionId)
  .eq("status", "submitted");

console.log("🔍 QUESTIONS", JSON.stringify(questions, null, 2));
console.log("🔍 ANSWERS", JSON.stringify(answers, null, 2));



      const { data: meta } = await supabase
        .from("overall_meta")
        .select("recommendation")
        .eq("quiz_key", quizKey)
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (meta?.recommendation) setRecommendation(meta.recommendation);

      if (!questions || !answers) {
        setLoading(false);
        return;
      }

   const result: {
  green: Question[];
  yellow: Question[];
  red: Question[];
} = {
  green: [],
  yellow: [],
  red: [],
};


      for (const q of questions) {
        const related = answers.filter((a) => a.question_id === q.id);
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

    fetchEverything();
  }, [quizKey, sessionId]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold">📋 Quizresultat</h1>

      {loading ? (
        <p className="text-muted-foreground text-sm">Indlæser data...</p>
      ) : grouped ? (
        <>
          <QuizResultComponent grouped={grouped} sessionId={sessionId || undefined} />

          {recommendation && (
            <Card className="p-4 mt-6 space-y-2 bg-blue-50 border border-blue-200">
              <h2 className="font-semibold text-base">📚 Anbefaling fra GPT</h2>
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">{recommendation}</p>
            </Card>
          )}
        </>
      ) : (
        <p className="italic text-muted-foreground text-sm">Ingen analyseret data fundet endnu for denne quiz.</p>
      )}
    </div>
  );
}
