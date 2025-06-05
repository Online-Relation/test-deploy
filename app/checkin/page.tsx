// app/checkin/page.tsx

"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const CheckinPage = () => {
  const [madsNeeds, setMadsNeeds] = useState(["", "", ""]);
  const [stineNeeds, setStineNeeds] = useState(["", "", ""]);
  const [madsCheckins, setMadsCheckins] = useState<any[]>([]);
  const [stineCheckins, setStineCheckins] = useState<any[]>([]);
  const [history, setHistory] = useState<{ mads: any[]; stine: any[] }>({ mads: [], stine: [] });
  const [evaluatorId, setEvaluatorId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<"mads" | "stine" | null>(null);

const userIdMads = "190a3151-97bc-43be-9daf-1f3b3062f97f";
  const userIdStine = "5687c342-1a13-441c-86ca-f7e87e1edbd5";

  const handleSubmit = async (who: "mads" | "stine") => {
    const needs = who === "mads" ? madsNeeds : stineNeeds;
    const userId = who === "mads" ? userIdMads : userIdStine;

    const today = new Date();
    const weekNumber = getWeekNumber(today);
    const year = today.getFullYear();

    for (const need of needs) {
      if (need.trim() === "") continue;

      await supabase.from("checkin").insert({
        user_id: userId,
        need_text: need,
        week_number: weekNumber,
        year,
      });
    }

    alert(`${who === "mads" ? "Mads'" : "Stines"} behov er gemt ✅`);
    who === "mads" ? setMadsNeeds(["", "", ""]) : setStineNeeds(["", "", ""]);
    fetchNeeds();
    fetchHistory();
  };

  const fetchNeeds = async () => {
    const today = new Date();
    const week = getWeekNumber(today);
    const year = today.getFullYear();

    const { data: madsData } = await supabase
      .from("checkin")
      .select("*")
      .eq("week_number", week)
      .eq("year", year)
      .eq("user_id", userIdMads);

    const { data: stineData } = await supabase
      .from("checkin")
      .select("*")
      .eq("week_number", week)
      .eq("year", year)
      .eq("user_id", userIdStine);

    if (madsData) setMadsCheckins(madsData);
    if (stineData) setStineCheckins(stineData);
  };

  const fetchHistory = async () => {
    const today = new Date();
    const currentWeek = getWeekNumber(today);
    const currentYear = today.getFullYear();

    const { data, error } = await supabase
      .from("checkin")
      .select("*")
      .lt("week_number", currentWeek)
      .eq("year", currentYear)
      .order("week_number", { ascending: false });

    if (!error && data) {
      const mads = data.filter((x) => x.user_id === userIdMads);
      const stine = data.filter((x) => x.user_id === userIdStine);
      setHistory({ mads, stine });
    }
  };

  useEffect(() => {
    const getSessionUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const id = session?.user?.id ?? null;
      setEvaluatorId(id);
      if (id === userIdMads) setCurrentUserRole("mads");
      else if (id === userIdStine) setCurrentUserRole("stine");
    };

    getSessionUser();
    fetchNeeds();
    fetchHistory();
  }, []);

  const handleEvaluation = async (
    id: string,
    status: "fulfilled" | "partial" | "not_fulfilled",
    target: "mads" | "stine"
  ) => {
    if (!evaluatorId) return;

    const xpMap = {
      fulfilled: 30,
      partial: 20,
      not_fulfilled: 10,
    };

    const xp = xpMap[status];
    const userId = target === "mads" ? userIdMads : userIdStine;
    const role = target;

    const updateCheckins = (list: any[], setter: any) => {
      const updated = list.map((item) =>
        item.id === id ? { ...item, status, xp_awarded: xp } : item
      );
      setter(updated);
    };

    if (target === "mads") updateCheckins(madsCheckins, setMadsCheckins);
    else updateCheckins(stineCheckins, setStineCheckins);

    await supabase
      .from("checkin")
      .update({
        status,
        xp_awarded: xp,
        evaluator_id: evaluatorId,
      })
      .eq("id", id);

    await supabase.from("xp_log").insert({
      user_id: userId,
      change: xp,
      role,
      description: `Check-in behov: ${status}`,
    });
  };

  



function getWeekNumber(d: Date) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1) / 7);
}

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Ugentlig Check-in</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mads */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Mads</h2>
          {madsNeeds.map((need, index) => (
            <input
              key={index}
              type="text"
              value={need}
              onChange={(e) => {
                const updated = [...madsNeeds];
                updated[index] = e.target.value;
                setMadsNeeds(updated);
              }}
              className="mb-2 w-full p-2 border rounded"
              placeholder={`Behov ${index + 1}`}
            />
          ))}
          {madsCheckins.length < 3 && (
            <button
              onClick={() => handleSubmit("mads")}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Gem behov
            </button>
          )}

          <div className="mt-6">
            <h3 className="font-semibold mb-2">Mads' behov denne uge</h3>
            {madsCheckins.map((item) => {
              const canEvaluate = item.status === "pending" && currentUserRole === "stine";
              return (
                <div
                  key={item.id}
                  className={`flex justify-between items-center p-2 rounded mb-2 ${
                    !canEvaluate ? "bg-gray-200" : "bg-gray-100"
                  }`}
                >
                  <span>{item.need_text}</span>
                 {currentUserRole === "stine" && (
  <div className="flex gap-2">
    <button className="px-2 py-1 bg-green-500 text-white rounded" onClick={() => handleEvaluation(item.id, "fulfilled", "mads")}>✅</button>
    <button className="px-2 py-1 bg-yellow-500 text-white rounded" onClick={() => handleEvaluation(item.id, "partial", "mads")}>⚖️</button>
    <button className="px-2 py-1 bg-red-500 text-white rounded" onClick={() => handleEvaluation(item.id, "not_fulfilled", "mads")}>❌</button>
  </div>
)}

  {currentUserRole === "mads" && (
  <div className="flex gap-2">
    <button className="px-2 py-1 bg-green-500 text-white rounded" onClick={() => handleEvaluation(item.id, "fulfilled", "stine")}>✅</button>
    <button className="px-2 py-1 bg-yellow-500 text-white rounded" onClick={() => handleEvaluation(item.id, "partial", "stine")}>⚖️</button>
    <button className="px-2 py-1 bg-red-500 text-white rounded" onClick={() => handleEvaluation(item.id, "not_fulfilled", "stine")}>❌</button>
  </div>
)}


                </div>
              );
            })}
          </div>
        </div>

        {/* Stine */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Stine</h2>
          {stineNeeds.map((need, index) => (
            <input
              key={index}
              type="text"
              value={need}
              onChange={(e) => {
                const updated = [...stineNeeds];
                updated[index] = e.target.value;
                setStineNeeds(updated);
              }}
              className="mb-2 w-full p-2 border rounded"
              placeholder={`Behov ${index + 1}`}
            />
          ))}
          {stineCheckins.length < 3 && (
            <button
              onClick={() => handleSubmit("stine")}
              className="mt-2 px-4 py-2 bg-purple-600 text-white rounded"
            >
              Gem behov
            </button>
          )}

          <div className="mt-6">
            <h3 className="font-semibold mb-2">Stines behov denne uge</h3>
            {stineCheckins.map((item) => {
              const canEvaluate = item.status === "pending" && currentUserRole === "mads";
              return (
                <div
                  key={item.id}
                  className={`flex justify-between items-center p-2 rounded mb-2 ${
                    !canEvaluate ? "bg-gray-200" : "bg-gray-100"
                  }`}
                >
                  <span>{item.need_text}</span>
                  <div className="flex gap-2">
                    <button
                      className="px-2 py-1 bg-green-500 text-white rounded"
                      onClick={() => handleEvaluation(item.id, "fulfilled", "stine")}
                      disabled={!canEvaluate}
                    >
                      ✅
                    </button>
                    <button
                      className="px-2 py-1 bg-yellow-500 text-white rounded"
                      onClick={() => handleEvaluation(item.id, "partial", "stine")}
                      disabled={!canEvaluate}
                    >
                      ⚖️
                    </button>
                    <button
                      className="px-2 py-1 bg-red-500 text-white rounded"
                      onClick={() => handleEvaluation(item.id, "not_fulfilled", "stine")}
                      disabled={!canEvaluate}
                    >
                      ❌
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function getWeekNumber(d: Date) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1) / 7);
}

export default CheckinPage;
