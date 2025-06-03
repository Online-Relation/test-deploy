'use client';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { useEffect, useState } from 'react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function DashboardPage() {
  const [fantasyStats, setFantasyStats] = useState({ idea: 0, planned: 0, fulfilled: 0 });
  const [dateStats, setDateStats] = useState({ new: 0, next: 0, memory: 0 });

  useEffect(() => {
    // Fantasier
    const storedFantasies = localStorage.getItem('fantasies');
    if (storedFantasies) {
      try {
        const parsed = JSON.parse(storedFantasies);
        const counts = { idea: 0, planned: 0, fulfilled: 0 };
        parsed.forEach((f: any) => {
          if (counts.hasOwnProperty(f.status)) {
            counts[f.status as keyof typeof counts]++;
          }
        });
        setFantasyStats(counts);
      } catch (err) {
        console.error('Fejl ved hentning af fantasier:', err);
      }
    }

    // Date Ideas
    const storedDates = localStorage.getItem('dateIdeas');
    if (storedDates) {
      try {
        const parsed = JSON.parse(storedDates);
        const counts = { new: 0, next: 0, memory: 0 };
        parsed.forEach((d: any) => {
          if (counts.hasOwnProperty(d.status)) {
            counts[d.status as keyof typeof counts]++;
          }
        });
        setDateStats(counts);
      } catch (err) {
        console.error('Fejl ved hentning af date ideas:', err);
      }
    }
  }, []);

  const data = {
    labels: ['Fantasier', 'Planlagt', 'Opfyldt', 'New Ideas', 'Next', 'Memories'],
    datasets: [
      {
        label: 'Antal Kort',
        data: [
          fantasyStats.idea,
          fantasyStats.planned,
          fantasyStats.fulfilled,
          dateStats.new,
          dateStats.next,
          dateStats.memory
        ],
        backgroundColor: [
          '#ec4899', // pink
          '#fbbf24', // gul
          '#10b981', // grøn
          '#3b82f6', // blå
          '#6366f1', // indigo
          '#8b5cf6'  // lilla
        ],
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Overblik over kort og status' },
    },
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">📊 Dashboard</h1>
      <Bar data={data} options={options} />
    </div>
  );
}
