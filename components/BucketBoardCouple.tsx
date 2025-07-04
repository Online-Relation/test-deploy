'use client';

import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';

interface BucketCategory {
  id: string;
  title: string;
  type: 'personlig' | 'par';
  goals: Goal[];
  imageUrl?: string;
}

interface Goal {
  id: string;
  title: string;
  notes: Note[];
  completed?: boolean;
}

interface Note {
  id: string;
  text: string;
  date: string;
}

export default function BucketlistBoard() {
  const [categories, setCategories] = useState<BucketCategory[]>([]);
  const [activeType, setActiveType] = useState<'personlig' | 'par'>('personlig');
  const [newCategoryTitle, setNewCategoryTitle] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from('bucketlist').select('*');
      if (error) {
        console.error('Fejl ved hentning fra Supabase:', error.message);
      } else if (data) {
        setCategories(data);
      }
    };
    fetchData();
  }, []);

  const addCategory = async () => {
    if (!newCategoryTitle.trim()) return;

    const newCat: BucketCategory = {
      id: uuidv4(),
      title: newCategoryTitle.trim(),
      type: activeType,
      goals: [],
      imageUrl: '',
    };

    const { error } = await supabase.from('bucketlist').insert([newCat]);
    if (error) {
      console.error('Fejl ved tilføjelse til Supabase:', error.message);
      return;
    }

    setCategories(prev => [...prev, newCat]);
    setNewCategoryTitle('');
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('bucketlist').delete().eq('id', id);
    if (error) {
      console.error('Fejl ved sletning fra Supabase:', error.message);
      return;
    }
    setCategories(prev => prev.filter(cat => cat.id !== id));
  };

  const updateCategory = async (updated: BucketCategory) => {
    const { error } = await supabase.from('bucketlist')
      .update(updated)
      .eq('id', updated.id);
    if (error) {
      console.error('Fejl ved opdatering i Supabase:', error.message);
      return;
    }
    setCategories(prev => prev.map(cat => cat.id === updated.id ? updated : cat));
  };

  const visibleCategories = categories.filter(cat => cat.type === activeType);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">🌍 Bucketlist</h1>
        <div className="space-x-2">
          <button
            onClick={() => setActiveType('personlig')}
            className={`px-3 py-1 rounded ${activeType === 'personlig' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Min
          </button>
          <button
            onClick={() => setActiveType('par')}
            className={`px-3 py-1 rounded ${activeType === 'par' ? 'bg-pink-600 text-white' : 'bg-gray-200'}`}
          >
            Parforhold
          </button>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={newCategoryTitle}
          onChange={e => setNewCategoryTitle(e.target.value)}
          placeholder="Ny kategori..."
          className="px-3 py-2 border rounded w-full"
        />
        <button
          onClick={addCategory}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Tilføj
        </button>
      </div>

      {visibleCategories.length === 0 && <p className="text-gray-500">Ingen kategorier endnu...</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {visibleCategories.map(cat => {
          const completed = cat.goals.filter(g => g.completed).length;
          const total = cat.goals.length;
          const totalNotes = cat.goals.reduce((sum, g) => sum + g.notes.length, 0);
          return (
            <div key={cat.id} className="bg-white rounded shadow overflow-hidden relative">
              {cat.imageUrl && (
                <img src={cat.imageUrl} alt={cat.title} className="w-full h-40 object-cover" />
              )}
              <div className="p-4">
                <h2 className="text-xl font-bold mb-2">{cat.title}</h2>
                <p className="text-sm text-gray-600 mb-1">
                  ✅ {completed} ud af {total} delmål opnået
                </p>
                <p className="text-sm text-gray-600">
                  📝 {totalNotes} noter på denne bucket
                </p>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => deleteCategory(cat.id)} className="text-red-500">🗑️</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}