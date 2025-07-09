'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUserContext } from '@/context/UserContext';
import WidgetRenderer from '@/components/widgets/WidgetRenderer';
import { BucketProvider } from '@/context/BucketContext';

// -- NYT: Import til ChallengeCardWidget --
import ChallengeCardWidget from '@/components/widgets/ChallengeCardWidget';

interface Widget {
  widget_key: string;
  layout: 'small' | 'medium' | 'large';
  height: 'auto' | 'medium' | 'large';
  order: number;
}

export default function DashboardPage() {
  const { user } = useUserContext();
  const [widgets, setWidgets] = useState<Widget[]>([]);

  // -- DEBUG (kan slettes) --
  if (user) {
    console.log('currentUserId:', user.id);
  }

  // --- OPDATERET: Tilføj 'challenge_card' til listen over understøttede widgets ---
  const supportedWidgets = [
    'xp_meter',
    'reward_progress',
    'task_summary',
    'kompliment_reminder',
    'weekly_recommendation',
    'reminder_widget',
    'activity_overview',
    'challenge_card', // <-- NYT!
  ];

  useEffect(() => {
    const fetchWidgets = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('dashboard_widgets')
        .select('widget_key, layout, height, order')
        .eq('user_id', user.id)
        .eq('enabled', true);

      if (error) console.error('Fejl ved hentning af widgets:', error);
      else setWidgets(data?.filter(w => supportedWidgets.includes(w.widget_key)) || []);
    };

    fetchWidgets();
  }, [user]);

  const layoutClass = (layout: string) => {
    switch (layout) {
      case 'small': return 'col-span-12 sm:col-span-6 lg:col-span-4';
      case 'medium': return 'col-span-12 sm:col-span-8';
      case 'large': return 'col-span-12';
      default: return 'col-span-12';
    }
  };

  const heightClass = (height: string) => {
    switch (height) {
      case 'medium': return 'min-h-[250px]';
      case 'large': return 'min-h-[400px]';
      default: return 'h-auto';
    }
  };

  if (!user) return null;

  return (
    <BucketProvider>
      <div className="w-full sm:max-w-6xl sm:mx-auto px-2 sm:px-4 py-6 grid grid-cols-12 gap-4 sm:gap-6">
        {widgets
          .sort((a, b) => a.order - b.order)
          .map(widget => (
            <div
              key={widget.widget_key}
              className={`${layoutClass(widget.layout)} ${heightClass(widget.height)} w-full`}
            >
              {/* SPECIAL CASE hvis du vil rende ChallengeCardWidget direkte (ellers via WidgetRenderer): */}
              {widget.widget_key === 'challenge_card' ? (
                <ChallengeCardWidget widget={widget} />
              ) : (
                <WidgetRenderer widget={widget} />
              )}
            </div>
          ))}
      </div>
    </BucketProvider>
  );
}
