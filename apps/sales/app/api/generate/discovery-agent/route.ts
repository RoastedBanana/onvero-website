import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext, getAdminClient } from '@onvero/lib/tenant-server';

const WEBHOOK_URL = process.env.N8N_WEBHOOK_DISCOVERY_AGENT ?? '';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!WEBHOOK_URL) {
    return NextResponse.json(
      { error: 'N8N_WEBHOOK_DISCOVERY_AGENT not configured' },
      { status: 500 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const freetext = typeof body.freetext === 'string' ? body.freetext : '';
  if (!freetext.trim()) {
    return NextResponse.json({ error: 'freetext is required' }, { status: 400 });
  }

  const client = getAdminClient();
  const { data: profile } = await client
    .from('tenant_ai_profile')
    .select('*')
    .eq('tenant_id', ctx.tenantId)
    .maybeSingle();

  const payload = {
    tenant_id: ctx.tenantId,
    user_id: ctx.userId,
    freetext,
    profile: profile ?? null,
    requested_at: new Date().toISOString(),
  };

  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.N8N_WEBHOOK_SECRET
        ? { 'x-onvero-secret': process.env.N8N_WEBHOOK_SECRET }
        : {}),
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON from n8n', raw: text.slice(0, 500) },
      { status: 502 },
    );
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: 'Webhook failed', status: res.status, detail: data },
      { status: res.status },
    );
  }

  return NextResponse.json({ ok: true, data });
}
