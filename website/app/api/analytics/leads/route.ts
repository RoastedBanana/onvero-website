import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getSessionTenantId } from '@/lib/tenant-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const TENANT = await getSessionTenantId();
  if (!TENANT) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'all';
  const supabase = await createServerSupabaseClient();

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
                  : null;

  let query = supabase
    .from('leads')
    .select(
      'id, company_name, fit_score, status, created_at, city, country, industry, linkedin_url, logo_url, summary, technology_names, tier, company_description, phone, website'
    )
    .eq('tenant_id', TENANT)
    .order('fit_score', { ascending: false, nullsFirst: false });

  if (days !== null) {
    query = query.gte('created_at', new Date(Date.now() - days * 86400000).toISOString());
  }

  const { data: leads, error } = await query;

  if (error) {
    console.error('[analytics/leads] Query error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const all = (leads || []) as Record<string, any>[];

  // Industry distribution
  const industryMap: Record<string, { count: number; totalScore: number; hot: number }> = {};
  all.forEach((l) => {
    const ind = l.industry;
    if (!ind || ind === 'Unbekannt' || ind === '') return;
    if (!industryMap[ind]) industryMap[ind] = { count: 0, totalScore: 0, hot: 0 };
    industryMap[ind].count++;
    industryMap[ind].totalScore += l.fit_score || 0;
    if ((l.fit_score || 0) >= 70) industryMap[ind].hot++;
  });
  const industries = Object.entries(industryMap)
    .map(([name, d]) => ({
      name,
      count: d.count,
      avgScore: d.count > 0 ? Math.round(d.totalScore / d.count) : 0,
      hot: d.hot,
    }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 10);

  // Technology distribution
  const techMap: Record<string, number> = {};
  all.forEach((l) => {
    const techs: string[] = l.technology_names || [];
    techs.forEach((t) => {
      techMap[t] = (techMap[t] || 0) + 1;
    });
  });
  const topTech = Object.entries(techMap)
    .filter(([name]) => !['Mobile Friendly', 'Remote'].includes(name))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  // City distribution
  const cityMap: Record<string, number> = {};
  all.forEach((l) => {
    if (l.city) cityMap[l.city] = (cityMap[l.city] || 0) + 1;
  });
  const topCities = Object.entries(cityMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  // Score histogram
  const scoreHistogram = Array.from({ length: 10 }, (_, i) => ({
    range: `${i * 10}-${i * 10 + 9}`,
    count: all.filter((l) => {
      const s = l.fit_score || 0;
      return s >= i * 10 && s < (i + 1) * 10;
    }).length,
  }));

  // Hot leads list
  const hotLeads = all
    .filter((l) => (l.fit_score || 0) >= 70)
    .slice(0, 10)
    .map((l) => ({
      id: l.id,
      name: l.company_name,
      company: l.company_name,
      score: l.fit_score,
      status: l.status,
      city: l.city,
      industry: l.industry || '—',
    }));

  const weeklyLeads = buildWeekly(all);

  // Data quality score per lead
  const qualityScores = all.map((l) => {
    let q = 0;
    if (l.industry) q += 15;
    if (l.city) q += 10;
    if (l.linkedin_url) q += 15;
    if (l.fit_score !== null) q += 20;
    if (l.technology_names?.length > 0) q += 15;
    if (l.summary) q += 10;
    if (l.website) q += 10;
    if (l.phone) q += 5;
    return q;
  });
  const avgDataQuality = all.length > 0 ? Math.round(qualityScores.reduce((a, b) => a + b, 0) / all.length) : 0;

  // Score ranges for histogram
  const scoreRanges: Record<string, number> = {
    '0-9': 0,
    '10-19': 0,
    '20-29': 0,
    '30-39': 0,
    '40-49': 0,
    '50-59': 0,
    '60-69': 0,
    '70-79': 0,
    '80-89': 0,
    '90-99': 0,
  };
  all.forEach((l) => {
    if (l.fit_score === null || l.fit_score === undefined) return;
    const bucket = Math.min(Math.floor(l.fit_score / 10) * 10, 90);
    const key = `${bucket}-${bucket + 9}`;
    if (scoreRanges[key] !== undefined) scoreRanges[key]++;
  });

  const scored = all.filter((l) => l.fit_score !== null);
  const contacted = all.filter((l) => l.status === 'contacted' || l.status === 'qualified');

  return NextResponse.json({
    total: all.length,
    hot: all.filter((l) => (l.fit_score || 0) >= 70).length,
    warm: all.filter((l) => (l.fit_score || 0) >= 45 && (l.fit_score || 0) < 70).length,
    cold: all.filter((l) => (l.fit_score || 0) < 45).length,
    avgScore: scored.length > 0 ? Math.round(scored.reduce((s, l) => s + (l.fit_score || 0), 0) / scored.length) : 0,
    withEmail: all.filter((l) => l.linkedin_url).length,
    scored: scored.length,
    contacted: contacted.length,
    avgDataQuality,
    scoreRanges,
    industries,
    topTech,
    topCities,
    scoreHistogram,
    hotLeads,
    weeklyLeads,
  });
}

function buildWeekly(leads: Record<string, any>[]) {
  return Array.from({ length: 8 }, (_, i) => {
    const weeksAgo = 7 - i;
    const start = new Date();
    start.setDate(start.getDate() - weeksAgo * 7);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    const week = leads.filter((l) => {
      const d = new Date(l.created_at);
      return d >= start && d <= end;
    });
    return {
      week: `KW${getWeek(start)}`,
      total: week.length,
      hot: week.filter((l) => (l.fit_score || 0) >= 70).length,
      warm: week.filter((l) => (l.fit_score || 0) >= 45 && (l.fit_score || 0) < 70).length,
      cold: week.filter((l) => (l.fit_score || 0) < 45).length,
    };
  });
}

function getWeek(date: Date): number {
  const d = new Date(date);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}
