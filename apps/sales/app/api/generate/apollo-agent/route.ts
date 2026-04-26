import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext } from '@onvero/lib/tenant-server';

const WEBHOOK_URL = process.env.N8N_WEBHOOK_APOLLO_ORG_AGENT ?? '';

export async function POST(req: NextRequest) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!WEBHOOK_URL) return NextResponse.json({ error: 'N8N_WEBHOOK_APOLLO_ORG_AGENT not configured' }, { status: 500 });

  const body = await req.json();
  const requestedAt = new Date().toISOString();

  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.N8N_WEBHOOK_SECRET ? { 'x-onvero-secret': process.env.N8N_WEBHOOK_SECRET } : {}),
    },
    body: JSON.stringify({
      freetext: body.freetext,
      tenant_id: ctx.tenantId,
      callback_url: `${req.nextUrl.origin}/api/generate/progress`,
    }),
  });

  const text = await res.text();
  let data: unknown = null;
  try {
    data = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON from n8n', raw: text.slice(0, 200) }, { status: 502 });
  }
  const webhook = (Array.isArray(data) ? data[0] : data) as Record<string, unknown>;

  // Pass through upstream status (402 = credits exhausted)
  if (res.status === 402 || (webhook as { status?: string })?.status === 'blocked') {
    return NextResponse.json({ ...webhook, status: 'blocked' }, { status: 402 });
  }
  if (!res.ok) {
    return NextResponse.json({ error: 'Webhook failed', status: res.status, detail: webhook }, { status: res.status });
  }

  return NextResponse.json({ ...webhook, requested_at: requestedAt });
}
