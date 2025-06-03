// src/app/fantasy/stats/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ArcElement,
} from 'chart.js';
import { supabase } from '@/lib/supabaseClient';

ChartJS.register(
  LineElement,
  BarElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ArcElement
);

interface XpLogEntry {
  change: number;
  timestamp: string;
  reason: string;
}

interface Fantasy {
  id: string;
  title: string;
  category?: string;
  effort?: 'Low' | 'Medium' | 'High';
  status: 'idea' | 'planned' | 'fulfilled';
}

export default function FantasyStatsPage() {
  const [xpLog, setXpLog] = useState<XpLogEntry[]>([]);
  const [fantasies, setFantasies] = useState<Fantasy[]>([]);

  useEffect(() => {
    const fetchXpLogs = async () => {
      const { data, error } = await supabase
        .from('xp_log')
        .select('*')
        .eq('reason', 'Fantasi opfyldt')
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Fejl ved hentning af XP-log:', error.message);
      } else {
        setXpLog(data);
      }
    };

    fetchXpLogs();
  }, []);

  useEffect(() => {
    const fetchFantasies = async () => {
      const { data, error } = await supabase
        .from('fantasies')
        .select('id, title, category, effort, status');

      if (error) {
        console.error('Fejl ved hentning af fantasier:', error.message);
      } else {
        setFantasies(data || []);
      }
    };

    fetchFantasies();
  }, []);

  const xpOverTime = xpLog.reduce<{ x: Date; y: number }[]>((acc, entry) => {
    const previous = acc.length > 0 ? acc[acc.length - 1].y : 0;
    acc.push({ x: new Date(entry.timestamp), y: previous + entry.change });
    return acc;
  }, []);

  const xpChartData = {
    datasets: [
      {
        label: 'XP fra fantasier',
        data: xpOverTime,
        fill: false,
        borderColor: '#8b5cf6',
        tension: 0.1,
      },
    ],
  };

  const xpChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'XP udvikling (kun fantasier)',
        font: { size: 16 },
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'day' as const,
        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 10,
        },
      },
      y: {
        beginAtZero: true,
      },
    },
  };

  const xpChangeByReason = xpLog.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.reason] = (acc[entry.reason] || 0) + entry.change;
    return acc;
  }, {});

  const barChartData = {
    labels: Object.keys(xpChangeByReason),
    datasets: [
      {
        label: 'XP per kategori',
        data: Object.values(xpChangeByReason),
        backgroundColor: '#34d399',
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'XP fordelt på kategorier',
        font: { size: 16 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const fulfilledFantasies = fantasies.filter((f) => f.status === 'fulfilled');

  const effortCounts = {
    Low: fulfilledFantasies.filter((f) => f.effort === 'Low').length,
    Medium: fulfilledFantasies.filter((f) => f.effort === 'Medium').length,
    High: fulfilledFantasies.filter((f) => f.effort === 'High').length,
  };

  const categoryCounts = fulfilledFantasies.reduce<Record<string, number>>((acc, curr) => {
    if (curr.category) {
      acc[curr.category] = (acc[curr.category] || 0) + 1;
    }
    return acc;
  }, {});

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">📈 XP Statistik – Fantasier</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <Line data={xpChartData} options={xpChartOptions} />
        </div>

        <div className="bg-white p-4 rounded shadow">
          <Bar data={barChartData} options={barChartOptions} />
        </div>

        <div className="bg-white p-4 rounded shadow">
          <Doughnut
            data={{
              labels: ['Low', 'Medium', 'High'],
              datasets: [
                {
                  data: [effortCounts.Low, effortCounts.Medium, effortCounts.High],
                  backgroundColor: ['#34d399', '#fbbf24', '#f87171'],
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                title: {
                  display: true,
                  text: 'Effort level (doughnut)',
                  font: { size: 16 },
                },
              },
            }}
          />
        </div>

        <div className="bg-white p-4 rounded shadow">
          <Pie
            data={{
              labels: Object.keys(categoryCounts),
              datasets: [
                {
                  data: Object.values(categoryCounts),
                  backgroundColor: [
                    '#93c5fd',
                    '#fca5a5',
                    '#fcd34d',
                    '#6ee7b7',
                    '#a5b4fc',
                    '#fdba74',
                  ],
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                title: {
                  display: true,
                  text: 'Fordeling efter kategori (pie)',
                  font: { size: 16 },
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
