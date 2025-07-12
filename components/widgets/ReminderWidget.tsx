// app/components/widgets/ReminderWidget.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { useBucket } from '@/context/BucketContext';
import { Badge } from '@/components/ui/badge';

export default function ReminderWidget({ currentUserId }: { currentUserId: string }) {
  const { buckets, toggleSubgoalDone } = useBucket();

  // Alle reminders
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
          sg.owner === currentUserId &&
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

  // --- STACKED STATE ---
  const [activeIndex, setActiveIndex] = useState(0);

  if (reminders.length === 0) return null;

  const current = reminders[activeIndex];

  const handlePrev = () => setActiveIndex(i => i === 0 ? reminders.length - 1 : i - 1);
  const handleNext = () => setActiveIndex(i => i === reminders.length - 1 ? 0 : i + 1);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 border">
      <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
        <span role="img" aria-label="alarm">⏰</span> Deadline Reminder
      </h3>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="text-lg px-2 py-1 rounded hover:bg-gray-100"
            aria-label="Forrige delmål"
          >
            ◀
          </button>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 bg-gray-50 p-2 rounded">
              <Badge variant="default" className="mb-1 sm:mb-0">{current.bucketTitle}</Badge>
              <span className="font-medium">{current.subgoalTitle}</span>
              <span className={`text-xs ${deadlineStatus(current.deadline)}`}>
                {new Date(current.deadline).toLocaleDateString()}
              </span>
              <button
                onClick={() => toggleSubgoalDone(current.bucketId, current.subgoalId, true)}
                className="btn btn-xs btn-primary ml-auto mt-2 sm:mt-0"
              >
                Markér som færdig
              </button>
            </div>
          </div>
          <button
            onClick={handleNext}
            className="text-lg px-2 py-1 rounded hover:bg-gray-100"
            aria-label="Næste delmål"
          >
            ▶
          </button>
        </div>
        <div className="text-xs text-center text-gray-500 mt-1">
          {activeIndex + 1} ud af {reminders.length} delmål
        </div>
      </div>
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
