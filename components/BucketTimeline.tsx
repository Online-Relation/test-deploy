// /components/BucketTimeline.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useBucket } from '@/context/BucketContext';
import { supabase } from '@/lib/supabaseClient';

export default function BucketTimeline() {
  const {
    buckets,
    loading,
    addBucket,
    addSubgoal,
    toggleSubgoalDone,
  } = useBucket();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [newBucketTitle, setNewBucketTitle] = useState('');
  const [newBucketCat, setNewBucketCat] = useState('');
  const [newSubgoalTitle, setNewSubgoalTitle] = useState('');

  // Hent bucket-kategorier
  useEffect(() => {
    supabase
      .from('bucket_categories')
      .select('id,name')
      .then(({ data }) => data && setCategories(data));
  }, []);

  // Sæt default kategori
  useEffect(() => {
    if (categories.length > 0 && !newBucketCat) {
      setNewBucketCat(categories[0].id);
    }
  }, [categories]);

  if (loading) return <p className="p-4 text-center">Indlæser…</p>;

  const today = new Date().toISOString().slice(0, 10);

  const handleAddBucket = async () => {
    if (!newBucketTitle.trim() || !newBucketCat) return;
    await addBucket(newBucketTitle.trim(), '', newBucketCat);
    setNewBucketTitle('');
  };

  const handleAddSubgoal = (bucketId: string) => {
    if (!newSubgoalTitle.trim()) return;
    addSubgoal(bucketId, newSubgoalTitle.trim());
    setNewSubgoalTitle('');
  };

  return (
    <div className="px-4 py-6">
      {/* Opret nyt mål */}
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <input
          type="text"
          placeholder="Ny bucket"
          value={newBucketTitle}
          onChange={e => setNewBucketTitle(e.target.value)}
          className="flex-1 border rounded px-3 py-2"
        />
        <select
          className="border rounded px-3 py-2"
          value={newBucketCat}
          onChange={e => setNewBucketCat(e.target.value)}
        >
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        <button
          onClick={handleAddBucket}
          className="btn btn-primary"
        >
          Opret mål
        </button>
      </div>
      <div className="relative">
        {/* Lodret linje */}
        <div className="absolute left-4 top-0 bottom-0 border-l-2 border-gray-300"></div>

        {buckets.map(bucket => {
          const doneCount = bucket.goals.filter(s => s.done).length;
          const progress = bucket.goals.length
            ? Math.round((doneCount / bucket.goals.length) * 100)
            : 0;
          const date = bucket.created_at.slice(0, 10);

          return (
            <div key={bucket.id} className="mb-8 pl-8 relative">
              <div className="absolute left-0 top-1 w-3 h-3 bg-blue-600 rounded-full" />

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold truncate">
                    {bucket.title}
                  </h3>
                  <span className="text-sm text-gray-500">{date}</span>
                </div>

                <div className="w-full bg-gray-200 h-2 rounded-full mb-4">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="text-xs text-gray-600 mb-2">
                  {doneCount} / {bucket.goals.length} delmål gennemført ({progress}%)
                </div>

                <ul className="space-y-1 mb-4">
                  {bucket.goals.map(sg => (
                    <li key={sg.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={sg.done}
                        onChange={e => toggleSubgoalDone(bucket.id, sg.id, e.target.checked)}
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
                    value={newSubgoalTitle}
                    onChange={e => setNewSubgoalTitle(e.target.value)}
                    className="flex-1 border rounded px-3 py-2"
                  />
                  <button
                    onClick={() => handleAddSubgoal(bucket.id)}
                    className="btn btn-primary"
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
