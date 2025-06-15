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
  { key: 'xp_overview', label: 'XP-overblik' },
  { key: 'reward_progress', label: 'Næste gave' },
  { key: 'xp_meter', label: 'XP-meter' },
];

export default function WidgetAccessPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [accessMap, setAccessMap] = useState<Record<string, Record<string, boolean>>>({});

  useEffect(() => {
    const fetchData = async () => {
      const { data: profiles } = await supabase.from('profiles').select('id, display_name');
      if (!profiles) return;
      setUsers(profiles);

      const { data: widgets } = await supabase.from('dashboard_widgets').select('user_id, widget_key, enabled');
      const map: Record<string, Record<string, boolean>> = {};
      for (const user of profiles) {
        map[user.id] = {};
        for (const w of allWidgets) {
          const match = widgets?.find(d => d.user_id === user.id && d.widget_key === w.key);
          map[user.id][w.key] = match?.enabled ?? false;
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
        [widgetKey]: !prev[userId]?.[widgetKey],
      },
    }));
  };

  const saveChanges = async () => {
    for (const userId in accessMap) {
      for (const widgetKey in accessMap[userId]) {
        await supabase.from('dashboard_widgets').upsert({
          user_id: userId,
          widget_key: widgetKey,
          enabled: accessMap[userId][widgetKey],
          layout: 'medium',
        }, { onConflict: 'user_id,widget_key' });
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
            <div className="space-y-2">
              {allWidgets.map(w => (
                <label key={w.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={accessMap[user.id]?.[w.key] || false}
                    onChange={() => toggle(user.id, w.key)}
                  />
                  <span>{w.label}</span>
                </label>
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
