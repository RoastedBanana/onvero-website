import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getSessionTenantId } from '@/lib/tenant-server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ─── GET: List all meetings for tenant ──────────────────────────────────────

export async function GET() {
  const tenantId = await getSessionTenantId();
  if (!tenantId) return NextResponse.json({ meetings: [] }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('meetings')
    .select(
      `
      *,
      leads:lead_id ( first_name, last_name, company_name ),
      meeting_analysis ( summary, ai_insights, sentiment, coaching_scores )
    `
    )
    .eq('tenant_id', tenantId)
    .order('date', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ meetings: [], error: error.message }, { status: 500 });

  // Flatten lead + analysis into meeting object
  const meetings = (data ?? []).map((m: Record<string, unknown>) => {
    const lead = m.leads as { first_name: string; last_name: string; company_name: string } | null;
    const analysis = Array.isArray(m.meeting_analysis) ? m.meeting_analysis[0] : m.meeting_analysis;
    return {
      ...m,
      leads: undefined,
      meeting_analysis: undefined,
      lead_name: lead ? `${lead.first_name} ${lead.last_name}` : null,
      lead_company: lead?.company_name ?? null,
      summary: (analysis as Record<string, unknown>)?.summary ?? null,
      ai_insights: (analysis as Record<string, unknown>)?.ai_insights ?? null,
      sentiment: (analysis as Record<string, unknown>)?.sentiment ?? null,
    };
  });

  return NextResponse.json({ meetings });
}

// ─── POST: Create a new meeting ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const tenantId = await getSessionTenantId();
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { lead_id, title, type, date, time, duration, phases, product, notes, from_suggestion } = body;

  if (!title || !type || !date || !time) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('meetings')
    .insert({
      tenant_id: tenantId,
      lead_id: lead_id || null,
      title,
      type,
      date,
      time,
      duration: duration ?? 25,
      phases: phases ?? [],
      product: product ?? '',
      notes: notes ?? '',
      from_suggestion: from_suggestion ?? false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ meeting: data }, { status: 201 });
}
