import { createServerSupabaseClient } from '@onvero/lib/supabase-server';
import { getSessionTenantId } from '@onvero/lib/tenant-server';
import { plausibleStats, plausibleTimeseries } from '@onvero/lib/plausible';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const TENANT = await getSessionTenantId();
  if (!TENANT) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await createServerSupabaseClient();

  const plausibleKey = process.env.PLAUSIBLE_API_KEY || '';

  const [leadsData, plausibleAgg, plausibleSeries] = await Promise.all([
    supabase
      .from('leads')
      .select('id, score, status, email_draft_body, created_at, ai_summary, website_summary')
      .eq('tenant_id', TENANT),
    plausibleKey
      ? plausibleStats(['visitors', 'pageviews', 'bounce_rate', 'visit_duration'], 'month', plausibleKey)
      : null,
    plausibleKey ? plausibleTimeseries('visitors', 'month', plausibleKey) : [],
  ]);

  const leads = (leadsData.data || []) as Record<string, any>[];
  const now = new Date();
  const last24h = leads.filter((l) => new Date(l.created_at) > new Date(now.getTime() - 86400000)).length;
  const last7d = leads.filter((l) => new Date(l.created_at) > new Date(now.getTime() - 7 * 86400000)).length;
  const hot = leads.filter((l) => (l.score || 0) >= 70).length;
  const warm = leads.filter((l) => (l.score || 0) >= 45 && (l.score || 0) < 70).length;
  const cold = leads.filter((l) => (l.score || 0) < 45).length;
  const contacted = leads.filter((l) => l.status === 'contacted').length;
  const qualified = leads.filter((l) => l.status === 'qualified').length;
  const withEmail = leads.filter((l) => l.email_draft_body).length;
  const aiScored = leads.filter((l) => l.score !== null && l.score !== undefined).length;
  const avgScore = leads.length > 0 ? Math.round(leads.reduce((s, l) => s + (l.score || 0), 0) / leads.length) : 0;

  const systemStatus = [
    { name: 'Lead Generator', status: 'active', detail: `${leads.length} Leads total` },
    { name: 'KI-Scoring', status: aiScored > 0 ? 'active' : 'idle', detail: `${aiScored} bewertet` },
    { name: 'E-Mail Drafts', status: withEmail > 0 ? 'active' : 'idle', detail: `${withEmail} erstellt` },
    {
      name: 'Plausible Analytics',
      status: plausibleKey ? ((plausibleAgg?.visitors?.value ?? 0) > 0 ? 'active' : 'pending') : 'missing',
      detail: plausibleKey ? 'Konfiguriert' : 'Nicht konfiguriert',
    },
    { name: 'E-Mail Versand', status: 'planned', detail: 'In Planung' },
  ];

  return NextResponse.json({
    leads: {
      total: leads.length,
      hot,
      warm,
      cold,
      contacted,
      qualified,
      withEmail,
      aiScored,
      avgScore,
      last24h,
      last7d,
      pipelineMin: hot * 5000,
      pipelineMax: hot * 20000,
    },
    website: {
      visitors: plausibleAgg?.visitors?.value || 0,
      pageviews: plausibleAgg?.pageviews?.value || 0,
      bounceRate: plausibleAgg?.bounce_rate?.value || 0,
      visitDuration: plausibleAgg?.visit_duration?.value || 0,
      timeseries: plausibleSeries || [],
    },
    systemStatus,
    hasPlausible: !!plausibleKey,
  });
}
