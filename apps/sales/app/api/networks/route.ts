import { createServerSupabaseClient } from '@onvero/lib/supabase-server';
import { getSessionTenantId } from '@onvero/lib/tenant-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const tenantId = await getSessionTenantId();
  if (!tenantId) return NextResponse.json({ networks: [] }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('networks')
    .select('id, name, created_at, updated_at')
    .eq('tenant_id', tenantId)
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ networks: [], error: error.message }, { status: 500 });
  return NextResponse.json({ networks: data ?? [] });
}

export async function POST(req: Request) {
  const tenantId = await getSessionTenantId();
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const supabase = await createServerSupabaseClient();

  const { data: user } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('networks')
    .insert({ name: body.name || 'Neues Netzwerk', tenant_id: tenantId, created_by: user.user?.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ network: data });
}
