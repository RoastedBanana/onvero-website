import { NextResponse } from 'next/server';
import { getSessionContext, getAdminClient } from '@/lib/tenant-server';

export async function GET(_request: Request, { params }: { params: Promise<{ documentId: string }> }) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { documentId } = await params;
  const client = getAdminClient();

  const { data, error } = await client
    .from('blogposts')
    .select('*')
    .eq('document_id', documentId)
    .eq('tenant_id', ctx.tenantId)
    .single();

  if (error) {
    return NextResponse.json({ error: 'Beitrag nicht gefunden' }, { status: 404 });
  }

  return NextResponse.json(data);
}
