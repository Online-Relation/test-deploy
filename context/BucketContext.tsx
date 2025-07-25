'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Subgoal = {
  id: string;
  title: string;
  done: boolean;
  dueDate?: string;
  owner?: string;
  image_url?: string;
};

type Bucket = {
  id: string;
  title: string;
  description: string;
  category: string;
  deadline?: string;
  created_at: string;
  goals: Subgoal[];
  image_url?: string;
};

type BucketContextType = {
  buckets: Bucket[];
  loading: boolean;
  addBucket: (
    title: string,
    description: string,
    category: string,
    deadline?: string,
    imageUrl?: string
  ) => Promise<void>;
  updateBucket: (
    id: string,
    title: string,
    description: string,
    category: string,
    deadline?: string,
    imageUrl?: string
  ) => Promise<void>;
  addSubgoal: (
    bucketId: string,
    title: string,
    dueDate?: string,
    owner?: string
  ) => Promise<void>;
  toggleSubgoalDone: (
    bucketId: string,
    subgoalId: string,
    done: boolean
  ) => Promise<void>;
  uploadSubgoalImage: (
    bucketId: string,
    subgoalId: string,
    file: File
  ) => Promise<void>;
  updateSubgoal: (
    bucketId: string,
    subgoalId: string,
    updatedFields: { title?: string; dueDate?: string; owner?: string }
  ) => Promise<void>;
  deleteSubgoal: (
    bucketId: string,
    subgoalId: string
  ) => Promise<void>;
};

const BucketContext = createContext<BucketContextType | undefined>(undefined);

export const BucketProvider = ({ children }: { children: React.ReactNode }) => {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);

  // Henter alle buckets fra Supabase
  const fetchBuckets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bucketlist_couple')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setBuckets(data as Bucket[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchBuckets();
  }, []);

  // Opretter bucket (imageUrl kan være null eller undefined)
  const addBucket = async (
    title: string,
    description: string,
    category: string,
    deadline?: string,
    imageUrl?: string
  ) => {
    const { error } = await supabase.from('bucketlist_couple').insert([
      {
        title,
        description,
        category,
        deadline,
        image_url: imageUrl || null,
      },
    ]);
    if (!error) fetchBuckets();
    else console.error('Fejl ved oprettelse af bucket:', error.message);
  };

  // Opdaterer bucket (imageUrl kan være null eller undefined)
  const updateBucket = async (
    id: string,
    title: string,
    description: string,
    category: string,
    deadline?: string,
    imageUrl?: string
  ) => {
    let updates: Partial<Bucket> = { title, description, category, deadline };
    if (imageUrl) updates.image_url = imageUrl;

    const { error } = await supabase
      .from('bucketlist_couple')
      .update(updates)
      .eq('id', id);

    if (!error) fetchBuckets();
    else console.error('Fejl ved opdatering:', error.message);
  };

  // Tilføjer subgoal til et bucket
  const addSubgoal = async (
    bucketId: string,
    title: string,
    dueDate?: string,
    owner?: string
  ) => {
    const target = buckets.find(b => b.id === bucketId);
    if (!target) return;

    const updatedGoals = [
      ...target.goals,
      {
        id: crypto.randomUUID(),
        title,
        done: false,
        dueDate,
        owner,
      },
    ];

    const { error } = await supabase
      .from('bucketlist_couple')
      .update({ goals: updatedGoals })
      .eq('id', bucketId);

    if (!error) fetchBuckets();
    else console.error('Fejl ved tilføjelse af delmål:', error.message);
  };

  // Skifter done på subgoal og logger XP hvis det er færdigt
  const toggleSubgoalDone = async (
    bucketId: string,
    subgoalId: string,
    done: boolean
  ) => {
    const target = buckets.find(b => b.id === bucketId);
    if (!target) return;

    const updatedGoals = target.goals.map(g =>
      g.id === subgoalId ? { ...g, done } : g
    );

    const { error } = await supabase
      .from('bucketlist_couple')
      .update({ goals: updatedGoals })
      .eq('id', bucketId);

    if (error) {
      console.error('Fejl ved at toggl’e delmål:', error.message);
      return;
    }

    setBuckets(prev =>
      prev.map(b =>
        b.id === bucketId ? { ...b, goals: updatedGoals } : b
      )
    );

    // XP-logik (hvis færdiggjort)
    if (done) {
      const ownerId = target.goals.find(g => g.id === subgoalId)?.owner;
      if (!ownerId) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', ownerId)
        .maybeSingle();

      const role = profileData?.role;
      if (!role) return;

      const { data: xpSetting } = await supabase
        .from('xp_settings')
        .select('xp')
        .eq('role', role)
        .eq('action', 'complete_subgoal')
        .maybeSingle();

      const xp = xpSetting?.xp || 0;

      if (xp > 0) {
        await supabase.from('xp_log').insert({
          change: xp,
          user_id: ownerId,
          role,
          description: `Delmål fuldført`,
        });
      }
    }
  };

  // Upload billede til et subgoal
  const uploadSubgoalImage = async (
    bucketId: string,
    subgoalId: string,
    file: File
  ) => {
    const ext = file.name.split('.').pop();
    const fileName = `${bucketId}_${subgoalId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('bucketlist-couple')
      .upload(`bucket-images/${fileName}`, file, { upsert: true });

    if (uploadError) {
      console.error('Fejl ved upload af billede:', uploadError.message);
      return;
    }

    const { data: publicData } = supabase.storage
      .from('bucketlist-couple')
      .getPublicUrl(`bucket-images/${fileName}`);

    const target = buckets.find(b => b.id === bucketId);
    if (!target) return;

    const updatedGoals = target.goals.map(g =>
      g.id === subgoalId ? { ...g, image_url: publicData?.publicUrl } : g
    );

    const updatedBuckets = buckets.map(b =>
      b.id === bucketId ? { ...b, goals: updatedGoals } : b
    );

    setBuckets(updatedBuckets);
  };

  // --- NYT: Opdater delmål ---
  const updateSubgoal = async (
    bucketId: string,
    subgoalId: string,
    updatedFields: { title?: string; dueDate?: string; owner?: string }
  ) => {
    const bucket = buckets.find(b => b.id === bucketId);
    if (!bucket) return;
    const updatedGoals = bucket.goals.map(sg =>
      sg.id === subgoalId ? { ...sg, ...updatedFields } : sg
    );
    await supabase
      .from('bucketlist_couple')
      .update({ goals: updatedGoals })
      .eq('id', bucketId);
    await fetchBuckets();
  };

  // --- NYT: Slet delmål ---
  const deleteSubgoal = async (bucketId: string, subgoalId: string) => {
    const bucket = buckets.find(b => b.id === bucketId);
    if (!bucket) return;
    const updatedGoals = bucket.goals.filter(sg => sg.id !== subgoalId);
    await supabase
      .from('bucketlist_couple')
      .update({ goals: updatedGoals })
      .eq('id', bucketId);
    await fetchBuckets();
  };

  return (
    <BucketContext.Provider
      value={{
        buckets,
        loading,
        addBucket,
        updateBucket,
        addSubgoal,
        toggleSubgoalDone,
        uploadSubgoalImage,
        updateSubgoal, // <-- NYT
        deleteSubgoal, // <-- NYT
      }}
    >
      {children}
    </BucketContext.Provider>
  );
};

export const useBucket = () => {
  const context = useContext(BucketContext);
  if (!context) {
    throw new Error('useBucket skal bruges inden for en BucketProvider');
  }
  return context;
};
