import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getSessionTenantId } from '@/lib/tenant-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: networkId } = await params;
  const tenantId = await getSessionTenantId();
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('network_edges')
    .insert({
      network_id: networkId,
      tenant_id: tenantId,
      source_node_id: body.source_node_id,
      target_node_id: body.target_node_id,
      edge_type: body.edge_type ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ edge: data });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: networkId } = await params;
  const tenantId = await getSessionTenantId();
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const edgeId = searchParams.get('edge_id');
  if (!edgeId) return NextResponse.json({ error: 'edge_id required' }, { status: 400 });

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('network_edges')
    .delete()
    .eq('id', edgeId)
    .eq('network_id', networkId)
    .eq('tenant_id', tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
