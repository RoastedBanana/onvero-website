import { createServerSupabaseClient } from '@onvero/lib/supabase-server';
import { getSessionTenantId } from '@onvero/lib/tenant-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const TENANT = await getSessionTenantId();
  if (!TENANT) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || '30d';
  const days =
    period === 'all'
      ? null
      : period === '7d'
        ? 7
        : period === '14d'
          ? 14
          : period === '30d'
            ? 30
            : period === '3mo'
              ? 90
              : period === '6mo'
                ? 180
                : period === '1y'
                  ? 365
                  : 30;

  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('leads')
    .select('created_at, fit_score, status')
    .eq('tenant_id', TENANT)
    .order('created_at', { ascending: true });

  if (days !== null) {
    query = query.gte('created_at', new Date(Date.now() - days * 86400000).toISOString());
  }

  const { data: leads } = await query;

  // For 'all' or periods > 30 days, group by week; otherwise by day
  const effectiveDays = days ?? 365;
  const useWeeks = effectiveDays > 30;
  const bucketCount = useWeeks ? Math.min(Math.ceil(effectiveDays / 7), 52) : effectiveDays;

  const bucketMap: Record<string, { total: number; hot: number; warm: number; cold: number }> = {};

  if (useWeeks) {
    for (let i = bucketCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * 7);
      const key = getWeekKey(d);
      bucketMap[key] = { total: 0, hot: 0, warm: 0, cold: 0 };
    }
  } else {
    for (let i = effectiveDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      bucketMap[key] = { total: 0, hot: 0, warm: 0, cold: 0 };
    }
  }

  (leads || []).forEach((l) => {
    const date = new Date(l.created_at);
    const key = useWeeks ? getWeekKey(date) : l.created_at.split('T')[0];
    if (!bucketMap[key]) return;
    bucketMap[key].total++;
    const s = l.fit_score || 0;
    if (s >= 70) bucketMap[key].hot++;
    else if (s >= 45) bucketMap[key].warm++;
    else bucketMap[key].cold++;
  });

  const trend = Object.entries(bucketMap).map(([date, d]) => ({
    date,
    label: useWeeks ? date : new Date(date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
    ...d,
  }));

  return NextResponse.json({ trend });
}

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `KW${weekNum}`;
}
