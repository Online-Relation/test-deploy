// app/checkin/page.tsx

"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const CheckinPage = () => {
  const [madsNeeds, setMadsNeeds] = useState(["", "", ""]);
  const [stineNeeds, setStineNeeds] = useState(["", "", ""]);
  const [madsCheckins, setMadsCheckins] = useState<any[] | null>(null);
  const [stineCheckins, setStineCheckins] = useState<any[] | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<"mads" | "stine" | null>(null);
  const [evaluatorId, setEvaluatorId] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [xpMap, setXpMap] = useState<Record<string, number>>({});

  const userIdMads = "190a3151-97bc-43be-9daf-1f3b3062f97f";
  const userIdStine = "5687c342-1a13-441c-86ca-f7e87e1edbd5";

  const fetchXPSettings = async () => {
    const { data } = await supabase
      .from("xp_settings")
      .select("*")
      .eq("role", "common");

    if (data) {
      const map: Record<string, number> = {};
      data.forEach((row) => {
        map[row.action] = row.xp;
      });
      setXpMap(map);
    }
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

    setMadsCheckins(madsData ?? []);
    setStineCheckins(stineData ?? []);
    setDataLoaded(true);
  };

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
        status: "pending",
      });
    }

    who === "mads" ? setMadsNeeds(["", "", ""]) : setStineNeeds(["", "", ""]);
    fetchNeeds();
  };

  const handleEvaluation = async (
    id: number,
    status: "evaluate_fulfilled" | "evaluate_partial" | "evaluate_rejected",
    target: "mads" | "stine"
  ) => {
    if (!evaluatorId) return;

    const xp = xpMap[status] ?? 0;
    const receiverId = target === "mads" ? userIdStine : userIdMads;
    const receiverRole = target === "mads" ? "stine" : "mads";

    await supabase
      .from("checkin")
      .update({
        status,
        xp_awarded: xp,
        evaluator_id: evaluatorId,
      })
      .eq("id", id);

    await supabase.from("xp_log").insert({
      user_id: receiverId,
      change: xp,
      role: receiverRole,
      description: `Check-in behov: ${status.replace("evaluate_", "")}`,
    });

    fetchNeeds();
  };

  useEffect(() => {
    const getSessionUser = async () => {
      const { data } = await supabase.auth.getSession();
      const id = data.session?.user.id ?? null;
      setEvaluatorId(id);
      if (id === userIdMads) setCurrentUserRole("mads");
      else if (id === userIdStine) setCurrentUserRole("stine");
    };

    getSessionUser();
    fetchXPSettings();
  }, []);

  useEffect(() => {
    if (currentUserRole) {
      fetchNeeds();
    }
  }, [currentUserRole]);

  const getWeekNumber = (d: Date) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1) / 7);
  };

  const getBgColor = (status: string) => {
    if (status === "evaluate_fulfilled") return "bg-green-100 border-green-400";
    if (status === "evaluate_partial") return "bg-yellow-100 border-yellow-400";
    if (status === "evaluate_rejected") return "bg-red-100 border-red-400";
    return "bg-gray-100";
  };

  const renderCheckins = (list: any[], target: "mads" | "stine") => {
    const isOwn = currentUserRole === target;
    const active = list.filter((item) => item.status === "pending");

    return (
      <div className="space-y-2 mb-6">
        {active.map((item) => {
          const canEvaluate = isOwn && item.status === "pending";
          return (
            <div
              key={item.id}
              className="p-3 border rounded bg-green-50 flex justify-between items-center"
            >
              <span>{item.need_text}</span>
              {canEvaluate && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEvaluation(item.id, "evaluate_fulfilled", target)}
                    className="px-2 py-1 rounded bg-green-500 text-white"
                  >
                    ✅
                  </button>
                  <button
                    onClick={() => handleEvaluation(item.id, "evaluate_partial", target)}
                    className="px-2 py-1 rounded bg-yellow-500 text-white"
                  >
                    ⚖️
                  </button>
                  <button
                    onClick={() => handleEvaluation(item.id, "evaluate_rejected", target)}
                    className="px-2 py-1 rounded bg-red-500 text-white"
                  >
                    ❌
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderHistoryBox = (
    items: any[],
    recipient: "mads" | "stine",
    showTitle = false
  ) => {
    return (
      <div>
        {showTitle && <h3 className="font-semibold mb-2">Historik</h3>}
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`p-3 border rounded ${getBgColor(item.status)}`}
            >
              <div className="font-medium">{item.need_text}</div>
              <div className="text-sm mt-1">
                {recipient.charAt(0).toUpperCase() + recipient.slice(1)} fik tildelt{" "}
                <span className="font-semibold">{item.xp_awarded}</span> point
                <span className="ml-2 text-gray-500">
                  Uge {item.week_number}
                  {item.updated_at
                    ? ` – ${new Date(item.updated_at).toLocaleDateString("da-DK")}`
                    : ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
  <div className="p-4 max-w-7xl mx-auto">
    <h1 className="text-3xl font-bold mb-10 text-center">Ugentlig Check-in</h1>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Mads' kort */}
      <div className="bg-white rounded-2xl shadow-lg p-6 space-y-8">
        <h2 className="text-2xl font-bold text-blue-700">Mads</h2>

        <div>
          <h3 className="text-lg font-semibold mb-2">Mine behov</h3>
          {madsNeeds.map((need, index) => (
            <input
              key={index}
              type="text"
              value={need}
              onChange={(e) => {
                if (currentUserRole !== "mads") return;
                const updated = [...madsNeeds];
                updated[index] = e.target.value;
                setMadsNeeds(updated);
              }}
              className="mb-2 w-full p-2 border rounded bg-white disabled:bg-gray-100"
              placeholder={`Behov ${index + 1}`}
              disabled={currentUserRole !== "mads"}
            />
          ))}
          {currentUserRole === "mads" && dataLoaded && (
            <button
              onClick={() => handleSubmit("mads")}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Gem behov
            </button>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Ugens behov</h3>
          {madsCheckins && renderCheckins(madsCheckins, "mads")}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Historik</h3>
          {stineCheckins &&
            renderHistoryBox(
              stineCheckins.filter((item) => item.status && item.status !== "pending"),
              "mads"
            )}
        </div>
      </div>

      {/* Stines kort */}
      <div className="bg-white rounded-2xl shadow-lg p-6 space-y-8">
        <h2 className="text-2xl font-bold text-purple-700">Stine</h2>

        <div>
          <h3 className="text-lg font-semibold mb-2">Mine behov</h3>
          {stineNeeds.map((need, index) => (
            <input
              key={index}
              type="text"
              value={need}
              onChange={(e) => {
                if (currentUserRole !== "stine") return;
                const updated = [...stineNeeds];
                updated[index] = e.target.value;
                setStineNeeds(updated);
              }}
              className="mb-2 w-full p-2 border rounded bg-white disabled:bg-gray-100"
              placeholder={`Behov ${index + 1}`}
              disabled={currentUserRole !== "stine"}
            />
          ))}
          {currentUserRole === "stine" && dataLoaded && (
            <button
              onClick={() => handleSubmit("stine")}
              className="mt-2 px-4 py-2 bg-purple-600 text-white rounded"
            >
              Gem behov
            </button>
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Ugens behov</h3>
          {stineCheckins && renderCheckins(stineCheckins, "stine")}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Historik</h3>
          {madsCheckins &&
            renderHistoryBox(
              madsCheckins.filter((item) => item.status && item.status !== "pending"),
              "stine"
            )}
        </div>
      </div>
    </div>
  </div>
);

};

export default CheckinPage;
