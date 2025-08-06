// /components/widgets/WidgetRenderer.tsx

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
import FlowersWidget from "@/components/widgets/Flowers";
import DashboardBanner from '@/components/widgets/DashboardBanner';
import ActiveBetWidget from "@/components/widgets/ActiveBetWidget";
import DailyMemoryWidget from "@/components/widgets/DailyMemoryWidget";
import DateMissionWidget from "@/components/widgets/DateMissionWidget";
import NeverBoringStatement from "@/components/widgets/NeverBoringStatement";
import SexlifeSpotlightWidget from "@/components/widgets/SexlifeSpotlightWidget";
import WeeklyMissionCard from "@/components/widgets/WeeklyMissionCard";

import { useUserContext } from '@/context/UserContext';

interface Widget {
  widget_key: string;
  layout: string;
  height: string;
}

export default function WidgetRenderer({ widget }: { widget: Widget }) {
  const { user } = useUserContext();

  if (!widget) {
    console.log('WidgetRenderer: No widget passed, return null');
    return null;
  }

  switch (widget.widget_key) {
    case 'never_boring_statement':
      return <NeverBoringStatement />;
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
    case 'level_tip':
      return <LevelTipWidget />;
    case 'profile_header':
      if (!user) return null;
      return (
        <DashboardUserWidget
          name={user.display_name || 'Navn'}
          avatarUrl={user.avatar_url || '/dummy-avatar.jpg'}
          userId={user.id}
        />
      );
    case 'dashboard_banner':
      return <DashboardBanner />;
    case 'manifestation_reminder':
      return <ManifestReminderWidget />;
    case 'followup_thoughts':
      return <FollowUpThoughtsWidget />;
    case 'flowers':
      if (!user?.id) return null;
      return <FlowersWidget currentUserId={user.id} />;
    case 'active_bet':
      return <ActiveBetWidget />;
    case 'daily_memory':
      return <DailyMemoryWidget />;
    case 'weekly_mission':
      return <WeeklyMissionCard />;
    case 'sexlife_spotlight':
      return <SexlifeSpotlightWidget />;
    case 'date_mission':
      if (!user?.id) return null;

      // RENDER OG UNMOUNT KORREKT:
      const widgetElement = <DateMissionWidget userId={user.id} displayName={user.display_name || ""} />;
      if (!widgetElement) {
        // Ekstra safety (normalt unødvendigt, men kan hjælpe React til at forstå at null = unmount)
        return null;
      }
      return widgetElement;

    default:
      return null;
  }
}
