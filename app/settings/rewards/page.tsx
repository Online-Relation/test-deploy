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
  redeemed: boolean;
  redeemed_at?: string;
  user_id?: string;
};

type Wish = {
  id: string;
  description: string;
  user_id: string;
};

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redeemedRewards, setRedeemedRewards] = useState<Reward[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requiredXp, setRequiredXp] = useState(0);
  const [assignedTo, setAssignedTo] = useState('mads');
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  // Level-længde state
  const [levelLength, setLevelLength] = useState<number>(100);
  const [levelSettingId, setLevelSettingId] = useState<number | null>(null);

  // Wishes fra profiler
  const [profileWishes, setProfileWishes] = useState<Wish[]>([]);

  const user = useUser();

  useEffect(() => {
    if (!user) return;
    fetchRewards();
    fetchLevelLength();
    fetchProfileWishes();
  }, [user]);

  // Hent og opdatér level-længde
  const fetchLevelLength = async () => {
    const { data, error } = await supabase
      .from('xp_settings')
      .select('id, xp')
      .eq('action', 'level_length')
      .eq('role', 'common')
      .maybeSingle();
    if (!error && data) {
      setLevelLength(data.xp);
      setLevelSettingId(data.id);
    }
  };

  const handleLevelLengthChange = async (val: number) => {
    setLevelLength(val);
    if (!levelSettingId) return;
    await supabase
      .from('xp_settings')
      .update({ xp: val })
      .eq('id', levelSettingId);
  };

  const fetchRewards = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('rewards')
      .select('*');
    if (!error && data) {
      setRewards(data.filter(r => !r.redeemed));
      setRedeemedRewards(data.filter(r => r.redeemed));
    } else {
      console.error('Error fetching rewards:', error);
    }
  };

  // Hent ønsker fra profiler
  const fetchProfileWishes = async () => {
    const { data, error } = await supabase
      .from('wishes')
      .select('*');
    if (!error && data) {
      const wishesMapped = data.map((w: any) => ({
        id: w.id,
        description: w.description,
        user_id: w.user_id,
      }));
      setProfileWishes(wishesMapped);
    } else {
      setProfileWishes([]);
      console.error('Fejl ved hentning af ønsker:', error);
    }
  };

  // Debug output udenfor return
  console.log("profileWishes in render:", profileWishes);

  const startEdit = (reward: Reward) => {
    setEditingReward(reward);
    setTitle(reward.title);
    setDescription(reward.description || '');
    setRequiredXp(reward.required_xp);
    setAssignedTo(reward.assigned_to);
  };

  const handleSaveReward = async () => {
    console.log("handleSaveReward CALLED");
    console.log("title:", title, "| requiredXp:", requiredXp, "| assignedTo:", assignedTo);

    if (!title || !requiredXp || !assignedTo) {
      console.log("Missing required fields");
      return;
    }
    if (editingReward) {
      const { error } = await supabase.from('rewards').update({
        title,
        description,
        required_xp: requiredXp,
        assigned_to: assignedTo,
      }).eq('id', editingReward.id);

      if (error) {
        console.error('Fejl ved opdatering:', error.message);
      }
    } else {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', assignedTo)
        .maybeSingle();

      console.log("profile:", profile, "profileError:", profileError);

      if (profileError || !profile) {
        console.error('Kunne ikke finde bruger til rollen:', assignedTo);
        return;
      }

      const { error: insertError } = await supabase.from('rewards').insert([
        {
          title,
          description,
          required_xp: requiredXp,
          assigned_to: assignedTo,
          redeemed: false,
          user_id: profile.id,
        },
      ]);

      if (insertError) {
        console.error('Fejl ved oprettelse:', insertError.message);
      }
    }

    setTitle('');
    setDescription('');
    setRequiredXp(0);
    setAssignedTo('mads');
    setEditingReward(null);
    fetchRewards();
  };

  return (
    <div>
      {/* NY SEKTION I TOPPEN */}
      <div className="mb-8 border-b pb-5">
        <h2 className="text-lg font-bold mb-2">Level-indstillinger</h2>
        <label className="block text-sm mb-1">Hvor mange XP skal ét level kræve?</label>
        <input
          type="number"
          min={1}
          value={levelLength}
          onChange={e => handleLevelLengthChange(Number(e.target.value))}
          className="border px-2 py-1 rounded w-32"
        />
        <span className="ml-2 text-gray-600">XP per level</span>
      </div>

      <h1 className="text-2xl font-bold mb-4">{editingReward ? 'Rediger gave' : 'Opret gave'}</h1>

      <div className="space-y-2 mb-6 max-w-md">
        <input
          type="text"
          placeholder="F.eks. 'Ny kjole'"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <textarea
          placeholder="Beskrivelse (valgfri)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <input
          type="number"
          placeholder="XP krav"
          value={requiredXp}
          onChange={(e) => setRequiredXp(Number(e.target.value))}
          className="w-full border p-2 rounded"
        />
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          className="w-full border p-2 rounded"
        >
          <option value="mads">Mads</option>
          <option value="stine">Stine</option>
        </select>
        <button
          onClick={handleSaveReward}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {editingReward ? 'Gem ændringer' : 'Opret gave'}
        </button>
      </div>

      <h2 className="text-xl font-semibold mb-2">Uindløste gaver</h2>
      <ul className="space-y-4 mb-6">
        {rewards.map((reward) => (
          <li key={reward.id} className="border p-4 rounded shadow">
            <div className="font-semibold">{reward.title}</div>
            {reward.description && <div className="text-sm text-gray-500 mb-1">{reward.description}</div>}
            <div className="text-sm text-gray-500">XP-krav: {reward.required_xp} XP</div>
            <div className="text-sm text-gray-500">Tildelt til: {reward.assigned_to}</div>
            <button onClick={() => startEdit(reward)} className="text-sm text-blue-600 hover:underline mt-2">Rediger</button>
          </li>
        ))}
      </ul>

      <h2 className="text-xl font-semibold mb-2">🎉 Indløste gaver</h2>
      <ul className="space-y-4 mb-8">
        {redeemedRewards.map((reward) => (
          <li key={reward.id} className="border p-4 rounded shadow bg-gray-50">
            <div className="font-semibold">{reward.title}</div>
            {reward.description && <div className="text-sm text-gray-500 mb-1">{reward.description}</div>}
            <div className="text-sm text-gray-500">XP-krav: {reward.required_xp} XP</div>
            <div className="text-sm text-gray-500">Tildelt til: {reward.assigned_to}</div>
            {reward.redeemed_at && <div className="text-xs text-gray-400 mt-1">Indløst: {new Date(reward.redeemed_at).toLocaleDateString()}</div>}
          </li>
        ))}
      </ul>

      {/* NY SEKTION: Ønsker fra profiler */}
      <h2 className="text-xl font-semibold mb-2">💡 Ønsker fra profiler</h2>
      <ul className="space-y-2">
        {profileWishes.length === 0 && (
          <li className="text-gray-500 italic">Ingen ønsker fra profiler endnu.</li>
        )}
        {profileWishes.map(wish => (
          <li key={wish.id} className="border p-3 rounded bg-yellow-50 flex justify-between items-center">
            <div>
              <div className="font-medium">{wish.description}</div>
              <div className="text-xs text-gray-500">Fra bruger-id: {wish.user_id}</div>
            </div>
            {/* Knap til at konvertere til reward kan tilføjes senere */}
          </li>
        ))}
      </ul>
    </div>
  );
}
