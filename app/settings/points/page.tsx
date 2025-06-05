'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface XPSetting {
  id: number;
  role: string;
  action: string;
  effort: string | null;
  xp: number;
}

export default function PointsPage() {
  const [settings, setSettings] = useState<XPSetting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from("xp_settings")
        .select("*")
        .order("role", { ascending: true });

      if (!error && data) {
        setSettings(data);
      }

      setLoading(false);
    };

    fetchSettings();
  }, []);

  const updateXP = async (id: number, xp: number) => {
    const { error } = await supabase
      .from("xp_settings")
      .update({ xp })
      .eq("id", id);

    if (!error) {
      setSettings((prev) =>
        prev.map((entry) => (entry.id === id ? { ...entry, xp } : entry))
      );
    }
  };

  const renderTable = (title: string, roleFilter: string) => (
    <div className="mb-10">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2 text-left">Handling</th>
            <th className="border px-4 py-2 text-left">Effort</th>
            <th className="border px-4 py-2 text-left">XP</th>
          </tr>
        </thead>
        <tbody>
          {settings
            .filter((s) => s.role === roleFilter)
            .map((setting) => (
              <tr key={setting.id}>
                <td className="border px-4 py-2">{setting.action}</td>
                <td className="border px-4 py-2">{setting.effort || '-'}</td>
                <td className="border px-4 py-2">
                  <input
                    type="number"
                    value={setting.xp}
                    onChange={(e) =>
                      updateXP(setting.id, parseInt(e.target.value))
                    }
                    className="w-20 border px-2 py-1 text-right"
                  />
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );

  if (loading) return <p>Indlæser...</p>;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">XP-indstillinger</h1>
      {renderTable("Fælles evaluering", "common")}
      {renderTable("Stine", "stine")}
      {renderTable("Mads", "mads")}
    </div>
  );
}
