import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getSessionTenantId } from '@/lib/tenant-server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ─── POST: Save meeting notes (batch) ──────────────────────────────────────

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenantId = await getSessionTenantId();
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { notes } = body;

  if (!Array.isArray(notes) || notes.length === 0) {
    return NextResponse.json({ error: 'Notes array required' }, { status: 400 });
  }

  const rows = notes.map((n: { text: string; timestamp: number; phaseId?: string; phaseName?: string }) => ({
    meeting_id: id,
    tenant_id: tenantId,
    text: n.text,
    timestamp_seconds: n.timestamp ?? 0,
    phase_id: n.phaseId ?? null,
    phase_name: n.phaseName ?? null,
  }));

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('meeting_notes').insert(rows).select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notes: data }, { status: 201 });
}
