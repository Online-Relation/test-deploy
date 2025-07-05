// /components/widgets/WidgetRenderer.tsx
'use client';

import KomplimentReminder from './KomplimentReminder';
import XpMeter from './XpMeter';
import RewardProgress from './RewardProgress';
import TaskSummary from './TaskSummary';
import WeeklyRecommendation from './WeeklyRecommendation';
import ReminderWidget from './ReminderWidget'; // <-- Ny import!
import { useUserContext } from '@/context/UserContext'; // <-- Importér bruger

interface Widget {
  widget_key: string;
  layout: string;
  height: string;
}

export default function WidgetRenderer({ widget }: { widget: Widget }) {
  const { user } = useUserContext(); // <-- Hent bruger

  switch (widget.widget_key) {
    case 'kompliment_reminder':
      return <KomplimentReminder height={widget.height} layout={widget.layout} />;
    case 'xp_meter':
      return <XpMeter height={widget.height} layout={widget.layout} />;
    case 'reward_progress':
      return <RewardProgress height={widget.height} layout={widget.layout} />;
    case 'task_summary':
      return <TaskSummary height={widget.height} layout={widget.layout} />;
    case 'weekly_recommendation':
      return <WeeklyRecommendation />;
    case 'reminder_widget':
      // Send kun currentUserId hvis bruger er logget ind
      if (!user?.id) return null;
      return <ReminderWidget currentUserId={user.id} />;
    default:
      return null;
  }
}
