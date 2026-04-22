import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext, getAdminClient } from '@/lib/tenant-server';
import { isUUID } from '@/lib/validate';

export const dynamic = 'force-dynamic';

// PATCH — toggle favorite (or any other allowed field)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!isUUID(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const body = await req.json();
  const update: Record<string, unknown> = {};
  if (typeof body.is_favorite === 'boolean') update.is_favorite = body.is_favorite;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const admin = getAdminClient();
  const { data, error } = await admin
    .from('lead_search_history')
    .update(update)
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ entry: data });
}

// DELETE — remove a search-history entry
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!isUUID(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const admin = getAdminClient();
  const { error } = await admin
    .from('lead_search_history')
    .delete()
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
