// /components/BetProbabilityBar.tsx

import React, { useEffect, useState } from "react";

interface Bet {
  guess_1_min: number;
  guess_1_max: number;
  guess_2_min: number;
  guess_2_max: number;
  end_at: string;
  participant_1_name?: string;
  participant_2_name?: string;
  participant_1_avatar?: string;
  participant_2_avatar?: string;
}

interface ProgressEntry {
  date: string;
  value: number;
}

export default function BetProbabilityBar({
  bet,
  progress,
}: {
  bet: Bet;
  progress: ProgressEntry[];
}) {
  const [probMads, setProbMads] = useState(0.5);
  const [probStine, setProbStine] = useState(0.5);

  useEffect(() => {
    if (!bet || !progress || progress.length === 0) {
      setProbMads(0.5);
      setProbStine(0.5);
      return;
    }

    let stagnantDays = 0;
    if (progress.length > 1) {
      let last = progress[progress.length - 1].value;
      for (let i = progress.length - 2; i >= 0; i--) {
        if (progress[i].value === last) stagnantDays++;
        else break;
      }
    }

    let perDay = 0;
    if (progress.length >= 2) {
      const penultimate = progress[progress.length - 2];
      const last = progress[progress.length - 1];
      const days = Math.max(
        1,
        Math.round(
          (new Date(last.date).getTime() -
            new Date(penultimate.date).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );
      perDay = (last.value - penultimate.value) / days;
    }

    const v1 = progress[progress.length - 1].value;
    const now = new Date(progress[progress.length - 1].date).getTime();
    const end = new Date(bet.end_at).getTime();
    const daysLeft = Math.max(
      0,
      Math.round((end - now) / (1000 * 60 * 60 * 24))
    );

    let projected = Math.round(v1 + daysLeft * perDay);

    let p1 = 0;
    let p2 = 0;

    if (
      typeof bet.guess_1_min === "number" &&
      typeof bet.guess_1_max === "number" &&
      typeof bet.guess_2_min === "number" &&
      typeof bet.guess_2_max === "number"
    ) {
      const in1 =
        projected >= bet.guess_1_min && projected <= bet.guess_1_max;
      const in2 =
        projected >= bet.guess_2_min && projected <= bet.guess_2_max;

      if (in1 && !in2) p1 = 1;
      else if (!in1 && in2) p2 = 1;
      else if (in1 && in2) {
        p1 = 0.5;
        p2 = 0.5;
      } else {
        const dTo1 = Math.min(
          Math.abs(projected - bet.guess_1_min),
          Math.abs(projected - bet.guess_1_max)
        );
        const dTo2 = Math.min(
          Math.abs(projected - bet.guess_2_min),
          Math.abs(projected - bet.guess_2_max)
        );

        let madsFavor = 0.5;
        if (stagnantDays >= 5 && v1 < bet.guess_2_min) {
          madsFavor = Math.min(0.9, 0.5 + stagnantDays * 0.07);
        } else if (stagnantDays >= 3 && v1 < bet.guess_2_min) {
          madsFavor = 0.7;
        }
        const totalDist = dTo1 + dTo2;
        if (totalDist > 0) {
          p1 = (dTo2 / totalDist) * madsFavor;
          p2 = (dTo1 / totalDist) * (1 - madsFavor);
        }
      }
    }

    // Normalisering
    const total = p1 + p2;
    setProbMads(total > 0 ? p1 / total : 0.5);
    setProbStine(total > 0 ? p2 / total : 0.5);
  }, [progress, bet]);

return (
  <div className="my-2">
    <div className="mb-1 flex justify-between text-xs font-semibold">
      <div className="flex-1 text-left text-pink-600">
        Stine: {(probStine * 100).toFixed(0)}%
      </div>
      <div className="flex-1 text-right text-blue-700">
        Mads: {(probMads * 100).toFixed(0)}%
      </div>
    </div>
    <div className="w-full h-5 rounded-xl bg-gray-200 flex overflow-hidden shadow-inner">
      <div
        className="h-full bg-pink-400 transition-all"
        style={{ width: `${probStine * 100}%` }}
      />
      <div
        className="h-full bg-blue-500 transition-all"
        style={{ width: `${probMads * 100}%` }}
      />
    </div>

  </div>
);





}
