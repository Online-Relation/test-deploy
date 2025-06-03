// app/settings/points/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function PointsSettingsPage() {
  const [settings, setSettings] = useState({
    add_fantasy_xp: 0,
    complete_fantasy_xp_low: 0,
    complete_fantasy_xp_medium: 0,
    complete_fantasy_xp_high: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('xp_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error) {
        console.error('Fejl ved hentning af settings:', error.message);
      } else if (data) {
        setSettings(data);
      }

      setLoading(false);
    };

    fetchSettings();
  }, []);

  const handleChange = (field: string, value: number) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    const { data: existing } = await supabase.from('xp_settings').select('id').eq('id', 1).maybeSingle();

    let error;
    if (existing) {
      ({ error } = await supabase.from('xp_settings').update(settings).eq('id', 1));
    } else {
      ({ error } = await supabase.from('xp_settings').insert([{ id: 1, ...settings }]));
    }

    if (error) {
      alert('Fejl ved opdatering af settings');
    } else {
      alert('Pointindstillinger er gemt!');
    }
  };

  if (loading) return <div className="p-6">Indlæser...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">⚙️ Pointindstillinger</h1>

      <div className="space-y-4">
        <div>
          <label className="block font-medium mb-1">XP for at tilføje en fantasi</label>
          <input
            type="number"
            value={settings.add_fantasy_xp}
            onChange={(e) => handleChange('add_fantasy_xp', parseInt(e.target.value) || 0)}
            className="border p-2 rounded w-full"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-medium mb-1">XP for lav indsats</label>
            <input
              type="number"
              value={settings.complete_fantasy_xp_low}
              onChange={(e) => handleChange('complete_fantasy_xp_low', parseInt(e.target.value) || 0)}
              className="border p-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">XP for middel indsats</label>
            <input
              type="number"
              value={settings.complete_fantasy_xp_medium}
              onChange={(e) => handleChange('complete_fantasy_xp_medium', parseInt(e.target.value) || 0)}
              className="border p-2 rounded w-full"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">XP for høj indsats</label>
            <input
              type="number"
              value={settings.complete_fantasy_xp_high}
              onChange={(e) => handleChange('complete_fantasy_xp_high', parseInt(e.target.value) || 0)}
              className="border p-2 rounded w-full"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Gem ændringer
      </button>
    </div>
  );
}
