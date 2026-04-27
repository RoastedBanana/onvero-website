import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext, getAdminClient } from '@onvero/lib/tenant-server';

export async function POST(req: NextRequest) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { action?: string; documentIds?: unknown; marked?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const documentIds = Array.isArray(body.documentIds)
    ? (body.documentIds.filter((v) => typeof v === 'string' && v.length > 0) as string[])
    : [];
  if (documentIds.length === 0) {
    return NextResponse.json({ error: 'documentIds required' }, { status: 400 });
  }

  const client = getAdminClient();

  if (body.action === 'delete') {
    const { data: rows, error: selErr } = await client
      .from('blogposts')
      .select('document_id, cover_image_id')
      .eq('tenant_id', ctx.tenantId)
      .in('document_id', documentIds);
    if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 });

    const imageIds = (rows ?? [])
      .map((r) => r.cover_image_id as string | null)
      .filter((v): v is string => !!v);
    if (imageIds.length > 0) {
      await client.storage.from('blogpost-images').remove(imageIds);
    }

    const { error: delErr } = await client
      .from('blogposts')
      .delete()
      .eq('tenant_id', ctx.tenantId)
      .in('document_id', documentIds);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, deleted: documentIds.length });
  }

  if (body.action === 'set-marked') {
    const marked = body.marked === true;
    const { error } = await client
      .from('blogposts')
      .update({ marked, updated_at: new Date().toISOString() })
      .eq('tenant_id', ctx.tenantId)
      .in('document_id', documentIds);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, updated: documentIds.length, marked });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
