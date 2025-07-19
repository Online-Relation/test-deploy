// /components/widgets/DateMissionWidget.tsx

"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { format } from "date-fns";
import { da } from "date-fns/locale";
import { Target, Eye, EyeOff, Gift, Sparkles, Star } from "lucide-react";

interface DateMission {
  id: string;
  title: string;
  planned_date: string;
  mission: string;
  created_by: string;
  status: string;
}

interface Props {
  userId: string;
  displayName: string;
}

const missionTip = "Tør du fuldføre missionen og fortælle det til din partner bagefter?";

export default function DateMissionWidget({ userId, displayName }: Props) {
  const [dateMission, setDateMission] = useState<DateMission | null>(null);
  const [showMission, setShowMission] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasRated, setHasRated] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [thankYou, setThankYou] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch function, nu med korrekt håndtering!
  async function fetchDateMission() {
    setLoading(true);
    const now = new Date();
    const nowISO = now.toISOString();

    // Hent ALLE kommende/planned/done dates til brugeren
    const { data: missions, error } = await supabase
      .from("modal_objects")
      .select("id, title, planned_date, mission, created_by, status")
      .eq("type", "date-idea")
      .or(`status.eq.planned,status.eq.done`)
      .gte("planned_date", nowISO)
      .order("planned_date", { ascending: true });

    if (!error && missions?.length) {
      // Find FØRSTE planned, ellers første done som ikke er rated af brugeren
      let next: DateMission | null = null;
      let alreadyRated = false;

      for (const row of missions) {
        if (row.status === "planned") {
          next = row;
          alreadyRated = false;
          break;
        }
        if (row.status === "done") {
          // Tjek om brugeren HAR ratet denne
          const { data: ratings } = await supabase
            .from("dates_ratings")
            .select("id")
            .eq("date_id", row.id)
            .eq("user_id", userId)
            .maybeSingle();
          if (!ratings) {
            next = row;
            alreadyRated = false;
            break;
          }
        }
      }
      // Hvis INGEN "planned" eller "unrated done" fundet, men der er én "done" (allerede rated), vis den
      if (!next && missions[0]?.status === "done") {
        next = missions[0];
        alreadyRated = true;
      }

      setDateMission(next);
      setHasRated(alreadyRated);
    } else {
      setDateMission(null);
      setHasRated(false);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchDateMission();
    const interval = setInterval(fetchDateMission, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [userId]);

  // Submit rating
  async function handleRate() {
    if (!rating || submitting) return;
    setSubmitting(true);
    await supabase.from("dates_ratings").insert({
      date_id: dateMission!.id,
      user_id: userId,
      rating,
      comment,
    });
    setThankYou(true);
    setHasRated(true);
    setSubmitting(false);
    setTimeout(() => {
      setThankYou(false);
      setRating(0);
      setComment("");
      fetchDateMission(); // <-- Hent næste mission automatisk!
    }, 5000);
  }

  if (loading) {
    return (
      <Card className="w-full shadow-2xl rounded-2xl bg-gradient-to-r from-pink-50 to-violet-100 my-6 border-0">
        <CardContent className="p-8 animate-pulse text-center">Indlæser mission…</CardContent>
      </Card>
    );
  }

  if (!dateMission) return null;
  const formattedDate = format(new Date(dateMission.planned_date), "dd/MM/yyyy", { locale: da });

  // Hvis date er done, vis rating UI
  if (dateMission.status === "done") {
    // Allerede rated? Takke-besked
    if (thankYou || hasRated) {
      let feedbackText = "";
      if (rating <= 3) {
        feedbackText =
          "Din partner har helt sikkert prøvet at gøre det til en god dateday. Husk at fortæl din partner hvad ikke fungerede for dig.";
      } else if (rating >= 4) {
        feedbackText =
          "Din partner bliver glad for at høre det har været en god oplevelse for dig. Husk at fortæl hvorfor det var en god date for dig.";
      }
      return (
        <Card className="w-full shadow-2xl rounded-2xl bg-gradient-to-r from-pink-50 to-violet-100 my-6 border-0">
          <CardContent className="flex flex-col items-center justify-center gap-3 p-8 min-h-[240px]">
            <Gift className="w-14 h-14 text-green-400 animate-bounce mb-2" />
            <div className="text-xl font-bold text-center text-green-700">Tak for din feedback på daten!</div>
            <div className="text-sm text-muted-foreground text-center mb-2">Din oplevelse er sendt til systemet.</div>
            <div className="text-sm text-center text-pink-600">
              {feedbackText}
            </div>
          </CardContent>
        </Card>
      );
    }
    // Ikke rated endnu:
    return (
      <Card className="w-full shadow-2xl rounded-2xl bg-gradient-to-r from-pink-50 to-violet-100 my-6 border-0">
        <CardContent className="flex flex-col items-center justify-center gap-6 p-8">
          <div className="text-lg font-bold text-pink-700 text-center">
            Hvordan var jeres date d. {formattedDate}?
          </div>
          <div className="flex gap-2 text-2xl">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={
                  star <= rating
                    ? "text-yellow-400 hover:scale-110 transition"
                    : "text-gray-400 hover:scale-110 transition"
                }
                onClick={() => setRating(star)}
                aria-label={`Vælg ${star} stjerner`}
              >
                <Star fill={star <= rating ? "#FACC15" : "none"} className="w-8 h-8" />
              </button>
            ))}
          </div>
          <textarea
            className="w-full max-w-md mt-2 border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-300 text-base text-gray-800"
            placeholder="Kommentar (valgfrit)"
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
          />
          <Button
            onClick={handleRate}
            disabled={!rating || submitting}
            className="w-full max-w-xs rounded-full bg-pink-500 hover:bg-pink-600 text-white text-lg font-semibold shadow mt-2"
          >
            Indsend bedømmelse
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Normal visning: Mission til kommende date (status=planned)
  return (
    <Card className="w-full shadow-2xl rounded-2xl bg-gradient-to-r from-pink-50 to-violet-100 my-6 border-0">
      <CardContent className="flex flex-col md:flex-row items-center gap-6 p-8">
        <div className="flex flex-col items-center justify-center w-full md:w-1/4">
          <Target className="w-14 h-14 text-pink-500 mb-4 animate-pulse" />
          <div className="font-extrabold text-2xl text-pink-700 text-center">{displayName}</div>
          <div className="text-sm text-muted-foreground text-center">Du har en date-mission!</div>
        </div>
        <div className="flex-1 flex flex-col items-center md:items-start gap-4">
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
              <div className="flex items-center gap-2 justify-center mt-3 text-sm text-green-700 font-semibold text-center">
                <Gift className="w-5 h-5 text-green-400" /> Missionen er nu afsløret – vær kreativ og skab oplevelser sammen!
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
