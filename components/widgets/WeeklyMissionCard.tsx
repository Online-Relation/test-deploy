"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabaseClient';
import { useUserContext } from "@/context/UserContext";
import { useRouter } from "next/navigation";

export default function WeeklyMissionCard() {
  const [revealed, setRevealed] = useState(true);
  const [timeLeft, setTimeLeft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [weeklyMission, setWeeklyMission] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { user, partnerId } = useUserContext();
  const [isCompleted, setIsCompleted] = useState(false);
  const [hideCard, setHideCard] = useState(false);
  const [recentImageUrl, setRecentImageUrl] = useState<string | null>(null);
  const [imageFallbackText, setImageFallbackText] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const now = new Date();
    const nextMonday = new Date();
    nextMonday.setDate(now.getDate() + ((8 - now.getDay()) % 7 || 7));
    nextMonday.setHours(4, 0, 0, 0);

    const storedCompletion = localStorage.getItem("missionCompletedAt");
    if (storedCompletion && now < nextMonday) {
      setHideCard(true);
      return;
    }

    const today = new Date();
    const daysUntilSunday = (7 - today.getDay()) % 7;
    const nextSunday = new Date(today);
    nextSunday.setDate(today.getDate() + daysUntilSunday);
    nextSunday.setHours(23, 59, 59, 999);

    const interval = setInterval(() => {
      const current = new Date().getTime();
      const distance = nextSunday.getTime() - current;

      if (distance <= 0) {
        clearInterval(interval);
        setTimeLeft("Udløbet");
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${days}d ${hours}t ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchWeeklyMission = async () => {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("day_missions")
        .select("text")
        .lte("active_from", now)
        .eq("is_active", true)
        .order("active_from", { ascending: false })
        .limit(1);

      console.log("📦 Data modtaget:", data);
      console.log("❌ Fejl:", error);

      if (!error && data.length > 0) {
        setWeeklyMission(data[0].text);
      }
    };

    const fetchDisplayName = async () => {
      const idToUse = partnerId || user?.id;
      if (!idToUse) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", idToUse)
        .single();

      if (!error && data) {
        setDisplayName(data.display_name);
      }
    };

    const fetchRecentImage = async () => {
      const idToUse = partnerId || user?.id;
      if (!idToUse) return;

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: imageData, error: imageError } = await supabase
        .from("dashboard_images")
        .select("image_url, created_at")
        .eq("user_id", idToUse)
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(1);

      if (!imageError && imageData && imageData.length > 0) {
        setRecentImageUrl(imageData[0].image_url);
        setImageFallbackText(null);
      } else {
        setRecentImageUrl(null);
        setImageFallbackText("Har I haft nogle oplevelser den seneste uge som gav jer en oplevelse?");
      }
    };

    fetchWeeklyMission();
    fetchDisplayName();
    fetchRecentImage();
  }, [user, partnerId]);

  const handleCompleteMission = async () => {
    if (!user) return;
    setIsSubmitting(true);

    await supabase.from("day_mission_logs").insert({
      user_id: user.id,
      mission_text: weeklyMission || "Ukendt mission",
      completed_at: new Date().toISOString(),
    });

    setSuccessMessage(`Godt gået, ${user.display_name}! Du gør en indsats for at holde jeres forhold levende og legende.`);
    setIsSubmitting(false);
    setIsCompleted(true);
    localStorage.setItem("missionCompletedAt", new Date().toISOString());
  };

  const handleRedirect = () => {
    router.push("/memories?uploaded=true");
  };

  if (hideCard) return null;

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div className="bg-black text-white rounded-3xl p-6 shadow-xl border border-purple-800 backdrop-blur">
        <div className="text-sm uppercase text-purple-400 mb-4">🎯 Din skjulte mission</div>

        <div className="border border-purple-800 rounded-xl p-6 text-center bg-black/50 backdrop-blur-sm">
          <h2 className="text-lg text-purple-100 mb-2">Din mission denne uge:</h2>
          <p className={revealed ? "text-pink-400 fade-in" : "text-pink-400 blur-text"}>
            {weeklyMission ? `“${weeklyMission}”` : "Indlæser..."}
          </p>

          {revealed && !isCompleted && (
            <div className="mt-5">
              <Button onClick={handleCompleteMission} disabled={isSubmitting}>
                Fuldfør mission
              </Button>
            </div>
          )}

          {successMessage && (
            <div className="mt-4 text-sm fade-in">
              <p>{successMessage}</p>
              {recentImageUrl ? (
                <img src={recentImageUrl} alt="Minde" className="mt-4 rounded-xl shadow max-h-48 mx-auto" />
              ) : (
                <p className="mt-3 text-pink-300 italic">{imageFallbackText}</p>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 text-center flex justify-between items-center">
          <div className="text-sm text-purple-300">
            {!isCompleted && <>⏳ <span className="text-white">{timeLeft}</span></>}
          </div>
          <Button onClick={isCompleted ? handleRedirect : () => setRevealed(!revealed)}>
            {isCompleted ? "Mission fuldført" : revealed ? "🔒 Skjul mission" : "🔓 Vis mission"}
          </Button>
        </div>
      </div>
    </div>
  );
}
