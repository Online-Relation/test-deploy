// app/checkin/oversigt/page.tsx
'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const OversigtPage = () => {
  const [madsCheckins, setMadsCheckins] = useState<any[]>([]);
  const [stineCheckins, setStineCheckins] = useState<any[]>([]);
  const [currentWeek, setCurrentWeek] = useState<number>(0);
  const [currentYear, setCurrentYear] = useState<number>(0);

  useEffect(() => {
    const today = new Date();
    const weekNumber = getWeekNumber(today);
    const year = today.getFullYear();
    setCurrentWeek(weekNumber);
    setCurrentYear(year);
    fetchOverview(weekNumber, year);
  }, []);

  const getWeekNumber = (d: Date) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d as any) - (yearStart as any)) / 86400000 + 1) / 7);
  };

  const fetchOverview = async (weekNumber: number, year: number) => {
    const userIdMads = "190a3151-97bc-43be-9daf-1f3b3062f97f";
    const userIdStine = "5687c342-1a13-441c-86ca-f7e87e1edbd5";

    const { data: madsData } = await supabase
      .from("checkin")
      .select("*")
      .eq("week_number", weekNumber)
      .eq("year", year)
      .eq("user_id", userIdMads);

    const { data: stineData } = await supabase
      .from("checkin")
      .select("*")
      .eq("week_number", weekNumber)
      .eq("year", year)
      .eq("user_id", userIdStine);

    // Filtrer kun pending og tag max 3
    const madsPending = (madsData ?? [])
      .filter((row) => row.status === "pending")
      .slice(0, 3);
    const stinePending = (stineData ?? [])
      .filter((row) => row.status === "pending")
      .slice(0, 3);

    setMadsCheckins(madsPending);
    setStineCheckins(stinePending);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Check-in Oversigt</h1>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          Uge {currentWeek}, {currentYear}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mads' Check-ins */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-xl font-semibold mb-2">Mads' behov</h3>
            {madsCheckins.length > 0 ? (
              <ul className="space-y-2">
                {madsCheckins.map((item) => (
                  <li
                    key={item.id}
                    className="border rounded p-2 flex justify-between items-center"
                  >
                    <span>{item.need_text}</span>
                    <span className="text-sm text-gray-500">
                      Afventer
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">Ingen Mads‐checkins under behandling.</p>
            )}
          </div>

          {/* Stine's Check-ins */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-xl font-semibold mb-2">Stine's behov</h3>
            {stineCheckins.length > 0 ? (
              <ul className="space-y-2">
                {stineCheckins.map((item) => (
                  <li
                    key={item.id}
                    className="border rounded p-2 flex justify-between items-center"
                  >
                    <span>{item.need_text}</span>
                    <span className="text-sm text-gray-500">
                      Afventer
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">Ingen Stine‐checkins under behandling.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OversigtPage;
