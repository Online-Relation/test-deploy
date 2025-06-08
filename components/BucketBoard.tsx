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
    uploadSubgoalImage,      // hent den nye funktion
  } = useBucket();
  const [newBucket, setNewBucket] = useState('');
  const [newTitles, setNewTitles] = useState<Record<string, string>>({});
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});

  if (loading) return <p>Loader data…</p>;

  return (
    <div>
      {/* Opret ny bucket */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Ny bucket"
          value={newBucket}
          onChange={e => setNewBucket(e.target.value)}
          className="flex-1 border px-2 py-1 rounded"
        />
        <button
          onClick={() => {
            if (!newBucket.trim()) return;
            addBucket(newBucket.trim());
            setNewBucket('');
          }}
          className="px-4 py-1 bg-purple-600 text-white rounded"
        >
          Opret
        </button>
      </div>

      {/* Bucket-kort */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {buckets.map(bucket => {
          const doneCount = bucket.goals.filter(s => s.done).length;
          const progress = Math.round((doneCount / bucket.goals.length) * 100);
          const isFlipped = flipped[bucket.id] || false;

          return (
            <motion.div
              key={bucket.id}
              className="relative w-full h-80 perspective group"
              onClick={() =>
                setFlipped(prev => ({ ...prev, [bucket.id]: !prev[bucket.id] }))
              }
              whileHover={{ scale: 1.03 }}
            >
              {/* FRONT */}
              <motion.div
                className="absolute inset-0 bg-white rounded-2xl shadow-lg overflow-hidden backface-hidden flex flex-col"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* Vis billede hvis det findes */}
                {bucket.goals[0]?.image_url && (
                  <img
                    src={bucket.goals[0].image_url}
                    alt=""
                    className="w-full h-32 object-cover"
                  />
                )}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <h3 className="text-xl font-bold">{bucket.title}</h3>
                  <div>
                    <div className="w-full bg-gray-200 h-2 rounded-full mb-2">
                      <div
                        className="h-2 rounded-full bg-purple-600"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      {doneCount} / {bucket.goals.length} gennemført
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* BACK */}
              <motion.div
                className="absolute inset-0 bg-white rounded-2xl shadow-lg p-4 backface-hidden rotateY-180 flex flex-col"
                animate={{ rotateY: isFlipped ? 0 : -180 }}
                transition={{ duration: 0.6 }}
              >
                <h4 className="text-md font-semibold mb-2">Delmål & Billeder</h4>
                <ul className="space-y-2 flex-1 overflow-auto mb-4">
                  {bucket.goals.map(sg => (
                    <li key={sg.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={sg.done}
                        onChange={e =>
                          toggleSubgoalDone(bucket.id, sg.id, e.target.checked)
                        }
                        className="form-checkbox h-5 w-5 text-purple-600"
                      />
                      <span className={sg.done ? 'line-through text-gray-400' : ''}>
                        {sg.title}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Upload billede til første delmål som demo */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Tilføj billede til første delmål
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async e => {
                      const file = e.target.files?.[0];
                      if (!file || bucket.goals.length === 0) return;
                      await uploadSubgoalImage(bucket.id, bucket.goals[0].id, file);
                    }}
                    className="block w-full text-sm text-gray-500"
                  />
                </div>

                {/* Tilføj nyt delmål */}
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
                      const title = newTitles[bucket.id]?.trim();
                      if (!title) return;
                      addSubgoal(bucket.id, title);
                      setNewTitles(prev => ({ ...prev, [bucket.id]: '' }));
                    }}
                    className="px-3 py-1 bg-purple-600 text-white rounded"
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
