import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
}

export async function POST(req: NextRequest) {
  // Optional shared-secret check.
  const expected = process.env.N8N_WEBHOOK_SECRET;
  if (expected) {
    const given = req.headers.get('x-onvero-secret');
    if (given !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const body = (await req.json().catch(() => ({}))) as {
    success?: boolean;
    company_name?: string;
    lead_id?: string;
    structural_fields_updated?: number;
    hrb_match_status?: string;
    scoring_complete?: boolean;
  };

  if (!body.lead_id || typeof body.lead_id !== 'string') {
    return NextResponse.json({ error: 'lead_id required' }, { status: 400 });
  }

  const admin = getAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }

  // Resolve tenant + run via the lead row (RLS-bypassed via service role).
  const { data: lead } = await admin
    .from('leads')
    .select('id, tenant_id, company_name, custom_fields')
    .eq('id', body.lead_id)
    .maybeSingle();

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  const customFields = (lead.custom_fields ?? {}) as Record<string, unknown>;
  const potentialLeadId =
    typeof customFields.potential_lead_id === 'string'
      ? (customFields.potential_lead_id as string)
      : null;
  const discoveryRunId =
    typeof customFields.discovery_run_id === 'string'
      ? (customFields.discovery_run_id as string)
      : null;

  // Mark the originating potential_lead as scored so the UI greys it out.
  if (potentialLeadId) {
    await admin
      .from('potential_leads')
      .update({ gescored: true })
      .eq('id', potentialLeadId)
      .eq('tenant_id', lead.tenant_id);
  }

  // Create the in-app notification.
  const companyName = body.company_name || (lead.company_name as string) || 'Lead';
  const title = body.scoring_complete
    ? `${companyName}: Scoring abgeschlossen`
    : `${companyName}: Anreicherung abgeschlossen`;
  const bodyText = body.scoring_complete
    ? 'Der Lead wurde vollständig angereichert und bewertet.'
    : 'Der Lead wurde angereichert.';

  await admin.from('notifications').insert({
    tenant_id: lead.tenant_id,
    type: 'lead_scoring_complete',
    title,
    body: bodyText,
    link: `/dashboard/unternehmen/${lead.id}`,
    payload: {
      lead_id: lead.id,
      potential_lead_id: potentialLeadId,
      discovery_run_id: discoveryRunId,
      company_name: companyName,
      structural_fields_updated: body.structural_fields_updated ?? null,
      hrb_match_status: body.hrb_match_status ?? null,
      scoring_complete: !!body.scoring_complete,
    },
  });

  return NextResponse.json({ ok: true });
}
