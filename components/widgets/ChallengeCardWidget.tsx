'use client';
import { useEffect, useState } from "react";
import { useUserContext } from '@/context/UserContext';
import { useXp } from '@/context/XpContext';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Trophy, Sparkles } from "lucide-react";
import { Badge } from '@/components/ui/badge'; // ← Din badge-komponent

interface ChallengeCard {
  id: string;
  title: string;      // ← tilføj denne linje
  question: string;
  category: string;
  active_from: string;
  active_to: string;
}


interface Widget {
  widget_key: string;
  layout: string;
  height: string;
}

interface ChallengeCardWidgetProps {
  widget: Widget;
  refresh?: number;
  onAnswered?: () => void;
}

export default function ChallengeCardWidget({
  widget,
  refresh,
  onAnswered,
}: ChallengeCardWidgetProps) {
  const { user } = useUserContext();
  const { fetchXp } = useXp();
  const userId = user?.id;
  const userRole = user?.role;
  const partnerId = user?.partner_id;

  const [card, setCard] = useState<ChallengeCard | null>(null);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alreadyAnswered, setAlreadyAnswered] = useState(false);
  const [xpValue, setXpValue] = useState<number>(0);
  const [partnerHasAnswered, setPartnerHasAnswered] = useState<boolean>(false);
  const [checkingAnswer, setCheckingAnswer] = useState(true);

  useEffect(() => {
    async function fetchCard() {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("challenge_cards")
        .select("*")
        .lte("active_from", today)
        .gte("active_to", today)
        .order("active_from", { ascending: true })
        .limit(1)
        .single();
      setCard(data || null);
      setLoading(false);
    }
    fetchCard();
    // eslint-disable-next-line
  }, [refresh]);

  useEffect(() => {
    async function fetchXP() {
      if (!userRole) {
        setXpValue(0);
        return;
      }
      const { data } = await supabase
        .from("xp_settings")
        .select("xp")
        .eq("role", userRole)
        .eq("action", "answer_challenge_card")
        .single();
      setXpValue(data?.xp ?? 0);
    }
    fetchXP();
  }, [userRole]);

  useEffect(() => {
    if (!card || !userId || !partnerId) return;

    async function checkAnswers() {
      setCheckingAnswer(true);
      if (!card) return;
      const { data: myAnswer } = await supabase
        .from("challenge_answers")
        .select("id")
        .eq("challenge_id", card.id)
        .eq("user_id", userId)
        .maybeSingle();

      setAlreadyAnswered(!!myAnswer);

      if (myAnswer) {
        const { data: partnerAnswer } = await supabase
          .from("challenge_answers")
          .select("id")
          .eq("challenge_id", card.id)
          .eq("user_id", partnerId)
          .maybeSingle();
        setPartnerHasAnswered(!!partnerAnswer);
      } else {
        setPartnerHasAnswered(false);
      }
      setCheckingAnswer(false);
    }
    checkAnswers();
    // eslint-disable-next-line
  }, [card, userId, partnerId, submitted, refresh]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!card || !userId) return;
    setLoading(true);

    const { error: answerError } = await supabase.from("challenge_answers").insert({
      challenge_id: card.id,
      user_id: userId,
      answer,
      xp_earned: xpValue,
    });

    if (answerError) {
      console.error("challenge_answers error:", answerError.message);
    } else {
      const { error: xpLogError } = await supabase.from("xp_log").insert({
        user_id: userId,
        action: "answer_challenge_card",
        change: xpValue,
      });
      if (xpLogError) {
        console.error("xp_log error:", xpLogError.message);
      } else {
        fetchXp();
        if (onAnswered) onAnswered();
      }
    }

    setSubmitted(true);
    setLoading(false);
  }

  if (loading || checkingAnswer) return null;
  if (!card) return null;

  if (submitted) {
    return (
      <div className="w-full rounded-2xl shadow bg-green-50 border border-green-200 px-6 py-6 mb-6 text-center flex flex-col gap-3 items-center">
        <Trophy className="mx-auto text-green-400 mb-1" size={28} />
        <div className="text-base font-bold text-green-900 mb-1">Du har besvaret denne udfordring!</div>
        <div className="text-sm font-semibold text-green-800 mb-2">Du har optjent <b>{xpValue} XP point</b>.</div>
        {partnerHasAnswered ? (
          <div className="text-green-800">
            Din partner har også svaret –{" "}
            <Link href="/fantasy/udfordringskort" className="underline font-semibold">
              se svaret nu
            </Link>
          </div>
        ) : (
          <div className="text-green-700">
            Din partner har ikke svaret endnu.<br />
            Find svaret senere i <Link href="/fantasy/udfordringskort" className="underline font-semibold">Udfordringskort</Link>
          </div>
        )}
      </div>
    );
  }

  if (alreadyAnswered) return null;

function getDaysLeft(card: ChallengeCard) {
  const toDate = new Date(card.active_to);
  const today = new Date();
  // Sæt tiden til midnat for begge for at undgå off-by-one fejl
  toDate.setHours(0,0,0,0);
  today.setHours(0,0,0,0);
  const msLeft = toDate.getTime() - today.getTime();
  return Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
}

  // Nu med <Badge>
  return (
    <div className="w-full rounded-2xl shadow-lg bg-white border border-indigo-100 px-0 py-0 mt-4 mb-8">
    <div className="flex items-center gap-2 px-8 pt-7 pb-2">
      <Sparkles size={24} className="text-indigo-600" /> 
      {/* Gør ikonet lidt større og farven lidt kraftigere */}
      <span className="text-indigo-800 text-xl font-extrabold">
        Sandhedens time
      </span>
      <span className="ml-auto">
        <Badge className="badge-warning">+{xpValue} XP</Badge>
      </span>
    </div>
    <div className="px-8 pt-0 pb-2">
      <p className="text-indigo-700 text-sm italic">
        Her er plads til ærlighed – og måske en smule pinlig stilhed. Klar, parat, åben!
      </p>
    </div>

    <div className="px-8 pt-1 pb-0">
      <div className="font-semibold text-indigo-700 mb-1 text-sm sm:text-base text-left">
        {card.title}:
      </div>
      <div className="text-base sm:text-lg font-normal text-gray-900 mb-2 text-left leading-snug whitespace-pre-line">
        {card.question}
      </div>
    </div>


      <form onSubmit={handleSubmit} className="flex flex-col items-center w-full px-8 pb-7">
        <textarea
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          className="w-full bg-gray-50 rounded-xl border border-indigo-100 p-3 shadow-inner focus:outline-indigo-400 focus:ring-2 focus:ring-indigo-300 text-base min-h-[60px] transition-all resize-none"
          placeholder="Skriv dit svar her…"
          required
        />
        <button
          type="submit"
          disabled={loading || !answer.trim()}
          className="btn btn-primary mt-5 w-full sm:w-2/3"
        >
          {loading ? "Indsender..." : `Indsend svar (+${xpValue} XP)`}
        </button>
        {card && (
  <div className="mt-3 text-xs text-gray-500 text-center">
    Du har <b>{getDaysLeft(card)}</b> dag{getDaysLeft(card) === 1 ? '' : 'e'} til at besvare spørgsmålet.
  </div>
)}

      </form>
      
    </div>
  );
}
