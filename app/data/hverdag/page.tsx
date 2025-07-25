// /data/hverdag/page.tsx
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

const POSITIVE_WORDS = [
  "Tryg", "Forbundet", "Elsket", "Håbefuld", "Optimistisk", "Taknemmelig", "Nysgerrig",
  "Afklaret", "Glæde", "Motiveret", "Inspireret", "Stolt", "Lettelse",
];
const NEGATIVE_WORDS = [
  "Usikker", "Tvivler", "Ensom", "Frustreret", "Overvældet", "Træt", "Skuffet", "Utryg",
  "Ængstelig", "Irriteret", "Ked af det", "Vred", "Jaloux", "Sårbar", "Opgivende", "Bekymret", "Resigneret"
];

const ilyWhoText: Record<string, string> = {
  partner_first: "Min kæreste sagde det først",
  me_first: "Jeg sagde det først",
  partner_only: "Kun min kæreste sagde det",
  me_only: "Kun jeg sagde det",
  "": "Ingen sagde det",
};

function formatMonthYear(date: Date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
}

// --- Utility: Vis måned med år på dansk ---
function formatMonthYearLabel(date: Date) {
  return date.toLocaleDateString("da-DK", { year: "numeric", month: "long" });
}

function daysBetween(dateStr?: string | null) {
  if (!dateStr) return null;
  const then = new Date(dateStr);
  const now = new Date();
  const ms = now.getTime() - then.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function toMidnight(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// --- GAVE-UDTRÆK ---
function extractGifts(data: any[]): { what: string; cost: number; date: string }[] {
  const gifts: { what: string; cost: number; date: string }[] = [];
  for (const row of data) {
    if (row.gift && Array.isArray(row.gifts)) {
      for (const g of row.gifts) {
        let cost = 0;
        if (typeof g.giftCost === "number") cost = g.giftCost;
        if (typeof g.giftCost === "string") cost = parseFloat(g.giftCost.replace(",", ".")) || 0;
        gifts.push({
          what: g.giftWhat,
          cost,
          date: row.checkin_date,
        });
      }
    } else if (row.gift === true && row.giftCost) {
      let cost = 0;
      if (typeof row.giftCost === "number") cost = row.giftCost;
      if (typeof row.giftCost === "string") cost = parseFloat(row.giftCost.replace(",", ".")) || 0;
      gifts.push({
        what: row.giftWhat || "",
        cost,
        date: row.checkin_date,
      });
    }
  }
  return gifts;
}

// --- NY: DATEDAY GAVER UDTRÆK ---
function extractDatedayGifts(data: any[]): { cost: number }[] {
  const gifts: { cost: number }[] = [];
  for (const row of data) {
    if (row.dateday === true && Array.isArray(row.dateday_gifts)) {
      for (const g of row.dateday_gifts) {
        let cost = 0;
        if (typeof g.giftCost === "number") cost = g.giftCost;
        else if (typeof g.giftCost === "string") cost = parseFloat(g.giftCost.replace(",", ".")) || 0;
        gifts.push({ cost });
      }
    }
  }
  return gifts;
}

export default function HverdagData() {
  // State
  const [moodCounts, setMoodCounts] = useState<number[]>([0, 0, 0, 0, 0]);
  const [tagCounts, setTagCounts] = useState<{ [tag: string]: number }>({});
  const [monthlyStats, setMonthlyStats] = useState<
    { month: string; positive: number; negative: number }[]
  >([]);
  const [monthsBack, setMonthsBack] = useState(6);

  const [ilyCounts, setIlyCounts] = useState<{
    partner_first: number;
    me_first: number;
    partner_only: number;
    me_only: number;
    none: number;
  }>({
    partner_first: 0,
    me_first: 0,
    partner_only: 0,
    me_only: 0,
    none: 0,
  });

  const [lastPartnerFirstDate, setLastPartnerFirstDate] = useState<string | null>(null);
  const [lastMeFirstDate, setLastMeFirstDate] = useState<string | null>(null);

  // Ekstra state til de nye felter
  const [lastFlowerDate, setLastFlowerDate] = useState<string | null>(null);
  const [alcoholCounts, setAlcoholCounts] = useState<{ yes: number; no: number }>({ yes: 0, no: 0 });
  const [honestyTalkCount, setHonestyTalkCount] = useState(0);
  const [honestyTalks, setHonestyTalks] = useState<{ date: string; topic: string }[]>([]);

  // Gave-state (samlet på tværs af alle dage)
  const [giftTotal, setGiftTotal] = useState(0);
  const [giftSum, setGiftSum] = useState(0);
  const [lastGiftDate, setLastGiftDate] = useState<string | null>(null);
  const [avgPricePerDay, setAvgPricePerDay] = useState<string | null>(null);

  // NYT: Alkohol pr. måned/samlet
  const [alcoholByMonth, setAlcoholByMonth] = useState<{ key: string, label: string, sammen: number, alkohol: number }[]>([]);
  const [alcoholTotalSummary, setAlcoholTotalSummary] = useState<{ sammen: number, alkohol: number }>({ sammen: 0, alkohol: 0 });

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setErrorMsg(null);

      const { data, error } = await supabase
        .from("daily_checkin")
        .select("*")
        .order("checkin_date", { ascending: true });

      if (error) {
        setErrorMsg("Fejl ved hentning: " + error.message);
        setLoading(false);
        return;
      }

      // Eksisterende aggregater
      const counts = [0, 0, 0, 0, 0];
      const tagMap: { [tag: string]: number } = {};
      const ily = {
        partner_first: 0,
        me_first: 0,
        partner_only: 0,
        me_only: 0,
        none: 0,
      };
      let lastPartnerFirst: string | null = null;
      let lastMeFirst: string | null = null;

      const statsPerMonth: Record<string, { positive: number; negative: number }> = {};

      // Nye felter - startværdier
      let lastFlower: string | null = null;
      let alcoholYes = 0, alcoholNo = 0;
      let honestyCount = 0;
      let honestyArr: { date: string; topic: string }[] = [];

      // ---- GAVE AGGREGAT (samler ALLE gaver) ----
      const allGifts = extractGifts(data || []);
      const allDatedayGifts = extractDatedayGifts(data || []);

      const totalCosts = [
        ...allGifts.map(g => g.cost),
        ...allDatedayGifts.map(g => g.cost),
      ];

      const giftTotalCount = totalCosts.length;
      const giftSumTotal = totalCosts.reduce((sum, c) => sum + c, 0);

      setGiftTotal(giftTotalCount);
      setGiftSum(giftSumTotal);
      setLastGiftDate(allGifts.length > 0 ? allGifts[allGifts.length - 1].date : null);

      // NYT: Gennemsnit pr. dag – starter fra 2025-07-11 til i dag (inkl.)
      let avgPrice = null;
      if (giftTotalCount > 0) {
        const FIXED_START_DATE = toMidnight(new Date("2025-07-11"));
        const endDate = toMidnight(new Date());
        const diffDays = Math.floor((endDate.getTime() - FIXED_START_DATE.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        if (diffDays > 0) {
          avgPrice = (giftSumTotal / diffDays).toFixed(2);
        }
      }
      setAvgPricePerDay(avgPrice);

      const now = new Date();
      const earliestDate = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 1);

      // --- Alkohol/sammen stats pr. måned ---
      const alcoholMonthMap: Record<string, { sammen: number, alkohol: number, date: Date }> = {};
      let sammenTotal = 0, alkoholTotal = 0;

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
          const monthKey = formatMonthYear(d);
          // --- Alkohol/sammen grupperet ---
          if (row.together === true || row.together === 1) {
            if (!alcoholMonthMap[monthKey]) {
              alcoholMonthMap[monthKey] = { sammen: 0, alkohol: 0, date: d };
            }
            alcoholMonthMap[monthKey].sammen++;
            sammenTotal++;
            if (row.alcohol === true || row.alcohol === 1) {
              alcoholMonthMap[monthKey].alkohol++;
              alkoholTotal++;
            }
          }

          if (d < earliestDate) return;
          if (!statsPerMonth[monthKey]) statsPerMonth[monthKey] = { positive: 0, negative: 0 };
          if (Array.isArray(row.tags)) {
            row.tags.forEach((tag: string) => {
              if (POSITIVE_WORDS.includes(tag)) statsPerMonth[monthKey].positive += 1;
              if (NEGATIVE_WORDS.includes(tag)) statsPerMonth[monthKey].negative += 1;
              tagMap[tag] = (tagMap[tag] || 0) + 1;
            });
          }
          // ILY-WHO tælling og sidste datoer
          switch (row.ily_who) {
            case "partner_first":
              ily.partner_first++;
              lastPartnerFirst = row.checkin_date;
              break;
            case "me_first":
              ily.me_first++;
              lastMeFirst = row.checkin_date;
              break;
            case "partner_only":
              ily.partner_only++;
              break;
            case "me_only":
              ily.me_only++;
              break;
            default:
              ily.none++;
          }
          // Blomster
          if (row.flowers === true) {
            lastFlower = row.checkin_date;
          }
          // Alkohol (gammelt total for doughnut)
          if (row.alcohol === true) alcoholYes++;
          if (row.alcohol === false) alcoholNo++;
          // Ærlighedssnak
          if (row.honesty_talk === true) {
            honestyCount++;
            honestyArr.push({ date: row.checkin_date, topic: row.honesty_topic || "" });
          }
        });
      }

      // --- Alkohol/sammen arrays (sorteret) ---
      const alcoholByMonthArr = Object.entries(alcoholMonthMap)
        .map(([key, val]) => ({
          key,
          label: formatMonthYearLabel(val.date),
          sammen: val.sammen,
          alkohol: val.alkohol
        }))
        .sort((a, b) => new Date(a.key) > new Date(b.key) ? 1 : -1);

      setAlcoholByMonth(alcoholByMonthArr);
      setAlcoholTotalSummary({ sammen: sammenTotal, alkohol: alkoholTotal });

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
      setIlyCounts(ily);
      setLastPartnerFirstDate(lastPartnerFirst);
      setLastMeFirstDate(lastMeFirst);
      setLastFlowerDate(lastFlower);
      setAlcoholCounts({ yes: alcoholYes, no: alcoholNo });
      setHonestyTalkCount(honestyCount);
      setHonestyTalks(honestyArr);
      setLoading(false);
    }

    fetchData();
  }, [monthsBack]);

  // Bar chart for tags
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

  // Chart for ily_who - ny rækkefølge og labels
  const ilyData = {
    labels: [
      ilyWhoText.partner_first,
      ilyWhoText.me_first,
      ilyWhoText.partner_only,
      ilyWhoText.me_only,
      ilyWhoText[""],
    ],
    datasets: [
      {
        data: [
          ilyCounts.partner_first,
          ilyCounts.me_first,
          ilyCounts.partner_only,
          ilyCounts.me_only,
          ilyCounts.none,
        ],
        backgroundColor: [
          "#f472b6", // partner_first (pink)
          "#60a5fa", // me_first (blå)
          "#f9a8d4", // partner_only (lys pink)
          "#a5b4fc", // me_only (lys blå)
          "#a3a3a3", // ingen (grå)
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

  const daysSinceMeFirst = daysBetween(lastMeFirstDate);
  const daysSincePartnerFirst = daysBetween(lastPartnerFirstDate);
  const daysSinceFlowers = daysBetween(lastFlowerDate);
  const daysSinceGift = daysBetween(lastGiftDate);

  // Udregn seneste dato blandt de to
  let latestIlyDate: string | null = null;
  if (lastMeFirstDate && lastPartnerFirstDate) {
    latestIlyDate =
      new Date(lastMeFirstDate) > new Date(lastPartnerFirstDate)
        ? lastMeFirstDate
        : lastPartnerFirstDate;
  } else if (lastMeFirstDate) {
    latestIlyDate = lastMeFirstDate;
  } else if (lastPartnerFirstDate) {
    latestIlyDate = lastPartnerFirstDate;
  }

  const daysSinceAnyone = daysBetween(latestIlyDate);

  // Alkohol doughnut chart
  const alcoholChartData = {
    labels: ["Alkohol drukket", "Ingen alkohol"],
    datasets: [
      {
        data: [alcoholCounts.yes, alcoholCounts.no],
        backgroundColor: ["#fbbf24", "#86efac"],
        borderWidth: 2,
      },
    ],
  };

  // --- RENDER ---
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
          {/* Stemnings-barometer */}
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

          {/* Bar chart */}
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

          {/* Line chart */}
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

          {/* --- NYE FELTER --- */}
          {/* BLOMSTER */}
          <div className="bg-white rounded-2xl shadow-lg p-4 mb-4 flex flex-col items-center">
            <h3 className="font-semibold mb-2 text-center">Blomster</h3>
            <div className="text-center text-md text-gray-700 mb-1">
              {daysSinceFlowers === null
                ? "Du har aldrig givet blomster endnu."
                : daysSinceFlowers === 0
                  ? "Du har givet blomster i dag."
                  : <>Det er i dag <b>{daysSinceFlowers}</b> dag{daysSinceFlowers === 1 ? "" : "e"} siden du har givet din partner blomster.</>
              }
            </div>
          </div>

          {/* GAVE */}
          <div className="bg-white rounded-2xl shadow-lg p-4 mb-4 flex flex-col items-center">
            <h3 className="font-semibold mb-2 text-center">Gaver</h3>
            <div className="text-center text-md text-gray-700 mb-1">
              {daysSinceGift === null
                ? "Du har aldrig givet en gave endnu."
                : daysSinceGift === 0
                  ? "Du har givet en gave i dag."
                  : <>Det er i dag <b>{daysSinceGift}</b> dag{daysSinceGift === 1 ? "" : "e"} siden du har givet din partner en gave.</>
              }
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Antal gaver (inkl. dates): <b>{giftTotal}</b>
            </div>
            <div className="text-sm text-gray-500">
              Total værdi (inkl. dates): <b>{giftSum} kr.</b>
            </div>
            {avgPricePerDay && (
              <div className="text-sm text-gray-500 mt-1">
                Det koster dig i gennemsnit <b>{avgPricePerDay} kr.</b> pr dag at have en kæreste (siden 11/7-2025).
              </div>
            )}
          </div>

          {/* ALKOHOL */}
          <div className="bg-white rounded-2xl shadow-lg p-4 mb-4 flex flex-col items-center">
            <h3 className="font-semibold mb-2 text-center">Alkohol</h3>
            <div className="w-52 mx-auto">
              <Doughnut
                data={alcoholChartData}
                options={{
                  plugins: { legend: { display: true, position: "bottom" as const } }
                }}
              />
            </div>
            <div className="mt-2 text-sm text-gray-500">
              {alcoholCounts.yes + alcoholCounts.no === 0
                ? "Ingen data endnu."
                : <>
                    Alkohol: <b>{alcoholCounts.yes}</b> gange &nbsp;|&nbsp;
                    Uden alkohol: <b>{alcoholCounts.no}</b> gange
                  </>
              }
            </div>
          </div>

          {/* ÆRLIGHEDSSNAK */}
          <div className="bg-white rounded-2xl shadow-lg p-4 mb-10 flex flex-col items-center">
            <h3 className="font-semibold mb-2 text-center">Ærlighedssnak</h3>
            <div className="text-md text-gray-700 mb-1">
              {honestyTalkCount === 0
                ? "Der er ikke registreret nogen ærlighedssnakke endnu."
                : <>Der har været <b>{honestyTalkCount}</b> ærlighedssnak{honestyTalkCount === 1 ? "" : "ke"}.</>
              }
            </div>
            <ul className="text-sm mt-2 w-full">
              {honestyTalks.map((t, i) =>
                <li key={i} className="border-b border-gray-100 py-1 px-2">
                  <span className="font-medium">{t.date}:</span> <span>{t.topic ? t.topic : <span className="italic text-gray-400">[ingen beskrivelse]</span>}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Cirkeldiagram for "jeg elsker dig" */}
          <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
            <h3 className="font-semibold mb-2 text-center">
              Hvem sagde “jeg elsker dig” (først/kun)?
            </h3>
            <div className="max-w-[340px] mx-auto">
              <Doughnut
                data={ilyData}
                options={{
                  plugins: {
                    legend: {
                      display: true,
                      position: "bottom" as const,
                      labels: { font: { size: 14 } }
                    }
                  }
                }}
              />
            </div>
            <ul className="mt-4 space-y-1 text-sm">
              <li className="flex justify-between">
                <span>{ilyWhoText.partner_first}:</span>
                <span className="font-bold">{ilyCounts.partner_first}</span>
              </li>
              <li className="flex justify-between">
                <span>{ilyWhoText.me_first}:</span>
                <span className="font-bold">{ilyCounts.me_first}</span>
              </li>
              <li className="flex justify-between">
                <span>{ilyWhoText.partner_only}:</span>
                <span className="font-bold">{ilyCounts.partner_only}</span>
              </li>
              <li className="flex justify-between">
                <span>{ilyWhoText.me_only}:</span>
                <span className="font-bold">{ilyCounts.me_only}</span>
              </li>
              <li className="flex justify-between">
                <span>{ilyWhoText[""]}:</span>
                <span className="font-bold">{ilyCounts.none}</span>
              </li>
            </ul>
            <div className="mt-4 text-center text-sm text-gray-600">
              {daysSinceMeFirst !== null &&
                <div>
                  {daysSinceMeFirst === 0
                    ? <>
                        Du (Mads) sagde det først i dag.<br />
                        {daysSincePartnerFirst === 0
                          ? "Stine sagde det først i dag."
                          : null}
                        {daysSinceAnyone !== null && daysSinceAnyone === 0
                          ? <><br />Det er i dag I sidst har sagt “jeg elsker dig”.</>
                          : null}
                      </>
                    : `Det er ${daysSinceMeFirst} dag${daysSinceMeFirst === 1 ? "" : "e"} siden du (Mads) sagde det først.`}
                </div>
              }
              {daysSinceMeFirst !== 0 && daysSincePartnerFirst !== null &&
                <div>
                  {daysSincePartnerFirst === 0
                    ? <>
                        Stine sagde det først i dag.<br />
                        {daysSinceAnyone !== null && daysSinceAnyone === 0
                          ? "Det er i dag I sidst har sagt “jeg elsker dig”."
                          : null}
                      </>
                    : `Det er ${daysSincePartnerFirst} dag${daysSincePartnerFirst === 1 ? "" : "e"} siden Stine sagde det først.`}
                </div>
              }
              {daysSinceAnyone !== null && daysSinceAnyone > 0 && (
                <div>
                  Det er {daysSinceAnyone} dag{daysSinceAnyone === 1 ? "" : "e"} siden I sidst har sagt “jeg elsker dig”.
                </div>
              )}
              {daysSinceMeFirst === null && daysSincePartnerFirst === null && (
                <div>Ingen har nogensinde sagt det (endnu).</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
