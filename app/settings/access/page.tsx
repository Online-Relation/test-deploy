// /app/settings/access/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { accessHierarchy, AccessEntry } from '@/lib/accessHierarchy';

type UserProfile = {
  id: string;
  display_name: string;
};

export default function AccessPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [accessList, setAccessList] = useState<Record<string, boolean>>({});

  // ➕ Langeland tilføjes lokalt til det importerede hierarchy
  const augmentedAccess: AccessEntry[] = useMemo(
    () => [
      ...((accessHierarchy as AccessEntry[]) || []),
      { key: 'langeland', label: 'Langeland', href: '/langeland', children: [] },
    ],
    []
  );

  // Hent alle profiler til dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('profiles').select('id, display_name');
      if (!error && data) setUsers(data);
    };
    fetchUsers();
  }, []);

  // Hent adgangsopsætning
  useEffect(() => {
    const fetchAccess = async () => {
      if (!selectedUser) {
        setAccessList({});
        return;
      }
      const { data, error } = await supabase
        .from('access_control')
        .select('menu_key, allowed')
        .eq('user_id', selectedUser);
      if (error) return;

      const map: Record<string, boolean> = {};
      augmentedAccess.forEach((entry) => {
        map[entry.key] = !!data?.find((r) => r.menu_key === entry.key)?.allowed;
        (entry.children || []).forEach((child) => {
          map[child.key] = !!data?.find((r) => r.menu_key === child.key)?.allowed;
        });
      });
      setAccessList(map);
    };
    fetchAccess();
  }, [selectedUser, augmentedAccess]);

  const toggleAccess = (key: string) => {
    setAccessList((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const saveAccess = async () => {
    if (!selectedUser) return;
    try {
      const updates: { user_id: string; menu_key: string; allowed: boolean }[] = [];
      for (const entry of augmentedAccess) {
        updates.push({ user_id: selectedUser, menu_key: entry.key, allowed: !!accessList[entry.key] });
        for (const child of entry.children || []) {
          updates.push({ user_id: selectedUser, menu_key: child.key, allowed: !!accessList[child.key] });
        }
      }
      const { error } = await supabase
        .from('access_control')
        .upsert(updates, { onConflict: 'user_id, menu_key' });
      if (error) throw error;
      alert('Adgange opdateret ✅');
    } catch (error) {
      console.error('Fejl ved opdatering af adgangsindstillinger:', error);
      alert('Der skete en fejl under gem af adgangsindstillinger.');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">🔐 Profiladgange</h1>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Vælg bruger</span>
        <select
          value={selectedUser || ''}
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
        <div className="space-y-4">
          {augmentedAccess.map((entry) => (
            <div key={entry.key} className="space-y-1">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={accessList[entry.key] || false}
                  onChange={() => toggleAccess(entry.key)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="text-base font-medium">{entry.label}</span>
              </label>
              {(entry.children && entry.children.length > 0) && (
                <div className="ml-6 space-y-1">
                  {entry.children.map((child) => (
                    <label key={child.key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={accessList[child.key] || false}
                        onChange={() => toggleAccess(child.key)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                      <span className="text-base">{child.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
          <button
            onClick={saveAccess}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Gem ændringer
          </button>
        </div>
      )}
    </div>
  );
}
