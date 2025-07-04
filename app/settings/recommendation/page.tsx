// /app/settings/recommendation/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUserContext } from '@/context/UserContext';

const widgetOptions = [
  'weekly_recommendation',
  'quiz_recommendation',
  'checkin_recommendation',
  'sexlife_recommendation',
  'overall_recommendation'
];

export default function RecommendationSettingsPage() {
  const { user } = useUserContext();
  const [widgetKey, setWidgetKey] = useState('weekly_recommendation');
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [tone, setTone] = useState('');
  const [excludeWords, setExcludeWords] = useState('');
  const [status, setStatus] = useState('');
  const [hiddenTables, setHiddenTables] = useState<string[]>([]);

  useEffect(() => {
    const fetchTables = async () => {
      const { data, error } = await supabase.rpc('list_tables');
      if (error) return console.error('Fejl ved hentning af tabeller:', error.message);
      const storedHidden = JSON.parse(localStorage.getItem('hiddenTables') || '[]');
      setHiddenTables(storedHidden);
      setTables(data);
    };

    fetchTables();
  }, []);

  useEffect(() => {
    if (!user?.id || !widgetKey) return;

    const fetchConfig = async () => {
      const { data, error } = await supabase
        .from('widget_config')
        .select('config')
        .eq('user_id', user.id)
        .eq('widget_key', widgetKey)
        .maybeSingle();

      if (error || !data?.config) return;

      setSelectedTables(data.config.tables || []);
      setTone(data.config.tone || '');
      setExcludeWords((data.config.excludeWords || []).join(', '));
    };

    fetchConfig();
  }, [user, widgetKey]);

  const handleSave = async () => {
    if (!user?.id || !widgetKey) return;

    const config = {
      tables: selectedTables,
      tone,
      excludeWords: excludeWords.split(',').map(w => w.trim()),
    };

    const { error } = await supabase
      .from('widget_config')
      .upsert(
        {
          user_id: user.id,
          widget_key: widgetKey,
          config,
          selected_tables: selectedTables,
        },
        { onConflict: 'user_id,widget_key' }
      );

    setStatus(error ? '❌ Kunne ikke gemme' : '✅ Gemt!');
  };

  const handleTableToggle = (table: string) => {
    setSelectedTables(prev =>
      prev.includes(table) ? prev.filter(t => t !== table) : [...prev, table]
    );
  };

  const handleHideTable = (table: string) => {
    const updatedHidden = [...hiddenTables, table];
    setHiddenTables(updatedHidden);
    localStorage.setItem('hiddenTables', JSON.stringify(updatedHidden));
  };

  const handleResetHidden = () => {
    setHiddenTables([]);
    localStorage.removeItem('hiddenTables');
  };

  const visibleTables = tables.filter(t => !hiddenTables.includes(t));

  return (
    <div className="max-w-xl mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-bold">Anbefaling – Widget Indstillinger</h1>

      <div className="space-y-4 bg-white shadow rounded-xl p-6">
        <div>
          <label className="block mb-1 font-medium">Widget-type</label>
          <select
            value={widgetKey}
            onChange={e => setWidgetKey(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            {widgetOptions.map(key => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">Inkluder tabeller</label>
          <div className="grid grid-cols-2 gap-2">
            {visibleTables.map(table => (
              <div
                key={table}
                className={`flex items-center justify-between text-sm rounded px-2 py-1 ${
                  selectedTables.includes(table) ? 'bg-green-100' : ''
                }`}
              >
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedTables.includes(table)}
                    onChange={() => handleTableToggle(table)}
                  />
                  {table}
                </label>
                <button onClick={() => handleHideTable(table)} className="text-red-500 text-xs">❌</button>
              </div>
            ))}
          </div>
          {hiddenTables.length > 0 && (
            <button
              onClick={handleResetHidden}
              className="mt-2 text-sm text-blue-600 underline"
            >
              Gendan skjulte tabeller
            </button>
          )}
        </div>

        <div>
          <label className="block mb-1 font-medium">Tone</label>
          <input
            type="text"
            value={tone}
            onChange={e => setTone(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="f.eks. kærlig og initiativrig"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Ekskluder ord (komma-separeret)</label>
          <input
            type="text"
            value={excludeWords}
            onChange={e => setExcludeWords(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="f.eks. fjernsyn, biograf"
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Gem konfiguration
        </button>

        {status && <p className="text-sm text-gray-600 mt-2">{status}</p>}
      </div>
    </div>
  );
}
