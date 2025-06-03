'use client';

import { useEffect, useState } from 'react';
import { useXp } from '@/context/XpContext';
import { supabase } from '@/lib/supabaseClient';

type Reward = {
  id: string;
  title: string;
  required_xp: number;
};

export default function SettingsPage() {
  const { xp } = useXp();

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [newReward, setNewReward] = useState({ title: '', required_xp: 0 });
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [editedReward, setEditedReward] = useState({ title: '', required_xp: 0 });

  const [fantasyCategories, setFantasyCategories] = useState<string[]>([]);
  const [dateCategories, setDateCategories] = useState<string[]>([]);
  const [newFantasyCategory, setNewFantasyCategory] = useState('');
  const [newDateCategory, setNewDateCategory] = useState('');

  // Hent rewards fra Supabase
  useEffect(() => {
    const fetchRewards = async () => {
      const { data, error } = await supabase.from('rewards').select('*');
      if (data) setRewards(data);
      if (error) console.error('Fejl ved hentning af rewards:', error.message);
    };
    fetchRewards();
  }, []);

  // Hent kategorier fra Supabase
  useEffect(() => {
    const fetchCategories = async () => {
      const [fantasyRes, dateRes] = await Promise.all([
        supabase.from('fantasy_categories').select('*'),
        supabase.from('date_categories').select('*'),
      ]);

      if (fantasyRes.data) setFantasyCategories(fantasyRes.data.map(c => c.name));
      if (fantasyRes.error) console.error('Fejl ved fantasy kategorier:', fantasyRes.error.message);
      if (dateRes.data) setDateCategories(dateRes.data.map(c => c.name));
      if (dateRes.error) console.error('Fejl ved date kategorier:', dateRes.error.message);
    };
    fetchCategories();
  }, []);

  const addReward = async () => {
    if (!newReward.title.trim() || newReward.required_xp <= 0) return;
    const { data, error } = await supabase.from('rewards').insert([{ ...newReward }]).select();
    if (data) setRewards(prev => [...prev, data[0]]);
    if (error) console.error('Fejl ved tilføjelse af præmie:', error.message);
    setNewReward({ title: '', required_xp: 0 });
  };

  const deleteReward = async (id: string) => {
    const { error } = await supabase.from('rewards').delete().eq('id', id);
    if (!error) setRewards(rewards.filter((r) => r.id !== id));
  };

  const updateReward = async () => {
    if (!editingRewardId) return;
    const { error } = await supabase
      .from('rewards')
      .update(editedReward)
      .eq('id', editingRewardId);
    if (!error) {
      setRewards(prev => prev.map(r => r.id === editingRewardId ? { ...r, ...editedReward } : r));
      setEditingRewardId(null);
    }
  };

  const addFantasyCategory = async () => {
    if (!newFantasyCategory.trim()) return;
    const { data, error } = await supabase.from('fantasy_categories').insert([{ name: newFantasyCategory.trim() }]).select();
    if (data) setFantasyCategories(prev => [...prev, data[0].name]);
    if (error) console.error('Fejl ved tilføjelse af fantasy kategori:', error.message);
    setNewFantasyCategory('');
  };

  const deleteFantasyCategory = async (name: string) => {
    const { error } = await supabase.from('fantasy_categories').delete().eq('name', name);
    if (!error) setFantasyCategories(prev => prev.filter(cat => cat !== name));
  };

  const addDateCategory = async () => {
    if (!newDateCategory.trim()) return;
    const { data, error } = await supabase.from('date_categories').insert([{ name: newDateCategory.trim() }]).select();
    if (data) setDateCategories(prev => [...prev, data[0].name]);
    if (error) console.error('Fejl ved tilføjelse af date kategori:', error.message);
    setNewDateCategory('');
  };

  const deleteDateCategory = async (name: string) => {
    const { error } = await supabase.from('date_categories').delete().eq('name', name);
    if (!error) setDateCategories(prev => prev.filter(cat => cat !== name));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">⚙️ Indstillinger</h1>

      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4">🎁 Dine præmier</h2>
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-4">
          <input type="text" placeholder="Præmietitel" value={newReward.title} onChange={(e) => setNewReward({ ...newReward, title: e.target.value })} className="border p-2 rounded flex-1" />
          <select className="border p-2 rounded w-40" onChange={(e) => {
            const type = e.target.value;
            let suggestedXp = 100;
            if (type === 'Mellem') suggestedXp = 300;
            else if (type === 'Stor') suggestedXp = 500;
            setNewReward({ ...newReward, required_xp: suggestedXp });
          }}>
            <option value="">Vælg type</option>
            <option value="Lille">Lille gave</option>
            <option value="Mellem">Mellem gave</option>
            <option value="Stor">Stor gave</option>
          </select>
          <input type="number" placeholder="XP krav" value={newReward.required_xp} onChange={(e) => setNewReward({ ...newReward, required_xp: parseInt(e.target.value) })} className="border p-2 rounded w-32" />
          <button onClick={addReward} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Tilføj</button>
        </div>

        {rewards.length > 0 ? (
          <ul className="space-y-2">
            {rewards.map((reward) => (
              <li key={reward.id} className="border p-3 rounded flex justify-between items-center">
                <span>{reward.title} ({reward.required_xp} XP)</span>
                <div className="flex gap-2 items-center">
                  <span className={`text-sm font-medium ${xp >= reward.required_xp ? 'text-green-600' : 'text-gray-400'}`}>
                    {xp >= reward.required_xp ? '🎉 Klar til indløsning' : `Mangler ${reward.required_xp - xp} XP`}
                  </span>
                  <button onClick={() => { setEditingRewardId(reward.id); setEditedReward({ title: reward.title, required_xp: reward.required_xp }); }} className="text-blue-600 hover:text-blue-800 text-sm">Rediger</button>
                  <button onClick={() => deleteReward(reward.id)} className="text-red-500 hover:text-red-700 text-sm">Slet</button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">Du har ikke oprettet nogen præmier endnu.</p>
        )}

        {editingRewardId && (
          <div className="mt-6 border-t pt-4">
            <h3 className="font-semibold mb-2">Rediger præmie</h3>
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <input type="text" value={editedReward.title} onChange={(e) => setEditedReward({ ...editedReward, title: e.target.value })} className="border p-2 rounded flex-1" />
              <input type="number" value={editedReward.required_xp} onChange={(e) => setEditedReward({ ...editedReward, required_xp: parseInt(e.target.value) || 0 })} className="border p-2 rounded w-32" />
              <button onClick={updateReward} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Gem ændringer</button>
              <button onClick={() => setEditingRewardId(null)} className="text-gray-600 hover:text-gray-800 text-sm">Annuller</button>
            </div>
          </div>
        )}
      </div>

      {/* Fantasy kategorier */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4">🏷️ Kategorier til fantasier</h2>
        <div className="flex gap-4 mb-4">
          <input type="text" placeholder="Ny kategori" value={newFantasyCategory} onChange={(e) => setNewFantasyCategory(e.target.value)} className="border p-2 rounded flex-1" />
          <button onClick={addFantasyCategory} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Tilføj</button>
        </div>
        <ul className="flex flex-wrap gap-2">
          {fantasyCategories.map((cat, idx) => (
            <li key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm flex items-center gap-2">
              {cat}
              <button onClick={() => deleteFantasyCategory(cat)} className="text-red-500 hover:text-red-700">×</button>
            </li>
          ))}
        </ul>
      </div>

      {/* Date kategorier */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4">🏷️ Kategorier til dates</h2>
        <div className="flex gap-4 mb-4">
          <input type="text" placeholder="Ny kategori" value={newDateCategory} onChange={(e) => setNewDateCategory(e.target.value)} className="border p-2 rounded flex-1" />
          <button onClick={addDateCategory} className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700">Tilføj</button>
        </div>
        <ul className="flex flex-wrap gap-2">
          {dateCategories.map((cat, idx) => (
            <li key={idx} className="bg-pink-100 text-pink-800 px-3 py-1 rounded text-sm flex items-center gap-2">
              {cat}
              <button onClick={() => deleteDateCategory(cat)} className="text-red-500 hover:text-red-700">×</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}