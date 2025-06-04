// app/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUserContext } from '@/context/UserContext';

export default function ProfilePage() {
  const { user } = useUserContext();
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user?.avatar_url) setFileUrl(user.avatar_url);
  }, [user]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);

    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}.${fileExt}`;

    // Slet tidligere fil hvis den findes
    await supabase.storage.from('avatars').remove([filePath]);

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        contentType: file.type,
      });

    if (uploadError) {
      console.error(uploadError);
      alert('Upload-fejl: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const publicUrl = data.publicUrl;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    if (updateError) {
      alert('Fejl ved opdatering af profil');
    } else {
      setFileUrl(publicUrl);
    }

    setUploading(false);
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Profil</h1>

      {fileUrl ? (
        <img src={fileUrl} alt="Avatar" className="w-32 h-32 rounded-full object-cover mb-4" />
      ) : (
        <div className="w-32 h-32 bg-gray-300 rounded-full mb-4" />
      )}

      <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
    </div>
  );
}
