import { supabase } from './supabaseClient';

export async function uploadImageToSupabase(
  file: File,
  userId: string,
  bucket: string = "dashboard" // default bucket
) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}_dashboard_${Date.now()}.${fileExt}`;
  const filePath = `dashboard-banners/${fileName}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return data.publicUrl;
}
