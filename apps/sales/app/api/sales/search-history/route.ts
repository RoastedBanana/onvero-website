import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext, getAdminClient } from '@onvero/lib/tenant-server';

export const dynamic = 'force-dynamic';

// GET — list recent searches (favorites first, then recency).
// Also triggers opportunistic cleanup of stale, non-favorite rows (>21 days).
export async function GET() {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = getAdminClient();

  // Opportunistic cleanup (fire-and-forget)
  admin.rpc('cleanup_lead_search_history').then(() => {}, () => {});

  const { data, error } = await admin
    .from('lead_search_history')
    .select('id, query, is_favorite, last_used_at, use_count, created_at')
    .eq('tenant_id', ctx.tenantId)
    .order('is_favorite', { ascending: false })
    .order('last_used_at', { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ history: data ?? [] });
}

// POST — record a search. If the same query already exists for this tenant,
// bump its last_used_at + use_count instead of inserting a duplicate.
export async function POST(req: NextRequest) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const query: string = (body.query ?? '').toString().trim();
  if (!query) return NextResponse.json({ error: 'query required' }, { status: 400 });

  const admin = getAdminClient();

  // Check for existing entry with same query
  const { data: existing } = await admin
    .from('lead_search_history')
    .select('id, use_count')
    .eq('tenant_id', ctx.tenantId)
    .eq('query', query)
    .maybeSingle();

  if (existing) {
    const { data, error } = await admin
      .from('lead_search_history')
      .update({
        last_used_at: new Date().toISOString(),
        use_count: (existing.use_count ?? 0) + 1,
      })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ entry: data, created: false });
  }

  const { data, error } = await admin
    .from('lead_search_history')
    .insert({
      tenant_id: ctx.tenantId,
      user_id: ctx.userId,
      query,
      is_favorite: false,
      last_used_at: new Date().toISOString(),
      use_count: 1,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ entry: data, created: true });
}
