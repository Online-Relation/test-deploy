// components/UserStatus.tsx
'use client';

import { useUser } from '@/context/UserContext';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UserStatus() {
  const { user, loading } = useUser();
  const [name, setName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchProfileName = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .maybeSingle();
      setName(data?.display_name || user.email || '');
    };

    fetchProfileName();
  }, [user]);

  if (loading) return null;

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="text-right text-sm text-gray-600 mb-4">
      {user ? (
        <>
          <div className="mb-1">Du er logget ind som: <strong>{name}</strong></div>
          <button
            onClick={handleLogout}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            Log ud
          </button>
        </>
      ) : (
        <div>Ikke logget ind</div>
      )}
    </div>
  );
}
