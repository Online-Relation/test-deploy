// /app/settings/widgets/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface UserProfile {
  id: string;
  display_name: string;
}

const allWidgets = [
  { key: 'kompliment_reminder', label: 'Kompliment' },
  { key: 'xp_meter', label: 'XP-meter' },
  { key: 'reward_progress', label: 'Næste gave' },
  { key: 'task_summary', label: 'Opgaver klar' }, // Tilføjet hvis den mangler
];

const heightOptions = ['auto', 'medium', 'large'];

export default function WidgetAccessPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [accessMap, setAccessMap] = useState<Record<string, Record<string, { enabled: boolean; order: number; height: string }>>>({});

  useEffect(() => {
    const fetchData = async () => {
      const { data: profiles } = await supabase.from('profiles').select('id, display_name');
      if (!profiles) return;
      setUsers(profiles);

      const { data: widgets } = await supabase.from('dashboard_widgets').select('user_id, widget_key, enabled, order, height');

      // Find og opret manglende widgets for hver bruger
      for (const user of profiles) {
        for (const widget of allWidgets) {
          const match = widgets?.find(w => w.user_id === user.id && w.widget_key === widget.key);
          if (!match) {
            await supabase.from('dashboard_widgets').insert({
              user_id: user.id,
              widget_key: widget.key,
              enabled: false,
              order: 0,
              height: 'auto',
              layout: 'small',
            });
          }
        }
      }

      // Genhent efter insert
      const { data: updatedWidgets } = await supabase.from('dashboard_widgets').select('user_id, widget_key, enabled, order, height');
      const map: Record<string, Record<string, { enabled: boolean; order: number; height: string }>> = {};

      for (const user of profiles) {
        map[user.id] = {};
        for (const w of allWidgets) {
          const match = updatedWidgets?.find(d => d.user_id === user.id && d.widget_key === w.key);
          map[user.id][w.key] = {
            enabled: match?.enabled ?? false,
            order: match?.order ?? 0,
            height: match?.height ?? 'auto',
          };
        }
      }

      setAccessMap(map);
    };

    fetchData();
  }, []);

  const toggle = (userId: string, widgetKey: string) => {
    setAccessMap(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [widgetKey]: {
          ...prev[userId][widgetKey],
          enabled: !prev[userId]?.[widgetKey]?.enabled,
        },
      },
    }));
  };

  const changeOrder = (userId: string, widgetKey: string, value: number) => {
    setAccessMap(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [widgetKey]: {
          ...prev[userId][widgetKey],
          order: value,
        },
      },
    }));
  };

  const changeHeight = (userId: string, widgetKey: string, value: string) => {
    setAccessMap(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [widgetKey]: {
          ...prev[userId][widgetKey],
          height: value,
        },
      },
    }));
  };

  const saveChanges = async () => {
    for (const userId in accessMap) {
      for (const widgetKey in accessMap[userId]) {
        const update = {
          user_id: userId,
          widget_key: widgetKey,
          enabled: accessMap[userId][widgetKey].enabled,
          layout: 'medium', // Du kan evt. gøre dette dynamisk senere
          order: accessMap[userId][widgetKey].order,
          height: accessMap[userId][widgetKey].height,
        };

        await supabase.from('dashboard_widgets').upsert(update, {
          onConflict: 'user_id,widget_key',
        });
      }
    }

    alert('Widgets opdateret ✅');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Widget-adgang</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {users.map(user => (
          <div key={user.id} className="border rounded p-4">
            <h2 className="font-semibold mb-3">{user.display_name}</h2>
            <div className="space-y-4">
              {allWidgets.map(w => (
                <div key={w.key} className="flex flex-col gap-2">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={accessMap[user.id]?.[w.key]?.enabled || false}
                      onChange={() => toggle(user.id, w.key)}
                    />
                    <span className="flex-1">{w.label}</span>
                    <input
                      type="number"
                      className="w-16 border p-1 rounded"
                      value={accessMap[user.id]?.[w.key]?.order ?? 0}
                      onChange={(e) => changeOrder(user.id, w.key, parseInt(e.target.value))}
                    />
                  </div>
                  <select
                    value={accessMap[user.id]?.[w.key]?.height || 'auto'}
                    onChange={(e) => changeHeight(user.id, w.key, e.target.value)}
                    className="w-full border p-1 rounded"
                  >
                    {heightOptions.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={saveChanges}
        className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Gem ændringer
      </button>
    </div>
  );
}
