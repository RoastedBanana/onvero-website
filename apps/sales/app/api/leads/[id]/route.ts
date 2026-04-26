import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@onvero/lib/supabase-server';
import { getSessionTenantId } from '@onvero/lib/tenant-server';
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
        .select('*')
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
    'fit_score',
    'phone',
    'company_name',
    'next_action',
    'tier',
    'is_excluded',
    'exclusion_reason',
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
