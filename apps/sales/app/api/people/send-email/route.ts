import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext, getAdminClient } from '@/lib/tenant-server';

const WEBHOOK_URL = process.env.N8N_WEBHOOK_SEND_OUTREACH_EMAIL ?? '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!WEBHOOK_URL) return NextResponse.json({ error: 'N8N_WEBHOOK_SEND_OUTREACH_EMAIL not configured' }, { status: 500 });

  const body = await req.json();
  const admin = getAdminClient();

  // Fetch tenant + sender profile in parallel
  const [tenantRes, profileRes] = await Promise.all([
    admin.from('tenants').select('id, name, logo_url, slug').eq('id', ctx.tenantId).maybeSingle(),
    admin.from('tenant_ai_profile').select('sender_name, sender_email, email_signature').eq('tenant_id', ctx.tenantId).maybeSingle(),
  ]);

  // Resolve logo: try tenants.logo_url, fall back to Supabase Storage bucket
  let logoUrl: string | null = tenantRes.data?.logo_url ?? null;
  if (!logoUrl) {
    try {
      const { data: files } = await admin.storage.from('website-assets').list(`logos/${ctx.tenantId}`, { limit: 1 });
      if (files && files.length > 0 && SUPABASE_URL) {
        logoUrl = `${SUPABASE_URL}/storage/v1/object/public/website-assets/logos/${ctx.tenantId}/${files[0].name}`;
      }
    } catch {
      // ignore
    }
  }

  // Build "from" — use sender_email from profile; fallback to generated local-part
  const senderName = profileRes.data?.sender_name || 'Sales';
  const profileEmail = profileRes.data?.sender_email;
  const fallbackLocal = senderName.toLowerCase().split(/\s+/)[0].replace(/[^a-z]/g, '') || 'sales';
  const fromEmail = profileEmail && profileEmail.includes('@') ? profileEmail : `${fallbackLocal}@contact.onvero.de`;
  const fromAddress = `${senderName} <${fromEmail}>`;

  const payload = {
    from: fromAddress,
    to: body.to,
    subject: body.subject ?? '',
    html: body.html ?? '',
    tenant_id: ctx.tenantId,
    lead_id: body.lead_id,
    logo_url: logoUrl,
  };

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.N8N_WEBHOOK_SECRET ? { 'x-onvero-secret': process.env.N8N_WEBHOOK_SECRET } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return NextResponse.json({ error: 'Webhook failed', status: res.status, detail: text.slice(0, 200) }, { status: 502 });
    }

    const text = await res.text();
    let data: unknown = null;
    try { data = JSON.parse(text); } catch { /* response may be empty */ }

    return NextResponse.json({ ok: true, response: data });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
