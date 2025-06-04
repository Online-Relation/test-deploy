// app/settings/rewards/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@supabase/auth-helpers-react';

type Reward = {
  id: number;
  title: string;
  description: string;
  required_xp: number;
  assigned_to: string;
  category: string;
  type: string;
  redeemed: boolean;
};

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requiredXp, setRequiredXp] = useState(0);
  const [assignedTo, setAssignedTo] = useState('mads');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [types, setTypes] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const user = useUser();

  useEffect(() => {
    if (!user) return;
    fetchRewards();
    fetchTypes();
    fetchCategories();
  }, [user]);

  const fetchRewards = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('redeemed', false)
      .eq('user_id', user?.id);

    if (!error && data) {
      setRewards(data);
    } else {
      console.error('Error fetching rewards:', error);
    }
  };

  const fetchTypes = async () => {
    const { data, error } = await supabase.from('fantasy_types').select('name');
    if (error) {
      console.error('Fejl ved hentning af typer:', error.message);
    } else {
      const names = data.map((entry) => entry.name);
      setTypes(names);
      if (names.length > 0) setType(names[0]);
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('gift_categories').select('name');
    if (error) {
      console.error('Fejl ved hentning af gavekategorier:', error.message);
    } else {
      const names = data.map((entry) => entry.name);
      setCategories(names);
      if (names.length > 0) setCategory(names[0]);
    }
  };

  const handleCreateReward = async () => {
    if (!user) return;
    if (!title || !requiredXp || !assignedTo || !category || !type) return;

    const { error } = await supabase.from('rewards').insert([
      {
        title,
        description,
        required_xp: requiredXp,
        assigned_to: assignedTo,
        category,
        type,
        redeemed: false,
        user_id: user.id,
      },
    ]);

    if (error) {
      console.error('Fejl ved oprettelse:', error.message);
    } else {
      setTitle('');
      setDescription('');
      setRequiredXp(0);
      setAssignedTo('mads');
      if (categories.length > 0) setCategory(categories[0]);
      if (types.length > 0) setType(types[0]);
      fetchRewards();
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Opret gave</h1>
      <div className="space-y-2 mb-6 max-w-md">
        <input
          type="text"
          placeholder="F.eks. 'Ny kjole', 'Spa-dag'"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <textarea
          placeholder="Kort beskrivelse af gaven (valgfri)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <input
          type="number"
          placeholder="XP krav for at kunne indløse gaven (fx 300)"
          value={requiredXp}
          onChange={(e) => setRequiredXp(Number(e.target.value))}
          className="w-full border p-2 rounded"
        />
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          className="w-full border p-2 rounded"
        >
          <option value="mads">Gaven gives til: Mads</option>
          <option value="stine">Gaven gives til: Stine</option>
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full border p-2 rounded"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              Kategori: {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full border p-2 rounded"
        >
          {types.map((t) => (
            <option key={t} value={t}>
              Type: {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
        <button
          onClick={handleCreateReward}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Opret gave
        </button>
      </div>

      <h2 className="text-xl font-semibold mb-2">Uindløste gaver</h2>
      <ul className="space-y-4">
        {rewards.map((reward) => (
          <li key={reward.id} className="border p-4 rounded shadow">
            <div className="font-semibold">{reward.title}</div>
            {reward.description && (
              <div className="text-sm text-gray-500 mb-1">{reward.description}</div>
            )}
            <div className="text-sm text-gray-500">XP-krav: {reward.required_xp} XP</div>
            <div className="text-sm text-gray-500">Tildelt til: {reward.assigned_to}</div>
            <div className="text-sm text-gray-500">Kategori: {reward.category}</div>
            <div className="text-sm text-gray-400 italic">Type: {reward.type}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
