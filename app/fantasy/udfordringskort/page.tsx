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
  revealed_for_partner: boolean;
  created_at: string;
}

interface MotivationalText {
  title: string;
  description: string;
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
  const [revealLoading, setRevealLoading] = useState<{ [answerId: string]: boolean }>({});
  const [completed, setCompleted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newAnswer, setNewAnswer] = useState("");
  
  const [motivationalText, setMotivationalText] = useState<MotivationalText | null>(null);

  // Fetch motivational text
  useEffect(() => {
  const fetchMotivationalText = async () => {
    const { data, error } = await supabase
      .from('motivational_texts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1); // Only get the latest record

    if (error) {
      console.error('Error fetching motivational text:', error);
      return;
    }

    setMotivationalText(data ? data[0] : null);
  };

  // Fetch text immediately when the page loads
  fetchMotivationalText();

  // Check if it's the second Sunday of the month at 5:00 AM
  const checkIfTimeToFetch = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // Sunday is 0
    const hour = now.getHours();

    // Check if it's Sunday and 5:00 AM
    if (dayOfWeek === 0 && hour === 5) {
      fetchMotivationalText();
    }
  };

  // Run the check function every hour
  const intervalId = setInterval(checkIfTimeToFetch, 3600000); // Check every hour

  return () => clearInterval(intervalId); // Clean up the interval on unmount
}, []);


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

      const { data: cards } = await supabase
        .from('challenge_cards')
        .select('*')
        .order('active_from', { ascending: false });

      const { data: answers } = await supabase
        .from('challenge_answers')
        .select('*')
        .in('user_id', [user.id, partnerId]);

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

        if (card.active_from <= today && card.active_to >= today) {
          activeCardObj = { card, myAnswer, partnerAnswer, partnerName };
        } else {
          if (myAnswer || partnerAnswer) {
            previous.push({ card, myAnswer, partnerAnswer, partnerName });
          }
        }
      });

      previous.sort((a, b) =>
        b.card.active_from.localeCompare(a.card.active_from)
      );

      setActiveCard(activeCardObj);
      setHistory(previous);
      setLoading(false);
    }

    fetchHistory();
  }, [user]);

  async function handleRevealMyAnswer(answer: ChallengeAnswer) {
    setRevealLoading((prev) => ({ ...prev, [answer.id]: true }));
    await supabase
      .from('challenge_answers')
      .update({ revealed_for_partner: true })
      .eq('id', answer.id);
    setTimeout(() => {
      setRevealLoading((prev) => ({ ...prev, [answer.id]: false }));
      window.location.reload(); // Reload to show updated status
    }, 300);
  }

  const handleComplete = async () => {
    if (activeCard) {
      await supabase
        .from('challenge_cards')
        .update({ completed: true })
        .eq('id', activeCard.card.id);
      setCompleted(true);
    }
  };

  function getAnswerStatus(answer: ChallengeAnswer | null, name: string) {
    if (answer) return <span className="text-green-600 font-semibold">{name} har besvaret</span>;
    return <span className="text-gray-400">{name} har ikke besvaret endnu</span>;
  }

  const handleEditAnswer = (answer: ChallengeAnswer) => {
    setNewAnswer(answer.answer);
    setIsEditing(true);
  };

  const handleAnswerChange = async (myAnswer: ChallengeAnswer | null, newAnswer: string) => {
    if (!myAnswer) return;

    const { error } = await supabase
      .from('challenge_answers')
      .update({ answer: newAnswer })
      .eq('id', myAnswer.id);

    if (!error) {
      setTimeout(() => window.location.reload(), 300);
    }
  };

  function renderAnswers(myAnswer: ChallengeAnswer | null, partnerAnswer: ChallengeAnswer | null, partnerName: string | null) {
    const bothAnswered = myAnswer && partnerAnswer;
    const bothRevealed = myAnswer?.revealed_for_partner && partnerAnswer?.revealed_for_partner;

    return (
      <div className="flex flex-col gap-2 mt-4 p-4 border-b-2">
        <div>
          <span className="font-semibold">Dit svar: </span>
          {myAnswer
            ? <>
                {isEditing && !myAnswer.revealed_for_partner ? (
                  <div>
                    <textarea
                      value={newAnswer}
                      onChange={(e) => setNewAnswer(e.target.value)}
                      className="w-full p-2 border rounded-md"
                    />
                    <button
                      className="mt-2 w-full py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                      onClick={() => handleAnswerChange(myAnswer, newAnswer)}
                    >
                      Opdater mit svar
                    </button>
                    <button
                      className="mt-2 w-full py-2 text-white bg-gray-500 hover:bg-gray-600 rounded-lg"
                      onClick={() => setIsEditing(false)}
                    >
                      Annuller
                    </button>
                  </div>
                ) : (
                  <>
                    <span>{myAnswer.answer}</span>
                    <span className="ml-2">{getAnswerStatus(myAnswer, "Du")}</span>
                    {!myAnswer.revealed_for_partner && (
                      <button
                        className="mt-4 w-full py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                        onClick={() => handleEditAnswer(myAnswer)}
                      >
                        Redigér mit svar
                      </button>
                    )}
                    {myAnswer.revealed_for_partner && (
                      <span className="ml-3 text-indigo-600">(Dit svar er afsløret for din partner)</span>
                    )}
                  </>
                )}
              </>
            : <span className="text-gray-400">Ikke besvaret</span>}
        </div>

        <div>
          <span className="font-semibold">{partnerName || "Din partner"}s svar: </span>
          {partnerAnswer
            ? <>
                {partnerAnswer.revealed_for_partner
                  ? partnerAnswer.answer
                  : <span className="italic text-gray-400">Skjult indtil {partnerName || "din partner"} vælger at afsløre sit svar</span>
                }
                <span className="ml-2">{getAnswerStatus(partnerAnswer, partnerName || "Din partner")}</span>
              </>
            : <span className="text-gray-400">{partnerName || "Din partner"} har ikke besvaret endnu</span>}
        </div>

        {bothAnswered && bothRevealed && (
          <div className="mt-4">
            <button
              className="w-full py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
              onClick={handleComplete}
            >
              Fuldfør
            </button>
          </div>
        )}

        {bothAnswered && !bothRevealed && (
          <div className="mt-4">
            <button
              className="w-full py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
              onClick={() => {
                myAnswer && handleRevealMyAnswer(myAnswer);
              }}
              disabled={revealLoading[myAnswer?.id || ""]}
            >
              {revealLoading[myAnswer?.id || ""] ? "Afslører..." : "Afslør mit svar"}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-8">Udfordringskort</h1>

      {/* Display motivational text */}
      {motivationalText && (
        <div className="mb-8 p-4 bg-gray-100 rounded-xl">
          <h2 className="text-lg font-semibold">{motivationalText.title}</h2>
          <p>{motivationalText.description}</p>
        </div>
      )}

      {/* Active Card */}
      {activeCard && !completed && (
        <div className="mb-10 bg-white rounded-xl shadow p-6 border-2 border-indigo-500">
          <div className="font-semibold text-indigo-800 mb-1">
            {activeCard.card.title}
            <span className="ml-2 text-xs text-indigo-700 bg-indigo-100 px-2 py-1 rounded-full">Aktiv nu</span>
          </div>
          <div className="mb-2 text-lg">{activeCard.card.question}</div>
          {renderAnswers(activeCard.myAnswer, activeCard.partnerAnswer, activeCard.partnerName)}
        </div>
      )}

      {/* Historik - When completed */}
      {completed && (
        <div className="mb-10 bg-white rounded-xl shadow p-6 border-2 border-indigo-500">
          <h2 className="text-xl font-semibold">Historik</h2>
          <div className="mb-2 text-lg">Dette kort er nu afsluttet</div>
          {activeCard && (
            <div className="mt-4">
              <span className="font-semibold">Dit svar: </span> {activeCard.myAnswer?.answer}
              <br />
              <span className="font-semibold">{activeCard.partnerName || "Din partner"}s svar: </span>
              {activeCard.partnerAnswer?.answer}
            </div>
          )}
        </div>
      )}

      {/* Tidligere kort */}
      {history.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-6 mt-4">Tidligere udfordringer</h2>
          {history.map(({ card, myAnswer, partnerAnswer, partnerName }) => (
            <div key={card.id} className="mb-8 bg-white rounded-xl shadow p-6">
              <div className="font-semibold text-indigo-800 mb-1">{card.title}</div>
              <div className="mb-2 text-lg">{card.question}</div>
              {renderAnswers(myAnswer, partnerAnswer, partnerName)}
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
