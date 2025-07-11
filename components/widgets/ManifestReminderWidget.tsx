'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type ManifestPoint = {
  id: string;
  title: string;
  content: string;
};

export default function ManifestReminderWidget() {
  const [point, setPoint] = useState<ManifestPoint | null>(null);
  const [currentParagraph, setCurrentParagraph] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPoints() {
      const { data, error } = await supabase
        .from('manifestation_points')
        .select('id, title, content')
        .eq('remind_me', true)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Fejl ved hentning af manifestation_points:', error);
        setPoint(null);
        setCurrentParagraph(null);
        return;
      }
      if (!data || data.length === 0) {
        setPoint(null);
        setCurrentParagraph(null);
        return;
      }

      // For nu vælger vi det første punkt (du kan ændre, hvis du vil randomize)
      const singlePoint = data[0];
      setPoint(singlePoint);

      // Split content i afsnit efter linjeskift med nummerering (fx "1. ", "2. ", etc.)
      const paragraphs = singlePoint.content
        .split(/\n\s*\d+\.\s*/)
        .filter((p: string) => p.trim().length > 0);

      // Beregn dag i året
      const dayOfYear = Math.floor(
        (new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
      );

      // Vælg afsnit baseret på dag i året modulo antal afsnit
      const index = dayOfYear % paragraphs.length;
      setCurrentParagraph(paragraphs[index]);
    }

    fetchPoints();
  }, []);

  if (!point || !currentParagraph) return null;

  return (
    <div className="bg-blue-50 rounded-xl shadow p-4 mb-4">
      <span className="text-xs text-blue-600 font-semibold mb-1 block">Dagens manifest-punkt</span>
      <strong className="block mb-1">{point.title}</strong>
      <p className="text-gray-700 text-sm" dangerouslySetInnerHTML={{ __html: currentParagraph }} />
    </div>
  );
}
