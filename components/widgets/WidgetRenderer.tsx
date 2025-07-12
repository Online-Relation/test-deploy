// components/WidgetRenderer.tsx

'use client';

import KomplimentReminder from './KomplimentReminder';
import XpMeter from './XpMeter';
import RewardProgress from './RewardProgress';
import TaskSummary from './TaskSummary';
import WeeklyRecommendation from './WeeklyRecommendation';
import ReminderWidget from './ReminderWidget';
import ActivityOverviewWidget from './ActivityOverviewWidget';
import ChallengeCardWidget from './ChallengeCardWidget';
import LevelTipWidget from './LevelTipWidget';
import DashboardUserWidget from './DashboardUserWidget';
import ManifestReminderWidget from './ManifestReminderWidget';
import FollowUpThoughtsWidget from "@/components/widgets/FollowUpThoughtsWidget";
import FlowersWidget from "@/components/widgets/Flowers"; // <-- Importér her

import { useUserContext } from '@/context/UserContext';

interface Widget {
  widget_key: string;
  layout: string;
  height: string;
}

export default function WidgetRenderer({ widget }: { widget: Widget }) {
  const { user } = useUserContext();

  console.log('WidgetRenderer: widget_key', widget?.widget_key, widget);

  if (!widget) {
    console.log('WidgetRenderer: No widget passed, return null');
    return null;
  }

  switch (widget.widget_key) {
    case 'kompliment_reminder':
      console.log('WidgetRenderer: Render KomplimentReminder');
      return <KomplimentReminder height={widget.height} layout={widget.layout} />;
    case 'xp_meter':
      console.log('WidgetRenderer: Render XpMeter');
      return <XpMeter height={widget.height} layout={widget.layout} />;
    case 'reward_progress':
      console.log('WidgetRenderer: Render RewardProgress');
      return <RewardProgress height={widget.height} layout={widget.layout} />;
    case 'task_summary':
      console.log('WidgetRenderer: Render TaskSummary');
      return <TaskSummary height={widget.height} layout={widget.layout} />;
    case 'weekly_recommendation':
      console.log('WidgetRenderer: Render WeeklyRecommendation');
      return <WeeklyRecommendation />;
    case 'reminder_widget':
      if (!user?.id) {
        console.log('WidgetRenderer: ReminderWidget no user.id, return null');
        return null;
      }
      console.log('WidgetRenderer: Render ReminderWidget');
      return <ReminderWidget currentUserId={user.id} />;
    case 'activity_overview':
      console.log('WidgetRenderer: Render ActivityOverviewWidget');
      return <ActivityOverviewWidget widget={widget} />;
    case 'challenge_card':
      console.log('WidgetRenderer: Render ChallengeCardWidget');
      return <ChallengeCardWidget widget={widget} />;
    case 'level_tip':
      console.log('WidgetRenderer: Render LevelTipWidget');
      return <LevelTipWidget />;
    case 'profile_header':
      if (!user) {
        console.log('WidgetRenderer: No user for profile_header, return null');
        return null;
      }
      console.log('WidgetRenderer: Render DashboardUserWidget');
      return (
        <DashboardUserWidget
          name={user.display_name || 'Navn'}
          avatarUrl={user.avatar_url || '/dummy-avatar.jpg'}
          userId={user.id}
        />
      );
    case 'manifestation_reminder':
      console.log('WidgetRenderer: Render ManifestReminderWidget');
      return <ManifestReminderWidget />;
    case 'followup_thoughts':
      console.log('WidgetRenderer: Render FollowUpThoughtsWidget');
      return <FollowUpThoughtsWidget />;
    case 'flowers':  // <-- Ny case for blomster widget
      if (!user?.id) {
        console.log('WidgetRenderer: FlowersWidget no user.id, return null');
        return null;
      }
      console.log('WidgetRenderer: Render FlowersWidget');
      return <FlowersWidget currentUserId={user.id} />; // <-- Rigtig prop navn
    default:
      console.log('WidgetRenderer: Unknown widget_key', widget.widget_key);
      return null;
  }
}
