// /app/data/sex/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, TimeScale);

const sexTypeLabels = [
  { key: 'hverdag', label: 'Hverdag' },
  { key: 'passioneret', label: 'Passioneret' },
  { key: 'vild', label: 'Vild' },
  { key: 'grænseoverskridende', label: 'Grænseoverskridende' },
];

export default function SexDataPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [positions, setPositions] = useState<{ id: string; name: string }[]>([]);
  const [logPositions, setLogPositions] = useState<{ log_id: string; position_id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFantasy, setLastFantasy] = useState<{ title: string; fulfilled_date: string } | null>(null);
  const [daysSince, setDaysSince] = useState<number | null>(null);
  const [oralsexStats, setOralsexStats] = useState<{
    months: string[],
    madsCounts: number[],
    stineCounts: number[],
    madsYear: number,
    stineYear: number,
  }>({ months: [], madsCounts: [], stineCounts: [], madsYear: 0, stineYear: 0 });
  const [sexTypeMonthlyStats, setSexTypeMonthlyStats] = useState<{
    months: string[],
    vaginalCounts: number[],
    analCounts: number[],
  }>({ months: [], vaginalCounts: [], analCounts: [] });
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [logLocations, setLogLocations] = useState<{ log_id: string; location_id: string }[]>([]);

  // Hent data
  useEffect(() => {
    async function load() {
      setLoading(true);

      // Sex logs (husk de nye felter)
      const { data: sexLogs } = await supabase
        .from('sexlife_logs')
        .select('id, log_date, initiator, sex_type, tried_something_new, tried_something_new_text')
        .order('log_date', { ascending: true });
      setLogs(sexLogs || []);

      // Positions
      const { data: sexPositions } = await supabase
        .from('sex_positions')
        .select('id, name')
        .order('name');
      setPositions(sexPositions || []);

      // Log positions
      const { data: logPos } = await supabase
        .from('sexlife_log_positions')
        .select('log_id, position_id');
      setLogPositions(logPos || []);

      // Locations
      const { data: locationsData } = await supabase
        .from('sex_locations')
        .select('id, name')
        .order('name');
      setLocations(locationsData || []);

      // Log locations
      const { data: logLocationsData } = await supabase
        .from('sexlife_log_locations')
        .select('log_id, location_id');
      setLogLocations(logLocationsData || []);

      setLoading(false);
    }
    load();
  }, []);

  // Find antal dage siden sidste sex
const lastLog = logs.length > 0
  ? logs[logs.length - 1]
  : null;

const daysSinceSex = lastLog
  ? Math.floor((Date.now() - new Date(lastLog.log_date).getTime()) / (1000 * 60 * 60 * 24))
  : null;

// Vælg farve og tekst
let tempBg = "bg-green-200 dark:bg-green-800";
let tempText = "🔥 Hot! I har haft sex for nylig";
let tempEmoji = "🔥";

if (daysSinceSex !== null) {
  if (daysSinceSex < 4) {
    tempBg = "bg-green-200 dark:bg-green-800";
    tempText = "🔥 Hot! I har haft sex for nylig";
    tempEmoji = "🔥";
  } else if (daysSinceSex < 10) {
    tempBg = "bg-yellow-200 dark:bg-yellow-800";
    tempText = "😏 Lidt tid siden – måske snart igen?";
    tempEmoji = "😏";
  } else {
    tempBg = "bg-red-200 dark:bg-red-800";
    tempText = "🥶 Det er ved at være længe siden!";
    tempEmoji = "🥶";
  }
} else {
  tempBg = "bg-gray-200 dark:bg-gray-800";
  tempText = "Ingen sexlogs endnu";
  tempEmoji = "❔";
}


  // Statistik: antal pr. måned
  const logsByMonth = logs.reduce((acc, log) => {
    const [year, month] = log.log_date.split('-');
    const key = `${year}-${month}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const months = Object.keys(logsByMonth).sort();
  const sexCounts = months.map(m => logsByMonth[m]);

  // Statistik: sex-type (doughnut)
  const sexTypeStats: Record<string, number> = {};
  logs.forEach(log => {
    sexTypeStats[log.sex_type] = (sexTypeStats[log.sex_type] || 0) + 1;
  });
  const sexTypeData = sexTypeLabels.map(label => sexTypeStats[label.key] || 0);

  // Statistik: stillinger - senest brugt
  const usedPositions = new Set(logPositions.map(lp => lp.position_id));
  const neverUsedPositions = positions.filter(p => !usedPositions.has(p.id));
  const positionLastUsed: Record<string, string | null> = {};
  logPositions.forEach(lp => {
    const log = logs.find(l => l.id === lp.log_id);
    if (log) {
      if (
        !positionLastUsed[lp.position_id] ||
        log.log_date > (positionLastUsed[lp.position_id] || '')
      ) {
        positionLastUsed[lp.position_id] = log.log_date;
      }
    }
  });

  const allPositions = positions
    .map(p => ({
      ...p,
      lastUsed: positionLastUsed[p.id] || null
    }))
    .sort((a, b) => {
      if (!a.lastUsed && b.lastUsed) return -1;
      if (a.lastUsed && !b.lastUsed) return 1;
      if (!a.lastUsed && !b.lastUsed) return a.name.localeCompare(b.name);
      return (a.lastUsed as string).localeCompare(b.lastUsed as string);
    });

  // Sidste fantasi (fuldført)
  useEffect(() => {
    async function fetchLastFantasy() {
      const { data } = await supabase
        .from('fantasies')
        .select('*')
        .order('created_date', { ascending: false })
        .limit(20);

      const fulfilled = (data ?? []).filter(f => {
        const statusStr = String(f.status).trim().toLowerCase();
        const isFulfilled = statusStr === 'fulfilled';
        const validDate = !!f.created_date && !isNaN(new Date(f.created_date).getTime());
        return isFulfilled && validDate;
      });

      if (fulfilled.length > 0) {
        setLastFantasy({ title: fulfilled[0].title, fulfilled_date: fulfilled[0].created_date });
        const days = Math.floor(
          (Date.now() - new Date(fulfilled[0].created_date).getTime()) / (1000 * 60 * 60 * 24)
        );
        setDaysSince(days);
      } else {
        setLastFantasy(null);
        setDaysSince(null);
      }
    }
    fetchLastFantasy();
  }, []);

  // Oralsex statistik
useEffect(() => {
  async function fetchOralSexStats() {
    // 1. Find id'erne på de to tags
    const { data: tagsData } = await supabase
      .from('sex_tags')
      .select('id, name');
    const oralTags = (tagsData ?? []).filter(t =>
      t.name.trim().toLowerCase() === 'oralsex til mads' ||
      t.name.trim().toLowerCase() === 'oralsex til stine'
    );
    if (oralTags.length === 0) return;

    // 2. Find alle sex-logs for året
    const thisYear = new Date().getFullYear();
    const yearStart = `${thisYear}-01-01`;
    const { data: sexLogs } = await supabase
      .from('sexlife_logs')
      .select('id, log_date, initiator');
    // 3. Find alle log-tag-relations
    const { data: logTags } = await supabase
      .from('sexlife_log_tags')
      .select('log_id, tag_id');

    // 4. Find logs for hver tag
    const oralLogsToStine = (logTags ?? [])
      .filter(t => {
        const tag = oralTags.find(x => x.id === t.tag_id);
        return tag && tag.name.trim().toLowerCase() === 'oralsex til stine';
      })
      .map(t => t.log_id);

    const oralLogsToMads = (logTags ?? [])
      .filter(t => {
        const tag = oralTags.find(x => x.id === t.tag_id);
        return tag && tag.name.trim().toLowerCase() === 'oralsex til mads';
      })
      .map(t => t.log_id);

    // 5. Saml statistik pr. måned og år
    const stats: Record<string, { mads: number; stine: number }> = {};
    let madsYear = 0, stineYear = 0;
    sexLogs?.forEach(log => {
      const monthKey = log.log_date.slice(0, 7); // YYYY-MM
      // Til Mads
      if (oralLogsToMads.includes(log.id)) {
        stats[monthKey] = stats[monthKey] || { mads: 0, stine: 0 };
        stats[monthKey].mads += 1;
        if (log.log_date >= yearStart) madsYear += 1;
      }
      // Til Stine
      if (oralLogsToStine.includes(log.id)) {
        stats[monthKey] = stats[monthKey] || { mads: 0, stine: 0 };
        stats[monthKey].stine += 1;
        if (log.log_date >= yearStart) stineYear += 1;
      }
    });

    const sortedMonths = Object.keys(stats).sort().slice(-3);
    setOralsexStats({
      months: sortedMonths,
      madsCounts: sortedMonths.map(m => stats[m].mads),
      stineCounts: sortedMonths.map(m => stats[m].stine),
      madsYear,
      stineYear
    });
  }
  fetchOralSexStats();
}, []);


  // Almindelig/anal statistik
  useEffect(() => {
    async function fetchSexTypeMonthlyStats() {
      const { data: placesData } = await supabase
        .from('sex_places')
        .select('id, name');

      const vaginalPlace = placesData?.find(
        t => t.name.trim().toLowerCase() === 'almindelig'
      );
      const analPlace = placesData?.find(
        t => t.name.trim().toLowerCase() === 'anal'
      );
      if (!vaginalPlace && !analPlace) return;

      const { data: sexLogs } = await supabase
        .from('sexlife_logs')
        .select('id, log_date');
      const { data: logPlaces } = await supabase
        .from('sexlife_log_places')
        .select('log_id, place_id');
      const stats: Record<string, { vaginal: number; anal: number }> = {};
      sexLogs?.forEach(log => {
        const monthKey = log.log_date.slice(0, 7);
        const hasVaginal = logPlaces?.some(
          p => p.log_id === log.id && p.place_id === vaginalPlace?.id
        );
        const hasAnal = logPlaces?.some(
          p => p.log_id === log.id && p.place_id === analPlace?.id
        );
        stats[monthKey] = stats[monthKey] || { vaginal: 0, anal: 0 };
        if (hasVaginal) stats[monthKey].vaginal += 1;
        if (hasAnal) stats[monthKey].anal += 1;
      });
      const sortedMonths = Object.keys(stats).sort();
      setSexTypeMonthlyStats({
        months: sortedMonths,
        vaginalCounts: sortedMonths.map(m => stats[m].vaginal),
        analCounts: sortedMonths.map(m => stats[m].anal),
      });
    }
    fetchSexTypeMonthlyStats();
  }, []);

  // Placering tæller
  const locationCounts: Record<string, number> = {};
  logLocations.forEach(l => {
    locationCounts[l.location_id] = (locationCounts[l.location_id] || 0) + 1;
  });

  // Prøvede noget nyt – find nyeste
  const triedNewLogs = logs
    .filter(l => l.tried_something_new)
    .sort((a, b) => (b.log_date > a.log_date ? 1 : -1));
  const lastTriedNew = triedNewLogs[0];

  // Procentdel for analsex
  const totalSexActs = sexTypeMonthlyStats.vaginalCounts.reduce((a, b) => a + b, 0)
    + sexTypeMonthlyStats.analCounts.reduce((a, b) => a + b, 0);
  const totalAnalActs = sexTypeMonthlyStats.analCounts.reduce((a, b) => a + b, 0);
  const analPct = totalSexActs > 0 ? Math.round((totalAnalActs / totalSexActs) * 100) : 0;

  let fantasyBg = "bg-green-200 dark:bg-green-800";
let fantasyText = "I har for nylig opfyldt en fantasi!";
let fantasyEmoji = "✨";

if (daysSince !== null) {
  if (daysSince < 14) {
    fantasyBg = "bg-green-200 dark:bg-green-800";
    fantasyText = "Fantasi opfyldt for nylig!";
    fantasyEmoji = "✨";
  } else if (daysSince < 30) {
    fantasyBg = "bg-yellow-200 dark:bg-yellow-800";
    fantasyText = "Det er ved at være et stykke tid siden I opfyldte en fantasi";
    fantasyEmoji = "⏳";
  } else {
    fantasyBg = "bg-red-200 dark:bg-red-800";
    fantasyText = "Tid til at opfylde en fantasi igen?";
    fantasyEmoji = "💭";
  }
} else {
  fantasyBg = "bg-gray-200 dark:bg-gray-800";
  fantasyText = "Ingen fantasi er opfyldt endnu";
  fantasyEmoji = "❔";
}


  return (
    
    <div className="max-w-4xl mx-auto mt-8 p-2">
      <div className={`rounded-2xl shadow-lg ${tempBg} p-6 mb-6 flex flex-col items-center`}>
  <div className="text-4xl mb-2">{tempEmoji}</div>
  <div className="text-lg font-bold mb-1">{tempText}</div>
  {daysSinceSex !== null &&
    <div className="text-xs text-gray-700 dark:text-gray-200">Det er <b>{daysSinceSex}</b> dage siden sidste sex.</div>
  }
</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sex pr. måned */}
        <div className="rounded-2xl shadow-lg bg-white dark:bg-gray-900 p-6 flex flex-col items-center">
          <h2 className="text-lg font-bold mb-2 text-center">Antal sex pr. måned</h2>
          <Bar
            data={{
              labels: months,
              datasets: [
                {
                  label: 'Antal',
                  data: sexCounts,
                  borderRadius: 8,
                  backgroundColor: 'rgba(99, 102, 241, 0.5)',
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
              },
              scales: {
                x: { title: { display: false } },
                y: { beginAtZero: true, title: { display: false }, ticks: { stepSize: 1 } },
              },
            }}
          />
        </div>
        {/* Fordeling sex-type */}
        <div className="rounded-2xl shadow-lg bg-white dark:bg-gray-900 p-6 flex flex-col items-center">
          <h2 className="text-lg font-bold mb-2 text-center">Fordeling af type</h2>
          <Doughnut
            data={{
              labels: sexTypeLabels.map(l => l.label),
              datasets: [
                {
                  data: sexTypeData,
                  borderWidth: 1,
                  backgroundColor: [
                    'rgba(99, 102, 241, 0.7)',
                    'rgba(16, 185, 129, 0.7)',
                    'rgba(236, 72, 153, 0.7)',
                    'rgba(234, 179, 8, 0.7)',
                  ],
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'bottom' },
              },
            }}
          />
        </div>
      </div>
      {/* Sidste opfyldte fantasi */}
      <div className={`rounded-2xl shadow-lg ${fantasyBg} p-6 mt-8 flex flex-col items-center transition-colors`}>
  <div className="text-3xl mb-2">{fantasyEmoji}</div>
  <h2 className="text-lg font-bold mb-2 text-center">Sidste fantasi</h2>
  <div className="text-base font-semibold text-center mb-1">{fantasyText}</div>
  {lastFantasy ? (
    <p className="text-center">
      <b>{lastFantasy.title}</b> blev opfyldt for <b>{daysSince}</b> dage siden.
    </p>
  ) : (
    <p className="text-center text-gray-500 italic">Ingen fantasi er opfyldt endnu.</p>
  )}
</div>

      {/* Tendenser måned for måned */}
      <div className="rounded-2xl shadow-lg bg-white dark:bg-gray-900 p-6 mt-8 flex flex-col items-center">
        <h2 className="text-lg font-bold mb-2 text-center">Tendens måned for måned</h2>
        <Line
          data={{
            labels: months,
            datasets: [
              {
                label: 'Udvikling',
                data: sexCounts,
                borderColor: 'rgba(99, 102, 241, 1)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                fill: true,
                tension: 0.3,
                pointRadius: 5,
                pointBackgroundColor: 'rgba(99, 102, 241, 1)',
              },
            ],
          }}
          options={{
            responsive: true,
            plugins: {
              legend: { display: false },
            },
            scales: {
              x: { title: { display: false } },
              y: { beginAtZero: true, title: { display: false }, ticks: { stepSize: 1 } },
            },
          }}
        />
        <p className="text-xs text-gray-500 mt-2 text-center">
          Se om trenden går op eller ned, og om der er store udsving fra måned til måned.
        </p>
      </div>
      {/* Oralsex graf */}
      <div className="rounded-2xl shadow-lg bg-white dark:bg-gray-900 p-6 mt-8 flex flex-col items-center">
        <h2 className="text-lg font-bold mb-2 text-center">Oralsex de sidste 3 måneder</h2>
        <Bar
          data={{
            labels: oralsexStats.months,
            datasets: [
              {
                label: 'Mads har fået',
                data: oralsexStats.madsCounts,
                backgroundColor: 'rgba(99, 102, 241, 0.6)',
              },
              {
                label: 'Stine har fået',
                data: oralsexStats.stineCounts,
                backgroundColor: 'rgba(236, 72, 153, 0.6)',
              },
            ],
          }}
          options={{
            responsive: true,
            plugins: {
              legend: { position: 'bottom' },
            },
            scales: {
              x: { title: { display: false } },
              y: { beginAtZero: true, title: { display: false }, ticks: { stepSize: 1 } },
            },
          }}
        />
      </div>
      {/* Oralsex i år */}
      <div className="flex flex-col md:flex-row gap-4 justify-center items-center mt-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 flex-1 text-center">
          <h3 className="font-bold mb-1">Mads har fået</h3>
          <div className="text-3xl font-bold text-indigo-700">{oralsexStats.madsYear}</div>
          <div className="text-sm text-gray-500 mt-1">oralsex i år</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 flex-1 text-center">
          <h3 className="font-bold mb-1">Stine har fået</h3>
          <div className="text-3xl font-bold text-pink-600">{oralsexStats.stineYear}</div>
          <div className="text-sm text-gray-500 mt-1">oralsex i år</div>
        </div>
      </div>
      {/* Almindelig vs. anal sex graf */}
      <div className="rounded-2xl shadow-lg bg-white dark:bg-gray-900 p-6 mt-8 flex flex-col items-center">
        <h2 className="text-lg font-bold mb-2 text-center">Almindelig sex vs. anal sex (pr. måned)</h2>
        <Bar
          data={{
            labels: sexTypeMonthlyStats.months,
            datasets: [
              {
                label: 'Almindelig sex',
                data: sexTypeMonthlyStats.vaginalCounts,
                backgroundColor: 'rgba(59, 130, 246, 0.7)',
              },
              {
                label: 'Anal sex',
                data: sexTypeMonthlyStats.analCounts,
                backgroundColor: 'rgba(239, 68, 68, 0.7)',
              },
            ],
          }}
          options={{
            responsive: true,
            plugins: { legend: { position: 'bottom' } },
            scales: {
              x: { title: { display: false } },
              y: { beginAtZero: true, title: { display: false }, ticks: { stepSize: 1 } },
            },
          }}
        />
        <p className="text-xs text-gray-500 mt-2 text-center">
          Se forskellen på hvor ofte I har haft almindelig sex og anal sex pr. måned.
        </p>
        <p className="text-lg text-gray-700 dark:text-gray-200 mt-2 text-center font-semibold">
          {analPct}% af jeres sexliv har I analsex
        </p>
      </div>
      {/* 3 kasser med statistik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {/* Kasse 1: Placeringer */}
        <div className="rounded-2xl shadow-lg bg-white dark:bg-gray-900 p-6 flex flex-col items-center">
          <h2 className="text-lg font-bold mb-2 text-center">Placeringer</h2>
          <ul className="w-full">
            {[...locations]
              .map(loc => ({
                ...loc,
                count: locationCounts[loc.id] || 0
              }))
              .sort((a, b) => b.count - a.count)
              .map(loc => (
                <li key={loc.id} className="flex justify-between items-center border-b py-1">
                  <span>{loc.name}</span>
                  <span className="font-bold">{loc.count}</span>
                </li>
              ))}
          </ul>
        </div>

        {/* Kasse 2: Stillinger */}
        <div className="rounded-2xl shadow-lg bg-white dark:bg-gray-900 p-6 flex flex-col items-center">
        <h2 className="text-lg font-bold mb-2 text-center">Stillinger</h2>
        <ul className="w-full">
            {[...positions]
            .map(pos => ({
                ...pos,
                count: logPositions.filter(l => l.position_id === pos.id).length
            }))
            .sort((a, b) => b.count - a.count)
            .map(pos => (
                <li key={pos.id} className="flex justify-between items-center border-b py-1">
                <span>{pos.name}</span>
                <span className="font-bold">{pos.count}</span>
                </li>
            ))}
        </ul>
        </div>

        {/* Kasse 3: Prøvede noget nyt */}
        <div className="rounded-2xl shadow-lg bg-white dark:bg-gray-900 p-6 flex flex-col items-center">
          <h2 className="text-lg font-bold mb-2 text-center">Prøvede noget nyt</h2>
          {lastTriedNew ? (
            <>
              <div className="mb-1">
                Sidst: <b>{new Date(lastTriedNew.log_date).toLocaleDateString("da-DK")}</b>
              </div>
              {lastTriedNew.tried_something_new_text && (
                <div className="italic text-center text-gray-600 mt-2">
                  “{lastTriedNew.tried_something_new_text}”
                </div>
              )}
            </>
          ) : (
            <div className="italic text-gray-400 text-center">I har endnu ikke prøvet noget nyt</div>
          )}
        </div>
      </div>
    </div>
  );
}
