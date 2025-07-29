// app/components/WeeklyMissionCard.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabaseClient';
import { useUserContext } from "@/context/UserContext";
import { useRouter } from "next/navigation";

export default function WeeklyMissionCard() {
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [weeklyMission, setWeeklyMission] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { user } = useUserContext();
  const [isCompleted, setIsCompleted] = useState(false);
  const [hideCard, setHideCard] = useState(false);
  const [countdown, setCountdown] = useState(180);
  const [recentImageUrl, setRecentImageUrl] = useState<string | null>(null);
  const [imageFallbackText, setImageFallbackText] = useState<string | null>(null);
  const router = useRouter();

  const TEST_MODE = true;

  useEffect(() => {
    const now = new Date();
    const nextMonday = new Date();
    nextMonday.setDate(now.getDate() + ((8 - now.getDay()) % 7 || 7));
    nextMonday.setHours(4, 0, 0, 0);

    const storedCompletion = localStorage.getItem("missionCompletedAt");
    if (!TEST_MODE && storedCompletion) {
      const completedAt = new Date(storedCompletion);
      if (now < nextMonday) {
        setHideCard(true);
        return;
      }
    }

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 7);

    const interval = setInterval(() => {
      const current = new Date().getTime();
      const distance = targetDate.getTime() - current;

      if (distance < 0) {
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
      const today = new Date();
      const lastMonday = new Date(today);
      lastMonday.setDate(today.getDate() - today.getDay() + 1);
      lastMonday.setHours(4, 0, 0, 0);

      const { data, error } = await supabase
        .from("day_missions")
        .select("text")
        .gte("created_at", lastMonday.toISOString())
        .order("created_at", { ascending: true })
        .limit(1);

      console.log("🪄 Weekly mission fetch:", { data, error });

      if (!error && data.length > 0) {
        setWeeklyMission(data[0].text);
      }
    };

    fetchWeeklyMission();
  }, []);

  const handleCompleteMission = async () => {
    if (!user) return;
    setIsSubmitting(true);

    const { error: logError } = await supabase.from("day_mission_logs").insert({
      user_id: user.id,
      mission_text: weeklyMission || "Ukendt mission",
      completed_at: new Date().toISOString(),
    });

    console.log("📌 Insert to day_mission_logs:", { logError });

    const { data, error } = await supabase.rpc("get_random_success_message");

    console.log("✅ Success message fetch:", { data, error });

    if (!error && data && data.length > 0 && typeof data[0].message === 'string') {
      setSuccessMessage(data[0].message);
    } else {
      setSuccessMessage("🎉 Godt gået! Du har markeret missionen som fuldført.");
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: imageData, error: imageError } = await supabase
  .from("dashboard_images")
  .select("image_url, created_at")
  .eq("user_id", user.id)
  .gte("created_at", sevenDaysAgo.toISOString())
  .order("created_at", { ascending: false })
  .limit(1);

if (!imageError && imageData && imageData.length > 0) {
  setRecentImageUrl(imageData[0].image_url);
  setImageFallbackText(null); // skjul fallback
} else {
  setRecentImageUrl(null); // skjul billede
  setImageFallbackText("Har I haft nogle oplevelser den seneste uge som gav jer en oplevelse?");
}


    setIsSubmitting(false);
    setIsCompleted(true);
    localStorage.setItem("missionCompletedAt", new Date().toISOString());
  };

  useEffect(() => {
    if (isCompleted && successMessage) {
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            router.push("/dashboard");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [isCompleted, successMessage]);

  if (hideCard) return null;

  return (
    <>
      <style>
        {`
          @keyframes blurPulse {
            0%, 100% {
              filter: blur(4px);
            }
            50% {
              filter: blur(6px);
            }
          }

          .blur-container * {
            animation: blurPulse 4s ease-in-out infinite;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          .fade-in {
            animation: fadeIn 0.4s ease-in-out;
          }

          .veil-glide {
            display: none;
          }
        `}
      </style>

      <div className="relative w-full max-w-xl mx-auto rounded-3xl overflow-hidden border border-purple-800 shadow-2xl" style={{ backgroundImage: "url('https://media.wired.com/photos/6374919bafd174dfb5859666/3:2/w_2560%2Cc_limit/Artemis-1-SLS-Launch-Science.jpg')", backgroundSize: "cover", backgroundPosition: "center", filter: "brightness(0.8) contrast(1.1)" }}>
        <div className="relative z-10 rounded-3xl bg-[#06010C]/70 p-6 backdrop-blur-sm">
          <div className="text-sm uppercase tracking-widest text-purple-400 mb-4">🎯 Din skjulte mission</div>

          <div className="relative border border-purple-800 rounded-xl p-6 text-center bg-black/50 backdrop-blur-sm overflow-hidden">
            <div className={revealed ? "fade-in" : "blur-container"}>
              <h2 className="text-lg font-normal text-purple-100 mb-2 z-10 relative">Din mission denne uge:</h2>
              <p className="text-1xl italic text-pink-400 z-10 relative">{weeklyMission ? `“${weeklyMission}”` : "Indlæser..."}</p>

              {revealed && !isCompleted && (
                <div className="mt-5">
                  <Button onClick={handleCompleteMission} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-full border border-emerald-800">Fuldfør mission</Button>
                </div>
              )}
              {successMessage && (
                <div className="mt-3 text-green-400 text-sm font-medium">
                  <p>{successMessage}</p>
                  <p className="text-purple-300 mt-2">Brug de næste {countdown} sekunder på at nyde følelsen af du gør noget for dit forhold 💫</p>
                  <p className="mt-5 text-white font-medium">Dette var jeres sidste oplevelse som skabte et minde for jeres parforhold. Er der sket noget nyt siden, så sæt pris på jeres oplevelser og dokumentér det nu.</p>
                  {recentImageUrl ? (
                    <img src={recentImageUrl} alt="Seneste minde" className="mt-3 mx-auto rounded-xl shadow-lg max-h-48 object-cover" />
                  ) : (
                    <p className="mt-3 text-pink-300 italic">{imageFallbackText}</p>
                  )}
                  <div className="mt-4 flex gap-4 justify-center">
                    <Button onClick={() => router.push("/dashboard/images")} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1 rounded-full text-sm">Upload</Button>
                    
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-purple-300">
              {!isCompleted && (
                <>
                  ⏳ <span className="text-white font-normal">{timeLeft}</span>
                </>
              )}
            </div>
            <Button onClick={() => setRevealed(!revealed)} className="bg-gradient-to-r from-purple-800 to-purple-600 hover:from-purple-700 hover:to-purple-500 text-white px-5 py-2 rounded-full border border-purple-700 shadow-md">
              {isCompleted ? "✅ Mission fuldført" : revealed ? "🔒 Skjul mission" : "🔓 Vis mission"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
