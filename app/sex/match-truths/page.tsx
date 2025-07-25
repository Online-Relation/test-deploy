"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useUserContext } from "@/context/UserContext";
import Image from "next/image";
import { format } from "date-fns";
import { da } from "date-fns/locale/da";

interface TruthCard {
  id: string;
  text: string;
}

interface AnswerLog {
  user_id: string;
  card_id: string;
  answer: "yes" | "maybe" | "no";
}

interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: "mads" | "stine";
}

interface CompletedMatch {
  card_id: string;
  completed_at: string;
}

type HistoryCard = { id: string; text: string; completed_at: string };

export default function MatchTruthsPage() {
  const { user } = useUserContext();
  const [cards, setCards] = useState<TruthCard[]>([]);
  const [answers, setAnswers] = useState<AnswerLog[]>([]);
  const [profiles, setProfiles] = useState<Record<"mads" | "stine", Profile | null>>({ mads: null, stine: null });
  const [completed, setCompleted] = useState<CompletedMatch[]>([]);
  const [loading, setLoading] = useState(true);

  // Hent alle relevante data ved load
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);

      // Hent sandhedskort
      const { data: cardData } = await supabase
        .from("truth_dare_cards")
        .select("id, text, type")
        .eq("type", "truth");

      // Hent logs (svar fra begge brugere)
      const { data: answerData } = await supabase
        .from("truth_dare_log")
        .select("user_id, card_id, answer")
        .in("answer", ["yes", "maybe"]); // Kun relevante svar

      // Hent profiler
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, role")
        .in("role", ["mads", "stine"]);

      // Hent completed matches (ny tabel, se nedenfor)
      const { data: completedData } = await supabase
        .from("truth_match_completed")
        .select("card_id, completed_at");

      // Set state
      setCards(cardData || []);
      setAnswers(answerData || []);
      setCompleted(completedData || []);

      // Mapper profiles til roller
      const mapped: Record<"mads" | "stine", Profile | null> = { mads: null, stine: null };
(profileData || []).forEach((p: any) => {
  if (p.role === "mads" || p.role === "stine") {
    mapped[p.role as "mads" | "stine"] = p;
  }
});



      setLoading(false);
    };

    fetchAll();
  }, []);

  // Udregn matches
  function getMatchedCards(matchAnswer: "yes" | "maybe") {
    // Find alle kort hvor begge brugere har givet matchAnswer og ikke er completed
    const mads = profiles.mads?.id;
    const stine = profiles.stine?.id;
    if (!mads || !stine) return [];

    return cards.filter(card => {
      if (completed.some(c => c.card_id === card.id)) return false; // flyttet til historik
      const madsAns = answers.find(a => a.card_id === card.id && a.user_id === mads);
      const stineAns = answers.find(a => a.card_id === card.id && a.user_id === stine);
      return madsAns?.answer === matchAnswer && stineAns?.answer === matchAnswer;
    });
  }

  // Historik: alle completed matches, nyeste øverst
  function getHistory(): HistoryCard[] {
    return completed
      .map(c => {
        const card = cards.find(card => card.id === c.card_id);
        return card ? { ...card, completed_at: c.completed_at } : null;
      })
      .filter((item): item is HistoryCard => !!item)
      .sort((a, b) => (b.completed_at > a.completed_at ? 1 : -1));
  }

  // Når man klikker "Vi gjorde det!"
  async function handleComplete(card_id: string) {
    const { error } = await supabase
      .from("truth_match_completed")
      .insert([{ card_id, completed_at: new Date().toISOString() }]);
    if (!error) {
      setCompleted(prev => [...prev, { card_id, completed_at: new Date().toISOString() }]);
    }
  }

  // Helper til at vise profil
  function renderAnswer(user: Profile | null, answer: "yes" | "maybe") {
    if (!user) return null;
    return (
      <div className="flex items-center gap-2 mt-2">
        {user.avatar_url && (
          <Image src={user.avatar_url} alt={user.display_name} width={36} height={36} className="rounded-full border" />
        )}
        <div>
          <div className="text-xs font-semibold">{user.display_name}</div>
          <div className="text-sm">{answer === "yes" ? "Ja" : "Måske"}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-5 px-2">
      <h1 className="text-2xl font-bold mb-4 text-purple-700 flex items-center gap-2">
        <span>✅</span> Fælles Ja-svar (Truth)
      </h1>

      {loading ? (
        <div className="text-center py-10">Indlæser...</div>
      ) : (
        <>
          {/* YES/YES MATCH */}
          {getMatchedCards("yes").length > 0 && (
            <section className="mb-6">
              <h2 className="font-bold text-lg mb-2 text-green-700">I er enige: Begge svarede Ja</h2>
              <div className="flex flex-col gap-4">
                {getMatchedCards("yes").map(card => (
                  <Card key={card.id} className="rounded-xl p-4 bg-white flex flex-col gap-2 shadow">
                    <div className="font-semibold mb-1">{card.text}</div>
                    <div className="flex gap-8">
                      {renderAnswer(profiles.mads, "yes")}
                      {renderAnswer(profiles.stine, "yes")}
                    </div>
                    <Button
                      onClick={() => handleComplete(card.id)}
                      className="mt-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full"
                    >
                      Vi gjorde det!
                    </Button>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* MAYBE/MAYBE MATCH */}
          {getMatchedCards("maybe").length > 0 && (
            <section className="mb-6">
              <h2 className="font-bold text-lg mb-2 text-yellow-600">Begge svarede Måske</h2>
              <div className="flex flex-col gap-4">
                {getMatchedCards("maybe").map(card => (
                  <Card key={card.id} className="rounded-xl p-4 bg-yellow-50 flex flex-col gap-2 shadow">
                    <div className="font-semibold mb-1">{card.text}</div>
                    <div className="flex gap-8">
                      {renderAnswer(profiles.mads, "maybe")}
                      {renderAnswer(profiles.stine, "maybe")}
                    </div>
                    <Button
                      onClick={() => handleComplete(card.id)}
                      className="mt-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full"
                    >
                      Vi gjorde det!
                    </Button>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* HISTORIK */}
          {getHistory().length > 0 && (
            <section>
              <h2 className="font-bold text-base mb-2 text-gray-500">Historik</h2>
              <div className="flex flex-col gap-3">
                {getHistory().map(card => (
                  <Card key={card.id} className="rounded-xl p-3 bg-gray-100 flex flex-col gap-1">
                    <div className="font-semibold">{card.text}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      Fuldført: {format(new Date(card.completed_at), "d. MMMM yyyy 'kl.' HH:mm", { locale: da })}
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
