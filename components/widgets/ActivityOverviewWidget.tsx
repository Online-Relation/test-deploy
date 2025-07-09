// /components/widgets/ActivityOverviewWidget.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { supabase } from '@/lib/supabaseClient';
import { useUserContext } from '@/context/UserContext';

Chart.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const PERIODS = [
  { label: '14 dage', days: 14 },
  { label: '1 måned', days: 30 },
  { label: '3 måneder', days: 90 },
];

const TASK_TYPES = [
  {
    key: 'bucketlist',
    label: 'Bucketlist',
    table: 'bucketlist_subgoals',
    userField: 'completed_by', // eller 'owner', hvis det er forskelligt hos dig
    dateField: 'completed_at',
  },
  {
    key: 'fantasy',
    label: 'Fantasier',
    table: 'fantasies',
    userField: 'completed_by',
    dateField: 'completed_at',
  },
  {
    key: 'sex_positions',
    label: 'Sexstillinger',
    table: 'positions_tried',
    userField: 'user_id',
    dateField: 'created_at',
  },
  {
    key: 'date_days',
    label: 'Date Days',
    table: 'date_days',
    userField: 'user_id',
    dateField: 'completed_at',
  },
  // Tilføj nemt flere her!
];

export default function ActivityOverviewWidget({ widget }) {
  const { user, partner } = useUserContext();
  const [selectedPeriod, setSelectedPeriod] = useState(PERIODS[0].days);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !partner) return;
    fetchData();
    // eslint-disable-next-line
  }, [selectedPeriod, user, partner]);

  async function fetchData() {
    setLoading(true);

    // Set dato for periode start
    const now = new Date();
    const periodStart = new Date(now);
    periodStart.setDate(now.getDate() - selectedPeriod);

    // Her samler vi alle queries til hver opgavetype
    const result: any = {};
    await Promise.all(
      TASK_TYPES.map(async (type) => {
        // Hent for både user og partner
        const userIds = [
          { label: user.first_name || 'Mig', id: user.id },
          { label: partner.first_name || 'Partner', id: partner.id },
        ];
        result[type.key] = {};

        await Promise.all(
          userIds.map(async ({ label, id }) => {
            const { count, error } = await supabase
              .from(type.table)
              .select(type.userField, { count: 'exact', head: true })
              .gte(type.dateField, periodStart.toISOString())
              .eq(type.userField, id);

            result[type.key][label] = count || 0;
          })
        );
      })
    );
    setData(result);
    setLoading(false);
  }

  // Klargør labels og data til graf
  const chartData = React.useMemo(() => {
    if (!data || !user || !partner) return null;

    const labels = TASK_TYPES.map((t) => t.label);
    const userLabel = user.first_name || 'Mig';
    const partnerLabel = partner.first_name || 'Partner';

    return {
      labels,
      datasets: [
        {
          label: userLabel,
          data: TASK_TYPES.map((t) => data[t.key]?.[userLabel] ?? 0),
          backgroundColor: 'rgba(59,130,246,0.8)', // Blå
        },
        {
          label: partnerLabel,
          data: TASK_TYPES.map((t) => data[t.key]?.[partnerLabel] ?? 0),
          backgroundColor: 'rgba(251,191,36,0.8)', // Gul
        },
      ],
    };
  }, [data, user, partner]);

  return (
    <div className="p-4 rounded-2xl shadow bg-white flex flex-col gap-4 min-h-[320px]">
      <div className="flex gap-2 mb-2">
        {PERIODS.map((p) => (
          <button
            key={p.days}
            className={`px-3 py-1 rounded-full border ${selectedPeriod === p.days ? 'bg-blue-500 text-white' : 'bg-white text-gray-800'}`}
            onClick={() => setSelectedPeriod(p.days)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <h2 className="text-lg font-bold">Handlinger fuldført ({PERIODS.find(p => p.days === selectedPeriod)?.label})</h2>
      {loading ? (
        <div className="text-center text-gray-500">Indlæser...</div>
      ) : chartData ? (
        <Bar
          data={chartData}
          options={{
            responsive: true,
            plugins: { legend: { position: 'top' } },
            scales: {
              y: { beginAtZero: true, ticks: { precision:0 } },
            },
          }}
        />
      ) : (
        <div className="text-gray-500">Ingen data fundet.</div>
      )}
    </div>
  );
}
