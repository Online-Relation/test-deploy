'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { notificationTypes } from '@/config/notificationsConfig';
import { useUserContext } from '@/context/UserContext';

interface NotificationSetting {
  id?: number;
  user_id: string;
  notification_type: string;
  enabled: boolean;
}

export default function NotificationSettingsPage() {
  const { user } = useUserContext();
  const [settings, setSettings] = useState<Record<string, NotificationSetting>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);
    supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .then(({ data, error }) => {
        if (error) {
          console.error('Fejl ved hentning af notifikationer:', error);
          setSettings({});
        } else {
          const map: Record<string, NotificationSetting> = {};
          data?.forEach(setting => {
            map[setting.notification_type] = setting;
          });

          // Sæt default enabled = true for typer uden indstillinger
          Object.keys(notificationTypes).forEach(key => {
            if (!map[key]) {
              map[key] = {
                user_id: user.id,
                notification_type: key,
                enabled: true,
              };
            }
          });

          setSettings(map);
        }
        setLoading(false);
      });
  }, [user]);

  const toggleSetting = (type: string) => {
    setSettings(prev => {
      const current = prev[type];
      return {
        ...prev,
        [type]: {
          ...current,
          enabled: !current?.enabled,
          notification_type: type,
          user_id: user?.id ?? '',
        },
      };
    });
  };

  const saveSettings = async () => {
    if (!user?.id) return;
    setSaving(true);
    const toUpsert = Object.values(settings).map(setting => ({
      user_id: user.id,
      notification_type: setting.notification_type,
      enabled: setting.enabled,
    }));

    const { error } = await supabase.from('notification_settings').upsert(toUpsert, {
      onConflict: 'user_id,notification_type',
    });

    if (error) {
      alert('Der skete en fejl ved gemning: ' + error.message);
    } else {
      alert('Indstillinger gemt!');
    }
    setSaving(false);
  };

  if (!user) return <div>Login for at ændre notifikationer</div>;

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Notifikationsindstillinger</h1>

      {loading ? (
        <p>Indlæser dine indstillinger...</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(notificationTypes).map(([key, typeDef]) => (
            <label
              key={key}
              className="flex items-center justify-between bg-white p-4 rounded shadow"
            >
              <div>
                <p className="font-semibold">{typeDef.label}</p>
                <p className="text-sm text-gray-600">
                  {typeDef.template.replace(/\{.*?\}/g, '...')}
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings[key]?.enabled ?? true}
                onChange={() => toggleSetting(key)}
                className="w-5 h-5"
              />
            </label>
          ))}
        </div>
      )}

      <button
        onClick={saveSettings}
        disabled={saving}
        className="mt-6 px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? 'Gemmer...' : 'Gem indstillinger'}
      </button>
    </div>
  );
}
