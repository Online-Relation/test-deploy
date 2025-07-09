'use client';
import { useEffect, useState } from 'react';
import { useUserContext } from '@/context/UserContext';
import { supabase } from '@/lib/supabaseClient';

interface ChallengeCard {
  id: string;
  title: string;
  question: string;
  category: string;
  active_from: string;
  active_to: string;
}

interface ChallengeAnswer {
  id: string;
  challenge_id: string;
  user_id: string;
  answer: string;
  created_at: string;
}

export default function ChallengeHistoryPage() {
  const { user } = useUserContext();
  const [activeCard, setActiveCard] = useState<{
    card: ChallengeCard;
    myAnswer: ChallengeAnswer | null;
    partnerAnswer: ChallengeAnswer | null;
    partnerName: string | null;
  } | null>(null);

  const [history, setHistory] = useState<
    {
      card: ChallengeCard;
      myAnswer: ChallengeAnswer | null;
      partnerAnswer: ChallengeAnswer | null;
      partnerName: string | null;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchHistory() {
      setLoading(true);

      const partnerId = user?.partner_id;
      if (!partnerId) {
        setHistory([]);
        setActiveCard(null);
        setLoading(false);
        return;
      }

      // Hent alle kort
      const { data: cards } = await supabase
        .from('challenge_cards')
        .select('*')
        .order('active_from', { ascending: false });

      // Hent alle svar fra dig og din partner
      const { data: answers } = await supabase
        .from('challenge_answers')
        .select('*')
        .in('user_id', [user.id, partnerId]);

      // Hent partner profilnavn (optionelt)
      let partnerName = null;
      if (partnerId) {
        const { data: partnerProfile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', partnerId)
          .single();
        partnerName = partnerProfile?.display_name || 'Din partner';
      }

      const today = new Date().toISOString().slice(0, 10);

      let activeCardObj: {
  card: ChallengeCard;
  myAnswer: ChallengeAnswer | null;
  partnerAnswer: ChallengeAnswer | null;
  partnerName: string | null;
} | null = null;

let previous: {
  card: ChallengeCard;
  myAnswer: ChallengeAnswer | null;
  partnerAnswer: ChallengeAnswer | null;
  partnerName: string | null;
}[] = [];


      (cards || []).forEach((card: ChallengeCard) => {
        const myAnswer = answers?.find(
          (a: ChallengeAnswer) => a.challenge_id === card.id && a.user_id === user.id
        ) || null;
        const partnerAnswer = answers?.find(
          (a: ChallengeAnswer) => a.challenge_id === card.id && a.user_id === partnerId
        ) || null;

        // Aktive kort: i dag mellem active_from og active_to
        if (card.active_from <= today && card.active_to >= today) {
          activeCardObj = { card, myAnswer, partnerAnswer, partnerName };
        } else {
          if (myAnswer || partnerAnswer) {
  previous.push({ card, myAnswer, partnerAnswer, partnerName });
}

        }
      });

      // Sorter tidligere kort (nyeste først)
      previous.sort((a, b) =>
        b.card.active_from.localeCompare(a.card.active_from)
      );

      setActiveCard(activeCardObj);
      setHistory(previous);
      setLoading(false);
    }

    fetchHistory();
  }, [user]);

  if (!user) {
    return <div className="p-8 text-center text-gray-400">Du skal være logget ind for at se din historik.</div>;
  }

  if (loading) {
    return <div className="p-8 text-center">Indlæser historik…</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-8">Udfordringskort</h1>

      {/* AKTIVT kort */}
      {activeCard && (
        <div className="mb-10 bg-white rounded-xl shadow p-6 border-2 border-indigo-500">
          <div className="font-semibold text-indigo-800 mb-1">{activeCard.card.title} <span className="ml-2 text-xs text-indigo-700 bg-indigo-100 px-2 py-1 rounded-full">Aktiv nu</span></div>
          <div className="mb-2 text-lg">{activeCard.card.question}</div>
          <div className="flex flex-col gap-2 mt-4">
            <div>
              <span className="font-semibold">Dit svar: </span>
              {activeCard.myAnswer ? activeCard.myAnswer.answer : <span className="text-gray-400">Ikke besvaret</span>}
            </div>
            <div>
              <span className="font-semibold">{activeCard.partnerName || "Din partner"}s svar: </span>
              {!activeCard.partnerAnswer
                ? <span className="text-gray-400">Ikke besvaret</span>
                : !activeCard.myAnswer
                  ? <span className="italic text-gray-400">Skjult indtil du også har svaret</span>
                  : activeCard.partnerAnswer.answer
              }
            </div>
          </div>
        </div>
      )}

      {/* TIDLIGERE kort */}
      {history.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-6 mt-4">Tidligere udfordringer</h2>
          {history.map(({ card, myAnswer, partnerAnswer, partnerName }) => (
            <div key={card.id} className="mb-8 bg-white rounded-xl shadow p-6">
              <div className="font-semibold text-indigo-800 mb-1">{card.title}</div>
              <div className="mb-2 text-lg">{card.question}</div>
              <div className="flex flex-col gap-2 mt-4">
                <div>
                  <span className="font-semibold">Dit svar: </span>
                  {myAnswer ? myAnswer.answer : <span className="text-gray-400">Ikke besvaret</span>}
                </div>
                <div>
                  <span className="font-semibold">{partnerName || "Din partner"}s svar: </span>
                  {!partnerAnswer
                    ? <span className="text-gray-400">Ikke besvaret</span>
                    : !myAnswer
                      ? <span className="italic text-gray-400">Skjult indtil du også har svaret</span>
                      : partnerAnswer.answer
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hvis ingen aktivt kort og ingen historik */}
      {!activeCard && history.length === 0 && (
        <div className="p-4 text-gray-500">Ingen udfordringer tilgængelige endnu.</div>
      )}
    </div>
  );
}
