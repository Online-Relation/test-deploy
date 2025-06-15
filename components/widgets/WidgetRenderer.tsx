// /components/widgets/WidgetRenderer.tsx
'use client';

import KomplimentReminder from './KomplimentReminder';
import XpMeter from './XpMeter';
import RewardProgress from './RewardProgress';
import TaskSummary from './TaskSummary';

interface Widget {
  widget_key: string;
  layout: string;
  height: string;
}

export default function WidgetRenderer({ widget }: { widget: Widget }) {
  switch (widget.widget_key) {
    case 'kompliment_reminder':
      return <KomplimentReminder height={widget.height} layout={widget.layout} />;
    case 'xp_meter':
      return <XpMeter height={widget.height} layout={widget.layout} />;
    case 'reward_progress':
      return <RewardProgress height={widget.height} layout={widget.layout} />;
    case 'task_summary':
      return <TaskSummary height={widget.height} layout={widget.layout} />;
    default:
      return null;
  }
}
