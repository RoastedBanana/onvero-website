import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getSessionTenantId } from '@/lib/tenant-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const tenantId = await getSessionTenantId();
  if (!tenantId) return NextResponse.json({ leads: [] }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('leads')
    .select(
      `
      id, company_name, first_name, last_name, email, phone,
      website, street, city, zip, country,
      status, score, source, notes, estimated_value,
      ai_summary, ai_tags, ai_next_action, ai_scored_at, ai_sources,
      email_draft_subject, email_draft_body, email_subject, website_summary, website_title, website_description,
      google_rating, google_reviews, google_maps_url, google_place_id,
      custom_fields, last_contacted_at, follow_up_at, created_at, apollo_id
    `
    )
    .eq('tenant_id', tenantId)
    .order('score', { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ leads: [], error: error.message }, { status: 500 });
  return NextResponse.json({ leads: data ?? [] });
}
