'use client';

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

type Reward = {
  id: string;
  title: string;
  requiredXp: number;
};

export default function RewardClaim({
  currentXp,
  onClaim,
}: {
  currentXp: number;
  onClaim: (xpSpent: number) => void;
}) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [claimedReward, setClaimedReward] = useState<string | null>(null);

  useEffect(() => {
    const fetchRewards = async () => {
      const { data, error } = await supabase.from('rewards').select('*');
      if (error) {
        console.error("Fejl ved hentning af præmier:", error.message);
      } else {
        const sorted = data.sort((a, b) => a.requiredXp - b.requiredXp);
        setRewards(sorted);
      }
    };
    fetchRewards();
  }, []);

  const handleClaim = async (reward: Reward) => {
    if (currentXp >= reward.requiredXp) {
      const confirm = window.confirm(`Vil du indløse "${reward.title}" for ${reward.requiredXp} XP?`);
      if (!confirm) return;

      const { error } = await supabase.from('rewards').delete().eq('id', reward.id);
      if (error) {
        console.error("Fejl ved sletning af præmie:", error.message);
        return;
      }

      setClaimedReward(reward.title);
      setRewards(rewards.filter(r => r.id !== reward.id));
      onClaim(reward.requiredXp);
    } else {
      alert("Du har ikke nok XP til denne præmie.");
    }
  };

  return (
    <Card className="bg-green-50 border border-green-200">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold text-green-800 mb-4">🎁 Tilgængelige præmier</h2>
        <ul className="space-y-4">
          {rewards.map((reward) => (
            <li key={reward.id} className="flex justify-between items-center">
              <div>
                <p className="font-medium">{reward.title}</p>
                <p className="text-sm text-muted-foreground">XP: {reward.requiredXp}</p>
              </div>
              <Button
                onClick={() => handleClaim(reward)}
                disabled={currentXp < reward.requiredXp}
              >
                Indløs
              </Button>
            </li>
          ))}
        </ul>
        {claimedReward && (
          <div className="mt-6 text-green-600 font-semibold">
            🎉 Du har indløst: {claimedReward}!
          </div>
        )}
      </CardContent>
    </Card>
  );
}