// components/widgets/NeverBoringStatement.tsx

"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, PartyPopper, Glasses, Frown } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useUserContext } from "@/context/UserContext";
import { Badge } from "@/components/ui/badge";

function getTodayDateStr() {
  return new Date().toISOString().slice(0, 10);
}

const NeverBoringStatement = () => {
  const { user } = useUserContext();
  const [showQuestion, setShowQuestion] = useState(false);
  const [moodSelected, setMoodSelected] = useState<number | null>(null);
  const [relationshipMood, setRelationshipMood] = useState<number | null>(null);
  const [yesterdaySummary, setYesterdaySummary] = useState<string | null>(null);
  const [xpGiven, setXpGiven] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [showVision, setShowVision] = useState(false);
  const [showMemoryInput, setShowMemoryInput] = useState(false);
  const [memoryText, setMemoryText] = useState("");
  const [memorySubmitted, setMemorySubmitted] = useState(false);
  const [widgetClosed, setWidgetClosed] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const currentHour = 20; // SIMULATION: Tving tidspunkt til 20 for aften-test

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
        setShowVision(true);
      } else if (currentHour >= 19 && currentHour <= 23) {
        setShowQuestion(true);
      } else if (currentHour >= 3 && currentHour < 19) {
        fetchYesterdaySummary();
        setShowVision(true);
      } else {
        setShowVision(true);
      }
    };

    checkIfUserAlreadyCheckedInToday();
  }, [user]);

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
    const today = getTodayDateStr();

    if (user?.id && moodSelected !== null) {
      const { error } = await supabase.from("daily_checkin").insert({
        user_id: user.id,
        checkin_date: today,
        mood: moodSelected,
        everyday_feeling: mood,
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
        setShowMemoryInput(true);
      }
    }
  };

  const handleMemorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memoryText.trim() || !user?.id) return;

    const today = getTodayDateStr();
    const { error } = await supabase.from("daily_memories").insert({
      user_id: user.id,
      memory_date: today,
      memory_text: memoryText.trim(),
    });

    if (!error) {
      setMemorySubmitted(true);
    } else {
      alert("Kunne ikke gemme minde: " + error.message);
    }
  };

  if (widgetClosed) return null;

  const handleClose = () => {
    setFadeOut(true);
    setTimeout(() => setWidgetClosed(true), 400);
  };

  const fadeClass = fadeOut ? "opacity-0 scale-95 transition-all duration-300" : "opacity-100 scale-100 transition-all duration-300";

  const renderStepTitle = () => {
    if (!moodSelected) return "Hvordan har jeres hverdag været i dag?";
    if (moodSelected && relationshipMood === null) return "Hvordan er stemningen mellem jer lige nu?";
    if (showMemoryInput && !memorySubmitted) return "Del et lille minde fra i dag";
    if (memorySubmitted) return "Tak for i dag – du har gjort noget godt for jeres forhold 💜";
    return "";
  };

  if (showQuestion) {
    return (
      <div className={`border-2 border-dashed border-purple-400 bg-purple-50 rounded-2xl shadow-xl p-6 flex flex-col items-center text-center gap-4 ${fadeClass}`}>
        <h2 className="text-xl md:text-2xl font-extrabold text-purple-700">
          {renderStepTitle()}
        </h2>
        {!moodSelected && (
          <div className="flex flex-wrap justify-center gap-3 mt-4 w-full">
            <button onClick={() => handleMoodClick(1)} className="px-4 py-3 bg-purple-100 border border-purple-300 rounded-xl text-sm font-medium text-purple-700 hover:bg-purple-200 active:scale-95 w-[140px]">
              <Frown className="w-5 h-5 inline mr-1" /> Kedeligt
            </button>
            <button onClick={() => handleMoodClick(2)} className="px-4 py-3 bg-purple-100 border border-purple-300 rounded-xl text-sm font-medium text-purple-700 hover:bg-purple-200 active:scale-95 w-[140px]">
              <Glasses className="w-5 h-5 inline mr-1" /> Hverdagsagtigt
            </button>
            <button onClick={() => handleMoodClick(3)} className="px-4 py-3 bg-purple-100 border border-purple-300 rounded-xl text-sm font-medium text-purple-700 hover:bg-purple-200 active:scale-95 w-[140px]">
              <PartyPopper className="w-5 h-5 inline mr-1" /> Spændende
            </button>
            <button onClick={() => handleMoodClick(4)} className="px-4 py-3 bg-purple-100 border border-purple-300 rounded-xl text-sm font-medium text-purple-700 hover:bg-purple-200 active:scale-95 w-[140px]">
              <Sparkles className="w-5 h-5 inline mr-1" /> Sjovt
            </button>
          </div>
        )}

        {moodSelected && relationshipMood === null && (
          <>
            <p className="mt-4 text-purple-700 text-base font-medium">
              Vælg den mulighed der bedst matcher stemningen i dag – svar ærligt, det handler bare om, hvordan temperaturen er i jeres relation er lige nu.
            </p>
            <div className="flex gap-3 flex-wrap justify-center mt-2">
              {[{ label: "Frost", value: 1, color: "border-blue-400 bg-blue-100 text-blue-800" }, { label: "Kølig", value: 2, color: "border-cyan-400 bg-cyan-100 text-cyan-800" }, { label: "Neutral", value: 3, color: "border-gray-400 bg-gray-100 text-gray-800" }, { label: "Lun", value: 4, color: "border-orange-400 bg-orange-100 text-orange-800" }, { label: "Hed", value: 5, color: "border-rose-400 bg-rose-100 text-rose-800" }].map(({ label, value, color }) => (
                <button key={value} onClick={() => handleRelationshipMoodClick(value)} className={`w-20 h-20 rounded-full border font-semibold ${color} hover:scale-105 transition-all`}>
                  {label}
                </button>
              ))}
            </div>
          </>
        )}

        {showMemoryInput && !memorySubmitted && (
          <form onSubmit={handleMemorySubmit} className="w-full mt-6 flex flex-col gap-3">
            
            <p className="text-gray-500 text-center">
              Hvad var <span className="font-semibold text-indigo-700">det bedste i dag?</span>
            </p>
            <textarea
              className="rounded-xl border border-indigo-200 focus:border-indigo-500 transition p-3 w-full resize-none text-sm"
              rows={3}
              maxLength={180}
              placeholder="Skriv kort her..."
              value={memoryText}
              onChange={(e) => setMemoryText(e.target.value)}
              required
            />
            <div className="flex justify-center gap-4">
              <button className="btn btn-primary" type="submit">
                Gem mit minde
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => setMemorySubmitted(true)}>
                Nej tak
              </button>
            </div>
          </form>
        )}

        {memorySubmitted && (
          <div className="mt-4 text-purple-700 font-semibold text-sm text-center">
            {memoryText.trim() ? (
              <>
                <p>
                  Godt gået, {displayName}!<br />
                  Når du gemmer det bedste fra i dag, gør du hverdagen lidt mere magisk – og meget mindre kedelig. Jeg er tilbage i morgen kl. 19.00 - 23.59
                </p>
              </>
            ) : (
              <>
                <p>
                  Du valgte ikke at gemme et minde i dag – og det er helt okay.<br />
                  Nogle dage er bare… dage. Men du tjekkede ind – og det gør en forskel!
                </p>
              </>
            )}
            <button className="btn btn-primary mt-3" onClick={handleClose}>
              Luk
            </button>
          </div>
        )}
      </div>
    );
  }

  if (showVision) {
    return (
      <div className={`border-2 border-dashed border-purple-400 bg-purple-50 rounded-2xl shadow-xl p-6 flex flex-col items-center text-center gap-4 ${fadeClass}`}>
        <div className="text-purple-500">
          <Sparkles className="w-10 h-10 animate-pulse" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-purple-700">
            Hos os må hverdagen aldrig blive for kedelig 💥
          </h2>
          <p className="mt-1 text-sm md:text-base text-purple-600">
            Et kærligt spark bagi til at finde på noget skørt, frækt eller nyt – hver dag.
          </p>
          <p className="mt-4 text-xs uppercase tracking-wider text-purple-500 font-semibold">
            Vores vision
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default NeverBoringStatement;
