'use client';

import { FC, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUserContext } from '@/context/UserContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Doughnut } from 'react-chartjs-2';
import { useParams } from 'next/navigation';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

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
}

interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: string;
}

interface Grouped {
  green: Question[];
  yellow: Question[];
  red: Question[];
}

interface Props {
  grouped: Grouped;
  answers: Answer[];
  showGraphsOnly?: boolean;
  sessionId?: string;
  quizKey?: string; // Tilføjet så vi kan bruge quizKey i komponenten
}

const QuizResultComponent: FC<Props> = ({
  grouped,
  answers,
  showGraphsOnly = false,
  sessionId,
  quizKey,
}) => {
  const { user } = useUserContext();

  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [recommendations, setRecommendations] = useState<string[] | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [view, setView] = useState<'results' | 'visual' | 'recommendations'>('results');

  // XP states
  const [xpGiven, setXpGiven] = useState(false);
  const [checkingXp, setCheckingXp] = useState(true);

  // Fuldfør quiz states
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [errorComplete, setErrorComplete] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      const userIds = [...new Set(answers.map((a) => a.user_id))];
      if (userIds.length === 0) return;

      const { data: pData } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, role')
        .in('id', userIds);

      if (pData) {
        const map: Record<string, Profile> = {};
        pData.forEach((p) => (map[p.id] = p));
        setProfiles(map);
      }
    };

    fetchProfiles();
  }, [answers]);

  useEffect(() => {
    const assignXpIfNeeded = async () => {
      setCheckingXp(true);

      const userIds = [...new Set(answers.map(a => a.user_id))];

      if (userIds.length === 0 || !quizKey) {
        setCheckingXp(false);
        return;
      }

      const { data: roleData, error: roleError } = await supabase
        .from('profiles')
        .select('id, role')
        .in('id', userIds);

      if (roleError) {
        setCheckingXp(false);
        return;
      }
      const userRoles: Record<string, string> = {};
      roleData?.forEach((row: any) => {
        userRoles[row.id] = row.role;
      });

      const { data: xpLog } = await supabase
        .from('xp_log')
        .select('id, user_id, description')
        .ilike('description', `%complete_parquiz:%${quizKey}%`)
        .in('user_id', userIds);

      const alreadyGiven = new Set((xpLog || []).map(row => row.user_id));
      const toGive = userIds.filter(uid => !alreadyGiven.has(uid));

      if (toGive.length === 0) {
        setXpGiven(true);
        setCheckingXp(false);
        return;
      }

      const { data: quizMeta } = await supabase
        .from('quiz_meta')
        .select('effort')
        .eq('quiz_key', quizKey)
        .maybeSingle();
      const effort = quizMeta?.effort || 'medium';

      const xpRows: any[] = [];
      for (const userId of toGive) {
        const role = userRoles[userId];
        if (!role) continue;

        const { data: xpSetting } = await supabase
          .from('xp_settings')
          .select('xp')
          .eq('action', 'complete_parquiz')
          .eq('role', role)
          .eq('effort', effort)
          .maybeSingle();

        if (!xpSetting) continue;

        xpRows.push({
          user_id: userId,
          change: xpSetting.xp,
          description: `complete_parquiz: ${quizKey} (${effort})`,
          created_at: new Date().toISOString(),
        });
      }

      if (xpRows.length === 0) {
        setCheckingXp(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('xp_log')
        .insert(xpRows);

      if (!insertError) setXpGiven(true);
      setCheckingXp(false);
    };

    assignXpIfNeeded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, quizKey]);

  useEffect(() => {
    const cleanedKey = quizKey?.replace(/\+/g, ' ') || '';
    const totalGrouped = grouped.green.length + grouped.yellow.length + grouped.red.length;

    if (!cleanedKey || totalGrouped === 0 || view !== 'recommendations') return;

    const fetchOrCacheRecommendation = async () => {
      setLoadingRecommendations(true);
      setRecommendationError(null);

      const { data: cached } = await supabase
        .from('quiz_recommendations')
        .select('recommendation')
        .eq('quiz_key', cleanedKey)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cached?.recommendation) {
        setRecommendations([cached.recommendation]);
        setLoadingRecommendations(false);
        return;
      }

      try {
        const res = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupedQuestions: grouped, quizKey: cleanedKey }),
        });

        const resData = await res.json();

        if (resData.recommendation) {
          const { error } = await supabase.from('quiz_recommendations').insert({
            quiz_key: cleanedKey,
            recommendation: resData.recommendation,
            grouped_questions_hash: 'placeholder',
            generated_at: new Date().toISOString(),
          });

          if (error) {
            console.error("❌ Fejl ved insert til quiz_recommendations:", error.message);
          }

          let rec = resData.recommendation;
          rec += '\n\n— Hentet data fra Supabase';
          setRecommendations([rec]);
        }
      } catch (err: any) {
        setRecommendationError(err.message || 'Ukendt fejl ved hentning af anbefalinger');
        setRecommendations([]);
      } finally {
        setLoadingRecommendations(false);
      }
    };

    fetchOrCacheRecommendation();
  }, [quizKey, grouped, view]);

  const chartData = {
    labels: ['Enige', 'Små forskelle', 'Store forskelle'],
    datasets: [
      {
        data: [grouped.green.length, grouped.yellow.length, grouped.red.length],
        backgroundColor: ['#22c55e', '#eab308', '#ef4444'],
        borderWidth: 1,
      },
    ],
  };

  // Ny: Hent fuldførsel-status ved mount
  useEffect(() => {
    const fetchCompletionStatus = async () => {
      if (!quizKey) return;
      const { data, error } = await supabase
        .from('quiz_conversation_starter_log')
        .select('conversation_completed')
        .eq('quiz_key', quizKey)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Fejl ved hentning af fuldførsel:', error);
        return;
      }

      setIsCompleted(data?.conversation_completed ?? false);
    };

    fetchCompletionStatus();
  }, [quizKey]);

  // Ny: Funktion til at markere som fuldført
// Tilføj dette i starten af handleMarkComplete-funktionen i QuizResultComponent

const handleMarkComplete = async () => {
  console.log('quizKey i handleMarkComplete:', quizKey);

  if (!quizKey) return;
  setLoadingComplete(true);
  setErrorComplete(null);

  try {
    // 1. Hent seneste række for quizKey
    const { data: rows, error: fetchError } = await supabase
      .from('quiz_conversation_starter_log')
      .select('id')
      .eq('quiz_key', quizKey)
      .order('created_at', { ascending: false })
      .limit(1);

    console.log('Fetched rows:', rows);

    if (fetchError || !rows || rows.length === 0) {
      setErrorComplete('Kunne ikke finde quiz-log til opdatering.');
      setLoadingComplete(false);
      return;
    }

    const rowId = rows[0].id;

    // 2. Opdater rækken med conversation_completed = true
    const { error: updateError } = await supabase
      .from('quiz_conversation_starter_log')
      .update({ conversation_completed: true })
      .eq('id', rowId);

    if (updateError) {
      setErrorComplete('Kunne ikke opdatere status. Prøv igen.');
    } else {
      setIsCompleted(true);
    }
  } catch (e) {
    setErrorComplete('Ukendt fejl ved opdatering.');
  } finally {
    setLoadingComplete(false);
  }
};




  if (showGraphsOnly) {
    return (
      <div className="space-y-6">
        <div className="w-64 mx-auto">
          <Doughnut data={chartData} />
        </div>
        <div className="text-sm text-center">Antal spørgsmål i hver kategori</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* XP status/debug */}
      {checkingXp && <div className="text-sm text-blue-500">Tjekker XP...</div>}
      {xpGiven && <div className="text-sm text-green-600">🎉 XP tildelt for denne quiz!</div>}

      <div className="flex justify-between gap-2 text-sm">
        <Button onClick={() => setView('results')} variant={view === 'results' ? 'secondary' : 'ghost'}>
          Resultater
        </Button>
        <Button onClick={() => setView('visual')} variant={view === 'visual' ? 'secondary' : 'ghost'}>
          Visuelt
        </Button>
        <Button onClick={() => setView('recommendations')} variant={view === 'recommendations' ? 'secondary' : 'ghost'}>
          Anbefalinger
        </Button>
      </div>

      {view === 'results' && (
        <>
          {(['green', 'yellow', 'red'] as const).map((level) => (
            <div key={level} className="space-y-2">
              <h2 className="text-lg font-semibold mt-6">
                {level === 'green' && '✅ Enige'}
                {level === 'yellow' && '🟡 Små forskelle'}
                {level === 'red' && '🔴 Store forskelle'}
              </h2>

              {grouped[level].map((q) => {
                const related = answers.filter((a) => a.question_id === q.id);

                return (
                  <Card key={q.id} className="p-4 space-y-4">
                    <div className="text-sm font-semibold text-muted-foreground">{q.question}</div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {['mads', 'stine'].map((roleKey) => {
                        const profileEntry = Object.values(profiles).find((p) =>
                          p.display_name?.toLowerCase().includes(roleKey)
                        );

                        const answer = related.find(
                          (a) =>
                            a.user_id === profileEntry?.id &&
                            a.question_id === q.id
                        );

                        return (
                          <div key={roleKey} className="flex items-center gap-2">
                            {profileEntry?.avatar_url ? (
                              <img
                                src={profileEntry.avatar_url}
                                alt={`${roleKey} avatar`}
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-300" />
                            )}
                            <div>
                              <div className="font-medium">{profileEntry?.display_name || roleKey}</div>
                              <div>{answer?.answer || 'Intet svar'}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}

              {grouped[level].length === 0 && (
                <p className="text-sm italic text-muted-foreground">Ingen</p>
              )}
            </div>
          ))}
        </>
      )}

      {view === 'visual' && (
        <div className="space-y-6">
          <div className="w-64 mx-auto">
            <Doughnut data={chartData} />
          </div>
          <div className="text-sm text-center">Antal spørgsmål i hver kategori</div>
        </div>
      )}

      {view === 'recommendations' && (
        <div className="space-y-4 text-sm bg-muted/50 p-4 rounded-xl shadow-inner">
          <h2 className="text-xl font-semibold text-center">📚 Anbefalinger til jer</h2>
          {loadingRecommendations && (
            <p className="italic text-muted-foreground text-center">Analyserer jeres svar...</p>
          )}
          {recommendationError && (
            <p className="text-red-600 text-center">{recommendationError}</p>
          )}
          {!loadingRecommendations && !recommendationError && (
            <>
              {recommendations === null ? (
                <p className="italic text-muted-foreground text-center">Analyserer jeres svar...</p>
              ) : recommendations.length === 0 ? (
                <p className="italic text-muted-foreground text-center">Ingen anbefalinger fundet.</p>
              ) : (
                <ul className="space-y-4">
                  {recommendations.map((r, i) => (
                    <li key={i} className="bg-white rounded-lg p-4 shadow border-l-4 border-blue-300">
                      <div className="text-base leading-snug whitespace-pre-wrap">{r}</div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}

      {/* Fuldfør quiz CTA nederst */}
      <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-300 text-center">
        <p className="mb-2 text-sm text-yellow-800">
          Har I fået snakket om tingene? Gik det helt galt, eller overlevede I? 😄
        </p>

        {isCompleted ? (
          <p className="text-green-700 font-semibold">Quizzen er markeret som fuldført – godt klaret!</p>
        ) : (
          <Button onClick={handleMarkComplete} disabled={loadingComplete}>
            {loadingComplete ? 'Opdaterer...' : 'Fuldfør quiz'}
          </Button>
        )}

        {errorComplete && <p className="mt-2 text-red-600 text-sm">{errorComplete}</p>}
      </div>
    </div>
  );
};

export default QuizResultComponent;
