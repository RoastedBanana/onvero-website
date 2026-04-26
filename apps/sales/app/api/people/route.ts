import { NextResponse } from 'next/server';
import { getSessionContext, getAdminClient } from '@onvero/lib/tenant-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const ctx = await getSessionContext();
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized', contacts: [], _debug: { reason: 'no-session' } }, { status: 401 });
  }

  const admin = getAdminClient();

  // Admin client, no tenant filter — same visibility as the lead detail page.
  const { data, error } = await admin
    .from('lead_contact_enrichments')
    .select('*, leads:lead_id(company_name, website, city, country, industry, company_description, estimated_num_employees, logo_url, fit_score)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[api/people] query error:', error.message);
    return NextResponse.json({
      error: error.message,
      contacts: [],
      _debug: { reason: 'query-error', tenant: ctx.tenantId },
    }, { status: 500 });
  }

  console.log(`[api/people] tenant=${ctx.tenantId} enrichments=${data?.length ?? 0}`);

  return NextResponse.json({
    contacts: data ?? [],
    _debug: { tenant: ctx.tenantId, count: data?.length ?? 0 },
  });
}
