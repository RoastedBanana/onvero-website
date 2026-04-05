import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const TENANT = 'df763f85-c687-42d6-be66-a2b353b89c90';

function getClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey) return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
  return null;
}

export async function GET() {
  const client = getClient() ?? (await createServerSupabaseClient());
  const { data, error } = await client.from('tenant_ai_profile').select('*').eq('tenant_id', TENANT).limit(1).single();

  if (error) return NextResponse.json({ profile: null });
  return NextResponse.json({ profile: data });
}

export async function PATCH(req: NextRequest) {
  const client = getClient() ?? (await createServerSupabaseClient());
  const body = await req.json();

  const { error } = await client
    .from('tenant_ai_profile')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('tenant_id', TENANT);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
