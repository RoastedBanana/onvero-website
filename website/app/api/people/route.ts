import { NextResponse } from 'next/server';
import { getSessionContext, getAdminClient } from '@/lib/tenant-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = getAdminClient();

  const { data, error } = await admin
    .from('lead_contact_enrichments')
    .select('*, leads:lead_id(company_name, website, city, country, industry, company_description, estimated_num_employees, logo_url, fit_score)')
    .eq('tenant_id', ctx.tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ contacts: data ?? [] });
}
