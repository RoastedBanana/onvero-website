import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getSessionTenantId } from '@/lib/tenant-server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// ─── POST: Trigger KI-Analyse via n8n workflow ──────────────────────────────
// Sends meeting data + transcript + notes to the Meeting Analyzer workflow,
// which writes results into meeting_analysis table and returns summary.

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenantId = await getSessionTenantId();
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const webhookUrl = process.env.N8N_WEBHOOK_MEETING_ANALYZER;
  if (!webhookUrl) {
    return NextResponse.json({ error: 'N8N_WEBHOOK_MEETING_ANALYZER not configured' }, { status: 500 });
  }

  const supabase = await createServerSupabaseClient();

  // Fetch meeting + transcript + notes
  const [meetingRes, transcriptRes, notesRes] = await Promise.all([
    supabase.from('meetings').select('*').eq('id', id).eq('tenant_id', tenantId).single(),
    supabase.from('meeting_transcripts').select('transcript').eq('meeting_id', id).eq('tenant_id', tenantId).single(),
    supabase
      .from('meeting_notes')
      .select('*')
      .eq('meeting_id', id)
      .eq('tenant_id', tenantId)
      .order('timestamp_seconds'),
  ]);

  if (meetingRes.error || !meetingRes.data) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
  }

  const meeting = meetingRes.data;
  const transcript = transcriptRes.data?.transcript ?? '';
  const notes = (notesRes.data ?? []).map((n: Record<string, unknown>) => ({
    text: n.text,
    timestamp: n.timestamp_seconds,
    phaseName: n.phase_name,
  }));

  // Also accept transcript from request body (for cases where it wasn't saved to DB yet)
  let finalTranscript = transcript;
  try {
    const body = await req.json().catch(() => ({}));
    if (body.transcript && !finalTranscript) {
      finalTranscript = body.transcript;
    }
  } catch {}

  // Call n8n Meeting Analyzer workflow
  const payload = {
    meeting_id: id,
    tenant_id: tenantId,
    transcript: finalTranscript,
    meeting_title: meeting.title,
    meeting_type: meeting.type,
    contact_name: meeting.lead_id ? undefined : meeting.title.split('—')[0]?.trim(),
    company: '',
    product: meeting.product || '',
    notes,
    phases: meeting.phases || [],
  };

  // If we have a lead, enrich with lead data
  if (meeting.lead_id) {
    const { data: lead } = await supabase
      .from('leads')
      .select('first_name, last_name, company_name')
      .eq('id', meeting.lead_id)
      .single();
    if (lead) {
      payload.contact_name = `${lead.first_name} ${lead.last_name}`;
      payload.company = lead.company_name;
    }
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await res.text();

    if (!res.ok) {
      return NextResponse.json({ error: text || 'n8n workflow failed' }, { status: res.status });
    }

    try {
      const json = JSON.parse(text);
      return NextResponse.json(json);
    } catch {
      return NextResponse.json({ result: text });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── GET: Fetch existing analysis ───────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenantId = await getSessionTenantId();
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('meeting_analysis')
    .select('*')
    .eq('meeting_id', id)
    .eq('tenant_id', tenantId)
    .single();

  if (error) return NextResponse.json({ analysis: null });
  return NextResponse.json({ analysis: data });
}
