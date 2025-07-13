// /lib/uploadImageToSupabase.ts
import { supabase } from './supabaseClient';

export async function uploadImageToSupabase(file: File, userId: string) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}_dashboard_${Date.now()}.${fileExt}`;
  const filePath = `dashboard-banners/${fileName}`;

  let { error } = await supabase.storage
    .from('dashboard')
    .upload(filePath, file);

  if (error) {
    throw error;
  }

  const { data } = supabase
    .storage
    .from('dashboard')
    .getPublicUrl(filePath);

  return data.publicUrl;
}
