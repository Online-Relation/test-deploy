'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type IdeaEntry = {
  id: string;
  title: string;
  description: string;
  page: string;
  subpage?: string;
  importance?: 'Meget vigtigt' | 'Vigtigt' | 'Mindre vigtigt';
  created_at: string;
};

type PageEntry = {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
};

const importanceLevels = ['Meget vigtigt', 'Vigtigt', 'Mindre vigtigt'] as const;

export default function IdebankPage() {
  const [ideas, setIdeas] = useState<IdeaEntry[]>([]);
  const [pages, setPages] = useState<PageEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    page: '',
    subpage: '',
    importance: 'Vigtigt' as IdeaEntry['importance'],
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [newPage, setNewPage] = useState('');
  const [newSubpage, setNewSubpage] = useState('');
  const [parentForSubpage, setParentForSubpage] = useState<string>('');
  const [importanceFilter, setImportanceFilter] = useState<'Alle' | IdeaEntry['importance']>('Alle');
  const [search, setSearch] = useState('');
  const [mainPageDropdown, setMainPageDropdown] = useState<string>('Alle');

  // Hent sider fra Supabase
  const fetchPages = async () => {
    const { data, error } = await supabase.from('idea_pages').select('*').order('name');
    setPages(data || []);
    const mains = (data || []).filter((p: PageEntry) => !p.parent_id);
    if (mains.length && !form.page) setForm(f => ({ ...f, page: mains[0].id, subpage: '' }));
  };

  // Hent ideer
  const fetchIdeas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('idea_bank')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setIdeas(data as IdeaEntry[]);
    setLoading(false);
  };

  useEffect(() => { fetchPages(); fetchIdeas(); }, []);

  // Tilføj hovedside
  const handleAddPage = async () => {
    const name = newPage.trim();
    if (!name) return;
    const exists = pages.some(p => !p.parent_id && p.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      setStatusMsg({ type: 'error', msg: 'Der findes allerede en hovedside med dette navn.' });
      return;
    }
    const { error } = await supabase.from('idea_pages').insert([{ name }]);
    if (!error) setStatusMsg({ type: 'success', msg: 'Hovedside tilføjet!' });
    else setStatusMsg({ type: 'error', msg: 'Kunne ikke tilføje hovedside.' });
    setNewPage('');
    fetchPages();
  };

  // Tilføj underpunkt
  const handleAddSubpage = async () => {
    const name = newSubpage.trim();
    if (!name || !parentForSubpage) return;
    const exists = pages.some(p => p.parent_id === parentForSubpage && p.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      setStatusMsg({ type: 'error', msg: 'Der findes allerede et underpunkt med dette navn under denne hovedside.' });
      return;
    }
    const { error } = await supabase.from('idea_pages').insert([{ name, parent_id: parentForSubpage }]);
    if (!error) setStatusMsg({ type: 'success', msg: 'Underpunkt tilføjet!' });
    else setStatusMsg({ type: 'error', msg: 'Kunne ikke tilføje underpunkt.' });
    setNewSubpage('');
    setParentForSubpage('');
    fetchPages();
  };

  // Gem/rediger idé
  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.page) return;
    setLoading(true);

    const mainPage = pages.find(p => p.id === form.page);
    const subPage = form.subpage ? pages.find(p => p.id === form.subpage) : undefined;

    try {
      if (editId) {
        await supabase
          .from('idea_bank')
          .update({
            title: form.title.trim(),
            description: form.description.trim(),
            page: mainPage?.name,
            subpage: subPage?.name || null,
            importance: form.importance,
          })
          .eq('id', editId);
        setEditId(null);
      } else {
        await supabase.from('idea_bank').insert([{
          title: form.title.trim(),
          description: form.description.trim(),
          page: mainPage?.name,
          subpage: subPage?.name || null,
          importance: form.importance,
        }]);
      }
    } catch (err) {
      console.error("idebank: Fejl i handleSave:", err);
    }
    setForm({
      title: '',
      description: '',
      page: pages.filter(p => !p.parent_id)[0]?.id || '',
      subpage: '',
      importance: 'Vigtigt',
    });
    fetchIdeas();
    setLoading(false);
  };

  // Slet idé
  const handleDelete = async (id: string) => {
    if (!window.confirm('Slet denne idé?')) return;
    setLoading(true);
    await supabase.from('idea_bank').delete().eq('id', id);
    fetchIdeas();
    setLoading(false);
  };

  // Marker idé som løst - sletter idéen
  const handleMarkAsSolved = async (id: string) => {
    if (!window.confirm('Markér denne idé som løst? Den vil blive fjernet fra listen.')) return;
    setLoading(true);
    await supabase.from('idea_bank').delete().eq('id', id);
    fetchIdeas();
    setLoading(false);
  };

  // Start redigering
  const handleEdit = (entry: IdeaEntry) => {
    const main = pages.find(p => p.name === entry.page && !p.parent_id);
    const sub = pages.find(p => p.name === entry.subpage && p.parent_id === main?.id);
    setEditId(entry.id);
    setForm({
      title: entry.title,
      description: entry.description,
      page: main?.id || '',
      subpage: sub?.id || '',
      importance: entry.importance || 'Vigtigt',
    });
  };

  // Dropdown data
  const mainPages = pages.filter(p => !p.parent_id);
  const subPages = pages.filter(p => p.parent_id === form.page);

  // --- FILTER/SEARCH LOGIK ---
  let filteredIdeas = ideas;
  if (importanceFilter !== 'Alle') {
    filteredIdeas = filteredIdeas.filter(i => i.importance === importanceFilter);
  }
  if (mainPageDropdown !== 'Alle') {
    const mainName = pages.find(p => p.id === mainPageDropdown)?.name;
    const subNames = pages.filter(p => p.parent_id === mainPageDropdown).map(p => p.name);
    filteredIdeas = filteredIdeas.filter(i =>
      (i.page === mainName) ||
      (subNames.length > 0 && subNames.includes(i.subpage || ''))
    );
  }
  const lowerSearch = search.toLowerCase();
  const searchedIdeas = filteredIdeas.filter(idea =>
    idea.title.toLowerCase().includes(lowerSearch) ||
    idea.description.toLowerCase().includes(lowerSearch) ||
    (idea.page || '').toLowerCase().includes(lowerSearch) ||
    (idea.subpage || '').toLowerCase().includes(lowerSearch)
  );

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8">
      <h1 className="text-2xl font-bold mb-4">💡 Idebank</h1>

      {statusMsg && (
        <div className={`mb-4 px-4 py-2 rounded font-semibold ${
          statusMsg.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {statusMsg.msg}
        </div>
      )}

      {/* Tilføj ny hovedside */}
      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <input
          type="text"
          placeholder="Tilføj ny hovedside..."
          value={newPage}
          onChange={e => setNewPage(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <button
          onClick={handleAddPage}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full sm:w-auto"
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
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full sm:w-auto"
        >
          Tilføj underpunkt
        </button>
      </div>

      {/* Filter (vigtighed) */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <span className="text-sm font-semibold mr-2 mt-1">Vis kun:</span>
        <button
          className={`px-3 py-1 rounded ${importanceFilter === 'Alle' ? 'bg-gray-800 text-white' : 'bg-gray-200'}`}
          onClick={() => setImportanceFilter('Alle')}
        >Alle vigtigheder</button>
        {importanceLevels.map(lvl => (
          <button
            key={lvl}
            className={`px-3 py-1 rounded ${
              importanceFilter === lvl
                ? lvl === 'Meget vigtigt'
                  ? 'bg-red-600 text-white'
                  : lvl === 'Vigtigt'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-500 text-white'
                : 'bg-gray-200'
            }`}
            onClick={() => setImportanceFilter(lvl)}
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

      {/* Tilføj/rediger idé */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">{editId ? 'Rediger idé' : 'Tilføj ny idé'}</h2>
        <input
          type="text"
          placeholder="Titel på idé"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          className="w-full border p-2 rounded mb-2"
          disabled={loading}
        />
        <textarea
          placeholder="Beskrivelse af idé"
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
        {/* Kategori/importance */}
        <select
          value={form.importance}
          onChange={e => setForm(f => ({ ...f, importance: e.target.value as IdeaEntry['importance'] }))}
          className="w-full border p-2 rounded mb-2"
          disabled={loading}
        >
          {importanceLevels.map(lvl => (
            <option key={lvl} value={lvl}>{lvl}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            disabled={loading}
          >
            {editId ? 'Gem ændringer' : 'Tilføj idé'}
          </button>
          {editId && (
            <button
              onClick={() => { setEditId(null); setForm({ title: '', description: '', page: mainPages[0]?.id || '', subpage: '', importance: 'Vigtigt' }); }}
              className="bg-gray-300 px-4 py-2 rounded"
              disabled={loading}
            >
              Annullér
            </button>
          )}
        </div>
      </div>

      {/* Idélisten */}
      <ul className="space-y-4">
        {searchedIdeas.length === 0 && <li className="text-gray-400">Ingen ideer i denne kategori.</li>}
        {searchedIdeas.map(idea => (
          <li
            key={idea.id}
            className="border rounded-lg p-4 flex flex-col gap-1 bg-blue-50 border-blue-400"
          >
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">{idea.title}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold rounded px-2 py-1 bg-blue-200 text-blue-800">
                  {idea.page}
                  {idea.subpage ? ` / ${idea.subpage}` : ''}
                </span>
              </div>
            </div>
            <div className="text-gray-600 text-sm mb-1">{idea.description}</div>
            {idea.importance && (
              <div className="mt-1">
                <span className={`text-xs font-semibold rounded px-2 py-1 ${
                  idea.importance === 'Meget vigtigt'
                    ? 'bg-red-500 text-white'
                    : idea.importance === 'Vigtigt'
                    ? 'bg-yellow-400 text-black'
                    : 'bg-gray-400 text-white'
                }`}>
                  {idea.importance}
                </span>
              </div>
            )}
            <div className="text-xs text-gray-400">Oprettet: {new Date(idea.created_at).toLocaleDateString('da-DK')}</div>
            <div className="flex gap-2 mt-1 self-end">
              <button
                onClick={() => handleEdit(idea)}
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                disabled={loading}
              >
                Rediger
              </button>
              <button
                onClick={() => handleDelete(idea.id)}
                className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-700"
                disabled={loading}
              >
                Slet
              </button>
              <button
                onClick={() => handleMarkAsSolved(idea.id)}
                className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                disabled={loading}
              >
                Løst
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
