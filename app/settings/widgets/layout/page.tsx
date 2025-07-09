'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Widget {
  key: string;
  label: string;
}

interface UserProfile {
  id: string;
  display_name: string;
}

const allWidgets: Widget[] = [
  { key: 'kompliment_reminder', label: 'Kompliment' },
  { key: 'xp_meter', label: 'XP-meter' },
  { key: 'reward_progress', label: 'Næste gave' },
  { key: 'task_summary', label: 'Opgaver klar' },
  { key: 'weekly_recommendation', label: 'Ugens anbefaling' },
  { key: 'reminder_widget', label: 'Deadline Reminder' },
  { key: 'challenge_card', label: 'Udfordringskort' }, // <-- Tilføjet!
];



const layoutOptions = ['small', 'medium', 'large'];
const heightOptions = ['auto', 'medium', 'large'];

export default function WidgetLayoutPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [widgetLayout, setWidgetLayout] = useState<
    Record<string, { layout: string; order: number; height?: string }>
  >({});

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name');
      if (!error && data) setUsers(data);
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!selectedUser) return;
      const { data } = await supabase
        .from('dashboard_widgets')
        .select('widget_key, layout, order, height')
        .eq('user_id', selectedUser);

      const layoutMap: Record<string, { layout: string; order: number; height?: string }> = {};
      data?.forEach((w) => {
        layoutMap[w.widget_key] = {
          layout: w.layout || 'medium',
          order: w.order ?? 0,
          height: w.height || 'auto',
        };
      });
      setWidgetLayout(layoutMap);
    };
    load();
  }, [selectedUser]);

  const updateWidget = (
    key: string,
    field: 'layout' | 'order' | 'height',
    value: string | number
  ) => {
    setWidgetLayout((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const saveChanges = async () => {
    if (!selectedUser) return;
    for (const key of Object.keys(widgetLayout)) {
      await supabase.from('dashboard_widgets').upsert(
        {
          user_id: selectedUser,
          widget_key: key,
          enabled: true,
          layout: widgetLayout[key].layout,
          order: widgetLayout[key].order,
          height: widgetLayout[key].height || 'auto',
        },
        { onConflict: 'user_id,widget_key' }
      );
    }
    alert('Layout gemt ✅');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Tilpas widget-layout</h1>

      <label className="block">
        <span className="text-sm font-medium text-gray-700">Vælg bruger</span>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded p-2"
        >
          <option value="">-- Vælg --</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.display_name}
            </option>
          ))}
        </select>
      </label>

      {selectedUser && (
        <div className="space-y-6">
          {allWidgets.map(({ key, label }) => (
            <div key={key} className="border p-4 rounded space-y-2">
              <h2 className="font-semibold">{label}</h2>

              <label className="block text-sm">
                Bredde:
                <select
                  value={widgetLayout[key]?.layout || 'medium'}
                  onChange={(e) => updateWidget(key, 'layout', e.target.value)}
                  className="block w-full mt-1 p-2 border rounded"
                >
                  {layoutOptions.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                Rækkefølge:
                <input
                  type="number"
                  value={widgetLayout[key]?.order || 0}
                  onChange={(e) =>
                    updateWidget(key, 'order', parseInt(e.target.value))
                  }
                  className="block w-full mt-1 p-2 border rounded"
                />
              </label>

              <label className="block text-sm">
                Højde:
                <select
                  value={widgetLayout[key]?.height || 'auto'}
                  onChange={(e) => updateWidget(key, 'height', e.target.value)}
                  className="block w-full mt-1 p-2 border rounded"
                >
                  {heightOptions.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ))}

          <button
            onClick={saveChanges}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Gem layout
          </button>
        </div>
      )}
    </div>
  );
}
