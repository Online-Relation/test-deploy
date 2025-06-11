// app/spil/sellerk/page.tsx

"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserContext } from "@/context/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";

interface Question {
  id: string;
  text: string;
  type: "truth" | "dare";
  difficulty?: string;
  category?: string;
  created_at?: string;
}

interface Player {
  id: string;
  name: string;
  avatar: string | null;
}

interface XpSetting {
  role: string;
  action: string;
  effort: string | null;
  xp: number;
}

export default function SellerkGamePage() {
  const { user } = useUserContext();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [usedIds, setUsedIds] = useState<string[]>([]);
  const [currentCard, setCurrentCard] = useState<Question | null>(null);
  const [showTypeChoice, setShowTypeChoice] = useState(true);
  const [turn, setTurn] = useState<"mads" | "stine">("mads");
  const [players, setPlayers] = useState<Record<"mads" | "stine", Player>>({
    mads: { id: "mads", name: "Mads", avatar: null },
    stine: { id: "stine", name: "Stine", avatar: null },
  });
  const [xpMap, setXpMap] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchQuestions = async () => {
      const { data, error } = await supabase
        .from("truth_dare_cards")
        .select("id, text, type, difficulty, category, created_at");

      if (error) {
        console.error("Fejl ved hentning af spørgsmål:", error.message);
        return;
      }

      setQuestions(data || []);
    };

    const fetchAvatars = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("role, display_name, avatar_url")
        .in("role", ["mads", "stine"]);

      if (error) {
        console.error("Fejl ved hentning af avatars:", error.message);
        return;
      }

      const newPlayers = { ...players };
      data?.forEach((p) => {
        const role = p.role as "mads" | "stine";
        newPlayers[role] = {
          id: role,
          name: p.display_name,
          avatar: p.avatar_url,
        };
      });
      setPlayers(newPlayers);
    };

    const fetchXp = async () => {
      const { data, error } = await supabase
        .from("xp_settings")
        .select("role, action, effort, xp")
        .in("action", ["complete_truth_dare", "reject_truth_dare"]);

      if (error) {
        console.error("Fejl ved hentning af XP:", error.message);
        return;
      }

      const map: Record<string, number> = {};
      data?.forEach((entry: XpSetting) => {
        const key = `${entry.role}_${entry.action}_${entry.effort ?? "none"}`;
        map[key] = entry.xp;
      });
      setXpMap(map);
    };

    fetchQuestions();
    fetchAvatars();
    fetchXp();
  }, []);

  const drawCard = (type: "truth" | "dare") => {
    const available = questions.filter(
      (q) => q.type === type && !usedIds.includes(q.id)
    );
    if (available.length === 0) return;
    const random = available[Math.floor(Math.random() * available.length)];
    setUsedIds([...usedIds, random.id]);
    setCurrentCard(random);
    setShowTypeChoice(false);
  };

  const logXP = async (action: string) => {
    if (!user || !currentCard) return;
    const effortKey = currentCard.difficulty ?? "none";
    const xpKey = `${turn}_${action}_${effortKey}`;
    const xp = xpMap[xpKey] ?? 0;

    const { error } = await supabase.from("xp_log").insert({
      user_id: user.id,
      role: turn,
      change: xp,
      description: `Sandhed eller konsekvens (${action === "reject_truth_dare" ? "fravalgt" : currentCard.type})`,
    });

    if (error) {
      console.error("Kunne ikke logge XP:", error.message);
    }

    nextTurn();
  };

  const nextTurn = () => {
    setShowTypeChoice(true);
    setCurrentCard(null);
    setTurn((prev) => (prev === "mads" ? "stine" : "mads"));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
      <h1 className="text-2xl font-bold">🔥 Fræk Sandhed eller Konsekvens</h1>

      <div className="flex gap-8 items-center">
        {Object.entries(players).map(([key, player]) => (
          <div
            key={player.id}
            className={`flex flex-col items-center gap-1 ${
              key === turn ? "opacity-100" : "opacity-40"
            }`}
          >
            <div className="w-16 h-16 relative rounded-full overflow-hidden border-2 border-white shadow-md">
              {player.avatar && (
                <Image src={player.avatar} alt={player.name} fill className="object-cover" />
              )}
            </div>
            <div className="text-sm font-medium">{player.name}</div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showTypeChoice ? (
          <motion.div
            key="choice"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col gap-4"
          >
            <Button onClick={() => drawCard("truth")} className="w-48 text-lg">
              Sandhed
            </Button>
            <Button onClick={() => drawCard("dare")} className="w-48 text-lg">
              Konsekvens
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="w-full max-w-md"
          >
            <Card className="p-6 text-center shadow-xl rounded-2xl">
              <p className="text-xl font-semibold">{currentCard?.text}</p>
              <div className="mt-2 text-sm text-muted-foreground">
                {currentCard?.category} • {currentCard?.difficulty}
              </div>
            </Card>
            <div className="flex justify-center gap-4 mt-6">
              {currentCard?.type === "dare" && (
                <Button variant="destructive" onClick={() => logXP("reject_truth_dare")}>Jeg sprang fra</Button>
              )}
              <Button onClick={() => logXP("complete_truth_dare")}>Jeg fuldførte det!</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
