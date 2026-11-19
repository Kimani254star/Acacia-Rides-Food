import { supabase } from '../lib/supabase';
import type { UserRole } from '../types/app';

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string, fullName: string, role: UserRole) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role } },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}
