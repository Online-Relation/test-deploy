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

export default function KomplimentPage() {
  const [compliments, setCompliments] = useState<Compliment[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [savingToday, setSavingToday] = useState<boolean>(false);
  const [chartData, setChartData] = useState<{ month: string; count: number }[]>(
    []
  );

  // Helper to get YYYY-MM-DD
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  // Pick today's compliment index (hidden)
  function pickDaily(list: Compliment[]) {
    const today = formatDate(new Date());
    const storedDate = localStorage.getItem('complimentDate');
    const storedIdx = Number(localStorage.getItem('complimentIndex'));

    if (storedDate === today && !isNaN(storedIdx)) {
      console.log('Using stored compliment index:', storedIdx);
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
    console.log('Choosing new compliment index:', choice);
    localStorage.setItem('usedCompliments', JSON.stringify([...used, choice]));
    localStorage.setItem('complimentDate', today);
    localStorage.setItem('complimentIndex', String(choice));
    setCurrentIndex(choice);
  }

  // Load compliments and set today's index
  useEffect(() => {
    supabase
      .from('compliments')
      .select('id, text')
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
        } else if (data) {
          setCompliments(data);
          pickDaily(data);
        }
      });
  }, []);

  // Register today's compliment
  async function handleGiveToday() {
    if (currentIndex === null) return;
    setSavingToday(true);

    const compId = compliments[currentIndex]?.id;
    if (!compId) {
      setSavingToday(false);
      return;
    }
    const today = formatDate(new Date());
    const { error } = await supabase.from('compliment_logs').insert({
      compliment_id: compId,
      given_date: today,
    });
    if (error) {
      console.error('Fejl ved registrering af kompliment:', error);
    }
    setSavingToday(false);
    loadChartData();
  }

  // Load chart data for remaining year
  async function loadChartData() {
    const start = formatDate(new Date());
    const end = `${new Date().getFullYear()}-12-31`;
    const { data, error } = await supabase
      .from('compliment_logs')
      .select('given_date')
      .gte('given_date', start)
      .lte('given_date', end);
    if (error || !data) {
      console.error(error);
      return;
    }

    // Count per month
    const counts: Record<string, number> = {};
    data.forEach(({ given_date }) => {
      const month = given_date.slice(5, 7); // 'MM'
      counts[month] = (counts[month] || 0) + 1;
    });
    const months = Array.from(
      { length: 12 - new Date().getMonth() },
      (_, i) => {
        const m = new Date().getMonth() + 1 + i;
        return m < 10 ? `0${m}` : `${m}`;
      }
    );
    const chart = months.map(m => ({ month: m, count: counts[m] || 0 }));
    setChartData(chart);
  }

  // Load chart data when component mounts
  useEffect(() => {
    loadChartData();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Kompliment-registrering</h1>

      <button
        onClick={handleGiveToday}
        disabled={savingToday}
        className="mt-4 px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white"
      >
        {savingToday ? 'Gemmer…' : 'Registrer dagens kompliment'}
      </button>

      {currentIndex !== null && compliments[currentIndex] && (
        <div className="mt-4 p-4 bg-indigo-100 rounded text-indigo-900 italic text-lg">
          "{compliments[currentIndex].text}"
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Registreringer resten af året</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
