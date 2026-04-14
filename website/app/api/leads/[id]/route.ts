import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getSessionTenantId } from '@/lib/tenant-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey) {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
  }
  return null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenantId = await getSessionTenantId();
  if (!tenantId) {
    return NextResponse.json({ lead: null, activities: [], error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = getAdmin() ?? (await createServerSupabaseClient());

    const [leadRes, activitiesRes] = await Promise.all([
      client
        .from('leads')
        .select(
          `id, company_name, first_name, last_name, email, phone,
           website, city, country, status, score, source,
           ai_summary, ai_tags, ai_next_action, ai_scored_at, ai_sources,
           email_draft_subject, email_draft_body, email_subject, website_summary, website_title,
           google_rating, google_reviews, google_maps_url, google_place_id,
           custom_fields, last_contacted_at, created_at, apollo_id, employment_history, organisation,
           strengths, concerns, is_excluded, exclusion_reason, website_data, follow_up_context`
        )
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .maybeSingle(),
      client
        .from('lead_activities')
        .select('id, type, title, content, content_full_title, content_full_content, interested, created_at, metadata')
        .eq('lead_id', id)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    if (leadRes.error) {
      console.error('[leads/[id]] supabase error:', leadRes.error);
      return NextResponse.json({ lead: null, activities: [], error: leadRes.error.message }, { status: 500 });
    }

    return NextResponse.json({
      lead: leadRes.data ?? null,
      activities: activitiesRes.data ?? [],
    });
  } catch (e) {
    return NextResponse.json({ error: String(e), lead: null, activities: [] }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  // Extract only safe fields to update (prevent injecting arbitrary columns)
  const safeFields: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const allowed = [
    'status',
    'score',
    'notes',
    'email',
    'phone',
    'first_name',
    'last_name',
    'company_name',
    'follow_up_at',
    'ai_next_action',
  ];
  for (const key of allowed) {
    if (key in body) safeFields[key] = body[key];
  }

  const client = getAdmin() ?? (await createServerSupabaseClient());

  // Try with session tenant first
  let tenantId = await getSessionTenantId();

  // Fallback: if no session, look up tenant from the lead itself (service role only)
  if (!tenantId && getAdmin()) {
    const { data: lead } = await client.from('leads').select('tenant_id').eq('id', id).single();
    tenantId = lead?.tenant_id ?? null;
  }

  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await client
    .from('leads')
    .update(safeFields)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ lead: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenantId = await getSessionTenantId();
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = getAdmin() ?? (await createServerSupabaseClient());

  await client.from('lead_activities').delete().eq('lead_id', id).eq('tenant_id', tenantId);
  const { error } = await client.from('leads').delete().eq('id', id).eq('tenant_id', tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
