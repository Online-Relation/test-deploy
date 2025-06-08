// /components/BucketTimeline.tsx
'use client';

import React, { useState } from 'react';
import { useBucket } from '@/context/BucketContext';

export default function BucketTimeline() {
  const { buckets, loading, addSubgoal, toggleSubgoalDone } = useBucket();
  const [newTitles, setNewTitles] = useState<Record<string,string>>({});

  if (loading) return <p className="p-4 text-center">Indlæser…</p>;

  return (
    <div className="relative overflow-x-auto px-2 sm:px-4 lg:px-6 py-4">
      <div className="absolute left-4 top-0 bottom-0 border-l-2 border-gray-300"></div>

      {buckets.map(bucket => {
        const doneCount = bucket.goals.filter(s => s.done).length;
        const progress = Math.round((doneCount / bucket.goals.length) * 100);

        return (
          <div
            key={bucket.id}
            className="mb-8 pl-8 pr-4 last:mb-0 min-w-[280px] sm:min-w-[320px] lg:min-w-[400px] relative inline-block align-top"
          >
            <div className="absolute left-0 top-1 w-3 h-3 bg-blue-600 rounded-full" />
            <div className="bg-white p-4 rounded-lg shadow flex flex-col">
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
                  className="flex-1 border rounded px-2 py-1 focus:outline-none"
                />
                <button
                  onClick={() => {
                    const title = newTitles[bucket.id]?.trim();
                    if (!title) return;
                    addSubgoal(bucket.id, title);
                    setNewTitles(prev => ({ ...prev, [bucket.id]: '' }));
                  }}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
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
