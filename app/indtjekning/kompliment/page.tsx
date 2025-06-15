// /app/indtjekning/kompliment/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

interface Compliment {
  id: string;
  text: string;
}

interface ComplimentLog {
  id: string;
  compliment_id: string;
  given_date: string;
  compliment_text?: string;
}

export default function KomplimentPage() {
  const [compliments, setCompliments] = useState<Compliment[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [savingToday, setSavingToday] = useState<boolean>(false);
  const [chartData, setChartData] = useState<{ date: string; count: number }[]>([]);
  const [givenDate, setGivenDate] = useState<string>('');
  const [recentLogs, setRecentLogs] = useState<ComplimentLog[]>([]);
  const [alreadyRegistered, setAlreadyRegistered] = useState<boolean>(false);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  function pickDaily(list: Compliment[]) {
    const today = formatDate(new Date());
    const storedDate = localStorage.getItem('complimentDate');
    const storedIdx = Number(localStorage.getItem('complimentIndex'));

    if (storedDate === today && !isNaN(storedIdx)) {
      setCurrentIndex(storedIdx);
      return;
    }
    const used: number[] = JSON.parse(localStorage.getItem('usedCompliments') || '[]');
    let available = list.map((_, i) => i).filter(i => !used.includes(i));
    if (available.length === 0) {
      localStorage.removeItem('usedCompliments');
      available = list.map((_, i) => i);
    }
    const choice = available[Math.floor(Math.random() * available.length)];
    localStorage.setItem('usedCompliments', JSON.stringify([...used, choice]));
    localStorage.setItem('complimentDate', today);
    localStorage.setItem('complimentIndex', String(choice));
    setCurrentIndex(choice);
  }

  useEffect(() => {
    supabase
      .from('compliments')
      .select('id, text')
      .then(({ data, error }) => {
        if (!error && data) {
          setCompliments(data);
          pickDaily(data);
        }
      });
  }, []);

  useEffect(() => {
    const checkAlreadyRegistered = async () => {
      const today = formatDate(new Date());
      if (currentIndex === null) return;
      const compId = compliments[currentIndex]?.id;
      if (!compId) return;

      const { data } = await supabase
        .from('compliment_logs')
        .select('id')
        .eq('compliment_id', compId)
        .eq('given_date', today)
        .maybeSingle();

      setAlreadyRegistered(!!data);
    };

    checkAlreadyRegistered();
  }, [currentIndex, compliments]);

  async function handleGiveToday() {
    if (currentIndex === null) return;
    setSavingToday(true);

    const compId = compliments[currentIndex]?.id;
    if (!compId || !givenDate) {
      setSavingToday(false);
      return;
    }

    const { error } = await supabase.from('compliment_logs').insert({
      compliment_id: compId,
      given_date: givenDate,
    });

    if (!error) {
      loadChartData();
      loadRecentLogs();
      setAlreadyRegistered(true);
    }
    setSavingToday(false);
  }

  async function loadChartData() {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 13); // 14 dage inkl. i dag
    const startDate = formatDate(start);
    const endDate = formatDate(end);

    const { data, error } = await supabase
      .from('compliment_logs')
      .select('given_date')
      .gte('given_date', startDate)
      .lte('given_date', endDate);

    if (error || !data) return;

    const counts: Record<string, number> = {};
    data.forEach(({ given_date }) => {
      counts[given_date] = (counts[given_date] || 0) + 1;
    });

    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = formatDate(d);
      return { date: key, count: counts[key] || 0 };
    });

    setChartData(days);
  }

  async function loadRecentLogs() {
    const { data } = await supabase
      .from('compliment_logs')
      .select('id, compliment_id, given_date')
      .order('given_date', { ascending: false })
      .limit(7);

    if (data) {
      const enriched = data.map(log => {
        const found = compliments.find(c => c.id === log.compliment_id);
        return { ...log, compliment_text: found?.text || '' };
      });
      setRecentLogs(enriched);
    }
  }

  useEffect(() => {
    loadChartData();
    loadRecentLogs();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Kompliment-registrering</h1>

      <section className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Dagens kompliment</h2>
        {currentIndex !== null && compliments[currentIndex] && (
          <div className="p-4 bg-indigo-100 rounded text-indigo-900 italic text-lg mb-2">
            "{compliments[currentIndex].text}"
          </div>
        )}

        {alreadyRegistered ? (
          <p className="text-green-700 text-sm">✅ Dagens kompliment er allerede registreret.</p>
        ) : (
          <div className="flex flex-col sm:flex-row items-start gap-4 mt-2">
            <input
              type="date"
              value={givenDate}
              onChange={e => setGivenDate(e.target.value)}
              className="border rounded px-3 py-2"
            />
            <button
              onClick={handleGiveToday}
              disabled={savingToday}
              className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {savingToday ? 'Gemmer…' : 'Registrer kompliment'}
            </button>
          </div>
        )}
      </section>

      {recentLogs.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Seneste komplimenter</h2>
          <ul className="space-y-2">
            {recentLogs.map(log => (
              <li key={log.id} className="border p-3 rounded">
                <p className="text-sm text-gray-700 italic">"{log.compliment_text}"</p>
                <p className="text-xs text-gray-500">Dato: {log.given_date}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Aktivitet de sidste 14 dage</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} domain={[0, 1]} />
            <Tooltip />
            <Bar dataKey="count" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
