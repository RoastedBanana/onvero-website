import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getSessionTenantId } from '@/lib/tenant-server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const tenantId = await getSessionTenantId();
  if (!tenantId) return NextResponse.json({ count: 0 });

  const supabase = await createServerSupabaseClient();
  const { count } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);
  return NextResponse.json({ count: count ?? 0 });
}
