import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const TENANT = 'df763f85-c687-42d6-be66-a2b353b89c90';

  const [activitiesRes, statsRes] = await Promise.all([
    supabase
      .from('lead_activities')
      .select('id, type, title, content, created_at, lead_id, metadata')
      .eq('tenant_id', TENANT)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('lead_activities').select('type').eq('tenant_id', TENANT),
  ]);

  const typeCounts: Record<string, number> = {};
  (statsRes.data || []).forEach((s) => {
    typeCounts[s.type] = (typeCounts[s.type] || 0) + 1;
  });

  return NextResponse.json({
    activities: activitiesRes.data || [],
    typeCounts,
    total: statsRes.data?.length || 0,
  });
}
