'use client';

import KomplimentReminder from './KomplimentReminder';
import XpMeter from './XpMeter';
import RewardProgress from './RewardProgress';
import TaskSummary from './TaskSummary';
import WeeklyRecommendation from './WeeklyRecommendation';
import ReminderWidget from './ReminderWidget';
import ActivityOverviewWidget from './ActivityOverviewWidget';
import ChallengeCardWidget from './ChallengeCardWidget';
import LevelTipWidget from './LevelTipWidget'; // <-- NY import!
import { useUserContext } from '@/context/UserContext';

interface Widget {
  widget_key: string;
  layout: string;
  height: string;
}

export default function WidgetRenderer({ widget }: { widget: Widget }) {
  const { user } = useUserContext();

  if (!widget) return null;

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
      if (!user?.id) return null;
      return <ReminderWidget currentUserId={user.id} />;
    case 'activity_overview':
      return <ActivityOverviewWidget widget={widget} />;
    case 'challenge_card':
      return <ChallengeCardWidget widget={widget} />;
    case 'level_tip':  // <--- NYT widget-key
      return <LevelTipWidget />; // Kan evt. tage layout/height, hvis du vil!
    default:
      return null;
  }
}
