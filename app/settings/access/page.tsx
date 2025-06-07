// app/settings/access/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Definer både hoved‐menupunkter og underpunkter som et hierarki
// Hver key uden “/” er et hovedpunkt. Eventuelle keys med “/” hører under hovedpunktet.
const accessHierarchy = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    children: [],
  },
  {
    key: 'todo',
    label: 'To-Do List',
    children: [],
  },
  {
    key: 'dates',
    label: 'Date Ideas',
    children: [],
  },
  {
    key: 'fantasy',
    label: 'Fantasier',
    children: [],
  },
  {
    key: 'checkin',
    label: 'Check-in',
    children: [
      { key: 'checkin/oversigt', label: 'Oversigt' },
      { key: 'checkin/mine-behov', label: 'Mine behov' },
      { key: 'checkin/historik', label: 'Historik' },
      { key: 'checkin/evaluering', label: 'Evaluering' },
    ],
  },
  {
    key: 'manifestation',
    label: 'Manifestation',
    children: [],
  },
  {
    key: 'career',
    label: 'Karriere',
    children: [],
  },
  {
    key: 'bucketlist',
    label: 'Bucketlist',
    children: [],
  },
  {
    key: 'profile',
    label: 'Profil',
    children: [],
  },
  {
    key: 'settings',
    label: 'Indstillinger',
    children: [
      { key: 'settings/points', label: 'Points' },
      { key: 'settings/rewards', label: 'Rewards' },
      { key: 'settings/categories', label: 'Categories' },
      { key: 'settings/access', label: 'Profiladgange' },
    ],
  },
];

type UserProfile = {
  id: string;
  display_name: string;
};

export default function AccessPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [accessList, setAccessList] = useState<Record<string, boolean>>({});

  // Hent alle profiler til dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name');
      if (error) {
        console.error('Fejl ved hentning af profiler:', error.message);
        return;
      }
      setUsers(data || []);
    };
    fetchUsers();
  }, []);

  // Hent adgangsopsætning for den valgte bruger
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

      if (error) {
        console.error('Fejl ved hentning af adgangsindstillinger:', error.message);
        return;
      }

      // Byg et map for alle keys (hoved og under), default = false
      const accessMap: Record<string, boolean> = {};
      accessHierarchy.forEach((entry) => {
        // Hovedpunkt
        accessMap[entry.key] = !!data?.find((row) => row.menu_key === entry.key)?.allowed;
        // Underpunkter (hvis nogen)
        entry.children.forEach((child) => {
          accessMap[child.key] = !!data?.find((row) => row.menu_key === child.key)?.allowed;
        });
      });

      setAccessList(accessMap);
    };

    fetchAccess();
  }, [selectedUser]);

  // Toggle én given key
  const toggleAccess = (key: string) => {
    setAccessList((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Gem alle adgangsregler
  const saveAccess = async () => {
    if (!selectedUser) return;

    try {
      const updates = [];

      // Upsert hovedpunkter
      accessHierarchy.forEach((entry) => {
        updates.push(
          supabase.from('access_control').upsert({
            user_id: selectedUser,
            menu_key: entry.key,
            allowed: !!accessList[entry.key],
          })
        );
        // Upsert underpunkter
        entry.children.forEach((child) => {
          updates.push(
            supabase.from('access_control').upsert({
              user_id: selectedUser,
              menu_key: child.key,
              allowed: !!accessList[child.key],
            })
          );
        });
      });

      await Promise.all(updates);
      alert('Adgange opdateret ✅');
    } catch (error) {
      console.error('Fejl ved opdatering af adgangsindstillinger:', error);
      alert('Der skete en fejl under gem af adgangsindstillinger.');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">🔐 Profiladgange</h1>

      {/* Dropdown: vælg bruger */}
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
          {accessHierarchy.map((entry) => (
            <div key={entry.key} className="space-y-1">
              {/* Hovedpunkt */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={accessList[entry.key] || false}
                  onChange={() => toggleAccess(entry.key)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="text-base font-medium">{entry.label}</span>
              </label>

              {/* Underpunkter – indrykket */}
              {entry.children.length > 0 && (
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
