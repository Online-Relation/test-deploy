// components/hverdag/HverdagExtras.tsx

"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

function daysSince(dateStr?: string | null) {
  if (!dateStr) return null;
  const then = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

export default function HverdagExtras() {
  const [lastGiftDate, setLastGiftDate] = useState<string | null>(null);
  const [lastFlowersDate, setLastFlowersDate] = useState<string | null>(null);
  const [giftTotal, setGiftTotal] = useState<number>(0);
  const [giftCount, setGiftCount] = useState<number>(0);
  const [giftsList, setGiftsList] = useState<{ giftWhat: string; giftCost: string; date: string }[]>([]);
  const [alcoholCounts, setAlcoholCounts] = useState<{ ja: number; nej: number }>({ ja: 0, nej: 0 });
  const [honestyList, setHonestyList] = useState<{ topic: string; date: string }[]>([]);
  const [honestyCounts, setHonestyCounts] = useState<{ ja: number; nej: number }>({ ja: 0, nej: 0 });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setErrorMsg(null);

      const { data, error } = await supabase
        .from("daily_checkin")
        .select("checkin_date, gift, gifts, flowers, alcohol, honesty_talk, honesty_topic");

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      let lastGift: string | null = null;
      let lastFlowers: string | null = null;
      let total = 0;
      let count = 0;
      let giftsArr: { giftWhat: string; giftCost: string; date: string }[] = [];
      let alcohol = { ja: 0, nej: 0 };
      let honesty: { topic: string; date: string }[] = [];
      let honestySummary = { ja: 0, nej: 0 };

      if (data && Array.isArray(data)) {
        data.forEach((row: any) => {
          // Blomster
          if (row.flowers === true || row.flowers === "ja") {
            if (!lastFlowers || new Date(row.checkin_date) > new Date(lastFlowers)) {
              lastFlowers = row.checkin_date;
            }
          }
          // Gaver
          if (row.gift === true || row.gift === "ja") {
            if (!lastGift || new Date(row.checkin_date) > new Date(lastGift)) {
              lastGift = row.checkin_date;
            }
            if (row.gifts && Array.isArray(row.gifts)) {
              row.gifts.forEach((g: any) => {
                giftsArr.push({
                  giftWhat: g.giftWhat || "",
                  giftCost: g.giftCost || "",
                  date: row.checkin_date
                });
                count++;
                // Summer gavepris (kun hvis tal!)
                const parsed = parseFloat((g.giftCost || "").replace(",", "."));
                if (!isNaN(parsed)) total += parsed;
              });
            }
          }
          // Alkohol
          if (row.alcohol === true || row.alcohol === "ja") alcohol.ja++;
          else alcohol.nej++;
          // Ærlighedssnak
          if (row.honesty_talk === true || row.honesty_talk === "ja") {
            honesty.push({
              topic: row.honesty_topic || "",
              date: row.checkin_date
            });
            honestySummary.ja++;
          } else {
            honestySummary.nej++;
          }
        });
      }

      setLastGiftDate(lastGift);
      setLastFlowersDate(lastFlowers);
      setGiftTotal(total);
      setGiftCount(count);
      setGiftsList(giftsArr);
      setAlcoholCounts(alcohol);
      setHonestyList(honesty);
      setHonestyCounts(honestySummary);
      setLoading(false);
    }

    fetchData();
  }, []);

  const daysSinceGift = daysSince(lastGiftDate);
  const daysSinceFlowers = daysSince(lastFlowersDate);

  const alcoholChart = {
    labels: ["Drak alkohol", "Drak ikke alkohol"],
    datasets: [
      {
        data: [alcoholCounts.ja, alcoholCounts.nej],
        backgroundColor: ["#fbbf24", "#d1d5db"],
        borderWidth: 2,
      },
    ],
  };

  const honestyChart = {
    labels: ["Ærlighedssnak", "Ingen ærlighedssnak"],
    datasets: [
      {
        data: [honestyCounts.ja, honestyCounts.nej],
        backgroundColor: ["#3b82f6", "#d1d5db"],
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="max-w-md mx-auto py-4 px-2">
      <h3 className="font-semibold mb-4 text-lg text-center">Ekstra statistik – Hverdag</h3>
      {loading ? (
        <div className="text-center text-gray-400">Henter data…</div>
      ) : errorMsg ? (
        <div className="text-center text-red-500">{errorMsg}</div>
      ) : (
        <>
          {/* Gave */}
          <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
            <div className="text-sm mb-1">
              <span className="font-medium">Gaver:</span><br />
              {daysSinceGift !== null
                ? <>Det er <b>{daysSinceGift}</b> dag{daysSinceGift === 1 ? "" : "e"} siden du har givet en gave.</>
                : <>Du har ikke givet nogen gaver endnu.</>
              }
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span>Total antal gaver:</span>
              <span className="font-semibold">{giftCount}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span>Samlet gavepris (kr.):</span>
              <span className="font-semibold">{giftTotal.toFixed(2)}</span>
            </div>
            {giftsList.length > 0 && (
              <div className="mt-2">
                <div className="font-medium mb-1">Seneste gaver:</div>
                <ul className="list-disc pl-4 text-xs">
                  {giftsList.slice(-3).reverse().map((g, idx) => (
                    <li key={idx}>
                      <span className="italic">{g.giftWhat}</span>
                      {g.giftCost && <> – {g.giftCost} kr.</>}
                      <span className="text-gray-400 ml-1">({g.date})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {/* Blomster */}
          <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
            <span className="font-medium">Blomster:</span><br />
            {daysSinceFlowers !== null
              ? <>Det er <b>{daysSinceFlowers}</b> dag{daysSinceFlowers === 1 ? "" : "e"} siden du har givet blomster.</>
              : <>Du har ikke givet blomster endnu.</>
            }
          </div>
          {/* Alkohol */}
          <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
            <span className="font-medium">Alkohol:</span>
            <Doughnut data={alcoholChart} />
            <div className="flex justify-between text-sm mt-2">
              <span>Med alkohol:</span>
              <span>{alcoholCounts.ja}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Uden alkohol:</span>
              <span>{alcoholCounts.nej}</span>
            </div>
          </div>
          {/* Ærlighedssnak */}
          <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
            <span className="font-medium">Ærlighedssnak:</span>
            <Doughnut data={honestyChart} />
            <div className="flex justify-between text-sm mt-2">
              <span>Med ærlighedssnak:</span>
              <span>{honestyCounts.ja}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Uden ærlighedssnak:</span>
              <span>{honestyCounts.nej}</span>
            </div>
            {honestyList.length > 0 && (
              <div className="mt-2">
                <div className="font-medium mb-1">Seneste emner:</div>
                <ul className="list-disc pl-4 text-xs">
                  {honestyList.slice(-5).reverse().map((h, idx) => (
                    <li key={idx}>
                      <span className="italic">{h.topic}</span>
                      <span className="text-gray-400 ml-1">({h.date})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
