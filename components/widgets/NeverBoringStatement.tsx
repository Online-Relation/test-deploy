// components/widgets/NeverBoringStatement.tsx

"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, PartyPopper, Glasses, Frown } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useUserContext } from "@/context/UserContext";
import { Badge } from "@/components/ui/badge";

const NeverBoringStatement = () => {
  const { user } = useUserContext();
  const [showQuestion, setShowQuestion] = useState(false);
  const [moodSelected, setMoodSelected] = useState<number | null>(null);
  const [relationshipMood, setRelationshipMood] = useState<number | null>(null);
  const [yesterdaySummary, setYesterdaySummary] = useState<string | null>(null);
  const [xpGiven, setXpGiven] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [hideWidget, setHideWidget] = useState(false);

  useEffect(() => {
    const now = new Date();
    const currentHour = now.getHours();

    if (!user?.id) return;

    const checkIfUserAlreadyCheckedInToday = async () => {
      const today = new Date();
      const checkin_date = `${today.getFullYear()}-${(today.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;

      const { data, error } = await supabase
        .from("daily_checkin")
        .select("id")
        .eq("user_id", user.id)
        .eq("checkin_date", checkin_date)
        .limit(1);

      if (!error && data && data.length > 0) {
        setHideWidget(true);
      } else if (currentHour >= 19 && currentHour <= 23) {
        setShowQuestion(true);
      } else if (currentHour >= 3 && currentHour < 19) {
        fetchYesterdaySummary();
      } else {
        setHideWidget(true);
      }
    };

    checkIfUserAlreadyCheckedInToday();
  }, [user]);

  useEffect(() => {
    if (xpGiven) {
      setCountdown(5);
    }
  }, [xpGiven]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setHideWidget(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((prev) => (prev ? prev - 1 : 0)), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const fetchYesterdaySummary = async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateString = yesterday.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("daily_checkin")
      .select("user_id, everyday_feeling, mood, profiles(display_name)")
      .eq("checkin_date", dateString);

    if (error || !data || data.length === 0) return;

    const stine = data.find((d: any) => d?.profiles?.display_name?.toLowerCase().includes("stine"));
    const mads = data.find((d: any) => d?.profiles?.display_name?.toLowerCase().includes("mads"));

    if (!stine || !mads) return;

    const { data: messages } = await supabase
      .from("checkin_messages")
      .select("message")
      .or(`and(weekday_stine.eq.${stine.everyday_feeling},weekday_mads.eq.${mads.everyday_feeling}),and(mood_stine.eq.${stine.mood},mood_mads.eq.${mads.mood})`)
      .limit(1);

    if (messages && messages.length > 0) {
      setYesterdaySummary(messages[0].message);
    }
  };

  const handleMoodClick = (mood: number) => {
    setMoodSelected(mood);
  };

  const handleRelationshipMoodClick = async (mood: number) => {
    setRelationshipMood(mood);
    const today = new Date();
    const checkin_date = `${today.getFullYear()}-${(today.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;

    if (user?.id && moodSelected !== null) {
      const { error } = await supabase.from("daily_checkin").insert({
        user_id: user.id,
        checkin_date,
        mood,
        everyday_feeling: moodSelected,
      });

      if (!error) {
        const { data: xpSetting, error: xpSettingsError } = await supabase
          .from("xp_settings")
          .select("xp")
          .eq("action", "daily_checkin")
          .eq("role", user.role)
          .maybeSingle();

        if (!xpSettingsError && xpSetting) {
          await supabase.from("xp_log").insert({
            user_id: user.id,
            action: "daily_checkin",
            change: xpSetting.xp,
            role: user.role,
          });
        }

        const { data: profileData } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .maybeSingle();

        setDisplayName(profileData?.display_name ?? null);
        setXpGiven(true);
      }
    }
  };

  if (hideWidget) {
    return null;
  }

  if (showQuestion) {
    return (
      <div className="border-2 border-dashed border-purple-400 bg-purple-50 rounded-2xl shadow-xl p-6 flex flex-col items-center text-center gap-4">
        <h2 className="text-xl md:text-2xl font-extrabold text-purple-700">
          Hvordan har jeres hverdag været i dag?
        </h2>
        {!moodSelected && (
          <div className="flex flex-wrap justify-center gap-3 mt-4 w-full">
            <button
              onClick={() => handleMoodClick(5)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 shadow-md hover:scale-105 transition-all min-w-[100px]"
            >
              <PartyPopper className="w-5 h-5" /> Sjov
            </button>
            <button
              onClick={() => handleMoodClick(3)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 shadow-md hover:scale-105 transition-all min-w-[100px]"
            >
              <Glasses className="w-5 h-5" /> Hyggelig
            </button>
            <button
              onClick={() => handleMoodClick(1)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-400 text-white rounded-full hover:bg-purple-500 shadow-md hover:scale-105 transition-all min-w-[100px]"
            >
              <Frown className="w-5 h-5" /> Kedelig
            </button>
          </div>
        )}

        {moodSelected && relationshipMood === null && (
          <>
            <p className="mt-4 text-purple-700 text-base font-medium">
              Hvordan er stemningen i dit parforhold lige nu?
            </p>
            <div className="flex gap-3 flex-wrap justify-center mt-2">
              {[
                { label: "Frost", value: 1, color: "border-blue-400 bg-blue-100 text-blue-800" },
                { label: "Kølig", value: 2, color: "border-cyan-400 bg-cyan-100 text-cyan-800" },
                { label: "Neutral", value: 3, color: "border-gray-400 bg-gray-100 text-gray-800" },
                { label: "Lun", value: 4, color: "border-orange-400 bg-orange-100 text-orange-800" },
                { label: "Hed", value: 5, color: "border-rose-400 bg-rose-100 text-rose-800" },
              ].map(({ label, value, color }) => (
                <button
                  key={value}
                  onClick={() => handleRelationshipMoodClick(value)}
                  className={`w-20 h-20 rounded-full border font-semibold ${color} hover:scale-105 transition-all`}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}

        {relationshipMood !== null && xpGiven && displayName && (
          <div className="mt-4 text-green-600 font-semibold">
           <p className="text-sm text-muted-foreground text-center mt-2">
              Fedt du tjekkede ind, {displayName}!<br />
              Du har lige optjent <Badge className="bg-purple-600 text-white shadow">10 XP</Badge> til din rejse mod din næste gave.
            </p>
            {countdown !== null && (
              <p className="mt-2 text-sm text-green-500 italic">
                Lukker automatisk om {countdown} sek...
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="text-center mt-4 p-4 border-dashed border-2 border-purple-300 bg-purple-50 rounded-xl">
      <h2 className="text-lg font-semibold text-purple-800 mb-2">
        Hvordan har jeres hverdag været i dag?
      </h2>
      <p className="text-sm text-muted-foreground">
        Fedt du tjekkede ind, {displayName}!<br />
        <span className="inline-flex items-center justify-center gap-1">
          Du har lige optjent
          <Badge className="bg-purple-600 text-white shadow ml-1">10 XP</Badge>
          til din rejse mod din næste gave.
        </span>
      </p>
    </div>
  );
};

export default NeverBoringStatement;
