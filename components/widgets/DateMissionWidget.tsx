// /components/widgets/DateMissionWidget.tsx

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { da } from "date-fns/locale";
import { supabase } from "@/lib/supabaseClient";
import { Sparkles, Target, EyeOff, Eye, Gift } from "lucide-react";

interface DateMission {
  id: string;
  title: string;
  planned_date: string;
  mission: string;
  created_by: string;
}

interface Props {
  userId: string;
  displayName: string;
}

const MISSION_TIPS = [
  "En sjov mission styrker nærvær og grin! 😂",
  "Tør du fuldføre missionen og fortælle det til din partner bagefter?",
  "Overrask dig selv – tag missionen 100% alvorligt.",
  "Del oplevelsen bagefter og fejr det sammen! 🎉"
];

export default function DateMissionWidget({ userId, displayName }: Props) {
  const [dateMission, setDateMission] = useState<DateMission | null>(null);
  const [showMission, setShowMission] = useState(false);
  const [loading, setLoading] = useState(true);

  // Tilfældigt tip
  const missionTip = MISSION_TIPS[Math.floor(Math.random() * MISSION_TIPS.length)];

  useEffect(() => {
    const fetchDateMission = async () => {
      setLoading(true);
      const now = new Date();
      const nowISO = now.toISOString();
      const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("modal_objects")
        .select("id, title, planned_date, mission, created_by")
        .eq("type", "date-idea")
        .eq("status", "planned")
        .gte("planned_date", nowISO)
        .lte("planned_date", fortyEightHoursFromNow)
        .neq("created_by", userId)
        .order("planned_date", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setDateMission(data as DateMission);
      } else {
        setDateMission(null);
      }
      setLoading(false);
    };

    fetchDateMission();
    const interval = setInterval(fetchDateMission, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  if (loading) {
    return (
      <Card className="w-full p-6 flex flex-col items-center justify-center animate-pulse shadow-2xl rounded-2xl min-h-[180px] bg-gradient-to-r from-pink-50 to-purple-50">
        <Sparkles className="w-8 h-8 mb-2 text-primary animate-bounce" />
        <span className="text-lg">Indlæser mission…</span>
      </Card>
    );
  }

  if (!dateMission) {
    return null;
  }

  const formattedDate = format(new Date(dateMission.planned_date), "dd/MM/yyyy", { locale: da });

  return (
    <Card className="w-full shadow-2xl rounded-2xl bg-gradient-to-r from-pink-50 to-violet-100 my-6 border-0">
  <CardContent className="flex flex-col md:flex-row items-center gap-6 p-8">
    <div className="flex flex-col items-center justify-center w-full md:w-1/4">
      <Target className="w-14 h-14 text-pink-500 mb-4 animate-pulse" />
      <div className="font-extrabold text-2xl text-pink-700 text-center">{displayName}</div>
      <div className="text-sm text-muted-foreground text-center">Du har en date-mission!</div>
    </div>
    <div className="flex-1 flex flex-col items-center gap-4 w-full">
      <div className="text-lg font-semibold text-center w-full">
        {displayName}, du har en mission til jeres dateday<br />
        <span className="font-semibold">
          d. {formattedDate} med emnet:
        </span>
        <br />
        <i className="block mt-2">{dateMission.title}</i>
      </div>

      <div className="relative w-full">
        <div
          className={`transition-all duration-300 rounded-xl px-4 py-5 min-h-[80px] text-center text-base font-medium bg-white/70 border border-pink-200 shadow-md ${
            showMission
              ? "blur-0 scale-105 border-2 border-pink-400 shadow-pink-200"
              : "blur-sm select-none cursor-pointer"
          }`}
          style={{
            filter: showMission ? "none" : "blur(7px)",
            pointerEvents: showMission ? "auto" : "none",
            transition: "all 0.3s"
          }}
          aria-hidden={!showMission}
        >
          {dateMission.mission?.trim() ? dateMission.mission : "(Ingen mission angivet)"}
        </div>
        <div className="flex items-center justify-center mt-2 w-full">
          <Button
            variant="secondary"
            size="lg"
            className={`w-full max-w-xs rounded-full border-2 border-pink-300 text-pink-700 font-semibold text-lg shadow ${showMission ? "bg-pink-100" : "bg-white/70"} transition`}
            onClick={() => setShowMission((v) => !v)}
            type="button"
          >
            {showMission ? (
              <><EyeOff className="mr-2" /> Skjul</>
            ) : (
              <><Eye className="mr-2" /> Afslør</>
            )}
          </Button>
        </div>
        {showMission && (
          <>
            <div className="flex items-center gap-2 justify-center mt-3 text-sm text-green-700 font-semibold text-center">
              <Gift className="w-5 h-5 text-green-400" />
              Missionen er nu afsløret – vær kreativ og skab oplevelser sammen!
            </div>
           
          </>
        )}
      </div>
      <div className="mt-3 text-xs text-violet-600/90 text-center italic font-medium flex gap-2 items-center">
        <Sparkles className="w-4 h-4" /> {missionTip}
      </div>
    </div>
  </CardContent>
</Card>

  );
}
