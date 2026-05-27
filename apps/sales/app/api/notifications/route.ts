import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext, getAdminClient } from '@onvero/lib/tenant-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = getAdminClient();

  // Lazy cleanup: drop notifications that have expired so DB doesn't grow forever.
  await client.from('notifications').delete().lt('expires_at', new Date().toISOString());

  const since = req.nextUrl.searchParams.get('since');
  let query = client
    .from('notifications')
    .select('id, type, title, body, payload, link, read_at, expires_at, created_at')
    .eq('tenant_id', ctx.tenantId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (since) {
    query = query.gt('created_at', since);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ notifications: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    action?: 'mark_all_read';
  };

  const client = getAdminClient();

  if (body.action === 'mark_all_read') {
    const { error } = await client
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('tenant_id', ctx.tenantId)
      .is('read_at', null);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}
