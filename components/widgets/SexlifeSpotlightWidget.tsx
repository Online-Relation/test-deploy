// components/widgets/SexlifeSpotlightWidget.tsx
'use client';

import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { supabase } from "@/lib/supabaseClient";
import { format, parseISO } from "date-fns";
import { getISOWeek } from "date-fns";

const temperatureColors = [
  { label: "Frost", color: "#A0C4FF" },
  { label: "Kølig", color: "#5EE6EC" },
  { label: "Neutral", color: "#D3D3D3" },
  { label: "Lun", color: "#FFCB77" },
  { label: "Hed", color: "#FF6B6B" },
];

// Dummy temperatur data
const temperatureData = [
  { week: "Uge 19", Mads: 1, Stine: 2 },
  { week: "Uge 20", Mads: 2, Stine: 3 },
  { week: "Uge 21", Mads: 3, Stine: 3 },
  { week: "Uge 22", Mads: 3, Stine: 2 },
  { week: "Uge 23", Mads: 4, Stine: 3 },
  { week: "Uge 24", Mads: 4, Stine: 4 },
  { week: "Uge 25", Mads: 0, Stine: 4 },
  { week: "Uge 26", Mads: 1, Stine: 3 },
  { week: "Uge 27", Mads: 2, Stine: 2 },
  { week: "Uge 28", Mads: 3, Stine: 1 },
  { week: "Uge 29", Mads: 4, Stine: 0 },
  { week: "Uge 30", Mads: 2, Stine: 2 },
];

export default function SexlifeSpotlightWidget() {
  const [activeTab, setActiveTab] = useState("temperature");
  const [sexData, setSexData] = useState<any[]>([]);
  const [totalSex, setTotalSex] = useState(0);
  const [totalNew, setTotalNew] = useState(0);

  useEffect(() => {
    const fetchSexData = async () => {
      const { data, error } = await supabase
        .from("sexlife_logs")
        .select("created_at, had_sex, tried_something_new");

      if (error) {
        console.error("Fejl ved hentning af sexlife_logs:", error);
        return;
      }

      const weekMap: Record<string, { antal: number; nye: number }> = {};
      let sexCount = 0;
      let newCount = 0;

      data.forEach((entry) => {
        const date = parseISO(entry.created_at);
        const week = `Uge ${getISOWeek(date)}`;

        if (!weekMap[week]) {
          weekMap[week] = { antal: 0, nye: 0 };
        }

        if (entry.had_sex) {
          weekMap[week].antal++;
          sexCount++;
        }
        if (entry.tried_something_new) {
          weekMap[week].nye++;
          newCount++;
        }
      });

      const formatted = Object.entries(weekMap)
        .map(([week, values]) => ({ week, ...values }))
        .sort((a, b) => {
          const numA = parseInt(a.week.replace("Uge ", ""));
          const numB = parseInt(b.week.replace("Uge ", ""));
          return numA - numB;
        });

      setSexData(formatted);
      setTotalSex(sexCount);
      setTotalNew(newCount);
    };

    fetchSexData();
  }, []);

  const newPercentage = totalSex > 0 ? Math.round((totalNew / totalSex) * 100) : 0;

  let sexMessage = "";

  if (newPercentage < 20) {
    sexMessage = `<span class='text-purple-500'>Det ser ud til I er ved at komme ind i rutine, hvor I ikke prøver noget nyt. I <strong><u>${newPercentage}%</u></strong> af jeres sexliv prøver I noget nyt. Måske I skulle tage en snak om noget nyt I begge har lyst til at prøve.</span>`;
  } else if (newPercentage < 50) {
    sexMessage = `<span class='text-purple-500'>I udforsker nyt i <strong><u>${newPercentage}%</u></strong> af jeres sexliv – godt gået! Måske er det tid til at tale om, hvad I kunne tænke jer at prøve næste gang?</span>`;
  } else if (newPercentage < 80) {
    sexMessage = `<span class='text-purple-500'>🔥 I er i fuld gang med at udforske hinanden! Med <strong><u>${newPercentage}%</u></strong> nye oplevelser viser I mod, lyst og leg. Bliv ved – det er inspirerende!</span>`;
  } else {
    sexMessage = `<span class='text-purple-500'>💥 WOW! I <strong><u>${newPercentage}%</u></strong> af jeres sexliv prøver I noget nyt. Det her er ikke bare et forhold – det er en erotisk ekspedition!</span>`;
  }

  return (
    <div className="relative bg-gradient-to-br from-violet-100 to-white rounded-3xl p-6 shadow-xl overflow-hidden">
      <h4 className="text-lg font-bold text-center text-purple-700 mb-6">Parforholdets puls</h4>

      <div className="relative z-10 mb-6 flex items-center justify-center gap-4">
        <button
          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 shadow-sm ${
            activeTab === "temperature"
              ? "bg-violet-600 text-white scale-105"
              : "bg-violet-100 text-violet-600 hover:bg-violet-200"
          }`}
          onClick={() => setActiveTab("temperature")}
        >
          Temperatur
        </button>
        <button
          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 shadow-sm ${
            activeTab === "challenge"
              ? "bg-violet-600 text-white scale-105"
              : "bg-violet-100 text-violet-600 hover:bg-violet-200"
          }`}
          onClick={() => setActiveTab("challenge")}
        >
          Sexliv
        </button>
      </div>

      <div className="relative z-10">
        {activeTab === "temperature" ? (
          <div className="space-y-6">
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Udvikling over 3 måneder</h4>
              <div className="w-full h-56 overflow-x-auto">
                <ResponsiveContainer width={800} height={220}>
                  <LineChart data={temperatureData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <XAxis dataKey="week" stroke="#888" fontSize={12} />
                    <YAxis domain={[0, 4]} tickFormatter={(v) => temperatureColors[v]?.label || ""} fontSize={12} />
                    <Tooltip formatter={(value: number | string) => {
                      const index = Number(value);
                      return temperatureColors[index]?.label || value;
                    }} />
                    <Legend verticalAlign="top" height={36} />
                    <Line type="monotone" dataKey="Mads" stroke="#7C3AED" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Stine" stroke="#EC4899" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Sexliv over 3 måneder</h4>
              <div className="w-full h-56 overflow-x-auto">
                <ResponsiveContainer width={800} height={220}>
                  <LineChart data={sexData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <XAxis dataKey="week" stroke="#888" fontSize={12} />
                    <YAxis fontSize={12} allowDecimals={false} />
                    <Tooltip />
                    <Legend verticalAlign="top" height={36} />
                    <Line type="monotone" dataKey="antal" stroke="#6366F1" strokeWidth={2} dot={{ r: 4 }} name="Antal gange" />
                    <Line type="monotone" dataKey="nye" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} name="Nye ting prøvet" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-center mt-2" dangerouslySetInnerHTML={{ __html: sexMessage }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
