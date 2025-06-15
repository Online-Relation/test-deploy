// /app/bucketlist-couple/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import BucketCard from '@/components/BucketCard';
import BucketTimeline from '@/components/BucketTimeline';
import { BucketProvider, useBucket } from '@/context/BucketContext';
import { supabase } from '@/lib/supabaseClient';

type ViewMode = 'timeline' | 'board';

function BucketGrid() {
  const {
    buckets,
    addBucket,
    updateBucket,
    addSubgoal,
    toggleSubgoalDone,
    uploadSubgoalImage,
  } = useBucket();

  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeBucketId, setActiveBucketId] = useState<string | null>(null);
  const [newBucketTitle, setNewBucketTitle] = useState('');
  const [newBucketDesc, setNewBucketDesc] = useState('');
  const [newBucketCat, setNewBucketCat] = useState('');
  const [newBucketDeadline, setNewBucketDeadline] = useState('');
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; display_name: string; avatar_url?: string }[]>([]);

  useEffect(() => {
    supabase
      .from('bucket_categories')
      .select('id,name')
      .then(({ data }) => data && setCategories(data));

    supabase
      .from('profiles')
      .select('id,display_name,avatar_url')
      .then(({ data }) => {
        if (data) setUsers(data);
      });
  }, []);

  useEffect(() => {
    if (categories.length && !newBucketCat) setNewBucketCat(categories[0].id);
  }, [categories]);

  const handleAddBucket = async () => {
    if (!newBucketTitle.trim()) return;

    await addBucket(
      newBucketTitle.trim(),
      newBucketDesc.trim(),
      newBucketCat,
      newBucketDeadline || undefined,
      newImageFile || undefined
    );

    setNewBucketTitle('');
    setNewBucketDesc('');
    setNewBucketDeadline('');
    setNewImageFile(null);
    setImageUrl('');
    setOpen(false);
  };

  const handleUpdateBucket = async () => {
    await updateBucket(
      activeBucketId!,
      newBucketTitle.trim(),
      newBucketDesc.trim(),
      newBucketCat,
      newBucketDeadline || undefined,
      newImageFile || undefined
    );

    setOpen(false);
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {buckets.map(bucket => (
          <BucketCard
            key={bucket.id}
            title={bucket.title}
            category={categories.find(c => c.id === bucket.category)?.name}
            imageUrl={bucket.image_url}
            description={bucket.description}
            onClick={() => {
              setActiveBucketId(bucket.id);
              setNewBucketTitle(bucket.title);
              setNewBucketDesc(bucket.description);
              setNewBucketCat(bucket.category);
              setNewBucketDeadline(bucket.deadline || '');
              setImageUrl(bucket.image_url || '');
              setEditMode(false);
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
            setNewBucketDeadline('');
            setNewImageFile(null);
            setImageUrl('');
            setEditMode(true);
            setOpen(true);
          }}
          className="flex items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer hover:border-gray-400 transition"
        >
          + Ny mål
        </div>
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <Dialog.Panel className="bg-white rounded-lg p-6 w-full max-w-lg mx-auto space-y-6">
          {editMode ? (
            <>
              <h2 className="text-xl font-bold">{activeBucketId ? 'Redigér mål' : 'Opret nyt mål'}</h2>
              <div className="grid grid-cols-1 gap-4">
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  placeholder="Titel"
                  value={newBucketTitle}
                  onChange={e => setNewBucketTitle(e.target.value)}
                />
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={newBucketDeadline}
                  onChange={e => setNewBucketDeadline(e.target.value)}
                />
                <select
                  className="w-full border rounded px-3 py-2"
                  value={newBucketCat}
                  onChange={e => setNewBucketCat(e.target.value)}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <textarea
                  className="w-full border rounded px-3 py-2 h-24"
                  placeholder="Beskrivelse"
                  value={newBucketDesc}
                  onChange={e => setNewBucketDesc(e.target.value)}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setNewImageFile(e.target.files?.[0] || null)}
                  className="w-full border rounded px-3 py-2"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={activeBucketId ? handleUpdateBucket : handleAddBucket}
                    className="btn btn-primary"
                  >
                    Gem
                  </button>
                  <button onClick={() => setOpen(false)} className="btn btn-outline">Luk</button>
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold">{newBucketTitle}</h2>
              {imageUrl && <img src={imageUrl} alt="Bucket" className="w-full rounded-lg" />}
              <p className="text-muted-foreground whitespace-pre-wrap">{newBucketDesc}</p>
              <p className="text-sm text-muted-foreground">Kategori: {categories.find(c => c.id === newBucketCat)?.name || 'Ukendt'}</p>
              <p className="text-sm text-muted-foreground">Deadline: {newBucketDeadline || 'Ingen'}</p>
              <div className="flex justify-end">
                <button onClick={() => setEditMode(true)} className="btn btn-outline">Rediger</button>
              </div>
            </>
          )}
        </Dialog.Panel>
      </Dialog>
    </div>
  );
}

export default function BucketlistCouplePage() {
  const [view, setView] = useState<ViewMode>('board');
  return (
    <BucketProvider>
      <div className="max-w-screen-lg mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4 text-center sm:text-left">Bucketlist for Par</h1>
        <div className="flex gap-4 mb-6 justify-center sm:justify-start">
          <button onClick={() => setView('board')} className={`btn ${view === 'board' ? 'btn-primary' : 'btn-outline'}`}>Board</button>
          <button onClick={() => setView('timeline')} className={`btn ${view === 'timeline' ? 'btn-primary' : 'btn-outline'}`}>Timeline</button>
        </div>
        {view === 'board' ? <BucketGrid /> : <BucketTimeline />}
      </div>
    </BucketProvider>
  );
}
