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
}

interface Grouped {
  green: Question[];
  yellow: Question[];
  red: Question[];
}

interface Props {
  grouped: Grouped;
  showGraphsOnly?: boolean;
}

const QuizResultComponent: FC<Props> = ({ grouped, showGraphsOnly = false }) => {
  const { quizKey: rawKey } = useParams();
  const quizKey = rawKey as string; // ⚠️ vigtigt: brug raw string direkte
  const { user } = useUserContext();

  const [answers, setAnswers] = useState<Answer[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [recommendations, setRecommendations] = useState<string[] | null>(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [view, setView] = useState<'results' | 'visual' | 'recommendations'>('results');

  useEffect(() => {
    const fetchAnswersAndProfiles = async () => {
      const { data: aData } = await supabase
        .from('quiz_responses')
        .select('question_id, answer, user_id')
        .eq('quiz_key', quizKey);

      const userIds = [...new Set(aData?.map(a => a.user_id) || [])];

      const { data: pData } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      if (aData) setAnswers(aData);
      if (pData) {
        const map: Record<string, Profile> = {};
        pData.forEach(p => (map[p.id] = p));
        setProfiles(map);
      }
    };

    fetchAnswersAndProfiles();
  }, [quizKey]);

useEffect(() => {
  const cleanedKey = quizKey.replace(/\+/g, ' ');
  if (!cleanedKey || (grouped.green.length + grouped.yellow.length + grouped.red.length === 0)) return;

  const fetchOrCacheRecommendation = async () => {
    setLoadingRecommendations(true);
    setRecommendationError(null);

    console.log("🔍 Henter anbefaling for quizKey:", cleanedKey);

    const { data: cached } = await supabase
      .from('quiz_recommendations')
      .select('recommendation')
      .eq('quiz_key', cleanedKey)
      .order('created_at', { ascending: false })
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
        console.log("📝 Gemmer anbefaling for quizKey:", cleanedKey);

        await supabase.from('quiz_recommendations').insert({
          quiz_key: cleanedKey,
          recommendation: resData.recommendation,
        });

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
}, [quizKey, grouped]);


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
          {(['green', 'yellow', 'red'] as const).map(level => (
            <div key={level} className="space-y-2">
              <h2 className="text-lg font-semibold mt-6">
                {level === 'green' && '✅ Enige'}
                {level === 'yellow' && '🟡 Små forskelle'}
                {level === 'red' && '🔴 Store forskelle'}
              </h2>

              {grouped[level].map(q => {
                const related = answers.filter(a => a.question_id === q.id);
                return (
                  <Card key={q.id} className="p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      {related.map(a => (
                        <div key={a.user_id} className="flex items-center gap-2">
                          {profiles[a.user_id]?.avatar_url ? (
                            <img src={profiles[a.user_id].avatar_url ?? ''} alt="avatar" className="w-6 h-6 rounded-full" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-300" />
                          )}
                          <div className="text-sm">
                            <div className="font-medium">{profiles[a.user_id]?.display_name || 'Ukendt'}</div>
                            <div>{a.answer}</div>
                          </div>
                        </div>
                      ))}
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
    </div>
  );
};

export default QuizResultComponent;
