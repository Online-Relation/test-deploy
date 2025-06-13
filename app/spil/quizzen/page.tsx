"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUserContext } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { useXp } from "@/context/XpContext";
import Image from "next/image";
import { motion, useAnimationControls } from "framer-motion";
import confetti from "canvas-confetti";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface Question {
  id: string;
  text: string;
  category: string;
}

interface Profile {
  id: string;
  display_name: string;
  avatar_url: string;
  role: string;
}

export default function CoupleQuizPage() {
  const { user } = useUserContext();
  const { fetchXp, xpSettings } = useXp();
  const [question, setQuestion] = useState<Question | null>(null);
  const [lastQuestionId, setLastQuestionId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; points: number } | null>(null);
  const [remainingCount, setRemainingCount] = useState(0);
  const [statsByUser, setStatsByUser] = useState<Record<string, { correct: number; wrong: number }>>({});

  const shakeControls = useAnimationControls();
  const asker = profiles[activeIndex];
  const answerer = profiles[(activeIndex + 1) % profiles.length];

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (profiles.length === 2) fetchNextQuestion();
  }, [profiles, activeIndex]);

  const fetchProfiles = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, role")
      .in("role", ["mads", "stine"]);

    if (data) {
      const sorted = data.sort((a, b) => (a.role === "mads" ? -1 : 1));
      setProfiles(sorted);
    }
  };

  const fetchNextQuestion = async () => {
    setLoading(true);
    setFeedback(null);

    if (!answerer) return;

    const { data: answered } = await supabase
      .from("couple_quiz_answers")
      .select("question_id")
      .eq("user_id", answerer.id);

    const answeredIds = answered?.map((a) => a.question_id) || [];

    const { data: allQuestions } = await supabase
      .from("couple_quiz_questions")
      .select("id, text, category")
      .eq("active", true);

    if (!allQuestions || allQuestions.length === 0) {
      setQuestion(null);
      setLoading(false);
      return;
    }

    const unused = allQuestions.filter((q) => !answeredIds.includes(q.id) && q.id !== lastQuestionId);

    setRemainingCount(unused.length);

    const { data: allStats } = await supabase
      .from("xp_log")
      .select("user_id, action")
      .in("action", ["quiz_correct", "quiz_wrong"]);

    if (allStats && profiles.length === 2) {
      const counts: Record<string, { correct: number; wrong: number }> = {};
      for (const profile of profiles) {
        const correct = allStats.filter((s) => s.user_id === profile.id && s.action === "quiz_correct").length;
        const wrong = allStats.filter((s) => s.user_id === profile.id && s.action === "quiz_wrong").length;
        counts[profile.display_name] = { correct, wrong };
      }
      setStatsByUser(counts);
    }

    if (unused.length === 0) {
      setQuestion(null);
    } else {
      const next = unused[Math.floor(Math.random() * unused.length)];
      setQuestion(next);
      setLastQuestionId(next.id);
    }

    setLoading(false);
  };

  const logAnswer = async (type: "quiz_correct" | "quiz_wrong") => {
    if (!user || !question || !answerer || !asker) return;

    const xpSetting = xpSettings.find(
      (s) => s.action === type && s.role === answerer.role
    );
    const xpValue = xpSetting?.xp || 0;

    const { error: xpError } = await supabase.from("xp_log").insert([
      {
        user_id: answerer.id,
        action: type,
        change: xpValue,
        role: answerer.role,
        description: `Parquiz: ${type} (${answerer.display_name})`,
      },
    ]);

    const { error: answerError } = await supabase.from("couple_quiz_answers").insert([
      {
        question_id: question.id,
        user_id: answerer.id,
        role: answerer.role,
        guessed_by_partner: asker.role,
      },
    ]);

    if (!xpError && !answerError) {
      fetchXp();

      if (type === "quiz_correct") {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.3 },
        });
      } else {
        confetti({
          particleCount: 60,
          spread: 90,
          startVelocity: 45,
          gravity: 1,
          scalar: 1.2,
          origin: { y: 0.4 },
          colors: ["#ff0000", "#cc0000", "#990000"],
        });

        shakeControls.start({
          x: [0, -10, 10, -10, 10, 0],
          transition: { duration: 0.5 },
        });
      }

      setFeedback({
        message:
          type === "quiz_correct"
            ? `${answerer.display_name} - du optjente ${xpValue} point 🎉`
            : `${answerer.display_name} - du tabte ${xpValue} point 😢`,
        points: xpValue,
      });
    } else {
      console.error("Fejl ved logging:", xpError || answerError);
    }
  };

  const nextTurn = () => {
    setActiveIndex((prev) => (prev + 1) % profiles.length);
  };

  if (!user || !asker) return <p className="p-6 text-center">Brugerdata indlæses...</p>;
  if (loading || !question) return <p className="p-6 text-center">Indlæser spørgsmål...</p>;

  const chartData = {
    labels: ["Rigtige", "Forkerte"],
    datasets: profiles.map((p) => ({
      label: p.display_name,
      data: [
        statsByUser[p.display_name]?.correct || 0,
        statsByUser[p.display_name]?.wrong || 0,
      ],
      backgroundColor: p.role === "mads" ? "#3b82f6" : "#ec4899",
    })),
  };

  return (
    <div className="max-w-xl mx-auto p-6 relative">
      <div className="absolute top-0 right-0 p-4">
        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary shadow">
          <Image
            src={asker.avatar_url || "/default-avatar.png"}
            alt={asker.display_name}
            width={80}
            height={80}
          />
        </div>
      </div>

      {!feedback && (
        <h1 className="text-2xl font-bold mb-2">{asker.display_name} spørger om:</h1>
      )}

      <motion.div
        className="p-4 mb-4 min-h-[180px] flex flex-col justify-between rounded-xl border bg-white shadow"
        animate={shakeControls}
      >
        {feedback ? (
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className="text-center text-lg font-semibold text-green-700"
          >
            {feedback.message}
          </motion.div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-lg">{question.text}</p>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                {question.category}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Når din partner har svaret, vælg om det var rigtigt eller forkert.
            </p>
            <div className="flex gap-4">
              <Button onClick={() => logAnswer("quiz_correct")} className="btn w-full bg-green-600 text-white">
                Gættede rigtigt
              </Button>
              <Button onClick={() => logAnswer("quiz_wrong")} className="btn w-full bg-red-600 text-white">
                Gættede forkert
              </Button>
            </div>
          </>
        )}
      </motion.div>

      {feedback && (
        <Button onClick={nextTurn} className="btn w-full mt-4">
          Næste spørgsmål
        </Button>
      )}

      {/* Stats-bokse */}
      <div className="flex flex-col md:flex-row gap-4 mt-6">
        <div className="flex-1 rounded-xl border bg-white p-4 shadow">
          <p className="text-sm text-muted-foreground mb-1">
            Spørgsmål tilbage til {answerer?.display_name}:
          </p>
          <p className="text-xl font-bold">{remainingCount} kort</p>
        </div>

        <div className="flex-1 rounded-xl border bg-white p-4 shadow overflow-x-auto">
          <p className="text-sm text-muted-foreground mb-2">Svarstatistik:</p>
          <Bar data={chartData} />
        </div>
      </div>
    </div>
  );
}