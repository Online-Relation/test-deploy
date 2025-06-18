// lib/getPartnerProfile.ts
import { supabase } from './supabaseClient';

export async function getPartnerProfile(currentUserId: string) {
  const { data: currentUser, error: userError } = await supabase
    .from('profiles')
    .select('partner_id')
    .eq('id', currentUserId)
    .maybeSingle();

  if (userError || !currentUser?.partner_id) {
    console.error('Fejl ved hentning af partner_id:', userError?.message || 'partner_id mangler på profilen');
    return null;
  }

  const { data: partner, error: partnerError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', currentUser.partner_id)
    .maybeSingle();

  if (partnerError || !partner) {
    console.error('Fejl ved hentning af partner-profil:', partnerError?.message || 'Ingen data');
    return null;
  }

  return partner;
}
