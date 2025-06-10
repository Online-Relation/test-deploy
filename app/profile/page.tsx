// /app/profile/page.tsx
'use client';

import { useEffect, useState, ChangeEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUserContext } from '@/context/UserContext';

interface Wish { id?: string; description: string; }

export default function ProfilePage() {
  const { user } = useUserContext();
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  // Tøjstørrelser
  const [sizes, setSizes] = useState({
    bh: '', trusser: '', sko: '', jeans: '', kjoler: '', nederdele: '', tshirts: '', toppe: '', buksedragt: ''
  });

  // Ønskeliste
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [savingWishes, setSavingWishes] = useState(false);

  // Indlæs profil og ønsker
  useEffect(() => {
    if (user?.avatar_url) setFileUrl(user.avatar_url);
    const fetchProfile = async () => {
      if (!user) return;
      const { data: prof } = await supabase
        .from('profiles')
        .select('bh,trusser,sko,jeans,kjoler,nederdele,tshirts,toppe,buksedragt')
        .eq('id', user.id)
        .maybeSingle();
      if (prof) {
        setSizes({
          bh: prof.bh ?? '', trusser: prof.trusser ?? '', sko: prof.sko ?? '',
          jeans: prof.jeans ?? '', kjoler: prof.kjoler ?? '', nederdele: prof.nederdele ?? '',
          tshirts: prof.tshirts ?? '', toppe: prof.toppe ?? '', buksedragt: prof.buksedragt ?? ''
        });
      }
      const { data: ws } = await supabase
        .from('wishes')
        .select('id,description')
        .eq('user_id', user.id);
      if (ws) setWishes(ws.map(w => ({ id: w.id, description: w.description })));
    };
    fetchProfile();
  }, [user]);

  // Filupload
  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}.${ext}`;
    await supabase.storage.from('avatars').remove([path]);
    const { error: upErr } = await supabase.storage.from('avatars')
      .upload(path, file, { cacheControl:'3600', contentType:file.type });
    if (upErr) { alert('Upload-fejl: '+upErr.message); setUploading(false); return; }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    const url = data.publicUrl;
    const { error: updErr } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
    if (!updErr) setFileUrl(url);
    setUploading(false);
  };

  // Gem størrelser
  const handleSaveSizes = async () => {
    if (!user) return;
    const { error } = await supabase.from('profiles').update(sizes).eq('id', user.id);
    alert(error ? 'Fejl ved opdatering af størrelser' : 'Størrelser gemt ✅');
  };

  // Wish handlers
  const addWishField = () => setWishes(prev => [...prev, { description: '' }]);
  const updateWish = (idx: number, desc: string) => {
    setWishes(prev => prev.map((w,i) => i===idx ? { ...w, description: desc } : w));
  };
  const removeWish = (idx: number) => {
    const toRemove = wishes[idx];
    if (toRemove.id) {
      supabase.from('wishes').delete().eq('id', toRemove.id);
    }
    setWishes(prev => prev.filter((_,i) => i!==idx));
  };

  const handleSaveWishes = async () => {
    if (!user) return;
    setSavingWishes(true);
    // Only insert new wishes
    const newW = wishes.filter(w => !w.id && w.description.trim());
    if (newW.length) {
      const inserts = newW.map(w => ({ user_id: user.id, description: w.description }));
      const { data: inserted, error: insertErr } = await supabase
        .from('wishes')
        .insert(inserts)
        .select('id, description');
      if (insertErr) {
        console.error('Fejl ved indsættelse af ønsker:', insertErr);
        alert('Fejl ved opdatering af ønskeliste');
        setSavingWishes(false);
        return;
      }
      // Merge newly inserted wishes with existing ones
      setWishes(prev => [
        ...prev.filter(w => w.id),
        ...inserted.map(w => ({ id: w.id, description: w.description }))
      ]);
    }
    setSavingWishes(false);
    alert('Ønskeliste opdateret ✅');
  };

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">👤 Min profil</h1>
      <div className="flex flex-col items-center">
        {fileUrl
          ? <img src={fileUrl} alt="Avatar" className="w-32 h-32 rounded-full object-cover mb-3" />
          : <div className="w-32 h-32 bg-gray-300 rounded-full mb-3" />}
        <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="text-sm" />
      </div>

      {user?.role==='stine' && <>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">👗 Mine tøjstørrelser</h2>
          {Object.entries(sizes).map(([key,label])=> (
            <div key={key}>
              <label className="block text-sm font-medium mb-1">{key}</label>
              <input type="text" value={sizes[key as keyof typeof sizes]} onChange={e=>setSizes(prev=>({...prev,[key]:e.target.value}))} className="w-full border rounded px-3 py-2" />
            </div>
          ))}
          <button onClick={handleSaveSizes} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Gem størrelser</button>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">🎁 Min ønskeliste</h2>
          {wishes.map((w, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                placeholder="Beskriv ønske"
                value={w.description}
                onChange={e=>updateWish(idx, e.target.value)}
                className="flex-grow border rounded px-3 py-2"
              />
              <button onClick={()=>removeWish(idx)} className="text-red-600">Slet</button>
            </div>
          ))}
          <button onClick={addWishField} className="w-full bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300">Tilføj ønske</button>
          <button onClick={handleSaveWishes} disabled={savingWishes} className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
            {savingWishes?'Gemmer…':'Gem ønskeliste'}
          </button>
        </div>
      </>}
    </div>
  );
}
