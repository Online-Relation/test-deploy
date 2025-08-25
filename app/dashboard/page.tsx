// /app/dashboard/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUserContext } from '@/context/UserContext';
import WidgetRenderer from '@/components/widgets/WidgetRenderer';
import { BucketProvider } from '@/context/BucketContext';
import ChallengeCardWidget from '@/components/widgets/ChallengeCardWidget';
import { logUserActivity } from '@/lib/logUserActivity';

interface Widget {
  widget_key: string;
  layout: 'small' | 'medium' | 'large';
  height: 'auto' | 'medium' | 'large';
  order: number;
}

/**
 * DEBUG-HOOKS – fjern når vi har løst problemet
 */
function useTopTapDebug() {
  useEffect(() => {
    const logTop = (label: string) => {
      const el = document.elementFromPoint(24, 24) as HTMLElement | null;
      if (!el) return console.log('[TapDebug]', label, 'No element at (24,24)');
      const cs = window.getComputedStyle(el);
      console.log('[TapDebug]', label, 'elementFromPoint(24,24):', el, {
        zIndex: cs.zIndex,
        position: cs.position,
        pointerEvents: cs.pointerEvents,
        opacity: cs.opacity,
      });
    };
    // kør ved mount og igen efter micro/macro tasks
    logTop('immediate');
    const t1 = setTimeout(() => logTop('timeout 0'), 0);
    const t2 = setTimeout(() => logTop('timeout 500'), 500);
    const t3 = setTimeout(() => logTop('timeout 1500'), 1500);
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
    };
  }, []);
}

function usePointerCaptureDebug() {
  useEffect(() => {
    const handler = (e: Event) => {
      const el = e.target as HTMLElement;
      const cs = el ? window.getComputedStyle(el) : null;
      console.log('[TapDebug] pointerdown target:', el, cs ? {
        zIndex: cs.zIndex,
        position: cs.position,
        pointerEvents: cs.pointerEvents,
        opacity: cs.opacity,
      } : 'no style');
    };
    document.addEventListener('pointerdown', handler, true);
    // auto-stop efter 5 sek
    const killer = setTimeout(() => document.removeEventListener('pointerdown', handler, true), 5000);
    return () => { clearTimeout(killer); document.removeEventListener('pointerdown', handler, true); };
  }, []);
}

export default function DashboardPage() {
  const { user } = useUserContext();
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [challengeCardRefresh, setChallengeCardRefresh] = useState(0);

  // Hold siden i top ved mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // DEBUG – log overlay ved første taps og hvad der ligger øverst ved burger
  useTopTapDebug();
  usePointerCaptureDebug();

  // Engangs login-log
  useEffect(() => {
    if (user?.id === '5687c342-1a13-441c-86ca-f7e87e1edbd5') {
      if (!sessionStorage.getItem('login_logged')) {
        logUserActivity({ userId: user.id, path: '/login', extra: { event: 'login' } });
        sessionStorage.setItem('login_logged', '1');
      }
    }
  }, [user]);

  const handleChallengeCardRefresh = useCallback(() => {
    setChallengeCardRefresh((c) => c + 1);
  }, []);

  const supportedWidgets = [
    'dashboard_banner',
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
    'active_bet',
    'daily_memory',
    'date_mission',
    'never_boring_statement',
    'sexlife_spotlight',
    'weekly_mission',
  ];

  useEffect(() => {
    const fetchWidgets = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('dashboard_widgets')
        .select('widget_key, layout, height, order')
        .eq('user_id', user.id)
        .eq('enabled', true);

      // ❌ STØJ: console-log fjernet/kommenteret
      // console.log('DashboardPage: fetchWidgets data', data, 'error', error);

      if (error) {
        console.error('Fejl ved hentning af widgets:', error);
        return;
      }
      setWidgets((data || []).filter((w) => supportedWidgets.includes(w.widget_key)));
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
    // console.log('DashboardPage: ingen user – return null');
    return null;
  }

  return (
    <BucketProvider>
      {/* Sørg for at indhold ikke kan ligge over headeren utilsigtet */}
      <div className="relative z-0 w-full sm:max-w-6xl sm:mx-auto px-2 sm:px-4 py-6 grid grid-cols-12 gap-4 sm:gap-6">
        {[...widgets]
          .sort((a, b) => {
            if (a.widget_key === 'profile_header') return -1;
            if (b.widget_key === 'profile_header') return 1;
            return a.order - b.order;
          })
          .map((widget) => (
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
          ))}
      </div>
    </BucketProvider>
  );
}
