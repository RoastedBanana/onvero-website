import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { isUUID } from '@/lib/validate';

export const dynamic = 'force-dynamic';

function getAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!isUUID(id)) {
      return NextResponse.json({ error: 'Ungültige ID' }, { status: 400 });
    }

    // Auth
    const userClient = await createServerSupabaseClient();
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Build update payload — only the fields the user can edit here
    const update: Record<string, unknown> = {};
    if (Array.isArray(body.apollo_keywords)) update.apollo_keywords = body.apollo_keywords;
    if (Array.isArray(body.apollo_industries)) update.apollo_industries = body.apollo_industries;
    if (Array.isArray(body.person_titles)) update.person_titles = body.person_titles;
    if (Array.isArray(body.person_locations)) update.person_locations = body.person_locations;
    if (Number.isFinite(body.refined_employee_min)) update.refined_employee_min = body.refined_employee_min;
    if (Number.isFinite(body.refined_employee_max)) update.refined_employee_max = body.refined_employee_max;
    if (Number.isFinite(body.lead_count)) update.lead_count = body.lead_count;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Nichts zu aktualisieren' }, { status: 400 });
    }

    const client = getAdmin() ?? userClient;

    // Verify the user belongs to the tenant of this execution row
    const { data: row, error: fetchErr } = await client
      .from('lead_run_execution')
      .select('id, tenant_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }
    if (!row) {
      return NextResponse.json({ error: 'Execution nicht gefunden' }, { status: 404 });
    }

    const { data: membership } = await userClient
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .eq('tenant_id', row.tenant_id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await client
      .from('lead_run_execution')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, execution: data });
  } catch (err) {
    return NextResponse.json(
      { error: 'Server-Fehler', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
