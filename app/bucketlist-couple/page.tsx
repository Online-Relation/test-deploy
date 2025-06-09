// /app/bucketlist-couple/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import BucketFilter, { PeriodKey } from '@/components/BucketFilter';
import BucketCard from '@/components/BucketCard';
import BucketTimeline from '@/components/BucketTimeline';
import { BucketProvider, useBucket } from '@/context/BucketContext';
import { supabase } from '@/lib/supabaseClient';

function BucketGrid() {
  const { buckets, addBucket, updateBucket, addSubgoal, toggleSubgoalDone, uploadSubgoalImage } = useBucket();
  const [period, setPeriod] = useState<PeriodKey>('1m');
  const [open, setOpen] = useState(false);
  const [activeBucketId, setActiveBucketId] = useState<string | null>(null);
  const [newBucketTitle, setNewBucketTitle] = useState('');
  const [newBucketDesc, setNewBucketDesc] = useState('');
  const [newBucketCat, setNewBucketCat] = useState('');
  const [newSubgoalTitle, setNewSubgoalTitle] = useState('');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    supabase
      .from('bucket_categories')
      .select('id,name')
      .then(({ data }) => data && setCategories(data));
  }, []);

  useEffect(() => {
    if (categories.length > 0 && !newBucketCat) {
      setNewBucketCat(categories[0].id);
    }
  }, [categories]);

  const displayBuckets = buckets;

  return (
    <>
      <BucketFilter current={period} onChange={setPeriod} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayBuckets.map(bucket => (
          <BucketCard
            key={bucket.id}
            title={bucket.title}
            category={categories.find(c => c.id === bucket.category)?.name}
            imageUrl={bucket.goals[0]?.image_url}
            description={bucket.description}
            onClick={() => {
              setActiveBucketId(bucket.id);
              setNewBucketTitle(bucket.title);
              setNewBucketDesc(bucket.description);
              setNewBucketCat(bucket.category);
              setNewSubgoalTitle('');
              setOpen(true);
            }}
          />
        ))}

        <div
          onClick={() => {
            setActiveBucketId(null);
            setNewBucketTitle('');
            setNewBucketDesc('');
            setNewBucketCat(categories[0]?.id || '');
            setNewSubgoalTitle('');
            setOpen(true);
          }}
          className="flex items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer hover:border-gray-400 transition"
        >
          + Ny mål
        </div>
      </div>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      >
        <Dialog.Panel className="bg-white rounded-lg p-6 w-full max-w-lg mx-auto">
          {activeBucketId ? (
            <>
              <Dialog.Title className="text-xl font-bold mb-4">Redigér mål</Dialog.Title>

              <label className="block mb-1 font-medium">Kategori</label>
              <select
                className="w-full border rounded px-3 py-2 mb-4"
                value={newBucketCat}
                onChange={e => setNewBucketCat(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              <label className="block mb-1 font-medium">Beskrivelse</label>
              <textarea
                className="w-full border rounded px-3 py-2 mb-4"
                value={newBucketDesc}
                onChange={e => setNewBucketDesc(e.target.value)}
                rows={3}
              />

              <div className="space-y-2 max-h-40 overflow-auto mb-4">
                {buckets
                  .find(b => b.id === activeBucketId)!
                  .goals.map(sg => (
                    <div key={sg.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={sg.done}
                        onChange={e => toggleSubgoalDone(activeBucketId, sg.id, e.target.checked)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span className={sg.done ? 'line-through text-gray-400' : ''}>{sg.title}</span>
                    </div>
                  ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (file && activeBucketId) {
                      // Upload image for first subgoal
                      const firstSubgoal = buckets.find(b => b.id === activeBucketId)!.goals[0];
                      if (firstSubgoal) {
                        await uploadSubgoalImage(activeBucketId, firstSubgoal.id, file);
                      }
                    }
                  }}
                  className="text-sm text-gray-600"
                />
                <input
                  type="text"
                  placeholder="Nyt delmål"
                  className="flex-1 border rounded px-3 py-2"
                  value={newSubgoalTitle}
                  onChange={e => setNewSubgoalTitle(e.target.value)}
                />
                <button
                  onClick={() => {
                    if (newSubgoalTitle.trim() && activeBucketId) {
                      addSubgoal(activeBucketId, newSubgoalTitle.trim());
                      setNewSubgoalTitle('');
                    }
                  }}
                  className="btn btn-primary"
                >
                  Tilføj delmål
                </button>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={async () => {
                    await updateBucket(
                      activeBucketId!,
                      newBucketTitle.trim(),
                      newBucketDesc.trim(),
                      newBucketCat
                    );
                    setOpen(false);
                  }}
                  className="btn btn-primary"
                >
                  Gem ændringer
                </button>
                <button onClick={() => setOpen(false)} className="btn btn-outline">Luk</button>
              </div>
            </>
          ) : (
            <>
              <Dialog.Title className="text-xl font-bold mb-4">Opret nyt mål</Dialog.Title>
              <div className="space-y-4 mb-4">
                <input
                  type="text"
                  placeholder="Titel"
                  className="w-full border rounded px-3 py-2"
                  value={newBucketTitle}
                  onChange={e => setNewBucketTitle(e.target.value)}
                />
                <select
                  className="w-full border rounded px-3 py-2"
                  value={newBucketCat}
                  onChange={e => setNewBucketCat(e.target.value)}
                >
                  <option value="" disabled>Vælg kategori</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <textarea
                  placeholder="Beskrivelse"
                  className="w-full border rounded px-3 py-2 h-24"
                  value={newBucketDesc}
                  onChange={e => setNewBucketDesc(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={async () => {
                    if (newBucketTitle.trim()) {
                      await addBucket(
                        newBucketTitle.trim(),
                        newBucketDesc.trim(),
                        newBucketCat
                      );
                      setOpen(false);
                    }
                  }}
                  className="btn btn-primary"
                >
                  Opret
                </button>
                <button onClick={() => setOpen(false)} className="btn btn-outline">Annuller</button>
              </div>
            </>
          )}
        </Dialog.Panel>
      </Dialog>
    </>
  );
}

export default function BucketlistCouplePage() {
  const [view, setView] = useState<'timeline' | 'board'>('board');
  return (
    <BucketProvider>
      <div className="max-w-screen-lg mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4 text-center sm:text-left">
          Bucketlist for Par
        </h1>
        <div className="flex gap-4 mb-6 justify-center sm:justify-start">
          <button onClick={() => setView('timeline')} className={`btn ${view === 'timeline' ? 'btn-primary' : 'btn-outline'}`}>Timeline</button>
          <button onClick={() => setView('board')} className={`btn ${view === 'board' ? 'btn-primary' : 'btn-outline'}`}>Board</button>
        </div>
        {view === 'timeline' ? <BucketTimeline /> : <BucketGrid />}
      </div>
    </BucketProvider>
  );
}
