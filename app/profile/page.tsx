// /app/profile/page.tsx
'use client';

import { useEffect, useState, ChangeEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUserContext } from '@/context/UserContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Sizes } from '@/types/profile';
import { TabKey } from '@/types/profileTabs';
import { ProfileTabs } from '@/components/profile/ProfileTabs';
import { WishSection } from '@/components/profile/WishSection';
import { SizeSection } from '@/components/profile/SizeSection';
import { PersonalitySection } from '@/components/profile/PersonalitySection';
import { PreferencesSection } from '@/components/profile/PreferencesSection';
import { EnergySection } from '@/components/profile/EnergySection';
import { RelationshipValuesSection } from '@/components/profile/RelationshipValuesSection';

interface Wish {
  id?: string;
  description: string;
}

export default function ProfilePage() {
  const { user } = useUserContext();
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('sizes');
  const [colorOrder, setColorOrder] = useState(['red', 'yellow', 'green', 'blue']);
  const [dopaminList, setDopaminList] = useState<string[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [savingWishes, setSavingWishes] = useState(false);
  const [sizes, setSizes] = useState<Sizes>({
    bh: '', trusser: '', sko: '', jeans: '', kjoler: '', nederdele: '', tshirts: '', toppe: '', buksedragt: '',
    love_language_1: '', love_language_2: '', love_language_3: '', love_language_4: '', love_language_5: '',
    surprise_ideas: '',
    meal_1: '', meal_2: '', meal_3: '', meal_4: '', meal_5: '',
    cake_1: '', cake_2: '', cake_3: '', cake_4: '', cake_5: '',
    drink_1: '', drink_2: '', drink_3: '', drink_4: '', drink_5: '',
    personality_description: '', keyword_1: '', keyword_2: '', keyword_3: '', keyword_4: '', keyword_5: '',
    red: '', yellow: '', green: '', blue: '',
    red_description: '', yellow_description: '', green_description: '', blue_description: '',
    relationship_value_1: '', relationship_value_2: '', relationship_value_3: '', relationship_value_4: '', relationship_value_5: '',
    relationship_role: '',
    relationship_roles_order: [],
  });

  useEffect(() => {
    if (user?.avatar_url) setFileUrl(user.avatar_url);
    const fetchProfile = async () => {
      if (!user) return;
      const { data: prof } = await supabase
        .from('profiles')
        .select(`*, dopamine_triggers`)
        .eq('id', user.id)
        .maybeSingle();
      if (prof) {
        setSizes(prev => ({
          ...prev,
          ...prof,
          relationship_roles_order: prof.relationship_roles_order || [],
        }));
        const order = Object.entries({
          red: prof.red,
          yellow: prof.yellow,
          green: prof.green,
          blue: prof.blue,
        })
          .sort((a, b) => Number(a[1]) - Number(b[1]))
          .map(([color]) => color);
        if (order.length === 4) setColorOrder(order);
        const parsedList = prof.dopamine_triggers ? JSON.parse(prof.dopamine_triggers) : [];
        setDopaminList(parsedList);
      }
      const { data: ws } = await supabase
        .from('wishes')
        .select('id, description')
        .eq('user_id', user.id);
      if (ws) {
        setWishes(ws.map(w => ({ id: w.id, description: w.description })));
      }
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
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
    });
    if (upErr) {
      alert('Upload-fejl: ' + upErr.message);
      setUploading(false);
      return;
    }
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
      dopamine_triggers: JSON.stringify(dopaminList),
      red: (colorOrder.indexOf('red') + 1).toString(),
      yellow: (colorOrder.indexOf('yellow') + 1).toString(),
      green: (colorOrder.indexOf('green') + 1).toString(),
      blue: (colorOrder.indexOf('blue') + 1).toString(),
      relationship_roles_order: sizes.relationship_roles_order,
    };
    const { error } = await supabase.from('profiles').update(dataToSave).eq('id', user.id);
    alert(error ? 'Fejl ved opdatering af profil' : 'Profil gemt ✅');
  };

  const addWishField = () => setWishes(prev => [...prev, { description: '' }]);
  const updateWish = (idx: number, desc: string) => {
    setWishes(prev => prev.map((w, i) => (i === idx ? { ...w, description: desc } : w)));
  };
  const removeWish = (idx: number) => {
    const toRemove = wishes[idx];
    if (toRemove.id) {
      supabase.from('wishes').delete().eq('id', toRemove.id);
    }
    setWishes(prev => prev.filter((_, i) => i !== idx));
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
        alert('Fejl ved opdatering af ønskeliste');
        setSavingWishes(false);
        return;
      }
      setWishes(prev => [
        ...prev.filter(w => w.id),
        ...inserted.map(w => ({ id: w.id, description: w.description })),
      ]);
    }
    setSavingWishes(false);
    alert('Ønskeliste opdateret ✅');
  };

  const moveColor = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...colorOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    setColorOrder(newOrder);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col items-center text-center space-y-3">
        {fileUrl ? (
          <img src={fileUrl} alt="Avatar" className="w-28 h-28 rounded-full object-cover shadow" />
        ) : (
          <div className="w-28 h-28 bg-gray-300 rounded-full shadow" />
        )}
        <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="text-sm" />
        <div className="flex items-center gap-4 mt-2">
          <h1 className="text-3xl font-bold">Min Profil</h1>
        </div>
      </div>

      <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-6 space-y-4"
        >
          {activeTab === 'personality' && (
            <PersonalitySection
              sizes={sizes}
              setSizes={setSizes}
              colorOrder={colorOrder}
              moveColor={moveColor}
              handleSaveSizes={handleSaveSizes}
            />
          )}
          {activeTab === 'energy' && (
            <EnergySection
              dopaminList={dopaminList}
              setDopaminList={setDopaminList}
              handleSaveSizes={handleSaveSizes}
            />
          )}
          {activeTab === 'preferences' && (
            <PreferencesSection
              sizes={sizes}
              setSizes={setSizes}
              handleSaveSizes={handleSaveSizes}
            />
          )}
          {activeTab === 'relationship' && (
            <RelationshipValuesSection
              sizes={sizes}
              setSizes={setSizes}
              handleSaveSizes={handleSaveSizes}
            />
          )}
          {activeTab === 'sizes' && user?.role === 'stine' && (
            <SizeSection
              sizes={sizes}
              setSizes={setSizes}
              handleSaveSizes={handleSaveSizes}
            />
          )}
          {activeTab === 'wishes' && user?.role === 'stine' && (
            <WishSection
              wishes={wishes}
              savingWishes={savingWishes}
              addWishField={addWishField}
              updateWish={updateWish}
              removeWish={removeWish}
              handleSaveWishes={handleSaveWishes}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
