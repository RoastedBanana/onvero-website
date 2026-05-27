import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ingestScoringResult } from '../../discovery-runs/_scoring';

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

  // Resolve tenant via the lead row so we can scope the ingest correctly.
  const { data: lead } = await admin
    .from('leads')
    .select('id, tenant_id')
    .eq('id', body.lead_id)
    .maybeSingle();

  if (!lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
  }

  await ingestScoringResult({
    client: admin,
    tenantId: lead.tenant_id as string,
    leadId: lead.id as string,
    companyName: body.company_name,
    structuralFieldsUpdated:
      typeof body.structural_fields_updated === 'number'
        ? body.structural_fields_updated
        : null,
    hrbMatchStatus: typeof body.hrb_match_status === 'string' ? body.hrb_match_status : null,
    scoringComplete: typeof body.scoring_complete === 'boolean' ? body.scoring_complete : true,
  });

  return NextResponse.json({ ok: true });
}
