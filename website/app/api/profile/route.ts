import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey) return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
  return null;
}

async function getTenantId(): Promise<string | null> {
  const userClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) return null;
  const { data } = await userClient
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .maybeSingle();
  return data?.tenant_id ?? null;
}

export async function GET() {
  const tenantId = await getTenantId();
  if (!tenantId) return NextResponse.json({ profile: null }, { status: 401 });

  const client = getAdmin() ?? (await createServerSupabaseClient());
  const { data, error } = await client
    .from('tenant_ai_profile')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ profile: null, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ profile: data ?? null });
}

export async function POST() {
  const tenantId = await getTenantId();
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = getAdmin() ?? (await createServerSupabaseClient());

  // Idempotent: return existing if already there
  const { data: existing } = await client
    .from('tenant_ai_profile')
    .select('*')
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (existing) return NextResponse.json({ profile: existing, created: false });

  const { data, error } = await client
    .from('tenant_ai_profile')
    .insert({
      tenant_id: tenantId,
      company_name: '',
      company_description: '',
      services: [],
      websites: [],
      onboarding_completed: false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ profile: data, created: true });
}

export async function PATCH(req: NextRequest) {
  const tenantId = await getTenantId();
  if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = getAdmin() ?? (await createServerSupabaseClient());
  const body = await req.json();

  const { error } = await client
    .from('tenant_ai_profile')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('tenant_id', tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
