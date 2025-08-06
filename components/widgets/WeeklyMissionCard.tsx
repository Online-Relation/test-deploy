// components/widgets/WeeklyMissionCard.tsx

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
  const { user, partnerId } = useUserContext();
  const [isCompleted, setIsCompleted] = useState(false);
  const [hideCard, setHideCard] = useState(false);
  const [countdown, setCountdown] = useState(180);
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
    console.log("Tjekker mission visning...");
    console.log("Nu:", now.toISOString());
    console.log("Næste mandag kl 04:", nextMonday.toISOString());
    console.log("LocalStorage missionCompletedAt:", storedCompletion);
    console.log("Skjules?", storedCompletion && now < nextMonday);

    if (storedCompletion) {
      const completedAt = new Date(storedCompletion);
      if (now < nextMonday) {
        setHideCard(true);
        return;
      }
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
  const today = new Date();
  const lastMonday = new Date(today);
  lastMonday.setDate(today.getDate() - today.getDay() + 1);
  lastMonday.setUTCHours(4, 0, 0, 0); // <-- vigtig ændring

  console.log("🔍 Fetch mission - sidste mandag UTC:", lastMonday.toISOString());

  const { data, error } = await supabase
    .from("day_missions")
    .select("text")
    .gte("created_at", lastMonday.toISOString())
    .order("created_at", { ascending: true })
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

    const { error: logError } = await supabase.from("day_mission_logs").insert({
      user_id: user.id,
      mission_text: weeklyMission || "Ukendt mission",
      completed_at: new Date().toISOString(),
    });

    const { data, error } = await supabase.rpc("get_random_success_message");

    setSuccessMessage(`Godt gået, ${user.display_name}! Du gør en indsats for at holde jeres forhold levende og legende.`);

    setIsSubmitting(false);
    setIsCompleted(true);
    localStorage.setItem("missionCompletedAt", new Date().toISOString());
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    const fileExt = file.name.split(".").pop() || "jpg";
    const filePath = `original_${user.id}_dashboard_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from("dashboard").upload(filePath, file);
    if (uploadError) return;

    const { data: publicUrlData } = supabase.storage.from("dashboard").getPublicUrl(filePath);
    if (!publicUrlData || !publicUrlData.publicUrl) return;

    const imageUrl = publicUrlData.publicUrl;

    const { error: insertError } = await supabase.from("dashboard_images").insert({
      user_id: user.id,
      image_url: imageUrl,
    });
    if (insertError) return;

    setRecentImageUrl(imageUrl);
    setImageFallbackText(null);
  };

  const handleRedirect = () => {
    router.push("/memories?uploaded=true");
  };

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

          .blur-text {
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
        `}
      </style>

      <div className="relative w-full max-w-xl mx-auto rounded-3xl overflow-hidden border border-purple-800 shadow-2xl" style={{ backgroundImage: "url('https://media.wired.com/photos/6374919bafd174dfb5859666/3:2/w_2560%2Cc_limit/Artemis-1-SLS-Launch-Science.jpg')", backgroundSize: "cover", backgroundPosition: "center", filter: "brightness(0.8) contrast(1.1)" }}>
        <div className="relative z-10 rounded-3xl bg-[#06010C]/70 p-6 backdrop-blur-sm">
          <div className="text-sm uppercase tracking-widest text-purple-400 mb-4">🎯 Din skjulte mission</div>

          <div className="relative border border-purple-800 rounded-xl p-6 text-center bg-black/50 backdrop-blur-sm overflow-hidden">
            <div>
              <h2 className="text-lg font-normal text-purple-100 mb-2 z-10 relative">Din mission denne uge:</h2>
              <p className={revealed ? "text-1xl italic text-pink-400 z-10 relative fade-in" : "text-1xl italic text-pink-400 z-10 relative blur-text"}>{weeklyMission ? `“${weeklyMission}”` : "Indlæser..."}</p>

              {revealed && !isCompleted && (
                <div className="mt-5">
                  <Button onClick={handleCompleteMission} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-full border border-emerald-800">Fuldfør mission</Button>
                </div>
              )}

              {successMessage && (
                <div className="mt-3 text-white text-sm font-medium fade-in">
                  <p>{successMessage}</p>
                  <p className="mt-5 text-white font-medium">Dette var jeres sidste oplevelse som skabte et minde for jeres parforhold. Er der sket noget nyt siden, så sæt pris på jeres oplevelser og dokumentér det nu.</p>
                  {recentImageUrl ? (
                    <img src={recentImageUrl} alt="Seneste minde" className="mt-3 mx-auto rounded-xl shadow-lg max-h-48 object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  ) : (
                    <p className="mt-3 text-pink-300 italic">{imageFallbackText}</p>
                  )}
                  <input type="file" id="upload-input" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <div className="mt-4 flex gap-4 justify-center">
                    <Button onClick={() => document.getElementById("upload-input")?.click()} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1 rounded-full text-sm">Upload</Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 text-center">
            {isCompleted && (
              <p className="text-white text-sm mb-2 text-right pr-1">Har du ikke et godt billede? så fuldfør missionen nu.</p>
            )}
            <div className="flex items-center justify-between">
              <div className="text-sm text-purple-300">
                {!isCompleted && (
                  <>
                    ⏳ <span className="text-white font-normal">{timeLeft}</span>
                  </>
                )}
              </div>
              <Button onClick={isCompleted ? handleRedirect : () => setRevealed(!revealed)} className="bg-gradient-to-r from-purple-800 to-purple-600 hover:from-purple-700 hover:to-purple-500 text-white px-5 py-2 rounded-full border border-purple-700 shadow-md">
                {isCompleted ? "Mission fuldført" : revealed ? "🔒 Skjul mission" : "🔓 Vis mission"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
