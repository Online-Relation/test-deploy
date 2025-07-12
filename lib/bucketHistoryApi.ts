// /lib/bucketHistoryApi.ts

import { supabase } from '@/lib/supabaseClient';

// Hent alle noter til et bucket
export async function getBucketNotes(bucketId: string) {
  const { data, error } = await supabase
    .from('bucket_history')
    .select('*')
    .eq('bucket_id', bucketId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// Tilføj et nyt notat
// /lib/bucketHistoryApi.ts

export async function addBucketNote(bucketId: string, note: string, userId: string) {
  console.log("PRØVER INSERT TIL bucket_history:", { bucketId, note, userId });
  const { data, error } = await supabase
    .from('bucket_history')
    .insert([{ bucket_id: bucketId, note, created_by: userId }])
    .select()
    .single();

  console.log("RESULTAT FRA SUPABASE INSERT:", { data, error });

  if (error) {
    console.error("Supabase insert error:", error);
    alert("Supabase insert error: " + error.message);
    throw error;
  }
  return data;
}



// Redigér et notat
export async function updateBucketNote(noteId: string, newText: string) {
  const { data, error } = await supabase
    .from('bucket_history')
    .update({ note: newText, updated_at: new Date().toISOString() })
    .eq('id', noteId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Slet et notat
export async function deleteBucketNote(noteId: string) {
  const { error } = await supabase
    .from('bucket_history')
    .delete()
    .eq('id', noteId);
  if (error) throw error;
  return true;
}
