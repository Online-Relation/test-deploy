'use client';

import { useEffect, useState } from 'react';
import { useXp } from '@/context/XpContext';
import { supabase } from '@/lib/supabaseClient';
import { Pencil, Trash2, Check, Plus, XCircle } from 'lucide-react';

interface Reward {
  r_id: string;
  title: string;
  required_xp: number;
  type: string;
  assigned_to?: 'mads' | 'stine';
  xp_cost?: number;
  redeemed?: boolean;
  redeemed_at?: string;
  _localId: string;
}

export default function Page() {
  const { xp, addXp } = useXp();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [newReward, setNewReward] = useState({
    title: '',
    required_xp: 0,
    type: '',
    assigned_to: 'mads' as 'mads' | 'stine'
  });
  const [editingRewardKey, setEditingRewardKey] = useState<string | null>(null);
  const [editedRewards, setEditedRewards] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchRewards = async () => {
      const { data, error } = await supabase.from('rewards').select('*');
      if (error) {
        console.error('Fejl ved hentning af præmier:', error.message);
        return;
      }
      const filtered = data.filter((r) => !r.redeemed);
      setRewards(
        filtered.map((reward, index) => ({
          ...reward,
          _localId: reward.r_id ?? `temp-${index}-${Math.random()}`,
        }))
      );
    };
    fetchRewards();
  }, [xp]);

  const addReward = async () => {
    if (!newReward.title.trim() || newReward.required_xp <= 0 || !newReward.type) return;
    const { data, error } = await supabase
      .from('rewards')
      .insert([{ ...newReward, redeemed: false }])
      .select('*');
    if (!error && data) {
      setRewards((prev) => [...prev, { ...data[0], _localId: data[0].r_id }]);
      setNewReward({ title: '', required_xp: 0, type: '', assigned_to: 'mads' });
    }
  };

  const deleteReward = async (r_id: string) => {
    const { error } = await supabase.from('rewards').delete().eq('r_id', r_id);
    if (!error) setRewards(rewards.filter((r) => r.r_id !== r_id));
  };

  const updateReward = async (r_id: string | undefined, localId: string) => {
    const updated = editedRewards[localId];
    const rewardId = r_id ?? updated?.r_id;
    if (!rewardId) return;

    const { error } = await supabase.from('rewards').update(updated).eq('r_id', rewardId);
    if (!error) {
      setRewards(prev => prev.map(r => r.r_id === rewardId ? { ...r, ...updated } : r));
      setEditingRewardKey(null);
      setEditedRewards((prev) => {
        const { [localId]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const typeLabels: Record<string, string> = {
    fantasy: 'Fantasi',
    todo: 'To-do',
    date: 'Date',
    universal: 'Universel',
  };

  const groupByType = (rewards: any[]) => {
    return rewards.reduce((acc, reward) => {
      const key = reward.type || 'andet';
      if (!acc[key]) acc[key] = [];
      acc[key].push(reward);
      return acc;
    }, {} as Record<string, any[]>);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10">
      <div>
        <h1 className="text-2xl font-bold mb-4">Præmier</h1>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <input
            type="text"
            placeholder="Titel"
            value={newReward.title}
            onChange={(e) => setNewReward({ ...newReward, title: e.target.value })}
            className="border p-2 rounded w-full sm:w-auto flex-grow"
          />
          <select
            value={newReward.type}
            onChange={(e) => setNewReward({ ...newReward, type: e.target.value })}
            className="border p-2 rounded"
          >
            <option value="">Kategori</option>
            <option value="fantasy">Fantasi</option>
            <option value="todo">To-do</option>
            <option value="date">Date</option>
            <option value="universal">Universel</option>
          </select>
          <select
            value={newReward.assigned_to}
            onChange={(e) => setNewReward({ ...newReward, assigned_to: e.target.value as 'mads' | 'stine' })}
            className="border p-2 rounded"
          >
            <option value="mads">Mads</option>
            <option value="stine">Stine</option>
          </select>
          <input
            type="number"
            placeholder="XP"
            value={newReward.required_xp}
            onChange={(e) => setNewReward({ ...newReward, required_xp: parseInt(e.target.value) || 0 })}
            className="border p-2 rounded w-24"
          />
          <button
            onClick={addReward}
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 flex items-center gap-2"
          >
            <Plus size={16} /> Tilføj
          </button>
        </div>
      </div>

      {Object.entries(groupByType(rewards) as Record<string, Reward[]>).map(([type, items]) => (
        <div key={type} className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-1">{typeLabels[type] || type}</h2>
          <ul className="space-y-1">
            {items.map((reward: Reward) => (
              <li
                key={reward._localId}
                className="border px-4 py-3 rounded flex justify-between items-center bg-white shadow-sm"
              >
                {editingRewardKey === reward._localId ? (
                  <div className="flex flex-col sm:flex-row gap-2 flex-grow items-center">
                    <input
                      value={editedRewards[reward._localId]?.title ?? reward.title}
                      onChange={(e) => setEditedRewards((prev) => ({
                        ...prev,
                        [reward._localId]: {
                          ...(prev[reward._localId] || reward),
                          title: e.target.value,
                        },
                      }))}
                      className="border p-1 rounded flex-1"
                    />
                    <input
                      type="number"
                      value={editedRewards[reward._localId]?.required_xp ?? reward.required_xp}
                      onChange={(e) => setEditedRewards((prev) => ({
                        ...prev,
                        [reward._localId]: {
                          ...(prev[reward._localId] || reward),
                          required_xp: parseInt(e.target.value) || 0,
                        },
                      }))}
                      className="border p-1 rounded w-20"
                    />
                    <select
                      value={editedRewards[reward._localId]?.type ?? reward.type}
                      onChange={(e) => setEditedRewards((prev) => ({
                        ...prev,
                        [reward._localId]: {
                          ...(prev[reward._localId] || reward),
                          type: e.target.value,
                        },
                      }))}
                      className="border p-1 rounded"
                    >
                      <option value="fantasy">Fantasi</option>
                      <option value="todo">To-do</option>
                      <option value="date">Date</option>
                      <option value="universal">Universel</option>
                    </select>
                    <select
                      value={editedRewards[reward._localId]?.assigned_to ?? reward.assigned_to}
                      onChange={(e) => setEditedRewards((prev) => ({
                        ...prev,
                        [reward._localId]: {
                          ...(prev[reward._localId] || reward),
                          assigned_to: e.target.value,
                        },
                      }))}
                      className="border p-1 rounded"
                    >
                      <option value="mads">Mads</option>
                      <option value="stine">Stine</option>
                    </select>
                    <button onClick={() => updateReward(reward.r_id, reward._localId)} className="text-green-600">
                      <Check size={18} />
                    </button>
                    <button onClick={() => setEditingRewardKey(null)} className="text-gray-500">
                      <XCircle size={18} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="font-medium">{reward.title}</span>
                      <span className="text-sm text-gray-500">{reward.required_xp} XP</span>
                      <span className="text-xs text-gray-400">({reward.assigned_to})</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <button onClick={() => deleteReward(reward.r_id)} className="text-red-500 hover:text-red-600">
                        <Trash2 size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingRewardKey(reward._localId);
                          setEditedRewards((prev) => ({
                            ...prev,
                            [reward._localId]: {
                              title: reward.title,
                              required_xp: reward.required_xp,
                              type: reward.type,
                              assigned_to: reward.assigned_to,
                            },
                          }));
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Pencil size={18} />
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
