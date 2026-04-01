import { createServerSupabaseClient } from './supabase-server';

import type { Lead, LeadStats } from './leads-client';
import { mapLead } from './leads-client';
export type { Lead, LeadStats, ScoreBreakdown } from './leads-client';
export { mapLead, computeStats } from './leads-client';

const TENANT_ID = 'df763f85-c687-42d6-be66-a2b353b89c90';

export async function fetchLeads(): Promise<Lead[]> {
  const client = await createServerSupabaseClient();
  const { data, error } = await client
    .from('leads')
    .select(
      `
      id, company_name, first_name, last_name, email, phone,
      website, street, city, zip, country,
      status, score, source, notes, estimated_value,
      ai_summary, ai_tags, ai_next_action, ai_scored_at,
      email_draft, website_summary, website_title, website_description,
      custom_fields, last_contacted_at, follow_up_at, created_at, apollo_id
    `
    )
    .eq('tenant_id', TENANT_ID)
    .order('score', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapLead);
}
