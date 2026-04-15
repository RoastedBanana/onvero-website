import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext, getAdminClient, isAdmin } from '@/lib/tenant-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ profile: null }, { status: 401 });

  const client = getAdminClient();
  const { data, error } = await client
    .from('tenant_ai_profile')
    .select('*')
    .eq('tenant_id', ctx.tenantId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ profile: null, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ profile: data ?? null, role: ctx.role });
}

export async function POST() {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = getAdminClient();

  // Idempotent: return existing if already there
  const { data: existing } = await client
    .from('tenant_ai_profile')
    .select('*')
    .eq('tenant_id', ctx.tenantId)
    .maybeSingle();
  if (existing) return NextResponse.json({ profile: existing, created: false });

  const { data, error } = await client
    .from('tenant_ai_profile')
    .insert({
      tenant_id: ctx.tenantId,
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
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!isAdmin(ctx.role)) {
    return NextResponse.json({ error: 'Nur Admins können das Profil bearbeiten.' }, { status: 403 });
  }

  const client = getAdminClient();
  const body = await req.json();

  // Whitelist allowed fields
  const allowed = [
    'company_name',
    'company_description',
    'company_location',
    'website',
    'websites',
    'target_customers',
    'ideal_lead_profile',
    'excluded_profiles',
    'services',
    'usp',
    'deal_size_min',
    'deal_size_max',
    'sender_name',
    'sender_role',
    'tone_of_voice',
    'email_signature',
    'industry',
    'sales_cycle_days',
    'ai_search_prompt',
    'ai_scoring_prompt',
    'onboarding_completed',
  ];

  const sanitized: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) sanitized[key] = body[key];
  }

  const { error } = await client.from('tenant_ai_profile').update(sanitized).eq('tenant_id', ctx.tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
