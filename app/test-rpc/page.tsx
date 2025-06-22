// /app/test-rpc/page.tsx
'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function TestRpcPage() {
  useEffect(() => {
    console.log('🔥 useEffect kører');

    const runRpc = async () => {
      console.log('🚀 Starter RPC kald...');

      const { data, error } = await supabase.rpc('create_knob_guess_session', {
        responder_id: '190a3151-97bc-43be-9daf-1f3b3062f97f',
        question_id: '026331bb-83dc-43cb-839a-642838213daa'
      });

      console.log('📦 Data:', data);
      console.log('⚠️ Error:', error);
    };

    runRpc();
  }, []);

  return (
    <div className="p-10 text-center">
      <h1 className="text-2xl font-bold text-blue-700">RPC Test – create_knob_guess_session</h1>
    </div>
  );
}
