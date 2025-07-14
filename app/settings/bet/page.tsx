// /app/settings/bet/page.tsx

'use client';

import CreateBetForm from '@/components/CreateBetForm';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface Bet {
  id: string;
  title: string;
  description: string;
  start_at: string;
  end_at: string;
  template: boolean;
  status: string;
  template_name?: string;
}

export default function BetSettingsPage() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('bets')
        .select('id, title, description, start_at, end_at, template, status, template_name')
        .order('created_at', { ascending: false });

      if (!error) setBets(data || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Væddemål & Skabeloner</h1>

      <div className="mb-8">
        <CreateBetForm />
      </div>

      <h2 className="text-xl font-semibold mb-3">Tidligere væddemål & skabeloner</h2>
      {loading ? (
        <div>Indlæser...</div>
      ) : bets.length === 0 ? (
        <div>Ingen væddemål oprettet endnu.</div>
      ) : (
        <ul className="space-y-3">
          {bets.map((bet) => (
            <li key={bet.id} className="rounded-xl border bg-white shadow p-4 hover:bg-yellow-50 transition">
              <Link href={`/settings/bet/${bet.id}`} className="block group">
                <div className="font-semibold group-hover:underline">{bet.title}</div>
                {bet.template && bet.template_name && (
                  <div className="text-xs text-blue-800 mb-1 italic">
                    Skabelon: {bet.template_name}
                  </div>
                )}
                <div className="text-sm text-gray-600 mb-1">{bet.description}</div>
                <div className="text-xs text-gray-500">
                  {bet.start_at?.slice(0, 16).replace('T', ' ')} – {bet.end_at?.slice(0, 16).replace('T', ' ')}
                </div>
                <div className="flex gap-2 mt-1">
                  {bet.template && <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">Skabelon</span>}
                  <span className={`px-2 py-0.5 text-xs rounded ${bet.status === 'active' ? 'bg-green-100 text-green-700' : bet.status === 'finished' ? 'bg-gray-200 text-gray-700' : 'bg-yellow-100 text-yellow-800'}`}>
                    {bet.status === 'active' ? 'Aktiv' : bet.status === 'finished' ? 'Afsluttet' : 'Skabelon'}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
