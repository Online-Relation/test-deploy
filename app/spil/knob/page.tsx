// /app/games/knob/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUserContext } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const answerOptions = [
  { key: 'love', label: '😍 Elsker' },
  { key: 'uncertain', label: '😬 Usikker' },
  { key: 'trigger', label: '💥 Trigger' }
];

export default function KnobGamePage() {
  const { user } = useUserContext();
  const [question, setQuestion] = useState<any>(null);
  const [phase, setPhase] = useState<'respond' | 'guess' | 'wait'>('wait');
  const [status, setStatus] = useState('');
  const [answerSaved, setAnswerSaved] = useState(false);
  const [sessionRole, setSessionRole] = useState<'responder' | 'guesser' | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [responderHasAnswered, setResponderHasAnswered] = useState(false);

  const fetchXpValue = async (action: string) => {
    const { data } = await supabase.from('xp_settings').select('*').eq('action', action).maybeSingle();
    return data?.value || 10;
  };

  const fetchNextQuestion = async () => {
    setStatus('');
    setHasAnswered(false);
    if (!user) return;
    console.log('🔄 fetchNextQuestion kaldes af', user.id);

    const { data: profile } = await supabase
      .from('profiles')
      .select('partner_id')
      .eq('id', user.id)
      .maybeSingle();

    const partnerId = profile?.partner_id;
    if (!partnerId) return;

    const createSession = async (q: any) => {
      console.log('🧪 createSession: ', q);
      const payload = {
        responder_id: user.id,
        guesser_id: partnerId,
        question_id: q?.id,
      };
      const { data, error } = await supabase.rpc('create_knob_session', payload);
      if (error) {
        console.error('❌ RPC fejl:', error.message || error);
        return false;
      }
      return true;
    };

    const { data: session } = await supabase
      .from('knob_game_sessions')
      .select('*')
      .or(`user_id.eq.${user.id},user_id.eq.${partnerId}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log('📦 Nuværende session:', session);

    if (session?.question_id) {
      const { data: answers } = await supabase
        .from('knob_game_answers')
        .select('*')
        .eq('question_id', session.question_id);

      console.log('📊 Fundne svar:', answers);

      if (answers && answers.length >= 2) {
        const { data: nextQArr, error } = await supabase.rpc('get_next_knob_question', { user_id: user.id });
        const nextQ = nextQArr?.[0];
        console.log('🧪 get_next_knob_question result:', nextQ);
        if (!nextQ) return;
        const success = await createSession(nextQ);
        if (!success) return;
        setQuestion(nextQ);
        setSessionRole('responder');
        setPhase('respond');
      } else {
        const { data: q } = await supabase
          .from('knob_game_questions')
          .select('*')
          .eq('id', session.question_id)
          .maybeSingle();

        setQuestion(q);
        if (session.user_id === user.id) {
          setSessionRole('responder');
          setPhase('respond');
        } else {
          setSessionRole('guesser');
          setPhase('guess');
        }
      }
    } else {
      const { data: nextQArr } = await supabase.rpc('get_next_knob_question', { user_id: user.id });
      const nextQ = nextQArr?.[0];
      if (!nextQ) return;
      const success = await createSession(nextQ);
      if (!success) return;
      setQuestion(nextQ);
      setSessionRole('responder');
      setPhase('respond');
    }
  };

 const checkGuessStatus = async () => {
  if (!user || !question) return;

  const { data: answers } = await supabase
    .from('knob_game_answers')
    .select('*')
    .eq('question_id', question.id)
    .order('created_at', { ascending: false })
    .limit(2);

  console.log('🟡 checkGuessStatus svar:', answers);

  const responder = answers?.find((a) => a.role === 'responder');
  const guesser = answers?.find((a) => a.role === 'guesser');

  if (responder && !guesser) {
    setResponderHasAnswered(true);
  }

// /app/games/knob/page.tsx

// (din eksisterende kode for imports og komponent starter her...)

    if (responder && guesser) {
      console.log('🟢 Begge svar fundet, checker match...');

      if (responder.value === guesser.value) {
        const xp = await fetchXpValue('guess_knob_correct');
        await supabase.from('xp_log').insert({
          user_id: guesser.user_id,
          change: xp,
          role: 'guesser',
          description: 'Tryk på min knap – korrekt gæt'
        });
        setStatus('🎉 Korrekt gæt! Du har fået XP!');
      } else {
        setStatus('😅 Forkert gæt – men godt forsøgt!');
      }

      setTimeout(() => {
        setAnswerSaved(false);
        setQuestion(null);
        setSessionRole(null); // ❗ vigtigt for næste useEffect
        setPhase('wait');     // ❗ nu styres næste fetch via ny useEffect
      }, 2500);
    }
  };

// 🔁 NYT USEEFFECT – henter næste spørgsmål når guesser er færdig
  useEffect(() => {
    if (phase === 'wait' && sessionRole === null) {
      console.log('⏩ phase === wait && sessionRole === null – forsøger at hente spørgsmål');
      fetchNextQuestion();
    }
  }, [phase, sessionRole]);

// (resten af din kode er uændret...)



  const checkForNewSession = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('partner_id')
      .eq('id', user.id)
      .maybeSingle();

    const partnerId = profile?.partner_id;
    if (!partnerId) return;

    const { data: session } = await supabase
      .from('knob_game_sessions')
      .select('*')
      .or(`user_id.eq.${user.id},user_id.eq.${partnerId}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (session?.guesser_id === user.id && (!question || question.id !== session.question_id)) {
      console.log('🔁 Guesser har opdaget ny session – henter spørgsmål...');
      fetchNextQuestion();
    }
  };

  const submitAnswer = async (value: string) => {
    if (!user || !question || !sessionRole) return;

    const { error } = await supabase.from('knob_game_answers').insert({
      user_id: user.id,
      question_id: question.id,
      role: sessionRole,
      value
    });

    if (error) {
      console.error("❌ Fejl ved indsættelse af svar:", error);
      setStatus('⚠️ Der opstod en fejl. Prøv igen.');
      return;
    }

    setHasAnswered(true);
    setAnswerSaved(true);
    setStatus('✅ Svar gemt! Vent på din partner...');
  };

  useEffect(() => {
    if (phase === 'guess') {
      const interval = setInterval(() => checkGuessStatus(), 3000);
      return () => clearInterval(interval);
    }
  }, [phase, question]);

 useEffect(() => {
  if (phase === 'wait') {
    const interval = setInterval(() => {
      checkForNewSession();
    }, 3000);
    return () => clearInterval(interval);
  }
}, [phase, question]);

  useEffect(() => {
    if (user) fetchNextQuestion();
  }, [user]);
  useEffect(() => {
  if (phase === 'wait' && sessionRole === null) {
    console.log('⏩ phase === wait && sessionRole === null – forsøger at hente spørgsmål');
    fetchNextQuestion();
  }
}, [phase, sessionRole]);


  return (
    <div className="max-w-xl mx-auto py-10 px-4 space-y-6">
      <h1 className="text-3xl font-bold text-center">🎯 Tryk på min knap</h1>

      {question && !hasAnswered && (
        <>
          {phase === 'respond' && (
            <Card className="bg-white rounded-2xl shadow-xl">
              <CardContent className="p-6 text-center space-y-4">
                <p className="text-lg font-semibold">{question.question}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  {answerOptions.map(opt => (
                    <Button key={opt.key} onClick={() => submitAnswer(opt.key)} className="text-base py-6">
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {phase === 'guess' && (
            <Card className="bg-white rounded-2xl shadow-xl">
              <CardContent className="p-6 text-center space-y-4">
                <p className="text-lg font-semibold">{question.question}</p>

                {!responderHasAnswered ? (
                  <p className="text-muted-foreground">Afventer din partners svar…</p>
                ) : (
                  <>
                    <p className="text-muted-foreground">Gæt din partners svar:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                      {answerOptions.map(opt => (
                        <Button key={opt.key} onClick={() => submitAnswer(opt.key)} className="text-base py-6">
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {hasAnswered && <div className="text-center text-green-600 font-semibold">{status}</div>}
      {!question && !hasAnswered && <p className="text-center text-muted-foreground">Indlæser næste spørgsmål…</p>}
    </div>
  );
}
