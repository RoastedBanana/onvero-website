import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getSessionTenantId } from '@/lib/tenant-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenantId = await getSessionTenantId();
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await createServerSupabaseClient();

  const [netRes, nodesRes, edgesRes] = await Promise.all([
    supabase.from('networks').select('*').eq('id', id).eq('tenant_id', tenantId).maybeSingle(),
    supabase
      .from('network_nodes')
      .select('id, lead_id, x, y, expand_category, source_node_id, leads(id, company_name, city, fit_score, industry, logo_url, tier)')
      .eq('network_id', id)
      .eq('tenant_id', tenantId),
    supabase
      .from('network_edges')
      .select('id, source_node_id, target_node_id, edge_type')
      .eq('network_id', id)
      .eq('tenant_id', tenantId),
  ]);

  if (netRes.error) return NextResponse.json({ error: netRes.error.message }, { status: 500 });
  if (!netRes.data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    network: netRes.data,
    nodes: nodesRes.data ?? [],
    edges: edgesRes.data ?? [],
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenantId = await getSessionTenantId();
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('networks')
    .update({ name: body.name, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ network: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenantId = await getSessionTenantId();
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('networks').delete().eq('id', id).eq('tenant_id', tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
