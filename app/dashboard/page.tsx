// /app/dashboard/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUserContext } from '@/context/UserContext';
import WidgetRenderer from '@/components/widgets/WidgetRenderer';
import DashboardUserWidget from '@/components/widgets/DashboardUserWidget';
import { BucketProvider } from '@/context/BucketContext';
import ChallengeCardWidget from '@/components/widgets/ChallengeCardWidget';
import { logUserActivity } from '@/lib/logUserActivity';
import ActiveBetWidget from "@/components/widgets/ActiveBetWidget";


interface Widget {
  widget_key: string;
  layout: 'small' | 'medium' | 'large';
  height: 'auto' | 'medium' | 'large';
  order: number;
}

export default function DashboardPage() {
  const { user } = useUserContext();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [challengeCardRefresh, setChallengeCardRefresh] = useState(0);

  // --- Log login-event kun én gang pr. session ---
  useEffect(() => {
    if (user?.id === "5687c342-1a13-441c-86ca-f7e87e1edbd5") {
      if (!sessionStorage.getItem("login_logged")) {
        logUserActivity({
          userId: user.id,
          path: "/login",
          extra: { event: "login" }
        });
        sessionStorage.setItem("login_logged", "1");
      }
    }
  }, [user]);

  const handleChallengeCardRefresh = useCallback(() => {
    setChallengeCardRefresh(c => c + 1);
  }, []);

  const supportedWidgets = [
    'xp_meter',
    'reward_progress',
    'task_summary',
    'kompliment_reminder',
    'weekly_recommendation',
    'reminder_widget',
    'activity_overview',
    'challenge_card',
    'level_tip',
    'profile_header',
    'manifestation_reminder',
    'followup_thoughts',
    'flowers',
    'dashboard_banner',
    'active_bet',
  ];

  useEffect(() => {
    const fetchWidgets = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('dashboard_widgets')
        .select('widget_key, layout, height, order')
        .eq('user_id', user.id)
        .eq('enabled', true);

      console.log('DashboardPage: fetchWidgets data', data, 'error', error);

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

  if (!user) {
    console.log('DashboardPage: ingen user – return null');
    return null;
  }

  // HOVED-log: her ser du det endelige widgets-array
  console.log('DashboardPage: widgets array', widgets);

  return (
    <BucketProvider>
      <div className="w-full sm:max-w-6xl sm:mx-auto px-2 sm:px-4 py-6 grid grid-cols-12 gap-4 sm:gap-6">
        {widgets
          .sort((a, b) => a.order - b.order)
          .map(widget => {
            console.log('DashboardPage: renderer widget', widget.widget_key, widget);
            return (
              <div
                key={widget.widget_key}
                className={`${layoutClass(widget.layout)} ${heightClass(widget.height)} w-full`}
              >
                {widget.widget_key === 'challenge_card' ? (
                  <ChallengeCardWidget
                    widget={widget}
                    refresh={challengeCardRefresh}
                    onAnswered={handleChallengeCardRefresh}
                  />
                ) : (
                  <WidgetRenderer widget={widget} />
                )}
              </div>
            );
          })}
      </div>
      {/* 
      // Test: Sæt denne direkte ind for at sikre, at widgetten altid vises – kun til fejlsøgning!
      // <FollowUpReminderWidget />
      */}
    </BucketProvider>
  );
}
