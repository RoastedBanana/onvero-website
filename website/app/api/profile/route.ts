import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const TENANT = 'df763f85-c687-42d6-be66-a2b353b89c90';

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('tenant_ai_profile')
    .select('*')
    .eq('tenant_id', TENANT)
    .limit(1)
    .single();

  if (error) return NextResponse.json({ profile: null });
  return NextResponse.json({ profile: data });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const body = await req.json();

  const { error } = await supabase
    .from('tenant_ai_profile')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('tenant_id', TENANT);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
