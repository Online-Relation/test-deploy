// /components/BetProbabilityBar.tsx

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface BetProbabilityBarProps {
  bet: {
    guess_1_min: number | null;
    guess_1_max: number | null;
    guess_2_min: number | null;
    guess_2_max: number | null;
    end_at: string;
    participant_1_avatar?: string;
    participant_2_avatar?: string;
    participant_1_name?: string;
    participant_2_name?: string;
  };
  betId: string;
}


export default function BetProbabilityBar({ bet, betId }: BetProbabilityBarProps) {
  const [progress, setProgress] = useState<{ date: string; value: number }[]>([]);
  const [probMads, setProbMads] = useState<number | null>(null);
  const [probStine, setProbStine] = useState<number | null>(null);

  useEffect(() => {
    if (!betId) return;
    (async () => {
      const { data, error } = await supabase
        .from("bet_progress")
        .select("date, value")
        .eq("bet_id", betId)
        .order("date", { ascending: true });
      if (!error && data) setProgress(data);
    })();
  }, [betId]);

  useEffect(() => {
    if (!bet || progress.length === 0) return;

    const first = progress[0];
    const last = progress[progress.length - 1];

    const d0 = new Date(first.date).getTime();
    const d1 = new Date(last.date).getTime();
    const v0 = first.value;
    const v1 = last.value;

    const daysElapsed = Math.max(1, Math.round((d1 - d0) / (1000 * 60 * 60 * 24)));
    const perDay = (v1 - v0) / daysElapsed;

    const now = new Date(last.date).getTime();
    const end = new Date(bet.end_at).getTime();
    const daysLeft = Math.max(0, Math.round((end - now) / (1000 * 60 * 60 * 24)));

    const projected = Math.round(v1 + daysLeft * perDay);

    let p1 = 0, p2 = 0;
    if (
      typeof bet.guess_1_min === "number" &&
      typeof bet.guess_1_max === "number" &&
      typeof bet.guess_2_min === "number" &&
      typeof bet.guess_2_max === "number"
    ) {
      const in1 = projected >= bet.guess_1_min && projected <= bet.guess_1_max;
      const in2 = projected >= bet.guess_2_min && projected <= bet.guess_2_max;

      if (in1 && !in2) p1 = 1;
      else if (!in1 && in2) p2 = 1;
      else if (in1 && in2) p1 = p2 = 0.5;
      else {
        const dTo1 = Math.min(Math.abs(projected - bet.guess_1_min), Math.abs(projected - bet.guess_1_max));
        const dTo2 = Math.min(Math.abs(projected - bet.guess_2_min), Math.abs(projected - bet.guess_2_max));
        if (dTo1 + dTo2 === 0) {
          p1 = p2 = 0.5;
        } else {
          p1 = dTo2 / (dTo1 + dTo2);
          p2 = dTo1 / (dTo1 + dTo2);
        }
      }
    }
    setProbMads(p1);
    setProbStine(p2);
  }, [progress, bet]);

  if (probMads === null || probStine === null) return null;

  const madsAvatar = bet.participant_1_avatar || "/dummy-avatar.jpg";
  const stineAvatar = bet.participant_2_avatar || "/dummy-avatar.jpg";

  return (
 <div className="mt-2 bg-white rounded-2xl shadow px-5 py-4 flex flex-col items-center">

    <div className="w-full flex items-center gap-2 mb-2">
      <img
        src={madsAvatar}
        alt=""
        className="w-8 h-8 rounded-full border border-gray-300 object-cover"
      />
      <div className="flex-1 bg-gray-200 h-5 rounded-full overflow-hidden relative">
        <div
          className="bg-[#0077b5] h-full transition-all"
          style={{ width: `${probMads * 100}%` }}
        />
        <div
          className="bg-[#00c389] h-full transition-all absolute top-0"
          style={{
            width: `${probStine * 100}%`,
            left: `${probMads * 100}%`,
          }}
        />
      </div>
      <img
        src={stineAvatar}
        alt=""
        className="w-8 h-8 rounded-full border border-gray-300 object-cover"
      />
    </div>
    <div className="w-full flex justify-between text-xs text-gray-600">
      <span>{Math.round(probMads * 100)}% chance</span>
      <span>{Math.round(probStine * 100)}% chance</span>
    </div>
  </div>
);
}