// app/checkin/historik/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Legend, Title, Tooltip } from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Legend, Title, Tooltip);

export default function CheckinHistorikPage() {
  const [history, setHistory] = useState<any[]>([]);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart>();
  
  const userIdMads = '190a3151-97bc-43be-9daf-1f3b3062f97f';
  const userIdStine = '5687c342-1a13-441c-86ca-f7e87e1edbd5';

  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase
        .from('checkin')
        .select('user_id, status')
        .neq('status', 'pending');
      setHistory(data || []);
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    if (history.length === 0) return;

    const statuses = ['approved', 'partial', 'rejected'];
    const countsFor = (userId: string) =>
      statuses.map((st) => history.filter((h) => h.user_id === userId && h.status === st).length);
    const madsCounts = countsFor(userIdMads);
    const stineCounts = countsFor(userIdStine);

    chartInstance.current = new Chart(chartRef.current, {
      type: 'bar',
      data: {
        labels: ['Godkendt', 'Delvist', 'Afvist'],
        datasets: [
          {
            label: 'Mads',
            data: madsCounts,
            backgroundColor: 'rgba(16, 185, 129, 0.7)',
          },
          {
            label: 'Stine',
            data: stineCounts,
            backgroundColor: 'rgba(234, 179, 8, 0.7)',
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: 'Historiske evalueringer' },
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Antal' } },
        },
      },
    });
  }, [history]);

  return (
    <div className="pt-8 pb-10 px-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Check-in Historik</h1>
      <canvas ref={chartRef} />
    </div>
  );
}
