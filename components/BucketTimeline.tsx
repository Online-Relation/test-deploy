// /components/BucketTimeline.tsx
'use client';

import React, { useState } from 'react';
import { useBucket } from '@/context/BucketContext';

export default function BucketTimeline() {
  const { buckets, loading, addSubgoal, toggleSubgoalDone } = useBucket();
  const [newTitles, setNewTitles] = useState<Record<string,string>>({});

  if (loading) return <p className="p-4 text-center">Indlæser…</p>;

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Horizontal scroll på alle devices */}
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {buckets.map(bucket => {
          const doneCount = bucket.goals.filter(s => s.done).length;
          const progress = Math.round((doneCount / bucket.goals.length) * 100);

          return (
            <div
              key={bucket.id}
              className="flex-none w-64 sm:w-72 lg:w-80 bg-white rounded-lg shadow p-4"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold truncate">{bucket.title}</h3>
                <span className="text-sm text-gray-500">
                  {new Date(bucket.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded mb-3">
                <div
                  className="h-2 rounded bg-blue-600"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <ul className="mb-3 space-y-1 max-h-32 overflow-auto">
                {bucket.goals.map(sg => (
                  <li key={sg.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={sg.done}
                      onChange={e =>
                        toggleSubgoalDone(bucket.id, sg.id, e.target.checked)
                      }
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className={sg.done ? 'line-through text-gray-400' : ''}>
                      {sg.title}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Nyt delmål"
                  value={newTitles[bucket.id] || ''}
                  onChange={e =>
                    setNewTitles(prev => ({ ...prev, [bucket.id]: e.target.value }))
                  }
                  className="flex-1 border rounded px-2 py-1"
                />
                <button
                  onClick={() => {
                    const title = newTitles[bucket.id]?.trim();
                    if (!title) return;
                    addSubgoal(bucket.id, title);
                    setNewTitles(prev => ({ ...prev, [bucket.id]: '' }));
                  }}
                  className="bg-blue-600 text-white px-3 py-1 rounded"
                >
                  Tilføj
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
