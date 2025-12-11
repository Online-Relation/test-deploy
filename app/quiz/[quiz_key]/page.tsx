// /app/quiz/[quiz_key]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useUserContext } from '@/context/UserContext';
import { v4 as uuidv4 } from 'uuid';
import { awardQuizXpToUser } from '@/lib/xpAwardQuiz';

type Question = { id: string; question: string; type: string };
const QUESTIONS_PER_PAGE = 10;

export default function QuizPage() {
  const { quiz_key } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const { user } = useUserContext();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [quizDescription, setQuizDescription] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!quiz_key) return;
    const decodedKey = decodeURIComponent(quiz_key as string);

    const fetchQuestions = async () => {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('id, question, type')
        .eq('quiz_key', decodedKey)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Fejl ved hentning af quiz_questions', error);
        return;
      }
      if (data) setQuestions(data as Question[]);
    };

    const fetchSavedAnswers = async () => {
      if (!user) return;

      const localKey = `quiz_session_${decodedKey}`;
      let storedSessionId =
        typeof window !== 'undefined' ? localStorage.getItem(localKey) : null;

      if (!storedSessionId) {
        // Tjek i Supabase om brugeren tidligere har oprettet en session
        const { data: existing, error } = await supabase
          .from('quiz_sessions')
          .select('session_id')
          .eq('quiz_key', decodedKey)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Fejl ved hentning af quiz_sessions', error);
        }

        if (existing?.session_id) {
          storedSessionId = existing.session_id;
        } else {
          const newId = uuidv4();
          const { error: insertError } = await supabase
            .from('quiz_sessions')
            .insert({
              quiz_key: decodedKey,
              session_id: newId,
              starter_user_id: user.id,
            });

          if (insertError) {
            console.error('Fejl ved oprettelse af quiz_session', insertError);
          }

          storedSessionId = newId;
        }

        if (storedSessionId && typeof window !== 'undefined') {
          localStorage.setItem(localKey, storedSessionId);
        }
      }

      setSessionId(storedSessionId);

      if (!storedSessionId) return;

      // Hent evt. gemte svar i denne session
      const { data, error } = await supabase
        .from('quiz_responses')
        .select('question_id, answer, session_id')
        .eq('quiz_key', decodedKey)
        .eq('user_id', user.id)
        .eq('session_id', storedSessionId)
        .eq('status', 'in_progress');

      if (error) {
        console.error('Fejl ved hentning af quiz_responses', error);
        return;
      }

      if (data && data.length > 0) {
        const saved: Record<string, string> = {};
        data.forEach((entry) => {
          saved[entry.question_id] = entry.answer;
        });
        setAnswers(saved);
      }
    };

    const fetchQuizMeta = async () => {
      const { data, error } = await supabase
        .from('quiz_meta')
        .select('description')
        .eq('quiz_key', decodedKey)
        .single();

      if (error) {
        console.error('Fejl ved hentning af quiz_meta', error);
        return;
      }

      if (data?.description) setQuizDescription(data.description);
    };

    Promise.all([fetchQuestions(), fetchSavedAnswers(), fetchQuizMeta()])
      .catch((err) => console.error('Fejl i quiz useEffect', err))
      .finally(() => setIsLoading(false));
  }, [quiz_key, user]);

  const handleChange = async (questionId: string, value: string) => {
    if (!user || !sessionId) return;

    const decodedKey = decodeURIComponent(quiz_key as string);

    setAnswers((prev) => ({ ...prev, [questionId]: value }));

    const payload = {
      quiz_key: decodedKey,
      question_id: questionId,
      user_id: user.id,
      answer: value,
      session_id: sessionId,
      status: 'in_progress' as const,
    };

    const { error } = await supabase
      .from('quiz_responses')
      .upsert([payload], { onConflict: 'quiz_key,question_id,user_id' });

    if (error) {
      console.error('Fejl ved upsert af quiz_responses', error);
    }
  };

  const startIndex = (page - 1) * QUESTIONS_PER_PAGE;
  const pageQuestions = questions.slice(
    startIndex,
    startIndex + QUESTIONS_PER_PAGE,
  );

  const handleNext = () => {
    // VIGTIGT: ingen ekstra encode – quiz_key er allerede i URL
    const key = quiz_key as string;
    router.push(`/quiz/${key}?page=${page + 1}`);
  };

  const handleBack = () => {
    if (page > 1) {
      // Samme her – brug rå key for at undgå %2520
      const key = quiz_key as string;
      router.push(`/quiz/${key}?page=${page - 1}`);
    } else {
      router.push('/quiz/parquiz');
    }
  };

  const handleSubmit = async () => {
    if (!sessionId || !user) return;

    const decodedKey = decodeURIComponent(quiz_key as string);

    // Markér mine svar submitted
    const { error: updateError } = await supabase
      .from('quiz_responses')
      .update({ status: 'submitted' })
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .eq('quiz_key', decodedKey);

    if (updateError) {
      console.error(
        'Fejl ved opdatering af quiz_responses til submitted',
        updateError,
      );
      return;
    }

    // Hent effort + rolle
    const [{ data: quizMeta, error: metaError }, { data: profile, error: profileError }] =
      await Promise.all([
        supabase
          .from('quiz_meta')
          .select('effort')
          .eq('quiz_key', decodedKey)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle(),
      ]);

    if (metaError) console.error('Fejl ved hentning af quiz_meta effort', metaError);
    if (profileError) console.error('Fejl ved hentning af profil role', profileError);

    const quizEffort = (quizMeta as any)?.effort || 'medium';
    const role = (profile as any)?.role || '';

    // Tildel XP
    await awardQuizXpToUser({
      userId: user.id,
      quizKey: decodedKey,
      effort: quizEffort,
      role,
    });

    // Tjek hvor mange der har submitted i denne session
    const { data: submittedRows, error: countErr } = await supabase
      .from('quiz_responses')
      .select('user_id', { count: 'exact', head: false })
      .eq('quiz_key', decodedKey)
      .eq('session_id', sessionId)
      .eq('status', 'submitted');

    if (countErr) {
      console.warn(
        '⚠️ Kunne ikke tælle submitted, sender til oversigt',
        countErr,
      );
      router.push('/quiz/parquiz?waiting=1');
      return;
    }

    const uniqueUserCount = new Set(
      (submittedRows || []).map((r: any) => r.user_id),
    ).size;
    console.log('🧮 Submitted i session', sessionId, '=>', uniqueUserCount);

    if (uniqueUserCount < 2) {
      // Partner mangler – send til oversigt/vent
      router.push('/quiz/parquiz?waiting=1');
      return;
    }

    // Begge er klar – send til spin med session
    router.push(
      `/quiz/spin?quizKey=${encodeURIComponent(
        decodedKey,
      )}&session=${encodeURIComponent(sessionId)}`,
    );
  };

  if (isLoading || !sessionId || !user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-sm text-muted-foreground">
          Indlæser spørgsmål og svar...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">
        Parquiz – {decodeURIComponent(quiz_key as string)}
      </h1>

      {quizDescription && (
        <p className="text-sm text-muted-foreground whitespace-pre-line">
          {quizDescription}
        </p>
      )}

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {startIndex + 1} –{' '}
          {Math.min(startIndex + QUESTIONS_PER_PAGE, questions.length)} af{' '}
          {questions.length} spørgsmål
        </p>
        <div className="w-full h-2 bg-gray-300 rounded">
          <div
            className="h-full bg-purple-600 rounded"
            style={{
              width: `${
                questions.length > 0
                  ? Math.min(
                      ((startIndex + QUESTIONS_PER_PAGE) / questions.length) *
                        100,
                      100,
                    )
                  : 0
              }%`,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {pageQuestions.map((q, index) => (
        <Card key={q.id} className="p-4">
          <p className="mb-2 font-medium">
            {startIndex + index + 1}. {q.question}
          </p>

          {q.type === 'boolean' ? (
            <div className="flex gap-4">
              <Button
                variant={answers[q.id] === 'Ja' ? 'primary' : 'ghost'}
                onClick={() => handleChange(q.id, 'Ja')}
              >
                Ja
              </Button>
              <Button
                variant={answers[q.id] === 'Nej' ? 'primary' : 'ghost'}
                onClick={() => handleChange(q.id, 'Nej')}
              >
                Nej
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {['Meget vigtigt', 'Vigtigt', 'Mindre vigtigt', 'Ikke vigtigt'].map(
                (option) => (
                  <Button
                    key={option}
                    variant={answers[q.id] === option ? 'primary' : 'ghost'}
                    onClick={() => handleChange(q.id, option)}
                  >
                    {option}
                  </Button>
                ),
              )}
            </div>
          )}
        </Card>
      ))}

      <div className="flex justify-between pt-4">
        <Button onClick={handleBack}>Tilbage</Button>
        {startIndex + QUESTIONS_PER_PAGE < questions.length ? (
          <Button onClick={handleNext}>Næste</Button>
        ) : (
          <Button onClick={handleSubmit}>Send</Button>
        )}
      </div>
    </div>
  );
}
