'use client';

import React, { useMemo } from 'react';
import { useBucket } from '@/context/BucketContext';
import { Badge } from '@/components/ui/badge';

// DU SKAL SENDE currentUserId IND SOM PROP!
export default function ReminderWidget({ currentUserId }: { currentUserId: string }) {
  const { buckets, toggleSubgoalDone } = useBucket();

  const reminders = useMemo(() => {
    const today = new Date();
    const weekAhead = new Date();
    weekAhead.setDate(today.getDate() + 7);

    let result: {
      bucketTitle: string;
      bucketId: string;
      subgoalId: string;
      subgoalTitle: string;
      deadline: string;
      ownerId?: string;
    }[] = [];

    buckets.forEach(bucket => {
      bucket.goals.forEach(sg => {
        if (
          !sg.done &&
          sg.dueDate &&
          sg.owner === currentUserId && // <--- VIGTIGT! KUN mine delmål
          new Date(sg.dueDate) >= today &&
          new Date(sg.dueDate) <= weekAhead
        ) {
          result.push({
            bucketTitle: bucket.title,
            bucketId: bucket.id,
            subgoalId: sg.id,
            subgoalTitle: sg.title,
            deadline: sg.dueDate,
            ownerId: sg.owner,
          });
        }
      });
    });
    // Sortér efter deadline (tættest først)
    return result.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  }, [buckets, currentUserId]);

  if (reminders.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 border">
      <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
        <span role="img" aria-label="alarm">⏰</span> Deadline Reminder
      </h3>
      <ul className="space-y-2">
        {reminders.map(reminder => (
          <li key={reminder.subgoalId} className="flex flex-col sm:flex-row sm:items-center sm:gap-3 bg-gray-50 p-2 rounded">
            <Badge variant="default" className="mb-1 sm:mb-0">{reminder.bucketTitle}</Badge>
            <span className="font-medium">{reminder.subgoalTitle}</span>
            <span className={`text-xs ${deadlineStatus(reminder.deadline)}`}>
              {new Date(reminder.deadline).toLocaleDateString()}
            </span>
            <button
              onClick={() => toggleSubgoalDone(reminder.bucketId, reminder.subgoalId, true)}
              className="btn btn-xs btn-primary ml-auto mt-2 sm:mt-0"
            >
              Markér som færdig
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function deadlineStatus(dueDate: string) {
  const today = new Date();
  const date = new Date(dueDate);
  const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'text-gray-400'; // overskredet
  if (diffDays === 0) return 'text-red-600 font-bold bg-red-100'; // i dag
  if (diffDays <= 3) return 'text-orange-500 font-semibold bg-orange-50'; // meget tæt på
  if (diffDays <= 7) return 'text-yellow-600 bg-yellow-50'; // indenfor en uge
  return 'text-gray-600 bg-gray-100';
}
