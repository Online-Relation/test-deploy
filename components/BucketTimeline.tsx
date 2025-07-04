// /components/Bcukettimeline.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useBucket } from '@/context/BucketContext';
import { supabase } from '@/lib/supabaseClient';

export default function BucketTimeline() {
  const {
    buckets,
    loading,
    addSubgoal,
    toggleSubgoalDone,
  } = useBucket();

  const [users, setUsers] = useState<
    { id: string; display_name: string; avatar_url: string | null }[]
  >([]);

  const [subgoalInputs, setSubgoalInputs] = useState<{
    [bucketId: string]: {
      title: string;
      dueDate: string;
      owner: string;
    };
  }>({});

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id,display_name,avatar_url')
      .then(({ data }) => data && setUsers(data));
  }, []);

  const handleInputChange = (bucketId: string, field: string, value: string) => {
    setSubgoalInputs(prev => ({
      ...prev,
      [bucketId]: {
        ...prev[bucketId],
        [field]: value,
      },
    }));
  };

  const resetInputs = (bucketId: string) => {
    setSubgoalInputs(prev => ({
      ...prev,
      [bucketId]: {
        title: '',
        dueDate: '',
        owner: users[0]?.id || '',
      },
    }));
  };

  if (loading) return <p className="p-4 text-center">Indlæser…</p>;

  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 overflow-x-hidden">

      <div className="relative">
        {buckets.map(bucket => {
          const doneCount = bucket.goals.filter(s => s.done).length;
          const progress = bucket.goals.length
            ? Math.round((doneCount / bucket.goals.length) * 100)
            : 0;
          const bucketDate = bucket.deadline || bucket.created_at.slice(0, 10);
          const input = {
            title: subgoalInputs[bucket.id]?.title || '',
            dueDate: subgoalInputs[bucket.id]?.dueDate || '',
            owner: subgoalInputs[bucket.id]?.owner || users[0]?.id || '',
          };

          return (
            <div key={bucket.id} className="mb-8 relative space-y-4 sm:space-y-2 w-full px-2">

              <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold truncate text-violet-700">{bucket.title}</h3>
                  <span className="text-sm text-gray-500">
                    {new Date(bucketDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="w-full bg-gray-200 h-2 rounded-full mb-4 overflow-hidden">
                  <div
                    className="h-2 bg-purple-600 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="text-xs text-gray-600 mb-4">
                  {doneCount} / {bucket.goals.length} delmål gennemført ({progress}%)
                </div>

                <ul className="space-y-2 mb-4">
                  {bucket.goals.map(sg => (
                    <li key={sg.id} className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={sg.done}
                        onChange={e =>
                          toggleSubgoalDone(bucket.id, sg.id, e.target.checked)
                        }
                        className="h-4 w-4 text-purple-600 mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className={sg.done ? 'line-through text-gray-400' : ''}>
                            {sg.title}
                          </span>
                          {sg.dueDate && (
                            <span className="text-xs text-gray-500">
                              {new Date(sg.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {sg.owner && (
                          <div className="mt-1 flex items-center gap-2 text-xs">
                            <img
                              src={
                                users.find(u => u.id === sg.owner)?.avatar_url ||
                                '/default-avatar.png'
                              }
                              alt={
                                users.find(u => u.id === sg.owner)?.display_name || 'Profil'
                              }
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <span>
                              Ansvarlig:{' '}
                              {users.find(u => u.id === sg.owner)?.display_name || sg.owner}
                            </span>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-4">
                  <input
                    type="text"
                    placeholder="Nyt delmål"
                    className="border rounded px-3 py-2 w-full"
                    value={input.title}
                    onChange={e => handleInputChange(bucket.id, 'title', e.target.value)}
                  />
                  <input
                    type="date"
                    className="border rounded px-3 py-2 w-full"
                    value={input.dueDate}
                    onChange={e => handleInputChange(bucket.id, 'dueDate', e.target.value)}
                  />
                  <select
                    className="border rounded px-3 py-2 w-full"
                    value={input.owner}
                    onChange={e => handleInputChange(bucket.id, 'owner', e.target.value)}
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.display_name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      if (input.title.trim()) {
                        addSubgoal(
                          bucket.id,
                          input.title.trim(),
                          input.dueDate || undefined,
                          input.owner || undefined
                        );
                        resetInputs(bucket.id);
                      }
                    }}
                    className="btn btn-primary w-full"
                  >
                    Tilføj delmål
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}