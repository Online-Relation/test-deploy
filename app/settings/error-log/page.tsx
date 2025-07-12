'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type ErrorEntry = {
  id: string;
  title: string;
  description: string;
  category: 'kritisk' | 'mindre fejl';
  status: 'åben' | 'løst';
  created_at: string;
};

const categories: ErrorEntry['category'][] = ['kritisk', 'mindre fejl'];

export default function ErrorLogPage() {
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'kritisk' as ErrorEntry['category'],
  });
  const [editId, setEditId] = useState<string | null>(null);

  // NYT: filter state
  const [categoryFilter, setCategoryFilter] = useState<'alle' | ErrorEntry['category']>('alle');

  // Hent alle fejl
  const fetchErrors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('error_log')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setErrors(data as ErrorEntry[]);
    setLoading(false);
  };

  useEffect(() => { fetchErrors(); }, []);

  // Tilføj eller rediger fejl
  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim()) return;
    setLoading(true);
    if (editId) {
      // Rediger
      const { error } = await supabase
        .from('error_log')
        .update({
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category,
        })
        .eq('id', editId);
      if (!error) setEditId(null);
    } else {
      // Tilføj
      await supabase.from('error_log').insert([{
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
      }]);
    }
    setForm({ title: '', description: '', category: 'kritisk' });
    fetchErrors();
    setLoading(false);
  };

  // Slet fejl
  const handleDelete = async (id: string) => {
    if (!window.confirm('Slet denne fejl?')) return;
    setLoading(true);
    await supabase.from('error_log').delete().eq('id', id);
    fetchErrors();
    setLoading(false);
  };

  // Markér som løst
  const handleMarkFixed = async (id: string) => {
    setLoading(true);
    await supabase.from('error_log').update({ status: 'løst' }).eq('id', id);
    fetchErrors();
    setLoading(false);
  };

  // Start redigering
  const handleEdit = (entry: ErrorEntry) => {
    setEditId(entry.id);
    setForm({ title: entry.title, description: entry.description, category: entry.category });
  };

  // Filterede fejl
  const filteredErrors = categoryFilter === 'alle'
    ? errors
    : errors.filter(e => e.category === categoryFilter);

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">🪲 Error Log</h1>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        <button
          className={`px-3 py-1 rounded ${categoryFilter === 'alle' ? 'bg-gray-800 text-white' : 'bg-gray-200'}`}
          onClick={() => setCategoryFilter('alle')}
        >Alle</button>
        {categories.map(cat => (
          <button
            key={cat}
            className={`px-3 py-1 rounded ${
              categoryFilter === cat
                ? (cat === 'kritisk' ? 'bg-red-600 text-white' : 'bg-yellow-500 text-white')
                : 'bg-gray-200'
            }`}
            onClick={() => setCategoryFilter(cat)}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Tilføj/rediger fejl */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">{editId ? 'Rediger fejl' : 'Tilføj ny fejl'}</h2>
        <input
          type="text"
          placeholder="Titel på fejl"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          className="w-full border p-2 rounded mb-2"
          disabled={loading}
        />
        <textarea
          placeholder="Beskrivelse af fejl"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          className="w-full border p-2 rounded mb-2"
          rows={3}
          disabled={loading}
        />
        <select
          value={form.category}
          onChange={e => setForm(f => ({ ...f, category: e.target.value as ErrorEntry['category'] }))}
          className="w-full border p-2 rounded mb-2"
          disabled={loading}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            disabled={loading}
          >
            {editId ? 'Gem ændringer' : 'Tilføj fejl'}
          </button>
          {editId && (
            <button
              onClick={() => { setEditId(null); setForm({ title: '', description: '', category: 'kritisk' }); }}
              className="bg-gray-300 px-4 py-2 rounded"
              disabled={loading}
            >
              Annullér
            </button>
          )}
        </div>
      </div>

      {/* Fejllisten */}
      <ul className="space-y-4">
        {filteredErrors.length === 0 && <li className="text-gray-400">Ingen fejl i denne kategori.</li>}
        {filteredErrors.map(err => (
          <li
            key={err.id}
            className={`border rounded-lg p-4 flex flex-col gap-1 ${err.status === 'løst' ? 'bg-green-50 border-green-400' : err.category === 'kritisk' ? 'bg-red-50 border-red-400' : 'bg-yellow-50 border-yellow-400'}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">{err.title}</span>
              <span className={`text-xs font-semibold rounded px-2 py-1 ml-2 ${
                err.status === 'løst'
                  ? 'bg-green-200 text-green-800'
                  : err.category === 'kritisk'
                  ? 'bg-red-200 text-red-800'
                  : 'bg-yellow-200 text-yellow-800'
              }`}>
                {err.status === 'løst'
                  ? 'Løst'
                  : err.category === 'kritisk'
                  ? 'Kritisk'
                  : 'Mindre fejl'}
              </span>
            </div>
            <div className="text-gray-600 text-sm mb-1">{err.description}</div>
            <div className="text-xs text-gray-400">Oprettet: {new Date(err.created_at).toLocaleDateString('da-DK')}</div>
            <div className="flex gap-2 mt-1 self-end">
              {err.status !== 'løst' && (
                <button
                  onClick={() => handleMarkFixed(err.id)}
                  className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                  disabled={loading}
                >
                  Markér som løst
                </button>
              )}
              <button
                onClick={() => handleEdit(err)}
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                disabled={loading}
              >
                Rediger
              </button>
              <button
                onClick={() => handleDelete(err.id)}
                className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-700"
                disabled={loading}
              >
                Slet
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
