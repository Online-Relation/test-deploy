// /components/BucketBoard.tsx
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useBucket } from '@/context/BucketContext';

export default function BucketBoard() {
  const {
    buckets,
    loading,
    addBucket,
    addSubgoal,
    toggleSubgoalDone,
    uploadSubgoalImage,
  } = useBucket();
  const [newBucket, setNewBucket] = useState('');
  const [newTitles, setNewTitles] = useState<Record<string,string>>({});
  const [flipped, setFlipped] = useState<Record<string,boolean>>({});

  if (loading) return <p className="p-4 text-center">Indlæser…</p>;

  return (
    <div className="px-2 sm:px-4 lg:px-6">
      {/* Ny bucket-form */}
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <input
          type="text"
          placeholder="Ny bucket"
          value={newBucket}
          onChange={e => setNewBucket(e.target.value)}
          className="flex-1 border rounded px-3 py-2 focus:outline-none"
        />
        <button
          onClick={() => {
            if (!newBucket.trim()) return;
            addBucket(newBucket.trim());
            setNewBucket('');
          }}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
        >
          Opret
        </button>
      </div>

      {/* Responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {buckets.map(bucket => {
          const doneCount = bucket.goals.filter(s => s.done).length;
          const progress = Math.round((doneCount / bucket.goals.length) * 100);
          const isFlipped = flipped[bucket.id] || false;

          return (
            <motion.div
              key={bucket.id}
              className="relative w-full h-72 sm:h-64 perspective"
              onClick={() =>
                setFlipped(prev => ({ ...prev, [bucket.id]: !prev[bucket.id] }))
              }
              whileHover={{ scale: 1.02 }}
            >
              {/* FRONT */}
              <motion.div
                className="absolute inset-0 backface-hidden bg-white shadow rounded-lg overflow-hidden flex flex-col"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6 }}
              >
                {bucket.goals[0]?.image_url && (
                  <div className="h-32 w-full overflow-hidden">
                    <img
                      src={bucket.goals[0].image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <h3 className="text-lg font-bold truncate">{bucket.title}</h3>
                  <div>
                    <div className="w-full bg-gray-200 h-2 rounded mb-1">
                      <div
                        className="h-2 rounded bg-purple-600"
                        style={{ width: `${progress}%` }}
                      />
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
                        onChange={e =>
                          toggleSubgoalDone(bucket.id, sg.id, e.target.checked)
                        }
                        className="form-checkbox h-4 w-4 text-purple-600"
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
                    className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition"
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
