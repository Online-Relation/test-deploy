// /app/quiz/resultater/[quizKey]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import QuizResultComponent from "./result-component";

interface Answer {
  question_id: string;
  answer: string;
  user_id: string;
}

interface Question {
  id: string;
  question: string;
  type: string;
  order: number;
}

export default function QuizResultPageWrapper() {
  const { quizKey: rawKey } = useParams();
  const quizKey = decodeURIComponent(rawKey as string);

  const [grouped, setGrouped] = useState<{
    green: Question[];
    yellow: Question[];
    red: Question[];
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: questions } = await supabase
        .from("quiz_questions")
        .select("id, question, type, order")
        .eq("quiz_key", quizKey)
        .order("order", { ascending: true });

      const { data: answers } = await supabase
        .from("quiz_responses")
        .select("question_id, answer, user_id")
        .eq("quiz_key", quizKey);

      if (!questions || !answers) return;

      const result = { green: [], yellow: [], red: [] } as {
        green: Question[];
        yellow: Question[];
        red: Question[];
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
    };

    fetchData();
  }, [quizKey]);

  if (!grouped) return <p className="p-4 text-muted-foreground text-sm">Indlæser spørgsmål og svar...</p>;

  return (
  <div className="flex justify-center px-4 py-6">
    <div className="w-full max-w-3xl bg-white rounded-2xl shadow-md p-6">
      <QuizResultComponent grouped={grouped} />
    </div>
  </div>
);

}
