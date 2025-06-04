'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { X } from 'lucide-react';

type Entry = { id: string; name: string };

const colorClasses = [
  'bg-purple-100 text-purple-800',
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-yellow-100 text-yellow-800',
  'bg-pink-100 text-pink-800',
  'bg-red-100 text-red-800',
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Entry[]>([]);
  const [types, setTypes] = useState<Entry[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [newType, setNewType] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: catData } = await supabase.from('fantasy_categories').select('*');
    const { data: typeData } = await supabase.from('fantasy_types').select('*');
    if (catData) setCategories(catData);
    if (typeData) setTypes(typeData);
  };

  const addEntry = async (table: 'fantasy_categories' | 'fantasy_types', value: string, setList: Function, setInput: Function) => {
    if (!value.trim()) return;
    setLoading(true);
    const { data, error } = await supabase.from(table).insert({ name: value }).select();
    if (!error && data) {
      setList((prev: Entry[]) => [...prev, ...data]);
      setInput('');
    }
    setLoading(false);
  };

  const deleteEntry = async (table: 'fantasy_categories' | 'fantasy_types', id: string, setList: Function) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) {
      setList((prev: Entry[]) => prev.filter((entry) => entry.id !== id));
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Kategorier og Typer</h1>

      {/* Kategorier */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Fantasikategorier</h2>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Ny kategori (fx romantik, leg, spontanitet)"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="flex-grow px-4 py-2 border rounded"
          />
          <button
            onClick={() => addEntry('fantasy_categories', newCategory, setCategories, setNewCategory)}
            disabled={loading}
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
          >
            Tilføj
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat, index) => (
            <span
              key={cat.id}
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colorClasses[index % colorClasses.length]}`}
            >
              {cat.name}
              <button
                onClick={() => deleteEntry('fantasy_categories', cat.id, setCategories)}
                className="ml-2 text-black hover:text-red-600"
                title="Slet"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Typer */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Fantasi-typer</h2>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Ny type (fx ting, oplevelse, tjeneste)"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            className="flex-grow px-4 py-2 border rounded"
          />
          <button
            onClick={() => addEntry('fantasy_types', newType, setTypes, setNewType)}
            disabled={loading}
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
          >
            Tilføj
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {types.map((type, index) => (
            <span
              key={type.id}
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colorClasses[index % colorClasses.length]}`}
            >
              {type.name}
              <button
                onClick={() => deleteEntry('fantasy_types', type.id, setTypes)}
                className="ml-2 text-black hover:text-red-600"
                title="Slet"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}