import { NextResponse } from 'next/server';
import { getSessionContext, getAdminClient } from '@onvero/lib/tenant-server';

export async function GET() {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = getAdminClient();
  const { data, error } = await client
    .from('blogposts')
    .select('*')
    .eq('tenant_id', ctx.tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Beiträge konnten nicht geladen werden' }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
