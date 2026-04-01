import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const TENANT = 'df763f85-c687-42d6-be66-a2b353b89c90';

  const { data: leads } = await supabase
    .from('leads')
    .select('created_at, score, status')
    .eq('tenant_id', TENANT)
    .gte('created_at', new Date(Date.now() - 14 * 86400000).toISOString())
    .order('created_at', { ascending: true });

  const dayMap: Record<string, { total: number; hot: number; warm: number; cold: number }> = {};

  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    dayMap[key] = { total: 0, hot: 0, warm: 0, cold: 0 };
  }

  (leads || []).forEach((l) => {
    const day = l.created_at.split('T')[0];
    if (!dayMap[day]) return;
    dayMap[day].total++;
    const s = l.score || 0;
    if (s >= 75) dayMap[day].hot++;
    else if (s >= 45) dayMap[day].warm++;
    else dayMap[day].cold++;
  });

  const trend = Object.entries(dayMap).map(([date, d]) => ({
    date,
    label: new Date(date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
    ...d,
  }));

  return NextResponse.json({ trend });
}
