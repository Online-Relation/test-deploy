'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import BetProgressForm from "@/components/BetProgressForm";
import BetProbabilityBar from "@/components/BetProbabilityBar";

interface Profile {
  id: string;
  username: string;
}

interface Reward {
  id: string;
  title: string;
}

interface Bet {
  id: string;
  title: string;
  description: string;
  start_at: string;
  end_at: string;
  participant_1: string;
  participant_2: string;
  reward_id_1: string;
  reward_id_2: string;
  template: boolean;
  template_name: string;
  guess_1_min: number | null;
  guess_1_max: number | null;
  guess_2_min: number | null;
  guess_2_max: number | null;
  status: string;
}

export default function BetDetailPage() {
  const { betId } = useParams();
  const router = useRouter();

  const [bet, setBet] = useState<Bet | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, username");
      setProfiles(profileData || []);

      const { data: rewardData } = await supabase
        .from("rewards")
        .select("id, title");
      setRewards(rewardData || []);

      const { data: betData } = await supabase
        .from("bets")
        .select("*")
        .eq("id", betId)
        .single();
      setBet(betData || null);
      setLoading(false);
    })();
  }, [betId]);

  const getProfileName = (id: string) => profiles.find((p) => p.id === id)?.username || "Ukendt";
  const getRewardTitle = (id: string) => rewards.find((r) => r.id === id)?.title || "";

  const handleDeactivate = async () => {
    if (!bet) return;
    if (!window.confirm("Er du sikker på, at du vil deaktivere dette væddemål?")) return;
    setDeactivating(true);
    const { error } = await supabase
      .from("bets")
      .update({ status: "inactive" })
      .eq("id", bet.id);
    setDeactivating(false);
    if (!error) {
      alert("Væddemål deaktiveret.");
      router.refresh();
      // router.push("/settings/bet"); // hvis du vil redirecte
    } else {
      alert("Fejl: " + error.message);
    }
  };

  if (loading || !bet) return <div>Indlæser...</div>;

  // For at vise deltager-navne i BetProbabilityBar
  const betWithNames = {
    ...bet,
    participant_1_name: getProfileName(bet.participant_1),
    participant_2_name: getProfileName(bet.participant_2),
  };

  return (
    <div className="max-w-xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-3">{bet.title}</h1>
      {bet.template && bet.template_name && (
        <div className="text-xs text-blue-800 mb-2 italic">
          Skabelon: {bet.template_name}
        </div>
      )}
      <div className="mb-3 text-gray-600">{bet.description}</div>
      <div className="text-sm mb-2">
        <strong>Periode:</strong>{" "}
        {bet.start_at?.slice(0, 16).replace("T", " ")} – {bet.end_at?.slice(0, 16).replace("T", " ")}
      </div>
      <div className="flex gap-4 mb-2">
        <div>
          <strong>Deltager 1:</strong> {getProfileName(bet.participant_1)}
        </div>
        <div>
          <strong>Deltager 2:</strong> {getProfileName(bet.participant_2)}
        </div>
      </div>
      <div className="flex gap-4 mb-2">
        <div>
          <strong>Deltager 1's gæt:</strong>{" "}
          {bet.guess_1_min !== null && bet.guess_1_max !== null
            ? `${bet.guess_1_min} – ${bet.guess_1_max}`
            : "-"}
        </div>
        <div>
          <strong>Deltager 2's gæt:</strong>{" "}
          {bet.guess_2_min !== null && bet.guess_2_max !== null
            ? `${bet.guess_2_min} – ${bet.guess_2_max}`
            : "-"}
        </div>
      </div>
      <div className="flex gap-4 mb-2">
        <div>
          <strong>Præmie (Deltager 1):</strong> {getRewardTitle(bet.reward_id_1)}
        </div>
        <div>
          <strong>Præmie (Deltager 2):</strong> {getRewardTitle(bet.reward_id_2)}
        </div>
      </div>
      <div className="mb-2">
        <span
          className={`px-3 py-1 text-xs rounded ${
            bet.status === "active"
              ? "bg-green-100 text-green-700"
              : bet.status === "inactive"
              ? "bg-gray-200 text-gray-700"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {bet.status === "active"
            ? "Aktiv"
            : bet.status === "inactive"
            ? "Inaktiv"
            : "Skabelon"}
        </span>
      </div>

      {/* ---------- INDSÆT LIKES PROGRESS FORM HER ---------- */}
      <BetProgressForm betId={bet.id} />

      {/* ---------- SANDSYNLIGHEDS-SLIDER ---------- */}
      <BetProbabilityBar bet={betWithNames} betId={bet.id} />

      <div className="flex gap-2 mt-6">
        <Link
          href={`/settings/bet/${bet.id}/edit`}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
        >
          Rediger
        </Link>
        {bet.status === "active" && (
          <button
            onClick={handleDeactivate}
            disabled={deactivating}
            className="px-4 py-2 rounded-xl bg-gray-500 text-white font-semibold shadow hover:bg-gray-700 transition"
          >
            {deactivating ? "Deaktiverer..." : "Deaktiver"}
          </button>
        )}
        <Link
          href="/settings/bet"
          className="ml-auto px-3 py-2 text-sm text-gray-600 hover:underline"
        >
          Tilbage til oversigt
        </Link>
      </div>
    </div>
  );
}
