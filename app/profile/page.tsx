// /app/profile/page.tsx
'use client';

import { useEffect, useState, ChangeEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUserContext } from '@/context/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import { DopaminList } from '@/components/DopaminList';

interface Wish { id?: string; description: string; }

export default function ProfilePage() {
  const { user } = useUserContext();
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
const [activeTab, setActiveTab] = useState<'sizes' | 'wishes' | 'preferences' | 'energy'>('sizes');


  const [sizes, setSizes] = useState({
    bh: '', trusser: '', sko: '', jeans: '', kjoler: '', nederdele: '', tshirts: '', toppe: '', buksedragt: '',
    love_language_1: '', love_language_2: '', love_language_3: '', love_language_4: '', love_language_5: '',
    surprise_ideas: ''
  });

  const [dopaminList, setDopaminList] = useState<string[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [savingWishes, setSavingWishes] = useState(false);

  useEffect(() => {
    if (user?.avatar_url) setFileUrl(user.avatar_url);
    const fetchProfile = async () => {
      if (!user) return;
      const { data: prof } = await supabase
        .from('profiles')
        .select('bh,trusser,sko,jeans,kjoler,nederdele,tshirts,toppe,buksedragt,love_language_1,love_language_2,love_language_3,love_language_4,love_language_5,dopamine_triggers,surprise_ideas')
        .eq('id', user.id)
        .maybeSingle();
      if (prof) {
        setSizes(prev => ({
          ...prev,
          ...prof,
          dopamine_triggers: undefined // ikke gemt her
        }));
        const parsedList = prof.dopamine_triggers ? JSON.parse(prof.dopamine_triggers) : [];
        setDopaminList(parsedList);
      }

      const { data: ws } = await supabase
        .from('wishes')
        .select('id,description')
        .eq('user_id', user.id);
      if (ws) setWishes(ws.map(w => ({ id: w.id, description: w.description })));
    };
    fetchProfile();
  }, [user]);

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

  const handleSaveSizes = async () => {
    if (!user) return;
    const dataToSave = {
      ...sizes,
      dopamine_triggers: JSON.stringify(dopaminList)
    };
    const { error } = await supabase.from('profiles').update(dataToSave).eq('id', user.id);
    alert(error ? 'Fejl ved opdatering af profil' : 'Profil gemt ✅');
  };

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
    const newW = wishes.filter(w => !w.id && w.description.trim());
    if (newW.length) {
      const inserts = newW.map(w => ({ user_id: user.id, description: w.description }));
      const { data: inserted, error: insertErr } = await supabase
        .from('wishes')
        .insert(inserts)
        .select('id, description');
      if (insertErr) {
        alert('Fejl ved opdatering af ønskeliste'); setSavingWishes(false); return;
      }
      setWishes(prev => [
        ...prev.filter(w => w.id),
        ...inserted.map(w => ({ id: w.id, description: w.description }))
      ]);
    }
    setSavingWishes(false);
    alert('Ønskeliste opdateret ✅');
  };

  const tabClass = (value: string) =>
    `px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
      activeTab === value ? 'bg-primary text-white shadow' : 'bg-muted text-muted-foreground hover:bg-muted/70'
    }`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col items-center text-center space-y-3">
        {fileUrl
          ? <img src={fileUrl} alt="Avatar" className="w-28 h-28 rounded-full object-cover shadow" />
          : <div className="w-28 h-28 bg-gray-300 rounded-full shadow" />}
        <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="text-sm" />
        <h1 className="text-3xl font-bold mt-2">Min Profil</h1>
      </div>

      <div className="flex justify-center gap-2 flex-wrap">
        <button onClick={() => setActiveTab('sizes')} className={tabClass('sizes')}>👗 Tøjstørrelser</button>
        <button onClick={() => setActiveTab('wishes')} className={tabClass('wishes')}>🎁 Ønskeliste</button>
        <button onClick={() => setActiveTab('preferences')} className={tabClass('preferences')}>💖 Kærlighed</button>
          <button onClick={() => setActiveTab('energy')} className={tabClass('energy')}>⚡ Energi</button>

      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-6 space-y-4"
        >
          {user?.role === 'stine' && activeTab === 'sizes' && (
            <>
              <h2 className="text-xl font-semibold">Mine tøjstørrelser</h2>
              {Object.entries(sizes).slice(0, 9).map(([key, val]) => (
                <div key={key}>
                  <label className="block text-sm font-medium capitalize mb-1">{key}</label>
                  <input
                    type="text"
                    value={val}
                    onChange={e => setSizes(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              ))}
              <button
                onClick={handleSaveSizes}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                Gem størrelser
              </button>
            </>
          )}

          {user?.role === 'stine' && activeTab === 'wishes' && (
            <>
              <h2 className="text-xl font-semibold">Min ønskeliste</h2>
              {wishes.map((w, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Beskriv ønske"
                    value={w.description}
                    onChange={e => updateWish(idx, e.target.value)}
                    className="flex-grow border rounded px-3 py-2"
                  />
                  <button onClick={() => removeWish(idx)} className="text-red-600">Slet</button>
                </div>
              ))}
              <button onClick={addWishField} className="w-full bg-gray-100 text-gray-800 py-2 rounded hover:bg-gray-200">
                Tilføj ønske
              </button>
              <button
                onClick={handleSaveWishes}
                disabled={savingWishes}
                className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
              >
                {savingWishes ? 'Gemmer…' : 'Gem ønskeliste'}
              </button>
            </>
          )}

          {activeTab === 'preferences' && (
            <>
              <h2 className="text-xl font-semibold">💖 Kærlighed</h2>
              <p className="text-sm text-gray-500 mb-4">Dine kærlighedssprog, dopamin-triggers og hvad du vil overraskes med</p>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">❤️ Kærlighedssprog</h3>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i}>
                    <label className="block text-sm font-medium mb-1">Prioritet {i + 1}</label>
                    <select
                      className="w-full border rounded px-3 py-2"
                      value={sizes[`love_language_${i + 1}` as keyof typeof sizes] || ''}
                      onChange={(e) =>
                        setSizes((prev) => ({
                          ...prev,
                          [`love_language_${i + 1}`]: e.target.value,
                        }))
                      }
                    >
                      <option value="">Vælg kærlighedssprog</option>
                      <option value="Anerkende ord">Anerkende ord</option>
                      <option value="Fysisk berøring">Fysisk berøring</option>
                      <option value="Tjenester">Tjenester</option>
                      <option value="Gaver">Gaver</option>
                      <option value="Tid sammen">Tid sammen</option>
                    </select>
                  </div>
                ))}
              </div>

              <DopaminList
                value={dopaminList}
                onChange={(list) => setDopaminList(list)}
              />

              <div className="mt-6">
                <h3 className="text-lg font-semibold">🎁 Overrask mig med…</h3>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  placeholder="Små eller store ting du gerne vil overraskes med"
                  value={sizes.surprise_ideas || ''}
                  onChange={(e) => setSizes((prev) => ({ ...prev, surprise_ideas: e.target.value }))}
                />
              </div>

              <button
                onClick={handleSaveSizes}
                className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 mt-6"
              >
                Gem kærlighedsprofil
              </button>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
