"use client";

import React, { useState, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { da } from "react-day-picker/locale";
import "react-day-picker/dist/style.css";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@supabase/auth-helpers-react";

const moodOptions = [
  { value: 1, label: "Frost", color: "bg-blue-200 border-blue-400 text-blue-900" },
  { value: 2, label: "Kølig", color: "bg-cyan-200 border-cyan-400 text-cyan-900" },
  { value: 3, label: "Neutral", color: "bg-gray-200 border-gray-400 text-gray-900" },
  { value: 4, label: "Lun", color: "bg-orange-200 border-orange-400 text-orange-900" },
  { value: 5, label: "Hed", color: "bg-red-200 border-red-400 text-red-900" },
];

// Sammenlign kun år, måned, dag – ligegyldigt hvad tid/zone er
function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function IndtjekningHverdag() {
  const user = useUser();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [wasTogether, setWasTogether] = useState("");
  const [conflict, setConflict] = useState("");
  const [mood, setMood] = useState(3);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const [registeredDates, setRegisteredDates] = useState<Date[]>([]);
  const [latest, setLatest] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- Hent datoer & registreringer ---
  useEffect(() => {
    if (!user) return;
    supabase
      .from("daily_checkin")
      .select("checkin_date")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) {
          // VIGTIGT: Lav en Date med UTC for kun datoen (ignorer tid)
          const regDates = data.map((row: any) => {
            // Split yyyy-mm-dd for at undgå tidszone-kaos
            const [year, month, day] = row.checkin_date.split("-");
            const d = new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0);
            return d;
          });
          setRegisteredDates(regDates);
          // Debug
          console.log("registeredDates (ISO):", regDates.map(d => d.toISOString()));
        }
      });

    setFetching(true);
    setErrorMsg(null);
    supabase
      .from("daily_checkin")
      .select("*")
      .eq("user_id", user.id)
      .order("checkin_date", { ascending: false })
      .limit(5)
      .then(({ data, error }) => {
        if (error) {
          setErrorMsg("Fejl ved hentning: " + error.message);
          setLatest([]);
        } else {
          setLatest(data || []);
          setErrorMsg(null);
        }
        setFetching(false);
      });
  }, [user, done]);

  // Debug: Se hvad der vælges som dato
  useEffect(() => {
    if (date) {
      console.log(
        "Valgt dato (objekt):", date,
        "ISO:", date.toISOString(),
        "Locale:", date.toLocaleString()
      );
    }
  }, [date]);

  // Matcher-funktion til DayPicker – logger ALT!
  function matcher(day: Date) {
    const found = registeredDates.some((reg) => isSameDay(day, reg));
    if (found) {
      console.log("MATCHER:", {
        dag: day.toISOString(),
        alleRegistrerede: registeredDates.map(d => d.toISOString())
      });
    }
    return found;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const checkin_date = date
      ? `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date
          .getDate()
          .toString()
          .padStart(2, "0")}`
      : undefined;

    const { error } = await supabase.from("daily_checkin").insert({
      user_id: user?.id,
      checkin_date,
      was_together: wasTogether === "ja",
      conflict: conflict === "ja",
      mood,
    });

    setLoading(false);
    if (!error) {
      setDone(true);
    } else {
      alert("Der opstod en fejl! Prøv igen.");
    }
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto py-8 px-4">
        <div className="rounded-2xl shadow-lg bg-white p-6 text-center">
          <div className="text-2xl mb-4">Tak for din indtjekning!</div>
          <button
            className="btn-primary w-full mt-2"
            onClick={() => setDone(false)}
          >
            Indsend en ny
          </button>
        </div>
        <LatestRegistrations latest={latest} fetching={fetching} errorMsg={errorMsg} />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-6 px-4">
      <form onSubmit={handleSubmit}>
        <div className="rounded-2xl shadow-lg bg-white p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4">Indtjekning – Hverdag</h2>

          {/* Kalender-vælger med markerede dage */}
          <div className="mb-4">
            <label className="block font-medium mb-1">Dato</label>
            <DayPicker
              mode="single"
              selected={date}
              onSelect={setDate}
              modifiers={{
                registered: matcher
              }}
              modifiersClassNames={{
                registered: "rdp-day_registered"
              }}
              showOutsideDays
              locale={da}
              weekStartsOn={1}
            />
          </div>

          {/* Var I sammen i dag */}
          <div className="mb-4">
            <label className="block font-medium mb-1">Var I sammen i dag?</label>
            <select
              value={wasTogether}
              onChange={(e) => setWasTogether(e.target.value)}
              className="border rounded-xl px-3 py-2 w-full"
              required
            >
              <option value="">Vælg...</option>
              <option value="ja">Ja</option>
              <option value="nej">Nej</option>
            </select>
          </div>

          {/* Konflikt */}
          <div className="mb-4">
            <label className="block font-medium mb-1">Var der konflikt?</label>
            <select
              value={conflict}
              onChange={(e) => setConflict(e.target.value)}
              className="border rounded-xl px-3 py-2 w-full"
              required
            >
              <option value="">Vælg...</option>
              <option value="ja">Ja</option>
              <option value="nej">Nej</option>
            </select>
          </div>

          {/* Stemning barometer */}
          <div className="mb-4">
            <label className="block font-medium mb-1">Humør for dagen</label>
            <div className="flex items-center gap-3 justify-between">
              {moodOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMood(opt.value)}
                  className={`rounded-full w-16 h-16 flex items-center justify-center border-2 font-medium text-xs
                    ${opt.color}
                    ${mood === opt.value ? "scale-110 border-black shadow" : "opacity-80"}
                    transition-all`}
                  aria-label={opt.label}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="mt-3 text-center text-base font-medium" style={{ minHeight: 24 }}>
              {moodOptions.find((opt) => opt.value === mood)?.label}
            </div>
          </div>

          {/* Submit */}
          <button
            className="btn-primary w-full mt-4 shadow"
            type="submit"
            disabled={loading}
          >
            {loading ? "Gemmer..." : "Gem"}
          </button>
        </div>
      </form>
      <LatestRegistrations latest={latest} fetching={fetching} errorMsg={errorMsg} />
    </div>
  );
}

function LatestRegistrations({ latest, fetching, errorMsg }: { latest: any[], fetching: boolean, errorMsg?: string | null }) {
  const moodOptions = [
    { value: 1, label: "Frost", color: "bg-blue-200 border-blue-400 text-blue-900" },
    { value: 2, label: "Kølig", color: "bg-cyan-200 border-cyan-400 text-cyan-900" },
    { value: 3, label: "Neutral", color: "bg-gray-200 border-gray-400 text-gray-900" },
    { value: 4, label: "Lun", color: "bg-orange-200 border-orange-400 text-orange-900" },
    { value: 5, label: "Hed", color: "bg-red-200 border-red-400 text-red-900" },
  ];

  return (
    <div className="rounded-2xl shadow bg-white p-4 mt-6">
      <h3 className="font-semibold mb-3 text-lg">Seneste indtjekninger</h3>
      {errorMsg ? (
        <div className="text-center text-red-500">{errorMsg}</div>
      ) : fetching ? (
        <div className="text-center text-gray-500">Henter...</div>
      ) : latest.length === 0 ? (
        <div className="text-center text-gray-400">Ingen registreringer endnu.</div>
      ) : (
        <ul className="space-y-2">
          {latest.map((item) => {
            const mood = moodOptions.find((m) => m.value === item.mood);
            return (
              <li key={item.id} className="flex items-center justify-between border-b pb-1 last:border-b-0">
                <span className="text-sm">{item.checkin_date}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${mood?.color}`}>
                  {mood?.label}
                </span>
                <span className="text-xs">
                  {item.was_together ? "Sammen" : "Ikke sammen"}
                </span>
                <span className="text-xs">
                  {item.conflict ? "Konflikt" : ""}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}


