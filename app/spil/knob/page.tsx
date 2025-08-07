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

  console.log('⏳ fetchNextQuestion kaldt...');
  console.log('📌 Bruger:', user);

  if (!user) {
    console.warn('🚫 Ingen bruger fundet – afbryder');
    return;
  }

  console.log('✅ Bruger-ID:', user.id);

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('partner_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('❌ Fejl ved hentning af profil:', profileError.message);
    return;
  }

  const partnerId = profile?.partner_id;
  console.log('👥 Partner-ID:', partnerId);

  if (!partnerId) {
    console.warn('🚫 Ingen partner-ID fundet – afbryder');
    return;
  }

  const createSession = async (q: any) => {
    console.log('🧪 createSession: ', q);
    const payload = {
      responder_id: user.id,
      guesser_id: partnerId,
      question_id: q?.id,
    };
    const { data, error } = await supabase.rpc('create_knob_session', payload);
    if (error) {
      console.error('❌ Fejl i create_knob_session:', error.message);
      return false;
    }
    console.log('✅ Session oprettet:', data);
    return true;
  };

  const { data: sessions, error: sessionsError } = await supabase
    .from('knob_game_sessions')
    .select('*')
    .order('created_at', { ascending: false });

  if (sessionsError) {
    console.error('❌ Fejl ved hentning af sessions:', sessionsError.message);
    return;
  }

  const session = sessions?.find(
    (s) => s.responder_id === user.id || s.guesser_id === user.id
  );

  console.log('📦 Nuværende session:', session);

  let mode: 'answer' | 'guess' = 'answer';

  if (session?.question_id) {
    const { data: answers } = await supabase
      .from('knob_game_answers')
      .select('*')
      .eq('question_id', session.question_id);

    console.log('📊 Fundne svar:', answers);

    const answeredByUser = answers?.some((a) => a.user_id === user.id);
    const answeredByPartner = answers?.some((a) => a.user_id === partnerId);

    if (answeredByUser && !answeredByPartner) {
      console.log('🧠 Partner mangler at gætte');
      return; // Vi afventer partneren
    }

    if (!answeredByUser) {
      console.log('🟩 Mode: answer');
      mode = 'answer';
    } else if (!answeredByPartner) {
      console.log('🟨 Mode: guess');
      mode = 'guess';
    }

    if (answers && answers.length >= 2) {
      console.log('➡️ Tid til nyt spørgsmål – henter fra get_next_knob_question...');
      const { data: nextQArr, error: rpcError } = await supabase.rpc('get_next_knob_question', {
        user_id: user.id,
        mode: mode,
      });

      if (rpcError) {
        console.error('❌ Fejl i get_next_knob_question:', rpcError.message);
        return;
      }

      console.log('📬 get_next_knob_question data:', nextQArr);

      const nextQ = nextQArr?.[0];
      if (!nextQ) {
        console.warn('⚠️ Ingen flere spørgsmål tilbage!');
        return;
      }

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

      console.log('📌 Genbruger eksisterende spørgsmål:', q);

      setQuestion(q);
      if (session.responder_id === user.id) {
        setSessionRole('responder');
        setPhase('respond');
      } else {
        setSessionRole('guesser');
        setPhase('guess');
      }
    }
  } else {
    console.log('➕ Ny session – henter spørgsmål via RPC');
    const { data: nextQArr, error: rpcError } = await supabase.rpc('get_next_knob_question', {
      user_id: user.id,
      mode: 'answer',
    });

    if (rpcError) {
      console.error('❌ Fejl i get_next_knob_question:', rpcError.message);
      return;
    }

    console.log('📬 get_next_knob_question data:', nextQArr);

    const nextQ = nextQArr?.[0];
    if (!nextQ) {
      console.warn('⚠️ Ingen spørgsmål tilbage!');
      return;
    }

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
        setSessionRole(null);
        setPhase('wait');
      }, 2500);
    }
  };

  const checkForNewSession = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('partner_id')
      .eq('id', user.id)
      .maybeSingle();

    const partnerId = profile?.partner_id;
    if (!partnerId) return;

    const { data: sessions } = await supabase
      .from('knob_game_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    const session = sessions?.find(
      (s) => s.guesser_id === user.id
    );

    if (session && (!question || question.id !== session.question_id)) {
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
    if (user) fetchNextQuestion();
  }, [user]);

  useEffect(() => {
    if (phase === 'wait') {
      const interval = setInterval(() => {
        checkForNewSession();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [phase, question]);

  useEffect(() => {
    if (phase === 'guess') {
      const interval = setInterval(() => checkGuessStatus(), 3000);
      return () => clearInterval(interval);
    }
  }, [phase, question]);

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
