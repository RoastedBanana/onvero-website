import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getSessionTenantId } from '@/lib/tenant-server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ─── GET: Single meeting with related data ──────────────────────────────────

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenantId = await getSessionTenantId();
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await createServerSupabaseClient();

  const [meetingRes, notesRes, analysisRes, transcriptRes] = await Promise.all([
    supabase.from('meetings').select('*').eq('id', id).eq('tenant_id', tenantId).single(),
    supabase
      .from('meeting_notes')
      .select('*')
      .eq('meeting_id', id)
      .eq('tenant_id', tenantId)
      .order('timestamp_seconds'),
    supabase.from('meeting_analysis').select('*').eq('meeting_id', id).eq('tenant_id', tenantId).single(),
    supabase.from('meeting_transcripts').select('*').eq('meeting_id', id).eq('tenant_id', tenantId).single(),
  ]);

  if (meetingRes.error) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });

  return NextResponse.json({
    meeting: meetingRes.data,
    notes: notesRes.data ?? [],
    analysis: analysisRes.data ?? null,
    transcript: transcriptRes.data ?? null,
  });
}

// ─── PATCH: Update meeting ──────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenantId = await getSessionTenantId();
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  // Only allow updating specific fields
  const allowed: Record<string, unknown> = {};
  const fields = ['title', 'type', 'status', 'date', 'time', 'duration', 'phases', 'product', 'notes', 'win_loss'];
  for (const key of fields) {
    if (key in body) allowed[key] = body[key];
  }

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('meetings')
    .update(allowed)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ meeting: data });
}

// ─── DELETE: Delete meeting ─────────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenantId = await getSessionTenantId();
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('meetings').delete().eq('id', id).eq('tenant_id', tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
