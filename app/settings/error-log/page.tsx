'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type ErrorEntry = {
  id: string;
  title: string;
  description: string;
  page: string;
  subpage?: string;
  category?: 'Kritisk' | 'Mindre fejl';
  created_at: string;
};

type PageEntry = {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
};

const categoryLevels = ['Kritisk', 'Mindre fejl'] as const;

export default function ErrorLogPage() {
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [pages, setPages] = useState<PageEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    page: '',
    subpage: '',
    category: 'Kritisk' as ErrorEntry['category'],
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [newPage, setNewPage] = useState('');
  const [newSubpage, setNewSubpage] = useState('');
  const [parentForSubpage, setParentForSubpage] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'Alle' | ErrorEntry['category']>('Alle');
  const [search, setSearch] = useState('');
  const [mainPageDropdown, setMainPageDropdown] = useState<string>('Alle');

  // Hent sider fra Supabase
  const fetchPages = async () => {
    const { data } = await supabase.from('error_pages').select('*').order('name');
    setPages(data || []);
    const mains = (data || []).filter((p: PageEntry) => !p.parent_id);
    if (mains.length && !form.page) setForm(f => ({ ...f, page: mains[0].id, subpage: '' }));
  };

  // Hent errors
  const fetchErrors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('error_log')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setErrors(data as ErrorEntry[]);
    setLoading(false);
  };

  useEffect(() => { fetchPages(); fetchErrors(); }, []);

  // Tilføj hovedside
  const handleAddPage = async () => {
    const name = newPage.trim();
    if (!name) return;
    await supabase.from('error_pages').insert([{ name }]);
    setNewPage('');
    fetchPages();
  };

  // Tilføj underpunkt
  const handleAddSubpage = async () => {
    const name = newSubpage.trim();
    if (!name || !parentForSubpage) return;
    await supabase.from('error_pages').insert([{ name, parent_id: parentForSubpage }]);
    setNewSubpage('');
    setParentForSubpage('');
    fetchPages();
  };

  // Gem/rediger fejl
  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.page) return;
    setLoading(true);

    const mainPage = pages.find(p => p.id === form.page);
    const subPage = form.subpage ? pages.find(p => p.id === form.subpage) : undefined;

    try {
      if (editId) {
        await supabase
          .from('error_log')
          .update({
            title: form.title.trim(),
            description: form.description.trim(),
            page: mainPage?.name,
            subpage: subPage?.name || null,
            category: form.category,
          })
          .eq('id', editId);
        setEditId(null);
      } else {
        await supabase.from('error_log').insert([{
          title: form.title.trim(),
          description: form.description.trim(),
          page: mainPage?.name,
          subpage: subPage?.name || null,
          category: form.category,
        }]);
      }
    } catch (err) {
      console.error("Fejl i handleSave:", err);
    }
    setForm({
      title: '',
      description: '',
      page: pages.filter(p => !p.parent_id)[0]?.id || '',
      subpage: '',
      category: 'Kritisk',
    });
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

  // Start redigering
  const handleEdit = (entry: ErrorEntry) => {
    const main = pages.find(p => p.name === entry.page && !p.parent_id);
    const sub = pages.find(p => p.name === entry.subpage && p.parent_id === main?.id);
    setEditId(entry.id);
    setForm({
      title: entry.title,
      description: entry.description,
      page: main?.id || '',
      subpage: sub?.id || '',
      category: entry.category || 'Kritisk',
    });
  };

  // Dropdown data
  const mainPages = pages.filter(p => !p.parent_id);
  const subPages = pages.filter(p => p.parent_id === form.page);

  // --- FILTER/SEARCH LOGIK ---
  let filteredErrors = errors;
  // category filter
  if (categoryFilter !== 'Alle') {
    filteredErrors = filteredErrors.filter(i => i.category === categoryFilter);
  }
  // HOVEDSIDE dropdown filter (inkl. underpunkter)
  if (mainPageDropdown !== 'Alle') {
    const mainName = pages.find(p => p.id === mainPageDropdown)?.name;
    const subNames = pages.filter(p => p.parent_id === mainPageDropdown).map(p => p.name);
    filteredErrors = filteredErrors.filter(i =>
      (i.page === mainName) ||
      (subNames.length > 0 && subNames.includes(i.subpage || ''))
    );
  }
  // SØGNING
  const lowerSearch = search.toLowerCase();
  const searchedErrors = filteredErrors.filter(error =>
    error.title.toLowerCase().includes(lowerSearch) ||
    error.description.toLowerCase().includes(lowerSearch) ||
    (error.page || '').toLowerCase().includes(lowerSearch) ||
    (error.subpage || '').toLowerCase().includes(lowerSearch)
  );

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8">
      <h1 className="text-2xl font-bold mb-4 text-red-700">🚨 Error Log</h1>

      {/* Tilføj ny hovedside */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <input
          type="text"
          placeholder="Tilføj ny hovedside…"
          value={newPage}
          onChange={e => setNewPage(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <button
          onClick={handleAddPage}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 w-full sm:w-auto"
        >
          Tilføj hovedside
        </button>
      </div>

      {/* Tilføj underpunkt */}
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <select
          value={parentForSubpage}
          onChange={e => setParentForSubpage(e.target.value)}
          className="border p-2 rounded w-full"
        >
          <option value="">Vælg hovedside…</option>
          {mainPages.map(mp => (
            <option key={mp.id} value={mp.id}>{mp.name}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Tilføj underpunkt…"
          value={newSubpage}
          onChange={e => setNewSubpage(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <button
          onClick={handleAddSubpage}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 w-full sm:w-auto"
        >
          Tilføj underpunkt
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <span className="text-sm font-semibold mr-2 mt-1">Vis kun:</span>
        <button
          className={`px-3 py-1 rounded ${categoryFilter === 'Alle' ? 'bg-gray-800 text-white' : 'bg-gray-200'}`}
          onClick={() => setCategoryFilter('Alle')}
        >Alle kategorier</button>
        {categoryLevels.map(lvl => (
          <button
            key={lvl}
            className={`px-3 py-1 rounded ${
              categoryFilter === lvl
                ? lvl === 'Kritisk'
                  ? 'bg-red-600 text-white'
                  : 'bg-yellow-500 text-black'
                : 'bg-gray-200'
            }`}
            onClick={() => setCategoryFilter(lvl)}
          >
            {lvl}
          </button>
        ))}
      </div>

      {/* --- SØGEFELT + HOVEDSIDE-DROPDOWN --- */}
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Søg efter titel, beskrivelse, side…"
          className="border p-2 rounded w-full"
        />
        <select
          value={mainPageDropdown}
          onChange={e => setMainPageDropdown(e.target.value)}
          className="border p-2 rounded w-full sm:w-auto"
        >
          <option value="Alle">Alle hovedsider</option>
          {mainPages.map(mp => (
            <option key={mp.id} value={mp.id}>{mp.name}</option>
          ))}
        </select>
      </div>
      {/* ------------------------------ */}

      {/* Tilføj/rediger fejl */}
      <div className="mb-6 p-4 border rounded-lg bg-red-50">
        <h2 className="text-lg font-semibold mb-2">{editId ? 'Rediger fejl' : 'Registrer ny fejl'}</h2>
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
        {/* Hovedside-dropdown */}
        <select
          value={form.page}
          onChange={e => setForm(f => ({ ...f, page: e.target.value, subpage: '' }))}
          className="w-full border p-2 rounded mb-2"
          disabled={loading}
        >
          {mainPages.map(pg => (
            <option key={pg.id} value={pg.id}>{pg.name}</option>
          ))}
        </select>
        {/* Underpunkt-dropdown */}
        {subPages.length > 0 && (
          <select
            value={form.subpage}
            onChange={e => setForm(f => ({ ...f, subpage: e.target.value }))}
            className="w-full border p-2 rounded mb-2"
            disabled={loading}
          >
            <option value="">Vælg underpunkt…</option>
            {subPages.map(sp => (
              <option key={sp.id} value={sp.id}>{sp.name}</option>
            ))}
          </select>
        )}
        {/* Kategori */}
        <select
          value={form.category}
          onChange={e => setForm(f => ({ ...f, category: e.target.value as ErrorEntry['category'] }))}
          className="w-full border p-2 rounded mb-2"
          disabled={loading}
        >
          {categoryLevels.map(lvl => (
            <option key={lvl} value={lvl}>{lvl}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            disabled={loading}
          >
            {editId ? 'Gem ændringer' : 'Registrer fejl'}
          </button>
          {editId && (
            <button
              onClick={() => { setEditId(null); setForm({ title: '', description: '', page: mainPages[0]?.id || '', subpage: '', category: 'Kritisk' }); }}
              className="bg-gray-300 px-4 py-2 rounded"
              disabled={loading}
            >
              Annullér
            </button>
          )}
        </div>
      </div>

      {/* Error listen */}
      <ul className="space-y-4">
        {searchedErrors.length === 0 && <li className="text-gray-400">Ingen fejl i denne kategori.</li>}
        {searchedErrors.map(error => (
          <li
            key={error.id}
            className="border rounded-lg p-4 flex flex-col gap-1 bg-red-50 border-red-400"
          >
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">{error.title}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold rounded px-2 py-1 bg-red-200 text-red-800">
                  {error.page}
                  {error.subpage ? ` / ${error.subpage}` : ''}
                </span>
              </div>
            </div>
            <div className="text-gray-600 text-sm mb-1">{error.description}</div>
            {/* --- VIS KATEGORI HER --- */}
            {error.category && (
              <div className="mt-1">
                <span className={`text-xs font-semibold rounded px-2 py-1 ${
                  error.category === 'Kritisk'
                    ? 'bg-red-500 text-white'
                    : 'bg-yellow-400 text-black'
                }`}>
                  {error.category}
                </span>
              </div>
            )}
            <div className="text-xs text-gray-400">Oprettet: {new Date(error.created_at).toLocaleDateString('da-DK')}</div>
            <div className="flex gap-2 mt-1 self-end">
              <button
                onClick={() => handleEdit(error)}
                className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                disabled={loading}
              >
                Rediger
              </button>
              <button
                onClick={() => handleDelete(error.id)}
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
