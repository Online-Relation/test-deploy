'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { createNotification } from '@/lib/notifications';
import { useUserContext } from '@/context/UserContext';

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
  const { user } = useUserContext();

  const [categories, setCategories] = useState<BucketCategory[]>([]);
  const [activeType, setActiveType] = useState<'personlig' | 'par'>('personlig');
  const [newCategoryTitle, setNewCategoryTitle] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      console.log('Henter bucketlist kategorier...');
      const { data, error } = await supabase.from('bucketlist').select('*');
      if (error) {
        console.error('Fejl ved hentning fra Supabase:', error.message);
      } else if (data) {
        console.log('Bucketlist kategorier modtaget:', data);
        setCategories(data);
      }
    };
    fetchData();
  }, []);

  const addCategory = async () => {
    console.log('Tilføj bucket kaldt med titel:', newCategoryTitle);
    if (!newCategoryTitle.trim()) {
      console.log('Titel er tom - afbryder');
      return;
    }
    if (!user?.id) {
      console.log('Ingen bruger i context - afbryder');
      return;
    }

    const newCat: Omit<BucketCategory, 'id'> = {
      title: newCategoryTitle.trim(),
      type: activeType,
      goals: [],
      imageUrl: '',
    };

    console.log('Prøver at indsætte bucket:', newCat);

    const { data, error } = await supabase
      .from('bucketlist')
      .insert([newCat])
      .select()
      .single();

    if (error) {
      console.error('Fejl ved tilføjelse til Supabase:', error.message);
      return;
    }

    console.log('Bucket oprettet:', data);

    setCategories(prev => [...prev, data]);
    setNewCategoryTitle('');

    try {
      console.log('Kalder createNotification med:', user.id, data.title, data.id);
      await createNotification(user.id, 'fantasy_added', {
        fantasyTitle: data.title,
        fantasyId: data.id,
      });
      console.log('Notifikation oprettet!');
    } catch (e) {
      console.error('Fejl ved oprettelse af notifikation:', e);
    }
  };

  const deleteCategory = async (id: string) => {
    console.log('Sletter kategori med id:', id);
    const { error } = await supabase.from('bucketlist').delete().eq('id', id);
    if (error) {
      console.error('Fejl ved sletning fra Supabase:', error.message);
      return;
    }
    setCategories(prev => prev.filter(cat => cat.id !== id));
  };

  const updateCategory = async (updated: BucketCategory) => {
    console.log('Opdaterer kategori:', updated);
    const { error } = await supabase.from('bucketlist').update(updated).eq('id', updated.id);
    if (error) {
      console.error('Fejl ved opdatering i Supabase:', error.message);
      return;
    }
    setCategories(prev => prev.map(cat => (cat.id === updated.id ? updated : cat)));
  };

  const visibleCategories = categories.filter(cat => cat.type === activeType);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">🌍 Bucketlist</h1>
        <div className="space-x-2">
          <button
            onClick={() => setActiveType('personlig')}
            className={`px-3 py-1 rounded ${
              activeType === 'personlig' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Min
          </button>
          <button
            onClick={() => setActiveType('par')}
            className={`px-3 py-1 rounded ${
              activeType === 'par' ? 'bg-pink-600 text-white' : 'bg-gray-200'
            }`}
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
                  <button onClick={() => deleteCategory(cat.id)} className="text-red-500">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
