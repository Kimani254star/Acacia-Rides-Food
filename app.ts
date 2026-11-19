import type { Session } from '@supabase/supabase-js';

export type UserRole = 'customer' | 'driver' | 'restaurant' | 'admin';
export type ServiceType = 'ride' | 'food' | 'parcel';
export type AppTab = 'home' | 'activity' | 'account';

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole | null;
  [key: string]: unknown;
}

export interface ServiceRequest {
  id: string;
  service_type: string;
  status: string;
  pickup_address: string | null;
  dropoff_address: string | null;
  created_at: string;
}

export interface AuthState {
  session: Session | null;
  profile: Profile | null;
}
