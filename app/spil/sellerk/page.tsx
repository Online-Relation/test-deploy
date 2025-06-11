// /app/spil/sellerk/page.tsx

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

interface Stats {
  success: number;
  skipped: number;
}

interface ThemeRow {
  name: string;
  background_class?: string;
  card_class?: string;
  button_class?: string;
}

const predefinedThemes: Record<string, { background: string; card: string; button: string }> = {
  default: {
    background: "bg-white",
    card: "border-pink-200",
    button: "bg-black text-white",
  },
};

export default function SellerkGamePage() {
  const { user } = useUserContext();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [usedIds, setUsedIds] = useState<string[]>([]);
  const [currentCard, setCurrentCard] = useState<Question | null>(null);
  const [showTypeChoice, setShowTypeChoice] = useState(true);
  const [isWildcard, setIsWildcard] = useState(false);
  const [turn, setTurn] = useState<"mads" | "stine">("mads");
  const [theme, setTheme] = useState("default");
  const [availableThemes, setAvailableThemes] = useState<string[]>([]);
  const [themeStyles, setThemeStyles] = useState<Record<string, { background: string; card: string; button: string }>>(predefinedThemes);
  const [players, setPlayers] = useState<Record<"mads" | "stine", Player>>({
    mads: { id: "mads", name: "Mads", avatar: null },
    stine: { id: "stine", name: "Stine", avatar: null },
  });
  const [userIdMap, setUserIdMap] = useState<Record<"mads" | "stine", string>>({ mads: "", stine: "" });
  const [xpMap, setXpMap] = useState<Record<string, number>>({});
  const [stats, setStats] = useState<Record<"mads" | "stine", Stats>>({
    mads: { success: 0, skipped: 0 },
    stine: { success: 0, skipped: 0 },
  });
  const [earnedXP, setEarnedXP] = useState<Record<"mads" | "stine", number>>({
    mads: 0,
    stine: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: qData }, { data: profileData }, { data: xpData }, { data: themeData }] = await Promise.all([
        supabase.from("truth_dare_cards").select("id, text, type, difficulty, category, created_at"),
        supabase.from("profiles").select("id, role, display_name, avatar_url").in("role", ["mads", "stine"]),
        supabase.from("xp_settings").select("role, action, effort, xp").in("action", ["complete_truth_dare", "reject_truth_dare"]),
        supabase.from("game_themes").select("name, background_class, card_class, button_class"),
      ]);

      if (qData) setQuestions(qData);

      if (profileData) {
        const newPlayers = { ...players };
        const newUserIdMap: Record<"mads" | "stine", string> = { mads: "", stine: "" };
        profileData.forEach((p) => {
          const role = p.role as "mads" | "stine";
          newPlayers[role] = {
            id: p.id,
            name: p.display_name,
            avatar: p.avatar_url,
          };
          newUserIdMap[role] = p.id;
        });
        setPlayers(newPlayers);
        setUserIdMap(newUserIdMap);
      }

      if (xpData) {
        const map: Record<string, number> = {};
        xpData.forEach((entry: XpSetting) => {
          const key = `${entry.role}_${entry.action}_${entry.effort ?? "none"}`;
          map[key] = entry.xp;
        });
        setXpMap(map);
      }

      if (themeData) {
        const names: string[] = [];
        const styles: Record<string, { background: string; card: string; button: string }> = { ...predefinedThemes };

        themeData.forEach((t: ThemeRow, i) => {
          names.push(t.name);
          styles[t.name] = {
            background: t.background_class || (i % 2 === 0 ? "bg-blue-50" : "bg-green-50"),
            card: t.card_class || (i % 2 === 0 ? "border-blue-300" : "border-green-300"),
            button: t.button_class || (i % 2 === 0 ? "bg-blue-600 text-white" : "bg-green-600 text-white"),
          };
        });

        setAvailableThemes(names);
        setThemeStyles(styles);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    setIsWildcard((usedIds.length + 1) % 20 === 0);
  }, [usedIds]);

const drawCard = async (type: "truth" | "dare") => {
  const userId = userIdMap[turn];
  if (!userId) return;

  const { data: allCards } = await supabase.from("truth_dare_cards").select("*").eq("type", type);
  if (!allCards) return;

  const { data: log } = await supabase.from("truth_dare_log").select("card_id").eq("user_id", userId);
  const usedCardIds = new Set(log?.map((entry) => entry.card_id));

  const availableCards = allCards.filter((card) => {
    const notUsed = !usedCardIds.has(card.id);
    const matchesTheme = theme === "default" || card.category === theme;
    return notUsed && matchesTheme;
  });

  if (availableCards.length === 0) {
    setCurrentCard({ id: "none", text: "Ingen kort tilbage i bunken.", type });
    setShowTypeChoice(false);
    return;
  }

  const selected = availableCards[Math.floor(Math.random() * availableCards.length)];

  setCurrentCard(selected);
  setUsedIds((prev) => [...prev, selected.id]);
  setShowTypeChoice(false);
};


  const logXP = async (action: string) => {
    if (!user || !currentCard || currentCard.id === "none") return;

    const effortKey = currentCard.difficulty ?? "none";
    const xpKey = `${turn}_${action}_${effortKey}`;
    const xp = xpMap[xpKey] ?? 0;

    await supabase.from("xp_log").insert({
      user_id: user.id,
      role: turn,
      change: xp,
      description: `Sandhed eller konsekvens (${action === "reject_truth_dare" ? "fravalgt" : currentCard.type})`,
    });

    const targetUserId = userIdMap[turn];
await supabase.from("truth_dare_log").insert({
  user_id: targetUserId,
  card_id: currentCard.id,
});

setUsedCardIdsForTurn((prev) => [...prev, currentCard.id]);

    setStats((prev) => {
      const copy = { ...prev };
      if (action === "reject_truth_dare") copy[turn].skipped++;
      else copy[turn].success++;
      return copy;
    });

    setEarnedXP((prev) => ({ ...prev, [turn]: prev[turn] + xp }));
    nextTurn();
  };

  const nextTurn = () => {
    setShowTypeChoice(true);
    setCurrentCard(null);
    setTurn((prev) => (prev === "mads" ? "stine" : "mads"));
  };

  const themeStyle = themeStyles[theme] || themeStyles.default;

  const [usedCardIdsForTurn, setUsedCardIdsForTurn] = useState<string[]>([]);

  useEffect(() => {
    const fetchUsedCards = async () => {
      const userId = userIdMap[turn];
      if (!userId) return;
      const { data } = await supabase
        .from("truth_dare_log")
        .select("card_id")
        .eq("user_id", userId);
      setUsedCardIdsForTurn(data?.map((entry) => entry.card_id) || []);
    };

    fetchUsedCards();
  }, [turn, userIdMap]);

  useEffect(() => {
    if (currentCard && currentCard.id !== "none") {
      setUsedCardIdsForTurn((prev) => {
        if (!prev.includes(currentCard.id)) {
          return [...prev, currentCard.id];
        }
        return prev;
      });
    }
  }, [currentCard]);

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen gap-6 pt-2 px-4 pb-12 max-w-xl mx-auto border rounded-xl ${themeStyle.background}`}>
      <h1 className="text-xl font-bold mb-2 text-center">Sandhed eller Konsekvens</h1>

      <div className="flex flex-wrap gap-2 justify-center">
        {["default", ...availableThemes].map((key) => (
          <button
            key={key}
            onClick={() => setTheme(key)}
            className={`px-3 py-1 rounded-full text-sm border ${
              theme === key ? "bg-black text-white" : themeStyles[key]?.button || "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>

      <div className="text-sm text-muted-foreground mb-2">Runde {usedIds.length + 1}</div>

      <div className="flex gap-8 items-center">
        {Object.entries(players).map(([key, player]) => {
          const isActive = key === turn;
          const remainingTruth = questions.filter(
            (q) => q.category === theme && q.type === "truth" && !usedCardIdsForTurn.includes(q.id)
          ).length;
          const remainingDare = questions.filter(
            (q) => q.category === theme && q.type === "dare" && !usedCardIdsForTurn.includes(q.id)
          ).length;

          return (
            <div
              key={player.id}
              className={`flex flex-col items-center gap-1 ${isActive ? "opacity-100" : "opacity-40"}`}
            >
              <div className="w-24 h-24 relative rounded-full overflow-hidden border-2 border-white shadow-md">
                {player.avatar && (
                  <Image src={player.avatar} alt={player.name} fill className="object-cover" />
                )}
              </div>
              <div className="text-sm font-medium">{player.name}</div>
              <div className="text-xs text-muted-foreground">
                ✅ {stats[key as "mads" | "stine"].success} / ❌ {stats[key as "mads" | "stine"].skipped}
              </div>
              <div className="text-xs text-green-700 font-semibold">
                XP: {earnedXP[key as "mads" | "stine"]}
              </div>
              {theme !== "default" && (
                <motion.div
                  key={isActive ? "visible" : "hidden"}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: isActive ? 1 : 0, height: isActive ? "auto" : 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="text-[11px] text-muted-foreground text-center mt-1">
                    Sandhed: {remainingTruth} kort<br />
                    Konsekvens: {remainingDare} kort
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {isWildcard && showTypeChoice && (
        <div className="text-center text-pink-600 font-semibold text-lg">
          🎲 Wildcard! Den anden vælger om du skal tage sandhed eller konsekvens
        </div>
      )}

      <AnimatePresence>
        {showTypeChoice ? (
          <motion.div
            key="choice"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col gap-4"
          >
            <Button onClick={() => drawCard("truth")} className={`w-48 text-lg ${themeStyle.button}`}>
              Sandhed
            </Button>
            <Button onClick={() => drawCard("dare")} className={`w-48 text-lg ${themeStyle.button}`}>
              Konsekvens
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ duration: 0.4, type: "spring" }}
            className="w-full max-w-md"
          >
            <Card className={`p-6 text-center shadow-xl rounded-2xl border-2 ${themeStyle.card}`}>
              <motion.p
                className="text-xl font-semibold"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                {currentCard?.text}
              </motion.p>
              <div className="mt-2 text-sm text-muted-foreground">
                {currentCard?.category} • {currentCard?.difficulty}
              </div>
            </Card>
            <div className="flex justify-center gap-4 mt-6">
              {currentCard?.type === "dare" && (
                <Button variant="destructive" onClick={() => logXP("reject_truth_dare")}>Jeg sprang fra</Button>
              )}
              <Button onClick={() => logXP("complete_truth_dare")} className={themeStyle.button}>Jeg fuldførte det!</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}