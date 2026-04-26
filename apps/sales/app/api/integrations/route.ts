import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext, getAdminClient, isAdmin } from '@/lib/tenant-server';

export const dynamic = 'force-dynamic';

// ─── GET: Load integration settings ─────────────────────────────────────────

export async function GET() {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = getAdminClient();
  const { data, error } = await client
    .from('tenant_integrations')
    .select('email_resend, follow_up_email, logo_url')
    .eq('tenant_id', ctx.tenantId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    email_resend: data?.email_resend ?? '',
    follow_up_email: data?.follow_up_email ?? false,
    logo_url: data?.logo_url ?? '',
  });
}

// ─── PATCH: Update integration settings (admin only) ─────────────────────────

export async function PATCH(req: NextRequest) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(ctx.role))
    return NextResponse.json({ error: 'Nur Admins können Integrationen ändern.' }, { status: 403 });

  const body = await req.json();
  const client = getAdminClient();

  // Whitelist allowed fields
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.email_resend === 'string') update.email_resend = body.email_resend.trim();
  if (typeof body.follow_up_email === 'boolean') update.follow_up_email = body.follow_up_email;
  if (typeof body.logo_url === 'string') update.logo_url = body.logo_url;

  const { error } = await client.from('tenant_integrations').update(update).eq('tenant_id', ctx.tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
