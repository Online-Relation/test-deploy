// /app/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUserContext } from '@/context/UserContext';

export default function ProfilePage() {
  const { user } = useUserContext();
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const [sizes, setSizes] = useState({
    bh: '',
    trusser: '',
    sko: '',
    jeans: '',
    kjoler: '',
    nederdele: '',
    tshirts: '',
    toppe: '',
  });

  useEffect(() => {
    if (user?.avatar_url) setFileUrl(user.avatar_url);

    const fetchSizes = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('bh,trusser,sko,jeans,kjoler,nederdele,tshirts,toppe,buksedragt')
        .eq('id', user.id)
        .maybeSingle();
      if (data) setSizes(data);
    };

    fetchSizes();
  }, [user]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);

    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}.${fileExt}`;
    await supabase.storage.from('avatars').remove([filePath]);

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { cacheControl: '3600', contentType: file.type });

    if (uploadError) {
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

    if (!updateError) setFileUrl(publicUrl);
    setUploading(false);
  };

  const handleSaveSizes = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update(sizes)
      .eq('id', user.id);

    if (error) {
      alert('Fejl ved opdatering af størrelser');
    } else {
      alert('Størrelser gemt ✅');
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">👤 Min profil</h1>

      <div className="flex flex-col items-center">
        {fileUrl ? (
          <img src={fileUrl} alt="Avatar" className="w-32 h-32 rounded-full object-cover mb-3" />
        ) : (
          <div className="w-32 h-32 bg-gray-300 rounded-full mb-3" />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="text-sm"
        />
      </div>

      {user?.role === 'stine' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">👗 Mine tøjstørrelser</h2>
          {[
            ['bh', 'BH-størrelse'],
            ['trusser', 'Trusser'],
            ['sko', 'Sko'],
            ['jeans', 'Jeans'],
            ['kjoler', 'Kjoler'],
            ['nederdele', 'Nederdele'],
            ['tshirts', 'T-shirts'],
            ['toppe', 'Toppe'],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1">{label}</label>
              <input
                type="text"
                value={sizes[key as keyof typeof sizes]}
                onChange={e =>
                  setSizes(prev => ({ ...prev, [key]: e.target.value }))
                }
                className="w-full border rounded px-3 py-2"
              />
            </div>
          ))}
          <button
            onClick={handleSaveSizes}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Gem størrelser
          </button>
        </div>
      )}
    </div>
  );
}
