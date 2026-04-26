import { createServerSupabaseClient } from '@onvero/lib/supabase-server';
import { getSessionTenantId } from '@onvero/lib/tenant-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; nodeId: string }> }) {
  const { id: networkId, nodeId } = await params;
  const tenantId = await getSessionTenantId();
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('network_nodes')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', nodeId)
    .eq('network_id', networkId)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ node: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; nodeId: string }> }) {
  const { id: networkId, nodeId } = await params;
  const tenantId = await getSessionTenantId();
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('network_nodes')
    .delete()
    .eq('id', nodeId)
    .eq('network_id', networkId)
    .eq('tenant_id', tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
