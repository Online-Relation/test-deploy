'use client';
import React, { createContext, useContext, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Bucket = {
  id: string;
  title: string;
  description: string;
  category: string;
  deadline?: string;
  image_url?: string;
};

type BucketContextProps = {
  buckets: Bucket[];
  addBucket: (
    title: string,
    desc: string,
    cat: string,
    deadline?: string,
    imageUrl?: string
  ) => Promise<void>;
  updateBucket: (
    id: string,
    title: string,
    desc: string,
    cat: string,
    deadline?: string,
    imageUrl?: string
  ) => Promise<void>;
  // ...resten af dine context metoder
};

const BucketContext = createContext<BucketContextProps | undefined>(undefined);

export function BucketProvider({ children }: { children: React.ReactNode }) {
  const [buckets, setBuckets] = useState<Bucket[]>([]);

  const fetchBuckets = async () => {
    const { data, error } = await supabase.from("bucketlist").select("*");
    if (!error && data) setBuckets(data);
  };

  // Denne version bruger kun imageUrl
  const addBucket = async (
    title: string,
    desc: string,
    cat: string,
    deadline?: string,
    imageUrl?: string
  ) => {
    await supabase.from("bucketlist").insert([
      {
        title,
        description: desc,
        category: cat,
        deadline,
        image_url: imageUrl || null,
      },
    ]);
    await fetchBuckets();
  };

  const updateBucket = async (
    id: string,
    title: string,
    desc: string,
    cat: string,
    deadline?: string,
    imageUrl?: string
  ) => {
    await supabase
      .from("bucketlist")
      .update({
        title,
        description: desc,
        category: cat,
        deadline,
        image_url: imageUrl || null,
      })
      .eq("id", id);
    await fetchBuckets();
  };

  // ...her evt. addSubgoal, toggleSubgoalDone, uploadSubgoalImage osv.

  return (
    <BucketContext.Provider
      value={{
        buckets,
        addBucket,
        updateBucket,
        // ...resten af context
      }}
    >
      {children}
    </BucketContext.Provider>
  );
}

export function useBucket() {
  const context = useContext(BucketContext);
  if (!context) throw new Error("useBucket must be used within a BucketProvider");
  return context;
}