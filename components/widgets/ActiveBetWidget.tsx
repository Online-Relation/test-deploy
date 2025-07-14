// /components/widgets/ActiveBetWidget.tsx

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { FaLinkedin } from "react-icons/fa";
import BetProbabilityBar from "@/components/BetProbabilityBar";

interface Bet {
  id: string;
  title: string;
  description: string;
  start_at: string;
  end_at: string;
  participant_1: string;
  participant_2: string;
  participant_1_name?: string; // valgfrit navn (hvis du sender det med)
  participant_2_name?: string;
  participant_1_avatar?: string; // valgfrit avatar
  participant_2_avatar?: string;
  reward_id_1: string;
  reward_id_2: string;
  guess_1_min?: number | null;
  guess_1_max?: number | null;
  guess_2_min?: number | null;
  guess_2_max?: number | null;
}


interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
}

interface Reward {
  id: string;
  title: string;
}

function getCountdown(endAt: string) {
  const end = new Date(endAt).getTime();
  const now = Date.now();
  const diff = end - now;

  if (diff <= 0) return "Slut!";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);

  let out = "";
  if (days > 0) out += `${days}d `;
  if (hours > 0 || days > 0) out += `${hours}t `;
  if (mins > 0 || hours > 0 || days > 0) out += `${mins}m `;
  out += `${secs}s`;

  return out;
}

export default function ActiveBetWidget() {
  const [bet, setBet] = useState<Bet | null>(null);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [rewards, setRewards] = useState<Record<string, Reward>>({});
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<string>("");
  const [progress, setProgress] = useState<{ date: string; value: number }[]>([]);

  // Test-data fallback
  const TEST_BET: Bet = {
    id: "dummy",
    title: "Test LinkedIn væddemål",
    description: "Hvem får flest likes på sit opslag?",
    start_at: "2025-07-01T08:00",
    end_at: "2025-07-31T08:00",
    participant_1: "1",
    participant_2: "2",
    reward_id_1: "1",
    reward_id_2: "2",
    guess_1_min: 34,
    guess_1_max: 44,
    guess_2_min: 45,
    guess_2_max: 55,
  };
  const TEST_PROFILES = {
    "1": { id: "1", username: "Stine", avatar_url: "/dummy-avatar.jpg" },
    "2": { id: "2", username: "Mads", avatar_url: "/dummy-avatar.jpg" },
  };
  const TEST_REWARDS = {
    "1": { id: "1", title: "Ny kjole" },
    "2": { id: "2", title: "En grill aften med Stine" },
  };

  // Hent aktivt væddemål + profiler + præmier
  useEffect(() => {
    (async () => {
      try {
        const { data: betData } = await supabase
          .from("bets")
          .select("*")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (!betData) {
          setBet(TEST_BET);
          setProfiles(TEST_PROFILES);
          setRewards(TEST_REWARDS);
          setLoading(false);
          return;
        }

        setBet(betData);

        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", [betData.participant_1, betData.participant_2]);
        const profilesMap = (profileData || []).reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
        setProfiles(profilesMap);

        const rewardIds = [betData.reward_id_1, betData.reward_id_2].filter(Boolean);
        const { data: rewardData } = await supabase
          .from("rewards")
          .select("id, title")
          .in("id", rewardIds);
        const rewardsMap = (rewardData || []).reduce((acc, r) => ({ ...acc, [r.id]: r }), {});
        setRewards(rewardsMap);

        setLoading(false);
      } catch (err) {
        setBet(TEST_BET);
        setProfiles(TEST_PROFILES);
        setRewards(TEST_REWARDS);
        setLoading(false);
      }
    })();
  }, []);

  // Hent likes-progression
  useEffect(() => {
    if (!bet?.id) return;
    (async () => {
      const { data } = await supabase
        .from("bet_progress")
        .select("date, value")
        .eq("bet_id", bet.id)
        .order("date", { ascending: true });
      if (data) setProgress(data);
    })();
  }, [bet?.id]);

  // Countdown
  useEffect(() => {
    if (!bet?.end_at) return;
    const update = () => setCountdown(getCountdown(bet.end_at));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [bet?.end_at]);

  if (loading) return <div>Indlæser væddemål...</div>;
  if (!bet) return null;

  // --- VINDERLOGIK ---
  let winnerSection = null;
  if (countdown === "Slut!") {
    const lastLikes = progress.length > 0 ? progress[progress.length - 1].value : null;
    const n1 = profiles[bet.participant_1]?.username || "Deltager 1";
    const n2 = profiles[bet.participant_2]?.username || "Deltager 2";
    const avatar1 = profiles[bet.participant_1]?.avatar_url || "/dummy-avatar.jpg";
    const avatar2 = profiles[bet.participant_2]?.avatar_url || "/dummy-avatar.jpg";

    let winnerText = "Ingen vinder endnu";
    let winnerAvatar = null;
    if (lastLikes !== null) {
      const in1 = lastLikes >= (bet.guess_1_min ?? -Infinity) && lastLikes <= (bet.guess_1_max ?? Infinity);
      const in2 = lastLikes >= (bet.guess_2_min ?? -Infinity) && lastLikes <= (bet.guess_2_max ?? Infinity);

      if (in1 && in2) {
        winnerText = "Uafgjort!";
        winnerAvatar = (
          <div className="flex justify-center gap-2">
            <img src={avatar1} className="w-12 h-12 rounded-full border-2 border-green-400" alt="" />
            <img src={avatar2} className="w-12 h-12 rounded-full border-2 border-green-400" alt="" />
          </div>
        );
      } else if (in1) {
        winnerText = `Vinderen er ${n1}!`;
        winnerAvatar = <img src={avatar1} className="w-16 h-16 rounded-full border-4 border-green-400 mx-auto" alt="" />;
      } else if (in2) {
        winnerText = `Vinderen er ${n2}!`;
        winnerAvatar = <img src={avatar2} className="w-16 h-16 rounded-full border-4 border-green-400 mx-auto" alt="" />;
      } else {
        const dist1 = Math.min(
          Math.abs(lastLikes - (bet.guess_1_min ?? 0)),
          Math.abs(lastLikes - (bet.guess_1_max ?? 0))
        );
        const dist2 = Math.min(
          Math.abs(lastLikes - (bet.guess_2_min ?? 0)),
          Math.abs(lastLikes - (bet.guess_2_max ?? 0))
        );
        if (dist1 === dist2) {
          winnerText = "Begge var lige tæt på!";
          winnerAvatar = (
            <div className="flex justify-center gap-2">
              <img src={avatar1} className="w-12 h-12 rounded-full border-2 border-green-400" alt="" />
              <img src={avatar2} className="w-12 h-12 rounded-full border-2 border-green-400" alt="" />
            </div>
          );
        } else if (dist1 < dist2) {
          winnerText = `Tættest på: ${n1}`;
          winnerAvatar = <img src={avatar1} className="w-16 h-16 rounded-full border-4 border-yellow-400 mx-auto" alt="" />;
        } else {
          winnerText = `Tættest på: ${n2}`;
          winnerAvatar = <img src={avatar2} className="w-16 h-16 rounded-full border-4 border-yellow-400 mx-auto" alt="" />;
        }
      }
    }
    winnerSection = (
      <div className="mt-5 bg-green-50 border border-green-300 text-green-700 rounded-xl px-6 py-4 text-center text-lg font-bold">
        {winnerAvatar}
        <div className="mt-2">{winnerText}</div>
        <span className="block text-sm mt-1 text-gray-500">Likes: {lastLikes ?? "ukendt"}</span>
      </div>
    );
  }

  // --- RENDER ---
  return (
    <div className="rounded-3xl border shadow-xl bg-[#eef3f8] p-7 max-w-2xl mx-auto relative mb-8 flex flex-col gap-4">
      {/* LinkedIn badge/logo */}
      <div className="absolute top-6 right-7 flex items-center gap-2">
        <FaLinkedin size={32} className="text-[#0077b5]" />
        <span className="text-[#0077b5] font-bold text-lg tracking-wide">LinkedIn Challenge</span>
      </div>

      <h3 className="text-2xl font-bold mb-0 text-[#0077b5]">{bet.title}</h3>
      <p className="text-gray-700">{bet.description}</p>

      <div className="flex flex-wrap items-center gap-3 mb-1">
        <span className="font-medium text-gray-700">
          <strong>Periode:</strong> {bet.start_at?.slice(0, 16).replace('T', ' ')} – {bet.end_at?.slice(0, 16).replace('T', ' ')}
        </span>
      </div>
      <div className="mb-2">
        <span className="inline-block bg-[#0077b5] text-white px-4 py-1 rounded-full tracking-wider font-mono text-lg font-semibold">
          {countdown}
        </span>
      </div>

      {/* Viser vinder-sektion når slut */}
      {winnerSection}

      {/* Deltagere og præmier */}
      <div className="flex flex-wrap gap-4 mt-1">
        <div className="flex-1 min-w-[130px] bg-white rounded-xl shadow p-3 flex flex-col items-center">
          <img
            src={profiles[bet.participant_1]?.avatar_url || "/dummy-avatar.jpg"}
            alt=""
            className="w-10 h-10 rounded-full border-2 border-[#0077b5] mb-2"
          />
          <span className="font-semibold text-[#0077b5]">
            {profiles[bet.participant_1]?.username || "Deltager 1"}
          </span>
          <span className="text-sm text-gray-500">
            Præmie: {rewards[bet.reward_id_1]?.title || "–"}
          </span>
        </div>
        <div className="flex-1 min-w-[130px] bg-white rounded-xl shadow p-3 flex flex-col items-center">
          <img
            src={profiles[bet.participant_2]?.avatar_url || "/dummy-avatar.jpg"}
            alt=""
            className="w-10 h-10 rounded-full border-2 border-[#0077b5] mb-2"
          />
          <span className="font-semibold text-[#0077b5]">
            {profiles[bet.participant_2]?.username || "Deltager 2"}
          </span>
          <span className="text-sm text-gray-500">
            Præmie: {rewards[bet.reward_id_2]?.title || "–"}
          </span>
        </div>
      </div>

      {/* Sandsynligheds-slider og avatarer */}
      <BetProbabilityBar
        bet={{
          guess_1_min: bet.guess_1_min ?? null,
          guess_1_max: bet.guess_1_max ?? null,
          guess_2_min: bet.guess_2_min ?? null,
          guess_2_max: bet.guess_2_max ?? null,
          end_at: bet.end_at,
          participant_1_name: profiles[bet.participant_1]?.username || "Deltager 1",
          participant_2_name: profiles[bet.participant_2]?.username || "Deltager 2",
          participant_1_avatar: profiles[bet.participant_1]?.avatar_url || "https://lhjunwhgvduwcaqrzojh.supabase.co/storage/v1/object/public/avatars/5687c342-1a13-441c-86ca-f7e87e1edbd5.jpg",
    participant_2_avatar: profiles[bet.participant_2]?.avatar_url || "https://lhjunwhgvduwcaqrzojh.supabase.co/storage/v1/object/public/avatars/190a3151-97bc-43be-9daf-1f3b3062f97f.JPG",
        }}
        betId={bet.id}
      />

    </div>
  );
}
