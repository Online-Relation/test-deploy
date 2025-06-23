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
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEverything = async () => {
      if (!sessionId) return;

      setLoading(true);

      const { data: questions } = await supabase
        .from('quiz_questions')
        .select('id, question, type, order')
        .eq('quiz_key', quizKey)
        .order('order', { ascending: true });

      const { data: answersData } = await supabase
        .from('quiz_responses')
        .select('question_id, answer, user_id, session_id, status')
        .eq('quiz_key', quizKey)
        .eq('session_id', sessionId)
        .eq('status', 'submitted');

      console.log('🔍 QUESTIONS', JSON.stringify(questions, null, 2));
      console.log('🔍 ANSWERS', JSON.stringify(answersData, null, 2));

      const { data: meta } = await supabase
        .from('overall_meta')
        .select('recommendation')
        .eq('quiz_key', quizKey)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (meta?.recommendation) setRecommendation(meta.recommendation);

      if (!questions || !answersData) {
        setLoading(false);
        return;
      }

      setAnswers(answersData);

      const importanceScale = [
        'ikke vigtigt',
        'mindre vigtigt',
        'vigtigt',
        'meget vigtigt',
      ];

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
        const related = answersData.filter((a) => a.question_id === q.id);
        const uniqueUsers = [...new Set(related.map((a) => a.user_id))];
        if (uniqueUsers.length !== 2) continue;

        const [a1, a2] = related.map((a) => a.answer.trim().toLowerCase());

        // Hvis helt ens
        if (a1 === a2) {
          result.green.push(q);
          continue;
        }

        // Hvis det er ja/nej
        if (
          (a1 === 'ja' && a2 === 'nej') ||
          (a1 === 'nej' && a2 === 'ja')
        ) {
          result.red.push(q);
          continue;
        }

        // Hvis det er skala: meget vigtigt → ikke vigtigt
        const i1 = importanceScale.indexOf(a1);
        const i2 = importanceScale.indexOf(a2);

        if (i1 !== -1 && i2 !== -1) {
          const diff = Math.abs(i1 - i2);
          if (diff === 0) result.green.push(q);
          else if (diff >= 2) result.red.push(q);
          else result.yellow.push(q);
          continue;
        }

        // Alt andet: gul
        result.yellow.push(q);
      }

      setGrouped(result);
      setLoading(false);
    };

    fetchEverything();
  }, [quizKey, sessionId]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold mb-2">Quizresultat</h1>

      {loading ? (
        <p className="text-muted-foreground text-sm">Indlæser data...</p>
      ) : grouped && sessionId ? (
        <>
          <QuizResultComponent
            grouped={grouped}
            answers={answers}
            sessionId={sessionId}
          />

          {recommendation && (
            <Card className="p-4 mt-6 space-y-2 bg-blue-50 border border-blue-200">
              <h2 className="font-semibold text-base">📚 Anbefaling fra GPT</h2>
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                {recommendation}
              </p>
            </Card>
          )}
        </>
      ) : (
        <p className="italic text-muted-foreground text-sm">
          Ingen analyseret data fundet endnu for denne quiz.
        </p>
      )}
    </div>
  );
}
