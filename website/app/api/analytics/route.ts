import { createServerSupabaseClient } from '@/lib/supabase-server';
import { plausibleStats, plausibleTimeseries, plausibleBreakdown } from '@/lib/plausible';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || '30d';
  const supabase = await createServerSupabaseClient();
  const TENANT = 'df763f85-c687-42d6-be66-a2b353b89c90';

  const plausibleKey = process.env.PLAUSIBLE_API_KEY || '';

  const [leadsData, plausibleAgg, plausibleSeries, plausibleSources, plausiblePages] = await Promise.all([
    supabase
      .from('leads')
      .select('id, score, status, email_draft, created_at, custom_fields, city, country')
      .eq('tenant_id', TENANT),
    plausibleKey
      ? plausibleStats(['visitors', 'pageviews', 'bounce_rate', 'visit_duration', 'visits'], period, plausibleKey)
      : null,
    plausibleKey ? plausibleTimeseries('visitors', period, plausibleKey) : [],
    plausibleKey ? plausibleBreakdown('visit:source', period, plausibleKey) : [],
    plausibleKey ? plausibleBreakdown('event:page', period, plausibleKey) : [],
  ]);

  const leads = (leadsData.data || []) as Record<string, any>[];
  const total = leads.length;
  const hot = leads.filter((l) => (l.score || 0) >= 75).length;
  const warm = leads.filter((l) => (l.score || 0) >= 45 && (l.score || 0) < 75).length;
  const cold = leads.filter((l) => (l.score || 0) < 45).length;
  const contacted = leads.filter((l) => l.status === 'contacted').length;
  const qualified = leads.filter((l) => l.status === 'qualified').length;
  const withEmail = leads.filter((l) => l.email_draft).length;
  const avgScore = total > 0 ? Math.round(leads.reduce((s, l) => s + (l.score || 0), 0) / total) : 0;

  const weeklyLeads = buildWeeklyData(leads);

  const industryMap: Record<string, { count: number; totalScore: number }> = {};
  leads.forEach((l) => {
    const cf = l.custom_fields || {};
    const ind = cf.industry_de || (cf.industry && cf.industry !== '' ? cf.industry : null);
    if (!ind) return;
    if (!industryMap[ind]) industryMap[ind] = { count: 0, totalScore: 0 };
    industryMap[ind].count++;
    industryMap[ind].totalScore += l.score || 0;
  });
  const industries = Object.entries(industryMap)
    .map(([name, d]) => ({ name, count: d.count, avgScore: Math.round(d.totalScore / d.count) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const techMap: Record<string, number> = {};
  leads.forEach((l) => {
    const techs: string[] = (l.custom_fields || {}).technologies || [];
    techs.forEach((t) => {
      techMap[t] = (techMap[t] || 0) + 1;
    });
  });
  const topTech = Object.entries(techMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const cityMap: Record<string, number> = {};
  leads.forEach((l) => {
    if (l.city) cityMap[l.city] = (cityMap[l.city] || 0) + 1;
  });
  const topCities = Object.entries(cityMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  const pipelineMin = hot * 5000;
  const pipelineMax = hot * 20000;

  return NextResponse.json({
    leads: {
      total,
      hot,
      warm,
      cold,
      contacted,
      qualified,
      withEmail,
      avgScore,
      pipelineMin,
      pipelineMax,
      conversionRate: total > 0 ? Math.round((qualified / total) * 100) : 0,
      hotRate: total > 0 ? Math.round((hot / total) * 100) : 0,
    },
    weeklyLeads,
    industries,
    topTech,
    topCities,
    website: {
      visitors: plausibleAgg?.visitors?.value || 0,
      pageviews: plausibleAgg?.pageviews?.value || 0,
      bounceRate: plausibleAgg?.bounce_rate?.value || 0,
      visitDuration: plausibleAgg?.visit_duration?.value || 0,
      visits: plausibleAgg?.visits?.value || 0,
      timeseries: plausibleSeries,
      sources: plausibleSources,
      pages: plausiblePages,
    },
    hasPlausible: !!plausibleKey,
  });
}

function buildWeeklyData(leads: Record<string, any>[]) {
  const weeks: { week: string; total: number; hot: number; warm: number; cold: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const start = new Date();
    start.setDate(start.getDate() - i * 7 - 6);
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setDate(end.getDate() - i * 7);
    end.setHours(23, 59, 59, 999);
    const week = leads.filter((l) => {
      const d = new Date(l.created_at);
      return d >= start && d <= end;
    });
    weeks.push({
      week: `KW${getWeek(start)}`,
      total: week.length,
      hot: week.filter((l) => (l.score || 0) >= 75).length,
      warm: week.filter((l) => (l.score || 0) >= 45 && (l.score || 0) < 75).length,
      cold: week.filter((l) => (l.score || 0) < 45).length,
    });
  }
  return weeks;
}

function getWeek(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}
