// components/widgets/Flowers.tsx

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface FlowersLogEntry {
  id: string;
  user_id: string;
  given_at: string;
}

interface FlowersReminderProps {
  currentUserId: string;
}

export default function FlowersReminder({ currentUserId }: FlowersReminderProps) {
  const [lastGivenAt, setLastGivenAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchLastGiven() {
    setLoading(true);
    const { data, error } = await supabase
      .from('flowers_log')
      .select('given_at')
      .eq('user_id', currentUserId)
      .order('given_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      setError('Fejl ved hentning: ' + error.message);
      setLoading(false);
      return;
    }

    setLastGivenAt(data?.given_at ?? null);
    setLoading(false);
  }

  useEffect(() => {
    fetchLastGiven();
  }, [currentUserId]);

  async function giveFlowers() {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('flowers_log')
      .insert([{ user_id: currentUserId, given_at: now }]);

    if (error) {
      alert('Kunne ikke registrere blomster: ' + error.message);
      return;
    }
    setLastGivenAt(now);
    alert('Blomster registreret! Tak for opmærksomheden 🌸');
  }

  if (loading) return <div>Indlæser blomsterdata…</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  if (!lastGivenAt) {
    // Aldrig givet blomster - vis widget med mulighed for at give blomster
    return (
      <div className="p-4 bg-red-100 rounded shadow text-center">
        <p>Det er mere end 30 dage siden, du sidst gav blomster til din partner.</p>
        <button
          onClick={giveFlowers}
          className="mt-3 bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600"
        >
          Giv blomster nu 🌹
        </button>
      </div>
    );
  }

  const lastDate = new Date(lastGivenAt);
  const nowDate = new Date();
  lastDate.setHours(0, 0, 0, 0);
  nowDate.setHours(0, 0, 0, 0);

  const diffTime = nowDate.getTime() - lastDate.getTime();
  const daysSince = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (daysSince >= 30) {
    return (
      <div className="p-4 bg-red-100 rounded shadow text-center">
        <p>Det er {daysSince} dage siden, du sidst gav blomster til din partner.</p>
        <button
          onClick={giveFlowers}
          className="mt-3 bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600"
        >
          Giv blomster nu 🌹
        </button>
      </div>
    );
  }

  // Mindre end 30 dage siden blomster - vis ikke widget
  return null;
}
