'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { X } from 'lucide-react';

type Category = {
  id: string;
  name: string;
};

const colorClasses = [
  'bg-purple-100 text-purple-800',
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-yellow-100 text-yellow-800',
  'bg-pink-100 text-pink-800',
  'bg-red-100 text-red-800',
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('fantasy_categories').select('*');
    if (!error && data) setCategories(data);
  };

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('fantasy_categories')
      .insert({ name: newCategory })
      .select();

    if (!error && data) {
      setCategories((prev) => [...prev, ...data]);
      setNewCategory('');
    }
    setLoading(false);
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('fantasy_categories').delete().eq('id', id);
    if (!error) {
      setCategories((prev) => prev.filter((cat) => cat.id !== id));
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Fantasikategorier</h1>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Ny kategori"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="flex-grow px-4 py-2 border rounded"
        />
        <button
          onClick={addCategory}
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          Tilføj
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        {categories.map((cat, index) => (
          <span
            key={cat.id}
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colorClasses[index % colorClasses.length]}`}
          >
            {cat.name}
            <button
              onClick={() => deleteCategory(cat.id)}
              className="ml-2 text-black hover:text-red-600"
              title="Slet"
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
