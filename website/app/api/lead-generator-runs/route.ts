import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getSessionTenantId } from '@/lib/tenant-server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const tenantId = await getSessionTenantId();
  if (!tenantId) return NextResponse.json({ runs: [] }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') ?? '5', 10);
  const status = searchParams.get('status');
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('lead_generator_runs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ runs: data ?? [] });
}

export async function POST(req: NextRequest) {
  const tenantId = await getSessionTenantId();
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from('lead_generator_runs')
    .insert({
      tenant_id: tenantId,
      source: body.source ?? 'google_maps_apify',
      status: 'running',
      search_terms: body.search_terms ?? [],
      max_results: body.max_results ?? 50,
      filters: body.filters ?? {},
      leads_found: 0,
      leads_new: 0,
      leads_duplicate: 0,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ run: data });
}
