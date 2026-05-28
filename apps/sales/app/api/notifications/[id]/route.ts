import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext, getAdminClient } from '@onvero/lib/tenant-server';

export const dynamic = 'force-dynamic';

export async function DELETE(_req: NextRequest, ctxParam: { params: Promise<{ id: string }> }) {
  const { id } = await ctxParam.params;
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = getAdminClient();
  const { error } = await client
    .from('notifications')
    .delete()
    .eq('tenant_id', ctx.tenantId)
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, ctxParam: { params: Promise<{ id: string }> }) {
  const { id } = await ctxParam.params;
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { read?: boolean };
  const readAt = body.read === false ? null : new Date().toISOString();

  const client = getAdminClient();
  const { error } = await client
    .from('notifications')
    .update({ read_at: readAt })
    .eq('tenant_id', ctx.tenantId)
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
