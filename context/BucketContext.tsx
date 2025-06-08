// /context/BucketContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

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
  goals: Subgoal[];
  created_at: string;
}

interface BucketContextType {
  buckets: Bucket[];
  loading: boolean;
  addBucket: (title: string) => Promise<void>;
  addSubgoal: (bucketId: string, title: string) => Promise<void>;
  toggleSubgoalDone: (bucketId: string, subgoalId: string, done: boolean) => Promise<void>;
  uploadSubgoalImage: (bucketId: string, subgoalId: string, file: File) => Promise<void>;
}

const BucketContext = createContext<BucketContextType | undefined>(undefined);

export const BucketProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);

  // Hent initial data
  const fetchBuckets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bucketlist_couple')
      .select('*');
    if (error) {
      console.error('Error fetching buckets:', error);
    } else {
      setBuckets((data as Bucket[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBuckets();
  }, []);

  // Opret ny bucket
  const addBucket = async (title: string) => {
    const { data, error } = await supabase
      .from('bucketlist_couple')
      .insert({ title, goals: [], created_at: new Date().toISOString() })
      .select()
      .single();
    if (error) {
      console.error('Error adding bucket:', error);
    } else if (data) {
      setBuckets(prev => [...prev, data as Bucket]);
    }
  };

  // Tilføj subgoal
  const addSubgoal = async (bucketId: string, title: string) => {
    const bucket = buckets.find(b => b.id === bucketId);
    if (!bucket) return;
    const newSubgoal: Subgoal = {
      id: crypto.randomUUID(),
      title,
      done: false,
    };
    const updatedGoals = [...bucket.goals, newSubgoal];
    const { error } = await supabase
      .from('bucketlist_couple')
      .update({ goals: updatedGoals })
      .eq('id', bucketId);
    if (error) {
      console.error('Error adding subgoal:', error);
    } else {
      setBuckets(prev =>
        prev.map(b => (b.id === bucketId ? { ...b, goals: updatedGoals } : b))
      );
    }
  };

  // Skift done-status
  const toggleSubgoalDone = async (
    bucketId: string,
    subgoalId: string,
    done: boolean
  ) => {
    const bucket = buckets.find(b => b.id === bucketId);
    if (!bucket) return;
    const updatedGoals = bucket.goals.map(s =>
      s.id === subgoalId ? { ...s, done } : s
    );
    const { error } = await supabase
      .from('bucketlist_couple')
      .update({ goals: updatedGoals })
      .eq('id', bucketId);
    if (error) {
      console.error('Error toggling subgoal:', error);
    } else {
      setBuckets(prev =>
        prev.map(b => (b.id === bucketId ? { ...b, goals: updatedGoals } : b))
      );
    }
  };

  // Upload billede til et delmål
  const uploadSubgoalImage = async (
    bucketId: string,
    subgoalId: string,
    file: File
  ) => {
    // Upload til Supabase Storage
    const filePath = `${bucketId}/${subgoalId}/${file.name}`;
    const { error: uploadError } = await supabase
      .storage
      .from('bucketlist-couple')
      .upload(filePath, file, { upsert: true });
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return;
    }

    // Hent public URL
    const { data: urlData } = supabase
      .storage
      .from('bucketlist-couple')
      .getPublicUrl(filePath);
    const publicUrl = urlData.publicUrl;

    // Opdater delmåls-URL i buckets
    const bucket = buckets.find(b => b.id === bucketId);
    if (!bucket) return;
    const updatedGoals = bucket.goals.map(s =>
      s.id === subgoalId ? { ...s, image_url: publicUrl } : s
    );
    const { error } = await supabase
      .from('bucketlist_couple')
      .update({ goals: updatedGoals })
      .eq('id', bucketId);
    if (!error) {
      setBuckets(prev =>
        prev.map(b => (b.id === bucketId ? { ...b, goals: updatedGoals } : b))
      );
    } else {
      console.error('Error saving image_url:', error);
    }
  };

  return (
    <BucketContext.Provider
      value={{
        buckets,
        loading,
        addBucket,
        addSubgoal,
        toggleSubgoalDone,
        uploadSubgoalImage,
      }}
    >
      {children}
    </BucketContext.Provider>
  );
};

export const useBucket = () => {
  const ctx = useContext(BucketContext);
  if (!ctx) throw new Error('useBucket must be inside BucketProvider');
  return ctx;
};
