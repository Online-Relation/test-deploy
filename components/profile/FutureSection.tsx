// /components/profile/FutureSection.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface Goal {
  id?: string;
  title: string;
  date: string;
  user_id?: string;
}

interface Props {
  isViewingPartner: boolean;
  userId: string;
  partnerId: string;
}

export function FutureSection({ isViewingPartner, userId, partnerId }: Props) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [newDate, setNewDate] = useState('');

  const activeId = isViewingPartner ? partnerId : userId;

  useEffect(() => {
    const fetchGoals = async () => {
      const { data, error } = await supabase
        .from('future_goals')
        .select('*')
        .eq('user_id', activeId)
        .order('date', { ascending: true });

      if (error) {
        console.error('Fejl ved hentning af mål:', error.message);
        return;
      }

      setGoals(data || []);
    };

    fetchGoals();
  }, [activeId]);

  const addGoal = async () => {
    if (!newGoal.trim() || !newDate.trim()) return;
    const { data, error } = await supabase
      .from('future_goals')
      .insert({ title: newGoal, date: newDate, user_id: userId })
      .select()
      .single();

    if (error) {
      alert('Kunne ikke tilføje mål');
      return;
    }

    setGoals([...goals, data]);
    setNewGoal('');
    setNewDate('');
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Vores Fremtid</h2>
      <p className="text-sm text-gray-500 mb-4">En tidslinje over jeres fælles mål og milepæle</p>

      <div className="space-y-4">
        {goals.map((goal) => (
          <div key={goal.id} className="border-l-4 border-pink-500 pl-4 py-2">
            <p className="text-sm text-gray-800 font-medium">{goal.title}</p>
            <p className="text-xs text-gray-500">{new Date(goal.date).toLocaleDateString('da-DK')}</p>
          </div>
        ))}
      </div>

      {!isViewingPartner && (
        <div className="mt-6 space-y-2">
          <h3 className="text-sm font-semibold">Tilføj nyt mål</h3>
          <input
            type="text"
            placeholder="Mål eller milepæl"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
          <button
            onClick={addGoal}
            className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
          >
            Tilføj mål
          </button>
        </div>
      )}
    </div>
  );
}
