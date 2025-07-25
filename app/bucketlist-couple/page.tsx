// /app/bucketlist-couple/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X } from "lucide-react";
import BucketCard from '@/components/BucketCard';
import BucketTimeline from '@/components/BucketTimeline';
import { BucketProvider, useBucket } from '@/context/BucketContext';
import { supabase } from '@/lib/supabaseClient';
import BucketNotes from '@/components/BucketNotes';

type ViewMode = 'timeline' | 'board';

// Hjælpefunktion til billedupload
async function uploadImageToStorage(file: File): Promise<string | null> {
  if (!file) return null;
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const { error } = await supabase
    .storage
    .from('bucketlist-couple')
    .upload(fileName, file, { upsert: true });
  if (error) {
    console.error("Billedupload fejlede:", error.message);
    return null;
  }
  const { publicUrl } = supabase
    .storage
    .from('bucketlist-couple')
    .getPublicUrl(fileName).data;
  return publicUrl;
}

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

  // Opret nyt bucket med billede
  const handleAddBucket = async () => {
    if (!newBucketTitle.trim()) return;

    let uploadedImageUrl: string | undefined = imageUrl;
    if (newImageFile) {
      const url = await uploadImageToStorage(newImageFile);
      uploadedImageUrl = url ?? undefined;
    }

    await addBucket(
      newBucketTitle.trim(),
      newBucketDesc.trim(),
      newBucketCat,
      newBucketDeadline || undefined,
      uploadedImageUrl
    );

    setNewBucketTitle('');
    setNewBucketDesc('');
    setNewBucketDeadline('');
    setNewImageFile(null);
    setImageUrl('');
    setOpen(false);
  };

  // Rediger bucket med mulighed for billede
  const handleUpdateBucket = async () => {
    let uploadedImageUrl: string | undefined = imageUrl;
    if (newImageFile) {
      const url = await uploadImageToStorage(newImageFile);
      uploadedImageUrl = url ?? undefined;
    }

    await updateBucket(
      activeBucketId!,
      newBucketTitle.trim(),
      newBucketDesc.trim(),
      newBucketCat,
      newBucketDeadline || undefined,
      uploadedImageUrl
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
            goals={bucket.goals}
            users={users}
            onClick={() => {
              setActiveBucketId(bucket.id);
              setNewBucketTitle(bucket.title);
              setNewBucketDesc(bucket.description);
              setNewBucketCat(bucket.category);
              setNewBucketDeadline(bucket.deadline || '');
              setImageUrl(bucket.image_url || '');
              setNewImageFile(null);
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
        <Dialog.Panel className="bg-white rounded-lg p-6 w-full max-w-lg mx-auto space-y-6 max-h-[80vh] overflow-y-auto relative">
          {/* KRYDS/close-ikon */}
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 text-gray-500 hover:text-black transition p-1 rounded-full"
            aria-label="Luk"
            tabIndex={0}
          >
            <X size={22} />
          </button>

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
              {activeBucketId && (
                <BucketNotes bucketId={activeBucketId} />
              )}
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
      <div className="w-full mx-auto px-0 sm:px-4 py-6" style={{ paddingLeft: '0px', paddingRight: '0px' }}>
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
