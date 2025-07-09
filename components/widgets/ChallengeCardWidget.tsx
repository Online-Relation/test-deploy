// /components/widgets/ChallengeCardWidget.tsx
'use client';
import { useEffect, useState } from "react";
import { useUserContext } from '@/context/UserContext';
import { useXp } from '@/context/XpContext';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface ChallengeCard {
  id: string;
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
  const [checkingAnswer, setCheckingAnswer] = useState(true); // <--- NY

  // Hent aktivt udfordringskort (kun det kort, der er aktivt i dag)
  useEffect(() => {
    async function fetchCard() {
      setLoading(true);
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
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

  // Hent XP fra xp_settings (dynamisk efter rolle)
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

  // Check om brugeren allerede har svaret, og om partneren har svaret
  useEffect(() => {
    if (!card || !userId || !partnerId) return;

    async function checkAnswers() {
      setCheckingAnswer(true); // <-- NY
      if (!card) return;
      // Check brugerens svar
      const { data: myAnswer } = await supabase
        .from("challenge_answers")
        .select("id")
        .eq("challenge_id", card.id)
        .eq("user_id", userId)
        .maybeSingle();

      setAlreadyAnswered(!!myAnswer);

      // Check partnerens svar (kun hvis du har svaret)
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
      setCheckingAnswer(false); // <-- NY
    }
    checkAnswers();
    // eslint-disable-next-line
  }, [card, userId, partnerId, submitted, refresh]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!card || !userId) return;
    setLoading(true);

    // Indsæt svar i challenge_answers
    const { error: answerError } = await supabase.from("challenge_answers").insert({
      challenge_id: card.id,
      user_id: userId,
      answer,
      xp_earned: xpValue,
    });

    if (answerError) {
      console.error("challenge_answers error:", answerError.message);
    } else {
      // Log XP til xp_log
      const { error: xpLogError } = await supabase.from("xp_log").insert({
        user_id: userId,
        action: "answer_challenge_card",
        change: xpValue,
      });
      if (xpLogError) {
        console.error("xp_log error:", xpLogError.message);
      } else {
        fetchXp();
        if (onAnswered) onAnswered(); // Trigger parent refresh!
      }
    }

    setSubmitted(true);
    setLoading(false);
  }

  // -- UI --
  if (loading || checkingAnswer) return null; // <-- skjul widget under async-check
  if (!card) return null; // skjul widget hvis ingen aktiv udfordring

  // VIS kun takkebesked hvis du lige har svaret nu
  if (submitted) {
    return (
      <div className="p-4 rounded-2xl bg-green-50 text-green-800 text-center">
        <div>Du har besvaret denne udfordring! 🏆</div>
        <div>Du har optjent <b>{xpValue} XP point</b>.</div>
        {partnerHasAnswered ? (
          <div className="mt-2">
            Din partner har også svaret –
            <Link href="/fantasy/udfordringskort" className="underline ml-1">se svaret nu</Link>
          </div>
        ) : (
          <div className="mt-2">
            Din partner har ikke svaret endnu.<br />
            Find svaret senere i <Link href="/fantasy/udfordringskort" className="underline">Udfordringskort</Link>
          </div>
        )}
      </div>
    );
  }

  // Hvis du har svaret før (alreadyAnswered) og loader dashboardet igen: skjul widget og besked
  if (alreadyAnswered) return null;

  // Vis kortet hvis ikke besvaret endnu
  return (
    <div className="p-4 rounded-2xl bg-white shadow flex flex-col gap-2">
      <div className="text-sm text-indigo-700 font-semibold mb-1">Udfordringskort</div>
      <div className="text-lg font-bold mb-2">{card.question}</div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          className="border rounded p-2 w-full min-h-[64px]"
          placeholder="Skriv dit svar her…"
          required
        />
        <button
          type="submit"
          className="btn btn-primary mt-2"
          disabled={loading || !answer.trim()}
        >
          Indsend svar (+{xpValue} XP)
        </button>
      </form>
    </div>
  );
}
