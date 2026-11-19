import { supabase } from '../lib/supabase';
import type { Profile } from '../types/app';

export async function getProfile(userId: string) {
  return supabase.from('arf_profiles').select('*').eq('id', userId).maybeSingle<Profile>();
}
