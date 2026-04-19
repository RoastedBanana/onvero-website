import { NextResponse } from 'next/server';
import { getSessionContext, getAdminClient } from '@/lib/tenant-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = getAdminClient();

  const [tenantRes, creditsRes] = await Promise.all([
    admin.from('tenants').select('id, name').eq('id', ctx.tenantId).maybeSingle(),
    admin
      .from('tenant_credits')
      .select('plan, credits_remaining, credits_used_period, overage_used, period_start, period_end, is_paused')
      .eq('tenant_id', ctx.tenantId)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    tenant: tenantRes.data ?? null,
    credits: creditsRes.data ?? null,
  });
}
