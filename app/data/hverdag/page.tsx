"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Doughnut, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  TimeScale,
} from "chart.js";
import "chartjs-adapter-date-fns";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  TimeScale
);

const moodOptions = [
  { value: 1, label: "Frost" },
  { value: 2, label: "Kølig" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Lun" },
  { value: 5, label: "Hed" },
];

// Definer positive/negative ord
const POSITIVE_WORDS = [
  "Tryg", "Forbundet", "Elsket", "Håbefuld", "Optimistisk", "Taknemmelig", "Nysgerrig",
  "Afklaret", "Glæde", "Motiveret", "Inspireret", "Stolt", "Lettelse",
];
const NEGATIVE_WORDS = [
  "Usikker", "Tvivler", "Ensom", "Frustreret", "Overvældet", "Træt", "Skuffet", "Utryg",
  "Ængstelig", "Irriteret", "Ked af det", "Vred", "Jaloux", "Sårbar", "Opgivende", "Bekymret", "Resigneret"
];

function formatMonthYear(date: Date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
}

export default function HverdagData() {
  const [moodCounts, setMoodCounts] = useState<number[]>([0, 0, 0, 0, 0]);
  const [tagCounts, setTagCounts] = useState<{ [tag: string]: number }>({});
  const [monthlyStats, setMonthlyStats] = useState<
    { month: string; positive: number; negative: number }[]
  >([]);
  const [monthsBack, setMonthsBack] = useState(6);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setErrorMsg(null);
      const { data, error } = await supabase
        .from("daily_checkin")
        .select("mood, tags, checkin_date");

      if (error) {
        setErrorMsg("Fejl ved hentning: " + error.message);
        setLoading(false);
        return;
      }

      // Stemnings-barometer (som før)
      const counts = [0, 0, 0, 0, 0];
      const tagMap: { [tag: string]: number } = {};

      // Gruppér per måned: { "2024-05": { positive: X, negative: Y } }
      const statsPerMonth: Record<string, { positive: number; negative: number }> = {};

      const now = new Date();
      const earliestDate = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 1);

      if (data && Array.isArray(data)) {
        data.forEach((row: any) => {
          // Stemning
          if (typeof row.mood === "number" && row.mood >= 1 && row.mood <= 5) {
            counts[row.mood - 1]++;
          }
          // Måneds-nøgle
          let d: Date | undefined;
          if (typeof row.checkin_date === "string") {
            d = new Date(row.checkin_date);
            if (isNaN(d.getTime())) d = undefined;
          }
          if (!d) return;
          if (d < earliestDate) return;
          const monthKey = formatMonthYear(d);

          if (!statsPerMonth[monthKey]) statsPerMonth[monthKey] = { positive: 0, negative: 0 };
          if (Array.isArray(row.tags)) {
            row.tags.forEach((tag: string) => {
              if (POSITIVE_WORDS.includes(tag)) statsPerMonth[monthKey].positive += 1;
              if (NEGATIVE_WORDS.includes(tag)) statsPerMonth[monthKey].negative += 1;
              tagMap[tag] = (tagMap[tag] || 0) + 1;
            });
          }
        });
      }

      // Lav “tom” stats for måneder uden data
      const months: string[] = [];
      for (let i = monthsBack - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(formatMonthYear(d));
      }
      const monthly: { month: string; positive: number; negative: number }[] = months.map(
        (month) => ({
          month,
          positive: statsPerMonth[month]?.positive || 0,
          negative: statsPerMonth[month]?.negative || 0,
        })
      );

      setMoodCounts(counts);
      setTagCounts(tagMap);
      setMonthlyStats(monthly);
      setLoading(false);
    }

    fetchData();
  }, [monthsBack]);

  // Bar chart for tags (category/barPercentage sættes på dataset)
  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  const tagBarData = {
    labels: sortedTags.map(([tag]) => tag),
    datasets: [
      {
        label: "Hyppigste følelser/tanker",
        data: sortedTags.map(([, count]) => count),
        backgroundColor: "#6366f1",
        categoryPercentage: 0.6,
        barPercentage: 0.6,
      },
    ],
  };

  const moodChartData = {
    labels: moodOptions.map((opt) => opt.label),
    datasets: [
      {
        data: moodCounts,
        backgroundColor: [
          "#93c5fd", // Frost
          "#67e8f9", // Kølig
          "#d1d5db", // Neutral
          "#fdba74", // Lun
          "#f87171", // Hed
        ],
        borderWidth: 2,
      },
    ],
  };

  // Linje-data for positive/negative per måned
  const lineChartData = {
    labels: monthlyStats.map((m) => m.month),
    datasets: [
      {
        label: "Positive følelser/tanker",
        data: monthlyStats.map((m) => m.positive),
        borderColor: "#10b981",
        backgroundColor: "#d1fae5",
        tension: 0.3,
        pointRadius: 5,
        fill: false,
      },
      {
        label: "Negative følelser/tanker",
        data: monthlyStats.map((m) => m.negative),
        borderColor: "#ef4444",
        backgroundColor: "#fee2e2",
        tension: 0.3,
        pointRadius: 5,
        fill: false,
      },
    ],
  };



return (
  <div className="max-w-md mx-auto py-8 px-4 pb-20">
    <h2 className="text-xl font-bold mb-4 text-center">Stemningsbarometer – Hverdag</h2>
    <div className="mb-4">
      <label className="font-medium mr-2">Vælg antal måneder:</label>
      <select
        value={monthsBack}
        onChange={e => setMonthsBack(Number(e.target.value))}
        className="border rounded-xl px-2 py-1"
      >
        {[3, 6, 12, 24].map(n => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
    </div>
    {loading ? (
      <div className="text-center text-gray-500">Henter data...</div>
    ) : errorMsg ? (
      <div className="text-center text-red-500">{errorMsg}</div>
    ) : (
      <>
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <Doughnut data={moodChartData} />
          <ul className="mt-6 space-y-1">
            {moodOptions.map((opt, idx) => (
              <li key={opt.value} className="flex justify-between text-sm">
                <span>{opt.label}</span>
                <span className="font-semibold">{moodCounts[idx]}</span>
              </li>
            ))}
          </ul>
        </div>
        {/* Bar chart: behold overflow og fast højde */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-10 max-h-[400px] h-[350px] overflow-y-auto">
          <h3 className="font-semibold mb-2 text-center">Top følelser/tanker</h3>
          {sortedTags.length === 0 ? (
            <div className="text-gray-400 text-center">Ingen tags endnu.</div>
          ) : (
            <Bar
              data={tagBarData}
              options={{
                indexAxis: "y",
                plugins: { legend: { display: false } },
                scales: {
                  x: { beginAtZero: true, ticks: { precision: 0 }, grid: { display: false } },
                  y: { grid: { display: false } },
                },
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 1.7,
              }}
            />
          )}
        </div>
        {/* Line chart: INGEN overflow og ingen fast højde */}
       <div className="bg-white rounded-2xl shadow-lg p-4 mb-16">
  <h3 className="font-semibold mb-2 text-center">
    Udvikling: positive vs negative følelser/tanker pr. måned
  </h3>
  <div className="relative h-[350px]">
    <Line
      data={lineChartData}
      options={{
        plugins: { legend: { display: true } },
        scales: {
          x: {
            title: { display: true, text: "Måned" },
            grid: { display: false },
          },
          y: {
            title: { display: true, text: "Antal" },
            beginAtZero: true,
            ticks: { precision: 0 },
            grid: { display: true, color: "#e5e7eb" },
          },
        },
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 1.7,
      }}
    />
  </div>
</div>

      </>
    )}
  </div>
);



}
