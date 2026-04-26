import { createServerSupabaseClient } from '@onvero/lib/supabase-server';
import { getSessionTenantId } from '@onvero/lib/tenant-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const TENANT = await getSessionTenantId();
  if (!TENANT) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await createServerSupabaseClient();

  const [activitiesRes, statsRes] = await Promise.all([
    supabase
      .from('lead_activities')
      .select('id, type, title, content, created_at, lead_id, metadata')
      .eq('tenant_id', TENANT)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('lead_activities').select('type').eq('tenant_id', TENANT),
  ]);

  const activities = activitiesRes.data || [];

  // Load lead data for activities
  const leadIds = [...new Set(activities.map((a) => a.lead_id).filter(Boolean))];
  let leadsById: Record<string, any> = {};
  if (leadIds.length > 0) {
    const { data: leadsData } = await supabase
      .from('leads')
      .select('id, first_name, last_name, company_name, score, status')
      .in('id', leadIds);
    leadsById = Object.fromEntries((leadsData || []).map((l) => [l.id, l]));
  }

  const enriched = activities.map((a) => {
    const lead = leadsById[a.lead_id] || null;
    return {
      ...a,
      lead_name: lead ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim() : null,
      company: lead?.company_name || null,
      score: lead?.score ?? null,
      lead_status: lead?.status || null,
    };
  });

  const typeCounts: Record<string, number> = {};
  (statsRes.data || []).forEach((s) => {
    typeCounts[s.type] = (typeCounts[s.type] || 0) + 1;
  });

  return NextResponse.json({
    activities: enriched,
    typeCounts,
    total: statsRes.data?.length || 0,
  });
}
