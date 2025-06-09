// /app/bucketlist-couple/page.tsx
'use client';

import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import BucketFilter, { PeriodKey } from '@/components/BucketFilter';
import BucketCard from '@/components/BucketCard';
import { BucketProvider, useBucket } from '@/context/BucketContext';

function BucketGrid() {
  const { buckets, addBucket, addSubgoal, toggleSubgoalDone } = useBucket();
  const [period, setPeriod] = useState<PeriodKey>('1m');
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newBucketTitle, setNewBucketTitle] = useState('');
  const [newSubgoalTitle, setNewSubgoalTitle] = useState('');

  // TODO: filtrér buckets efter period
  const display = buckets;

  return (
    <>
      <BucketFilter current={period} onChange={setPeriod} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {display.map(bucket => (
          <BucketCard
            key={bucket.id}
            title={bucket.title}
            category="Kategori" // TODO: brug bucket.category hvis tilføjet
            imageUrl={bucket.goals[0]?.image_url}
            onClick={() => {
              setActiveId(bucket.id);
              setOpen(true);
              setNewSubgoalTitle('');
            }}
          />
        ))}

        {/* Kort til at oprette nyt mål */}
        <div
          onClick={() => {
            setActiveId(null);
            setOpen(true);
            setNewBucketTitle('');
          }}
          className="flex items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer hover:border-gray-400 transition"
        >
          + Ny mål
        </div>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} className="fixed inset-0 z-50">
        <div className="flex items-center justify-center h-full p-4">
          <Dialog.Panel className="bg-white rounded-lg p-6 w-full max-w-lg mx-auto">
            {activeId ? (
              <>
                <Dialog.Title className="text-xl font-bold mb-4">Delmål</Dialog.Title>
                <div className="space-y-2 max-h-60 overflow-auto mb-4">
                  {buckets
                    .find(b => b.id === activeId)
                    ?.goals.map(sg => (
                      <div key={sg.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={sg.done}
                          onChange={e =>
                            toggleSubgoalDone(activeId, sg.id, e.target.checked)
                          }
                          className="h-4 w-4 text-blue-600"
                        />
                        <span className={sg.done ? 'line-through text-gray-400' : ''}>
                          {sg.title}
                        </span>
                      </div>
                    ))}
                </div>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Nyt delmål"
                    className="flex-1 border rounded px-3 py-2"
                    value={newSubgoalTitle}
                    onChange={e => setNewSubgoalTitle(e.target.value)}
                  />
                  <button
                    onClick={() => {
                      if (newSubgoalTitle.trim()) {
                        addSubgoal(activeId, newSubgoalTitle.trim());
                        setNewSubgoalTitle('');
                      }
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                  >
                    Tilføj delmål
                  </button>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="mt-2 text-right text-gray-500"
                >
                  Luk
                </button>
              </>
            ) : (
              <>
                <Dialog.Title className="text-xl font-bold mb-4">
                  Opret nyt mål
                </Dialog.Title>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Titel"
                    className="flex-1 border rounded px-3 py-2"
                    value={newBucketTitle}
                    onChange={e => setNewBucketTitle(e.target.value)}
                  />
                  <button
                    onClick={() => {
                      if (newBucketTitle.trim()) {
                        addBucket(newBucketTitle.trim());
                        setOpen(false);
                      }
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded"
                  >
                    Opret
                  </button>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="mt-2 text-right text-gray-500"
                >
                  Annuller
                </button>
              </>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}

export default function BucketlistCouplePage() {
  return (
    <BucketProvider>
      <div className="max-w-screen-lg mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Bucketlist for Par</h1>
        <BucketGrid />
      </div>
    </BucketProvider>
  );
}
