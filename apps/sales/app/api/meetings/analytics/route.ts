import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getSessionTenantId } from '@/lib/tenant-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const tenantId = await getSessionTenantId();
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await createServerSupabaseClient();

  // Fetch all meetings + analysis in one go
  const { data: meetings } = await supabase
    .from('meetings')
    .select(
      `
      id, title, type, status, date, duration, win_loss, lead_id, product,
      meeting_analysis ( summary, ai_insights, sentiment, talk_ratio_user, talk_ratio_customer, coaching_scores, action_items )
    `
    )
    .eq('tenant_id', tenantId)
    .order('date', { ascending: false })
    .limit(200);

  if (!meetings) return NextResponse.json({ analytics: null });

  const completed = meetings.filter((m: Record<string, unknown>) => m.status === 'Abgeschlossen');
  const analyses = completed
    .map((m: Record<string, unknown>) => {
      const a = Array.isArray(m.meeting_analysis) ? m.meeting_analysis[0] : m.meeting_analysis;
      return a
        ? {
            ...(a as Record<string, unknown>),
            meetingId: m.id,
            type: m.type,
            win_loss: m.win_loss,
            product: m.product,
            date: m.date,
            duration: m.duration,
          }
        : null;
    })
    .filter(Boolean) as Record<string, unknown>[];

  // Aggregate coaching scores
  const coachingKeys = [
    'gespraechsanteil',
    'fragetechnik',
    'einwandbehandlung',
    'closing',
    'bedarfsanalyse',
    'follow_up',
  ];
  const coachingAgg: Record<string, { total: number; count: number }> = {};
  for (const key of coachingKeys) coachingAgg[key] = { total: 0, count: 0 };

  for (const a of analyses) {
    const scores = a.coaching_scores as Record<string, number> | null;
    if (scores) {
      for (const key of coachingKeys) {
        if (typeof scores[key] === 'number') {
          coachingAgg[key].total += scores[key];
          coachingAgg[key].count += 1;
        }
      }
    }
  }

  const coachingAvg: Record<string, number> = {};
  for (const key of coachingKeys) {
    coachingAvg[key] = coachingAgg[key].count > 0 ? Math.round(coachingAgg[key].total / coachingAgg[key].count) : 0;
  }

  // Sentiment distribution
  const sentiments = { positive: 0, neutral: 0, negative: 0 };
  for (const a of analyses) {
    const s = a.sentiment as string;
    if (s in sentiments) sentiments[s as keyof typeof sentiments]++;
  }

  // Talk ratio average
  let talkRatioUser = 0;
  let talkRatioCount = 0;
  for (const a of analyses) {
    if (typeof a.talk_ratio_user === 'number') {
      talkRatioUser += a.talk_ratio_user as number;
      talkRatioCount++;
    }
  }

  // By type
  const byType: Record<string, { count: number; won: number; lost: number }> = {};
  for (const m of meetings) {
    const t = m.type as string;
    if (!byType[t]) byType[t] = { count: 0, won: 0, lost: 0 };
    byType[t].count++;
    if (m.win_loss === 'won') byType[t].won++;
    if (m.win_loss === 'lost') byType[t].lost++;
  }

  // Collect all AI insights for pattern analysis
  const allInsights: string[] = [];
  const allActionItems: string[] = [];
  for (const a of analyses) {
    const insights = a.ai_insights as string[] | null;
    if (insights) allInsights.push(...insights);
    const actions = a.action_items as { text: string }[] | null;
    if (actions) allActionItems.push(...actions.map((ai) => ai.text));
  }

  // Find recurring patterns (words that appear in multiple insights)
  const wordFreq: Record<string, number> = {};
  const stopWords = new Set([
    'und',
    'die',
    'der',
    'das',
    'ist',
    'ein',
    'eine',
    'für',
    'mit',
    'von',
    'zu',
    'auf',
    'in',
    'den',
    'dem',
    'des',
    'als',
    'wird',
    'bei',
    'hat',
    'sich',
    'nicht',
    'auch',
    'noch',
    'aus',
    'aber',
    'wie',
    'nach',
    'oder',
    'dass',
  ]);
  for (const insight of allInsights) {
    const words = insight
      .toLowerCase()
      .replace(/[^a-zäöüß\s-]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopWords.has(w));
    const unique = new Set(words);
    for (const w of unique) wordFreq[w] = (wordFreq[w] ?? 0) + 1;
  }
  const patterns = Object.entries(wordFreq)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word, count]) => ({ word, count }));

  return NextResponse.json({
    analytics: {
      totalMeetings: meetings.length,
      completed: completed.length,
      planned: meetings.filter((m: Record<string, unknown>) => m.status === 'Geplant').length,
      totalDuration: completed.reduce((s: number, m: Record<string, unknown>) => s + ((m.duration as number) ?? 0), 0),
      avgDuration:
        completed.length > 0
          ? Math.round(
              completed.reduce((s: number, m: Record<string, unknown>) => s + ((m.duration as number) ?? 0), 0) /
                completed.length
            )
          : 0,
      analysisCount: analyses.length,
      coachingAvg,
      sentiments,
      talkRatioUser: talkRatioCount > 0 ? Math.round((talkRatioUser / talkRatioCount) * 100) : null,
      byType,
      patterns,
      recentInsights: allInsights.slice(0, 20),
      winLoss: {
        won: meetings.filter((m: Record<string, unknown>) => m.win_loss === 'won').length,
        lost: meetings.filter((m: Record<string, unknown>) => m.win_loss === 'lost').length,
        pending: meetings.filter((m: Record<string, unknown>) => m.win_loss === 'pending').length,
      },
    },
  });
}
