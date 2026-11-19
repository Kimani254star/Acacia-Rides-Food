import { supabase } from '../lib/supabase';
import type { ServiceRequest, ServiceType } from '../types/app';

export interface CreateRequestInput {
  customerId: string;
  serviceType: ServiceType;
  pickupAddress: string;
  dropoffAddress: string;
  description: string;
}

export async function getRecentRequests(limit = 20) {
  return supabase
    .from('arf_service_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
    .returns<ServiceRequest[]>();
}

export async function createServiceRequest(input: CreateRequestInput) {
  return supabase.from('arf_service_requests').insert({
    customer_id: input.customerId,
    service_type: input.serviceType,
    pickup_address: input.pickupAddress,
    dropoff_address: input.dropoffAddress,
    description: input.description,
    status: 'requested',
  });
}
