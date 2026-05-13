import { getSessionTenantId, getAdminClient } from '@onvero/lib/tenant-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const tenantId = await getSessionTenantId();
  if (!tenantId) return NextResponse.json({ leads: [] }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const archived = searchParams.get('archived') === 'true';

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('archived', archived)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ leads: [], error: error.message }, { status: 500 });
  return NextResponse.json({ leads: data ?? [] });
}
