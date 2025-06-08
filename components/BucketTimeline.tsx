// /components/BucketTimeline.tsx
'use client';

import React, { useState } from 'react';
import { useBucket, Bucket, Subgoal } from '@/context/BucketContext';

export default function BucketTimeline() {
  const { buckets, loading, addSubgoal, toggleSubgoalDone } = useBucket();
  const [newTitles, setNewTitles] = useState<Record<string, string>>({});

  if (loading) return <p>Loader data…</p>;

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 border-l-2 border-gray-300"></div>
      {buckets.map(bucket => {
        const doneCount = bucket.goals.filter(s => s.done).length;
        const progress = Math.round((doneCount / bucket.goals.length) * 100);
        return (
          <div key={bucket.id} className="mb-8 pl-8 relative">
            <div className="absolute left-0 top-1 w-3 h-3 bg-blue-600 rounded-full" />
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">{bucket.title}</h3>
                <span className="text-sm text-gray-500">
                  {new Date(bucket.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full mb-4">
                <div
                  className="h-2 rounded-full bg-blue-600"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-xs text-gray-600 mb-2">
                {doneCount} / {bucket.goals.length} delmål ({progress}%)
              </div>
              <ul className="space-y-1 mb-4">
                {bucket.goals.map(sg => (
                  <li key={sg.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={sg.done}
                      onChange={e =>
                        toggleSubgoalDone(bucket.id, sg.id, e.target.checked)
                      }
                      className="form-checkbox h-4 w-4 text-blue-600"
                    />
                    <span className={sg.done ? 'line-through text-gray-400' : ''}>
                      {sg.title}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nyt delmål"
                  value={newTitles[bucket.id] || ''}
                  onChange={e =>
                    setNewTitles(prev => ({ ...prev, [bucket.id]: e.target.value }))
                  }
                  className="flex-1 border px-2 py-1 rounded"
                />
                <button
                  onClick={() => {
                    addSubgoal(bucket.id, newTitles[bucket.id] || '');
                    setNewTitles(prev => ({ ...prev, [bucket.id]: '' }));
                  }}
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                >
                  Tilføj
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
