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
  participant_1_name?: string;
  participant_2_name?: string;
  participant_1_avatar?: string;
  participant_2_avatar?: string;
  gift_1?: string;
  gift_2?: string;
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
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<string>("");

  // Test-data fallback
  const TEST_BET: Bet = {
    id: "dummy",
    title: "Test LinkedIn væddemål",
    description: "Hvem får flest likes på sit opslag?",
    start_at: "2025-07-01T08:00",
    end_at: "2025-07-31T08:00",
    participant_1: "1",
    participant_2: "2",
    gift_1: "Massageaften",
    gift_2: "Vælg film",
    guess_1_min: 34,
    guess_1_max: 44,
    guess_2_min: 45,
    guess_2_max: 55,
  };
  const TEST_PROFILES = {
    "1": { id: "1", username: "Stine", avatar_url: "/dummy-avatar.jpg" },
    "2": { id: "2", username: "Mads", avatar_url: "/dummy-avatar.jpg" },
  };

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

        setLoading(false);
      } catch (err) {
        setBet(TEST_BET);
        setProfiles(TEST_PROFILES);
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!bet?.end_at) return;
    const update = () => setCountdown(getCountdown(bet.end_at));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [bet?.end_at]);

  if (loading) return <div>Indlæser væddemål...</div>;
  if (!bet) return null;

  return (
  <div className="rounded-3xl border shadow-xl bg-[#eef3f8] p-7 max-w-2xl mx-auto relative mb-8 flex flex-col gap-4">

    {/* LinkedIn badge/logo & Challenge navn – venstrejusteret */}
    <div className="w-full flex justify-start mb-1">
      <div className="flex items-center gap-2">
        <FaLinkedin size={32} className="text-[#0077b5]" />
        <span className="text-[#0077b5] font-bold text-lg tracking-wide">LinkedIn Challenge</span>
      </div>
    </div>

    {/* Titel på desktop */}
    <h3 className="text-2xl font-bold mb-0 text-[#0077b5] hidden sm:block">{bet.title}</h3>
    {/* Titel skjules på mobil */}

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

    {/* Deltagere og gavepræmier */}
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
          Gave: {bet.gift_1 || "–"}
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
          Gave: {bet.gift_2 || "–"}
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
        participant_1_avatar: profiles[bet.participant_1]?.avatar_url || "/dummy-avatar.jpg",
        participant_2_avatar: profiles[bet.participant_2]?.avatar_url || "/dummy-avatar.jpg",
      }}
      betId={bet.id}
    />

  </div>
);

}