// /context/BucketContext.tsx
'use client';

// /context/BucketContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Navnet på din Supabase Storage bucket – ERSTAT 'DIN_BUCKET_NAVN' med det korrekte bucket-navn
const STORAGE_BUCKET = 'bucketlist-couple';

export interface Subgoal {
  id: string;
  title: string;
  done: boolean;
  dueDate?: string;
  image_url?: string;
}

export interface Bucket {
  id: string;
  title: string;
  description: string;
  category: string;
  goals: Subgoal[];
  created_at: string;
}

interface BucketContextType {
  buckets: Bucket[];
  loading: boolean;
  addBucket: (title: string, description: string, category: string) => Promise<void>;
  updateBucket: (id: string, title: string, description: string, category: string) => Promise<void>;
  addSubgoal: (bucketId: string, title: string) => Promise<void>;
  toggleSubgoalDone: (bucketId: string, subgoalId: string, done: boolean) => Promise<void>;
  uploadSubgoalImage: (bucketId: string, subgoalId: string, file: File) => Promise<void>;
}

const BucketContext = createContext<BucketContextType | undefined>(undefined);

export const BucketProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);

  // Hent alle buckets
  const fetchBuckets = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('bucketlist_couple').select('*');
    if (error) console.error('Error fetching buckets:', error.message);
    else setBuckets((data as Bucket[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchBuckets();
  }, []);

  // Opret ny bucket med kategori
  const addBucket = async (title: string, description: string, category: string) => {
    if (!category) {
      console.error('Vælg en kategori før oprettelse.');
      return;
    }
    const payload = { title, description, category, goals: [] };
    const { data, error } = await supabase
      .from('bucketlist_couple')
      .insert(payload)
      .select('*')
      .single();
    if (error) console.error('Error adding bucket:', error.message);
    else setBuckets(prev => [...prev, data as Bucket]);
  };

  // Opdater eksisterende bucket
  const updateBucket = async (id: string, title: string, description: string, category: string) => {
    const { data, error } = await supabase
      .from('bucketlist_couple')
      .update({ title, description, category })
      .eq('id', id)
      .select('*')
      .single();
    if (error) console.error('Error updating bucket:', error.message);
    else setBuckets(prev => prev.map(b => (b.id === id ? (data as Bucket) : b)));
  };

  // Tilføj delmål
  const addSubgoal = async (bucketId: string, title: string) => {
    const bucket = buckets.find(b => b.id === bucketId);
    if (!bucket) return;
    const newSubgoal: Subgoal = { id: crypto.randomUUID(), title, done: false };
    const updatedGoals = [...bucket.goals, newSubgoal];
    const { data, error } = await supabase
      .from('bucketlist_couple')
      .update({ goals: updatedGoals })
      .eq('id', bucketId)
      .select('*')
      .single();
    if (error) console.error('Error adding subgoal:', error.message);
    else setBuckets(prev => prev.map(b => (b.id === bucketId ? { ...b, goals: (data as Bucket).goals } : b)));
  };

  // Toggle delmålsdone
  const toggleSubgoalDone = async (bucketId: string, subgoalId: string, done: boolean) => {
    const bucket = buckets.find(b => b.id === bucketId);
    if (!bucket) return;
    const updatedGoals = bucket.goals.map(s => (s.id === subgoalId ? { ...s, done } : s));
    const { data, error } = await supabase
      .from('bucketlist_couple')
      .update({ goals: updatedGoals })
      .eq('id', bucketId)
      .select('*')
      .single();
    if (error) console.error('Error toggling subgoal:', error.message);
    else setBuckets(prev => prev.map(b => (b.id === bucketId ? { ...b, goals: (data as Bucket).goals } : b)));
  };

  // Upload billede for delmål
  const uploadSubgoalImage = async (bucketId: string, subgoalId: string, file: File) => {
    const filePath = `${bucketId}/${subgoalId}/${file.name}`;
    const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, file, { upsert: true });
    if (uploadError) {
      console.error('Upload error:', uploadError.message);
      return;
    }
    const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
    const publicUrl = urlData.publicUrl;
    const bucket = buckets.find(b => b.id === bucketId);
    if (!bucket) return;
    const updatedGoals = bucket.goals.map(s => (s.id === subgoalId ? { ...s, image_url: publicUrl } : s));
    const { data, error } = await supabase
      .from('bucketlist_couple')
      .update({ goals: updatedGoals })
      .eq('id', bucketId)
      .select('*')
      .single();
    if (error) console.error('Error saving image_url:', error.message);
    else setBuckets(prev => prev.map(b => (b.id === bucketId ? { ...b, goals: (data as Bucket).goals } : b)));
  };

  return (
    <BucketContext.Provider value={{
      buckets,
      loading,
      addBucket,
      updateBucket,
      addSubgoal,
      toggleSubgoalDone,
      uploadSubgoalImage,
    }}>
      {children}
    </BucketContext.Provider>
  );
};

export const useBucket = () => {
  const ctx = useContext(BucketContext);
  if (!ctx) throw new Error('useBucket must be inside BucketProvider');
  return ctx;
};
