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
    .select('*')
    .eq('tenant_id', tenantId)
    .order('date', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ meetings: [], error: error.message }, { status: 500 });
  return NextResponse.json({ meetings: data ?? [] });
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
