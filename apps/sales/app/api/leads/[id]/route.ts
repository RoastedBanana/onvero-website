import { createClient } from '@supabase/supabase-js';
import { getSessionTenantId, getAdminClient } from '@onvero/lib/tenant-server';
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
    const client = getAdmin() ?? getAdminClient();

    const [leadRes, activitiesRes, contactsRes, analysisRes] = await Promise.all([
      client.from('leads').select('*').eq('id', id).eq('tenant_id', tenantId).maybeSingle(),
      client
        .from('lead_activities')
        .select('id, type, title, content, content_full_title, content_full_content, interested, created_at, metadata')
        .eq('lead_id', id)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(20),
      client
        .from('lead_contacts')
        .select(
          'id, apollo_person_id, first_name, last_name, full_name, title, role, seniority, email, email_status, phone, mobile_phone, linkedin_url, photo_url, city, country, status, is_primary, created_at'
        )
        .eq('lead_id', id)
        .eq('tenant_id', tenantId)
        .neq('is_excluded', true)
        .order('created_at', { ascending: false }),
      client
        .from('lead_analyses')
        .select(
          'id, version, is_current, primary_hook, backup_hooks, timing_assessment, deal_potential, contact_strategy, predicted_objections, corroborated_signals, contradictions, critical_warnings, data_quality_summary, domain_confidences, created_at'
        )
        .eq('lead_id', id)
        .eq('tenant_id', tenantId)
        .eq('is_current', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (leadRes.error) {
      console.error('[leads/[id]] supabase error:', leadRes.error);
      return NextResponse.json(
        { lead: null, activities: [], contacts: [], error: leadRes.error.message },
        { status: 500 }
      );
    }

    // For each contact, pull the latest enrichment with an actual email draft.
    type ContactRow = {
      id: string;
      apollo_person_id?: string | null;
      first_name?: string | null;
      last_name?: string | null;
      full_name?: string | null;
      title?: string | null;
      role?: string | null;
      seniority?: string | null;
      email?: string | null;
      email_status?: string | null;
      phone?: string | null;
      mobile_phone?: string | null;
      linkedin_url?: string | null;
      photo_url?: string | null;
      city?: string | null;
      country?: string | null;
      status?: string | null;
      is_primary?: boolean | null;
      created_at?: string | null;
    };
    const contactRows: ContactRow[] = contactsRes.data ?? [];
    const contactIds = contactRows.map((c) => c.id);
    const draftsByContact: Record<string, { subject: string | null; body: string | null; created_at: string }> = {};
    if (contactIds.length) {
      const { data: enrichRows } = await client
        .from('lead_contact_enrichments')
        .select('lead_contact_id, email_draft_subject, email_draft_body, created_at')
        .in('lead_contact_id', contactIds)
        .not('email_draft_body', 'is', null)
        .order('created_at', { ascending: false });
      for (const row of enrichRows ?? []) {
        if (!draftsByContact[row.lead_contact_id]) {
          draftsByContact[row.lead_contact_id] = {
            subject: row.email_draft_subject,
            body: row.email_draft_body,
            created_at: row.created_at,
          };
        }
      }
    }

    const contacts = contactRows.map((c) => ({
      ...c,
      email_draft_subject: draftsByContact[c.id]?.subject ?? null,
      email_draft_body: draftsByContact[c.id]?.body ?? null,
      email_generated_at: draftsByContact[c.id]?.created_at ?? null,
    }));

    return NextResponse.json({
      lead: leadRes.data ?? null,
      activities: activitiesRes.data ?? [],
      contacts,
      analysis: analysisRes.data ?? null,
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
    'archived',
  ];
  for (const key of allowed) {
    if (key in body) safeFields[key] = body[key];
  }

  const tenantId = await getSessionTenantId();
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = getAdminClient();

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

  const client = getAdmin() ?? getAdminClient();

  await client.from('lead_activities').delete().eq('lead_id', id).eq('tenant_id', tenantId);
  const { error } = await client.from('leads').delete().eq('id', id).eq('tenant_id', tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
