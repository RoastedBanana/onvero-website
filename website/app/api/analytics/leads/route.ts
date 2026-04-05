import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || '30d';
  const supabase = await createServerSupabaseClient();
  const TENANT = 'df763f85-c687-42d6-be66-a2b353b89c90';

  const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '3mo' ? 90 : 365;
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const { data: leads } = await supabase
    .from('leads')
    .select(
      'id, first_name, last_name, company_name, score, status, email_draft_body, created_at, city, country, custom_fields, ai_summary, ai_tags, ai_next_action'
    )
    .eq('tenant_id', TENANT)
    .gte('created_at', since)
    .order('score', { ascending: false });

  const all = (leads || []) as Record<string, any>[];

  const industryMap: Record<string, { count: number; totalScore: number; hot: number }> = {};
  all.forEach((l) => {
    const cf = l.custom_fields || {};
    const ind = cf.industry_de || (cf.industry && cf.industry !== '' ? cf.industry : null);
    if (!ind || ind === 'Unbekannt') return;
    if (!industryMap[ind]) industryMap[ind] = { count: 0, totalScore: 0, hot: 0 };
    industryMap[ind].count++;
    industryMap[ind].totalScore += l.score || 0;
    if ((l.score || 0) >= 75) industryMap[ind].hot++;
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

  const techMap: Record<string, number> = {};
  all.forEach((l) => {
    const techs: string[] = (l.custom_fields || {}).technologies || [];
    techs.forEach((t) => {
      techMap[t] = (techMap[t] || 0) + 1;
    });
  });
  const topTech = Object.entries(techMap)
    .filter(([name]) => !['Mobile Friendly', 'Remote'].includes(name))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const cityMap: Record<string, number> = {};
  all.forEach((l) => {
    if (l.city) cityMap[l.city] = (cityMap[l.city] || 0) + 1;
  });
  const topCities = Object.entries(cityMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  const scoreHistogram = Array.from({ length: 10 }, (_, i) => ({
    range: `${i * 10}-${i * 10 + 9}`,
    count: all.filter((l) => {
      const s = l.score || 0;
      return s >= i * 10 && s < (i + 1) * 10;
    }).length,
  }));

  const hotLeads = all
    .filter((l) => (l.score || 0) >= 75)
    .slice(0, 10)
    .map((l) => ({
      id: l.id,
      name: `${l.first_name || ''} ${l.last_name || ''}`.trim(),
      company: l.company_name,
      score: l.score,
      status: l.status,
      city: l.city,
      industry: (l.custom_fields || {}).industry_de || (l.custom_fields || {}).industry || '—',
      tags: l.ai_tags || [],
      nextAction: l.ai_next_action,
      hasEmail: !!l.email_draft_body,
    }));

  const weeklyLeads = buildWeekly(all);

  // Data quality score per lead
  const qualityScores = all.map((l) => {
    let q = 0;
    if (l.email_draft_body) q += 20;
    if (l.custom_fields?.industry || l.custom_fields?.industry_de) q += 15;
    if (l.city) q += 10;
    if (l.custom_fields?.linkedin_url) q += 10;
    if (l.score !== null) q += 20;
    if (l.custom_fields?.technologies?.length > 0) q += 15;
    if (l.ai_summary) q += 10;
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
    if (l.score === null || l.score === undefined) return;
    const bucket = Math.min(Math.floor(l.score / 10) * 10, 90);
    const key = `${bucket}-${bucket + 9}`;
    if (scoreRanges[key] !== undefined) scoreRanges[key]++;
  });

  return NextResponse.json({
    total: all.length,
    hot: all.filter((l) => (l.score || 0) >= 75).length,
    warm: all.filter((l) => (l.score || 0) >= 45 && (l.score || 0) < 75).length,
    cold: all.filter((l) => (l.score || 0) < 45).length,
    avgScore: all.length > 0 ? Math.round(all.reduce((s, l) => s + (l.score || 0), 0) / all.length) : 0,
    withEmail: all.filter((l) => l.email_draft_body).length,
    scored: all.filter((l) => l.score !== null).length,
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
      hot: week.filter((l) => (l.score || 0) >= 75).length,
      warm: week.filter((l) => (l.score || 0) >= 45 && (l.score || 0) < 75).length,
      cold: week.filter((l) => (l.score || 0) < 45).length,
    };
  });
}

function getWeek(date: Date): number {
  const d = new Date(date);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}
