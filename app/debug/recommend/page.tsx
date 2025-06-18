// /app/debug/recommend/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function DebugRecommendPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name');

      if (error) console.error('Fejl ved hentning af brugere:', error.message);
      else setUsers(data || []);
    };

    fetchUsers();
  }, []);

  const handleGenerate = async () => {
    if (!selectedUserId || !selectedPartnerId) {
      setStatus('Vælg både bruger og partner');
      return;
    }

    setStatus('Genererer...');

    const res = await fetch('/api/generate-recommendation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: selectedUserId,
        for_partner: selectedPartnerId
      })
    });

    const json = await res.json();
    if (res.ok) setStatus('✅ Anbefaling genereret!');
    else setStatus('Fejl: ' + (json?.error || 'Ukendt fejl'));
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-xl font-bold mb-4">Debug – Generér anbefaling</h1>

      <label className="block text-sm font-medium">Vælg bruger (modtager):</label>
      <select
        className="w-full border p-2 rounded"
        value={selectedUserId}
        onChange={(e) => setSelectedUserId(e.target.value)}
      >
        <option value="">-- Vælg bruger --</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>{u.display_name}</option>
        ))}
      </select>

      <label className="block text-sm font-medium">Vælg partner som anbefalingen handler om:</label>
      <select
        className="w-full border p-2 rounded"
        value={selectedPartnerId}
        onChange={(e) => setSelectedPartnerId(e.target.value)}
      >
        <option value="">-- Vælg partner --</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>{u.display_name}</option>
        ))}
      </select>

      <button
        onClick={handleGenerate}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Generér anbefaling
      </button>

      {status && <p className="mt-4 text-sm font-medium">{status}</p>}
    </div>
  );
}
