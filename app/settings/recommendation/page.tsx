'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const widgetOptions = ['weekly_recommendation'];

export default function RecommendationSettingsPage() {
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [widgetKey, setWidgetKey] = useState('weekly_recommendation');
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [tone, setTone] = useState('');
  const [status, setStatus] = useState('');
  const [hiddenTables, setHiddenTables] = useState<string[]>([]);

  useEffect(() => {
    const fetchInitial = async () => {
      const { data: usersData } = await supabase.from('profiles').select('id, display_name');
      const formatted = (usersData || []).map((u: any) => ({ id: u.id, name: u.display_name || 'Ukendt' }));
      setUsers(formatted);

      const { data: tableList } = await supabase.rpc('list_tables');
      const storedHidden = JSON.parse(localStorage.getItem('hiddenTables') || '[]');
      setHiddenTables(storedHidden);
      setTables(tableList || []);
    };

    fetchInitial();
  }, []);

  useEffect(() => {
    if (!selectedUser) return;

    const fetchUserConfig = async () => {
      const { data, error } = await supabase
        .from('widget_config')
        .select('config')
        .eq('user_id', selectedUser)
        .eq('widget_key', widgetKey)
        .maybeSingle();

      if (!error && data?.config) {
        setSelectedTables(data.config.tables || []);
        setTone(data.config.tone || '');
      }
    };

    fetchUserConfig();
  }, [selectedUser, widgetKey]);

  const handleSave = async () => {
    if (!selectedUser || !widgetKey) return;

    const config = {
      for_partner: selectedUser === 'mads' ? 'stine' : 'mads',
      tables: selectedTables,
      tone,
    };

    const { error } = await supabase
      .from('widget_config')
      .upsert(
        {
          user_id: selectedUser,
          widget_key: widgetKey,
          config,
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
          <label className="block mb-1 font-medium">Vælg bruger</label>
          <select
            value={selectedUser}
            onChange={e => setSelectedUser(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">-- Vælg --</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
        </div>

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
              <div key={table} className="flex items-center justify-between text-sm">
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
