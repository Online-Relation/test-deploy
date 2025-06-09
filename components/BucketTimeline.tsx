// /components/BucketBoard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useBucket } from '@/context/BucketContext';
import { supabase } from '@/lib/supabaseClient';

export default function BucketBoard() {
  const { buckets, loading, addBucket, addSubgoal, toggleSubgoalDone, uploadSubgoalImage } = useBucket();
  const [newBucket, setNewBucket] = useState('');
  const [newBucketCat, setNewBucketCat] = useState('');
  const [newTitles, setNewTitles] = useState<Record<string, string>>({});
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  // Hent bucket-kategorier
  useEffect(() => {
    supabase
      .from('bucket_categories')
      .select('id,name')
      .then(({ data }) => data && setCategories(data));
  }, []);

  // Sæt default kategori når hentet
  useEffect(() => {
    if (categories.length > 0 && !newBucketCat) {
      setNewBucketCat(categories[0].id);
    }
  }, [categories]);

  if (loading) return <p className="p-4 text-center">Indlæser…</p>;

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Opret ny bucket */}
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <input
          type="text"
          placeholder="Ny bucket"
          value={newBucket}
          onChange={e => setNewBucket(e.target.value)}
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
          onClick={() => {
            if (!newBucket.trim()) return;
            if (!newBucketCat) {
              console.error('Vælg en kategori før oprettelse.');
              return;
            }
            addBucket(newBucket.trim(), '', newBucketCat);
            setNewBucket('');
          }}
          className="btn btn-primary"
        >
          Opret
        </button>
      </div>

      {/* Responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {buckets.map(bucket => {
          const doneCount = bucket.goals.filter(s => s.done).length;
          const progress = bucket.goals.length ? Math.round((doneCount / bucket.goals.length) * 100) : 0;
          const isFlipped = flipped[bucket.id] || false;

          return (
            <motion.div
              key={bucket.id}
              className="relative w-full perspective cursor-pointer"
              onClick={() => setFlipped(prev => ({ ...prev, [bucket.id]: !prev[bucket.id] }))}
              whileHover={{ scale: 1.02 }}
            >
              {/* FRONT */}
              <motion.div
                className="absolute inset-0 backface-hidden bg-white shadow rounded-lg overflow-hidden flex flex-col"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6 }}
              >
                {bucket.goals[0]?.image_url && (
                  <img
                    src={bucket.goals[0].image_url}
                    alt=""
                    className="w-full h-32 object-cover"
                  />
                )}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <h3 className="text-lg font-bold truncate">{bucket.title}</h3>
                  <div>
                    <div className="w-full bg-gray-200 h-2 rounded mb-1">
                      <div className="h-2 rounded bg-purple-600" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-xs text-gray-500">
                      {doneCount}/{bucket.goals.length} ({progress}%)
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* BACK */}
              <motion.div
                className="absolute inset-0 backface-hidden rotateY-180 bg-white shadow rounded-lg p-4 flex flex-col"
                animate={{ rotateY: isFlipped ? 0 : -180 }}
                transition={{ duration: 0.6 }}
              >
                <h4 className="font-semibold mb-2">Delmål</h4>
                <ul className="flex-1 overflow-auto space-y-1 mb-3">
                  {bucket.goals.map(sg => (
                    <li key={sg.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={sg.done}
                        onChange={e => toggleSubgoalDone(bucket.id, sg.id, e.target.checked)}
                        className="h-4 w-4 text-purple-600"
                      />
                      <span className={sg.done ? 'line-through text-gray-400' : ''}>
                        {sg.title}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async e => {
                      const file = e.target.files?.[0];
                      if (file && bucket.goals[0]) {
                        await uploadSubgoalImage(bucket.id, bucket.goals[0].id, file);
                      }
                    }}
                    className="text-sm text-gray-600"
                  />
                  <input
                    type="text"
                    placeholder="Nyt delmål"
                    value={newTitles[bucket.id] || ''}
                    onChange={e => setNewTitles(prev => ({ ...prev, [bucket.id]: e.target.value }))}
                    className="flex-1 border rounded px-2 py-1 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      const title = newTitles[bucket.id]?.trim();
                      if (!title) return;
                      addSubgoal(bucket.id, title);
                      setNewTitles(prev => ({ ...prev, [bucket.id]: '' }));
                    }}
                    className="btn btn-primary"
                  >
                    Tilføj
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
