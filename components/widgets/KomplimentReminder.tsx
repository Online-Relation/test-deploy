// /components/widgets/KomplimentReminder.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';

export default function KomplimentReminder({
  height,
  layout,
}: {
  height: string;
  layout: string;
}) {
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    const checkComplimentReminder = async () => {
      const { data, error } = await supabase
        .from('compliment_logs')
        .select('given_date')
        .order('given_date', { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0) {
        setShowReminder(true);
        return;
      }

      const lastDate = new Date(data[0].given_date);
      const daysAgo = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysAgo >= 7) setShowReminder(true);
    };

    checkComplimentReminder();
  }, []);

  if (!showReminder) return null;

  const heightClass = {
    auto: 'h-auto',
    medium: 'min-h-[250px]',
    large: 'min-h-[400px]',
  }[height] || 'h-auto';

  const textSizeClass = {
    small: 'text-base',
    medium: 'text-lg',
    large: 'text-xl',
  }[layout] || 'text-base';

  const spacingClass = {
    small: 'space-y-2',
    medium: 'space-y-4',
    large: 'space-y-6',
  }[layout] || 'space-y-2';

  return (
    <Card className={`shadow ${heightClass} flex flex-col justify-center`}>
      <CardContent className={`p-6 text-center ${spacingClass}`}>
        <h2 className={`font-bold ${textSizeClass}`}>💬 Kompliment på tide?</h2>
        <p className="text-gray-600">
          Det er over 7 dage siden du sidst har givet et kompliment.
        </p>
      </CardContent>
    </Card>
  );
}
