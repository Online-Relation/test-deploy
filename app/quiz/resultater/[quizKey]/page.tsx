// /app/quiz/resultater/[quizKey]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Card } from '@/components/ui/card';
import QuizResultComponent from '@/app/quiz/resultater/[quizKey]/result-component';
import levenshtein from 'fast-levenshtein';
import { awardQuizXpToUser } from '@/lib/xpAwardQuiz';

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

export default function QuizResultPage() {
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

      // 1. Hent quizspørgsmål
      const { data: questions } = await supabase
        .from('quiz_questions')
        .select('id, question, type, order')
        .eq('quiz_key', quizKey)
        .order('order', { ascending: true });

      // 2. Hent besvarelser
      const { data: answersData } = await supabase
        .from('quiz_responses')
        .select('question_id, answer, user_id, session_id, status')
        .eq('quiz_key', quizKey)
        .eq('session_id', sessionId)
        .eq('status', 'submitted');

      // 3. Hent effort fra quiz_meta
      const { data: metaData } = await supabase
        .from('quiz_meta')
        .select('effort')
        .eq('quiz_key', quizKey)
        .maybeSingle();
      const effort = metaData?.effort || 'medium';

      // 4. Tildel XP til ALLE brugere med submitted svar (ROLLEBASERET)
      if (answersData && answersData.length > 0) {
        const uniqueUserIds = [...new Set(answersData.map(a => a.user_id))];

        // Hent alle roller på én gang (bedre performance)
        const { data: roles } = await supabase
          .from('profiles')
          .select('id, role')
          .in('id', uniqueUserIds);

        for (const userId of uniqueUserIds) {
          const userProfile = roles?.find(p => p.id === userId);
          const role = userProfile?.role || 'mads'; // fallback hvis rolle ikke findes
          await awardQuizXpToUser({
            userId,
            quizKey,
            effort,
            role,
          });
        }
      }

      // 5. Hent anbefaling
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

      // 6. Resultat-gruppering som før
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

        let [a1, a2] = related.map((a) =>
          a.answer.trim().toLowerCase().replace(/[.,!?]/g, '')
        );

        // Helt ens
        if (a1 === a2) {
          result.green.push(q);
          continue;
        }

        // Ja/nej/måske logik
        const yn = ['ja', 'nej', 'måske'];
        if (yn.includes(a1) && yn.includes(a2)) {
          if (a1 === a2) result.green.push(q);
          else if (a1 === 'måske' || a2 === 'måske') result.yellow.push(q);
          else result.red.push(q);
          continue;
        }

        // Skala-svar
        const i1 = importanceScale.indexOf(a1);
        const i2 = importanceScale.indexOf(a2);
        if (i1 !== -1 && i2 !== -1) {
          const diff = Math.abs(i1 - i2);
          if (diff === 0) result.green.push(q);
          else if (diff <= 2) result.yellow.push(q);
          else result.red.push(q);
          continue;
        }

        // Fallback: brug tekst-afstand
        const dist = levenshtein.get(a1, a2);
        if (dist <= 2) result.green.push(q);
        else if (dist <= 5) result.yellow.push(q);
        else result.red.push(q);
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
