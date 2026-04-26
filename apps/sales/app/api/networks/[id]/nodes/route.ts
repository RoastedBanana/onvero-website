import { createServerSupabaseClient } from '@onvero/lib/supabase-server';
import { getSessionTenantId } from '@onvero/lib/tenant-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: networkId } = await params;
  const tenantId = await getSessionTenantId();
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('network_nodes')
    .insert({
      network_id: networkId,
      tenant_id: tenantId,
      lead_id: body.lead_id,
      x: body.x ?? 0,
      y: body.y ?? 0,
      expand_category: body.expand_category ?? null,
    })
    .select('id, lead_id, x, y, expand_category, source_node_id, leads(id, company_name, city, fit_score, industry, logo_url, tier)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Touch network updated_at
  await supabase.from('networks').update({ updated_at: new Date().toISOString() }).eq('id', networkId);

  return NextResponse.json({ node: data });
}

// Bulk update positions
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: networkId } = await params;
  const tenantId = await getSessionTenantId();
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { updates } = (await req.json()) as { updates: { id: string; x: number; y: number }[] };
  if (!updates?.length) return NextResponse.json({ ok: true });

  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();

  const results = await Promise.all(
    updates.map((u) =>
      supabase
        .from('network_nodes')
        .update({ x: u.x, y: u.y, updated_at: now })
        .eq('id', u.id)
        .eq('network_id', networkId)
        .eq('tenant_id', tenantId)
    )
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 500 });

  await supabase.from('networks').update({ updated_at: now }).eq('id', networkId);
  return NextResponse.json({ ok: true });
}
