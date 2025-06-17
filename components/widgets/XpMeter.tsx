// /components/widgets/XpMeter.tsx
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function XpMeter({
  height,
  layout,
}: {
  height: string;
  layout: string;
}) {
  const [xp, setXp] = useState(0);

  useEffect(() => {
    const loadXp = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('xp_log')
        .select('change')
        .eq('user_id', user.id);

      const total = data?.reduce((sum, e) => sum + e.change, 0) || 0;
      setXp(total);
    };

    loadXp();
  }, []);

  const heightClass = {
    auto: 'h-auto',
    medium: 'min-h-[250px]',
    large: 'min-h-[400px]',
  }[height] || 'h-auto';

  const getSizeClass = (layout: string, height: string) => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      // Mobil: ekstra stor
      return 'w-64 h-64'; // 256px
    }
    if (layout === 'large' && height === 'large') return 'w-[18vw] h-[18vw] max-w-[360px] max-h-[360px]';
    if (layout === 'large') return 'w-[16vw] h-[16vw] max-w-[320px] max-h-[320px]';
    if (layout === 'medium') return 'w-[12vw] h-[12vw] max-w-[260px] max-h-[260px]';
    return 'w-24 h-24';
  };

  const sizeClass = getSizeClass(layout, height);

  return (
    <Card className={`text-center shadow ${heightClass} flex flex-col justify-center`}>
      <CardContent className="p-6 flex flex-col items-center space-y-6">
        <h2 className="text-xl font-bold">XP-meter</h2>
        <div className={sizeClass}>
          <CircularProgressbar
            value={xp % 100}
            maxValue={100}
            text={`${xp} XP`}
            styles={buildStyles({
              textSize: '16px',
              pathColor: '#10B981',
              textColor: '#374151',
              trailColor: '#D1D5DB',
            })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
