import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext, getAdminClient } from '@onvero/lib/tenant-server';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, ctxParam: { params: Promise<{ id: string }> }) {
  const { id } = await ctxParam.params;
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = getAdminClient();
  const { data, error } = await client
    .from('potential_leads')
    .select(
      'id, company_name, city, country, website_url, linkedin_url, employee_count, phone, revenue_cents, incorporated_at, discovery_source, gescored, raw_data, created_at',
    )
    .eq('tenant_id', ctx.tenantId)
    .eq('discovery_run_id', id)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ leads: data ?? [] });
}
