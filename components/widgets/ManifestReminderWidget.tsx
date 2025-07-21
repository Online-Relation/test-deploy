// /components/widgets/ManifestReminderWidget.tsx

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

      if (error || !data || data.length === 0) {
        setPoint(null);
        setCurrentParagraph(null);
        return;
      }

      // Vælg dagens manifest-point (skift hver dag, men random baseret på dag)
      const dayOfYear = Math.floor(
        (new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
      );
      const manifestIndex = dayOfYear % data.length;
      const selectedPoint = data[manifestIndex];
      setPoint(selectedPoint);

      // Split content i afsnit (nummererede eller linjeskift)
      const paragraphs = selectedPoint.content
        .split(/\n\s*(?=\d+\.\s)/) // splitter på nummererede punkter som "1. xxx"
        .filter((p: string) => p.trim().length > 0);

      // Udvælg dagens punkt fra afsnittene (så alle punkter kommer i rotation)
      const paraIndex = dayOfYear % paragraphs.length;
      setCurrentParagraph(paragraphs[paraIndex]);
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
