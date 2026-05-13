import { NextResponse } from 'next/server';
import { getSalesSessionContext, getAdminClient } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  const ctx = await getSalesSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = getAdminClient();
  const tid = ctx.tenantId;

  const [profileRes, leadsRes] = await Promise.all([
    client
      .from('tenant_ai_profile')
      .select('icp_config, scoring_weights, notifications_config')
      .eq('tenant_id', tid)
      .maybeSingle(),
    client.from('leads').select('score, status, employees, shop_system').eq('tenant_id', tid).limit(500),
  ]);

  const profile = profileRes.data;
  const leads = leadsRes.data ?? [];

  const icp = profile?.icp_config as Record<string, unknown> | null;
  const weights = profile?.scoring_weights as Record<string, unknown> | null;
  const notif = profile?.notifications_config as Record<string, unknown> | null;

  const hasLeads = leads.length > 0;
  const hasEnrichedFirmographics = leads.some((l) => l.employees != null && l.employees !== '');
  const hasTechnographics = leads.some((l) => l.shop_system != null && l.shop_system !== '');
  const hasHighScoreLead = leads.some((l) => (l.score ?? 0) >= 80);
  const hasWarmOrHot = leads.some((l) => l.status === 'hot' || l.status === 'warm');

  const icpConfigured = icp != null && Array.isArray(icp.industries) && (icp.industries as unknown[]).length > 0;

  const scoringConfigured = weights != null && typeof weights.fit === 'number';

  const carriersConfigured =
    icp != null && Array.isArray(icp.excluded_carriers) && (icp.excluded_carriers as unknown[]).length > 0;

  const notificationsConfigured = notif != null && (notif.slack_webhook || notif.notify_hot);

  const status: Record<string, boolean> = {
    'icp-1': icpConfigured,
    'icp-2': scoringConfigured,
    'icp-3': carriersConfigured,
    'data-1': hasLeads,
    'data-2': hasEnrichedFirmographics,
    'data-3': hasTechnographics,
    'sig-2': !!notificationsConfigured,
    'pipe-1': hasHighScoreLead,
    'pipe-2': hasWarmOrHot,
  };

  return NextResponse.json({ status });
}
