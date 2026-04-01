import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const TENANT = 'df763f85-c687-42d6-be66-a2b353b89c90';

  const { data } = await supabase
    .from('lead_daily_stats')
    .select('date, total, hot, warm, cold, avg_score, contacted, pipeline_min, pipeline_max')
    .eq('tenant_id', TENANT)
    .order('date', { ascending: true })
    .limit(90);

  return NextResponse.json({ trend: data || [] });
}
