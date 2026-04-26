import { createServerSupabaseClient } from '@onvero/lib/supabase-server';
import { getSessionTenantId } from '@onvero/lib/tenant-server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ─── GET: List active suggestions ───────────────────────────────────────────

export async function GET() {
  const tenantId = await getSessionTenantId();
  if (!tenantId) return NextResponse.json({ suggestions: [] }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('meeting_suggestions')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('dismissed', false)
    .eq('accepted', false)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) return NextResponse.json({ suggestions: [], error: error.message }, { status: 500 });
  return NextResponse.json({ suggestions: data ?? [] });
}

// ─── PATCH: Dismiss or accept a suggestion ──────────────────────────────────

export async function PATCH(req: NextRequest) {
  const tenantId = await getSessionTenantId();
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { id, action } = body;

  if (!id || !['dismiss', 'accept'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const update = action === 'dismiss' ? { dismissed: true } : { accepted: true };

  const { data, error } = await supabase
    .from('meeting_suggestions')
    .update(update)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ suggestion: data });
}
