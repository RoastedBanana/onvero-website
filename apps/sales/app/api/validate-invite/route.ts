import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ valid: false, reason: 'not_found' });
    }

    const { data, error } = await supabase
      .from('invitations')
      .select('email, tenant_id, used_at, expires_at')
      .eq('token', token)
      .single();

    if (error || !data) {
      return NextResponse.json({ valid: false, reason: 'not_found' });
    }

    if (data.used_at) {
      return NextResponse.json({ valid: false, reason: 'already_used' });
    }

    if (new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, reason: 'expired' });
    }

    // Fetch tenant info for the card display
    const { data: tenant } = await supabase.from('tenants').select('name, logo_url').eq('id', data.tenant_id).single();

    return NextResponse.json({
      valid: true,
      email: data.email,
      tenant_id: data.tenant_id,
      tenant_name: tenant?.name || '',
      tenant_logo: tenant?.logo_url || null,
    });
  } catch {
    return NextResponse.json({ valid: false, reason: 'not_found' }, { status: 500 });
  }
}
