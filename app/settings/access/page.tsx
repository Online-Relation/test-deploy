'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { navItems } from '@/lib/navItems';

type AccessEntry = {
  menu_key: string;
  allowed: boolean;
};

export default function AccessPage() {
  const [users, setUsers] = useState<{ id: string; email: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [accessList, setAccessList] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('profiles').select('id, email');
      if (data) setUsers(data);
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchAccess = async () => {
      if (!selectedUser) return;
      const { data } = await supabase
        .from('access_control')
        .select('menu_key, allowed')
        .eq('user_id', selectedUser);

      const accessMap: Record<string, boolean> = {};
      navItems.forEach((item) => {
        const match = data?.find((row) => row.menu_key === item.key);
        accessMap[item.key] = match ? match.allowed : false;
      });
      setAccessList(accessMap);
    };

    fetchAccess();
  }, [selectedUser]);

  const toggleAccess = (menuKey: string) => {
    setAccessList((prev) => ({ ...prev, [menuKey]: !prev[menuKey] }));
  };

  const saveAccess = async () => {
    if (!selectedUser) return;

    await Promise.all(
      Object.entries(accessList).map(([key, allowed]) =>
        supabase.from('access_control').upsert({
          user_id: selectedUser,
          menu_key: key,
          allowed,
        })
      )
    );

    alert('Adgange opdateret ✅');
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
              {u.email}
            </option>
          ))}
        </select>
      </label>

      {selectedUser && (
        <div className="space-y-3">
          {navItems.map((item) => (
            <label key={item.key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={accessList[item.key] || false}
                onChange={() => toggleAccess(item.key)}
              />
              {item.label}
            </label>
          ))}

          <button
            onClick={saveAccess}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
          >
            Gem ændringer
          </button>
        </div>
      )}
    </div>
  );
}
