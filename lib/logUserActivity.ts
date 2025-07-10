// /lib/logUserActivity.ts

import { supabase } from '@/lib/supabaseClient';

// Log brugeraktivitet til Supabase
export async function logUserActivity({
  userId,
  path,
  userAgent,
  extra,
}: {
  userId: string;
  path: string;
  userAgent?: string | null;
  extra?: any;
}) {
  // Brug altid browserens userAgent hvis ikke angivet
  const resolvedUserAgent =
    userAgent ||
    (typeof navigator !== 'undefined' && typeof navigator.userAgent === 'string'
      ? navigator.userAgent
      : null);

  // Forsøg at indsætte log i Supabase
  const { error } = await supabase.from('user_activity_log').insert({
    user_id: userId,
    path,
    user_agent: resolvedUserAgent,
    extra: extra || null,
    timestamp: new Date().toISOString(), // Hvis din tabel kræver timestamp
  });

  if (error) {
    // Log altid fejl til console!
    console.error('❌ logUserActivity fejlede:', error);
    return false;
  }
  // Debug info (kan fjernes)
  // console.log('✅ logUserActivity gemt:', { userId, path, resolvedUserAgent });
  return true;
}
