import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIp } from '@onvero/lib/rate-limit';
import { getSessionContext } from '@onvero/lib/tenant-server';

const WEBHOOK_MAP: Record<string, string> = {
  'blog-ai-polish': 'N8N_WEBHOOK_BLOG_AI_POLISH',
};

export async function POST(req: NextRequest) {
  try {
    const ctx = await getSessionContext();
    if (!ctx) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });

    const ip = getClientIp(req.headers);
    const { success } = await rateLimit(`n8n-proxy:${ip}`, { maxRequests: 20, windowMs: 60_000 });
    if (!success) return NextResponse.json({ error: 'Zu viele Anfragen' }, { status: 429 });

    const { action, ...payload } = await req.json();

    if (!action || !WEBHOOK_MAP[action]) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const url = process.env[WEBHOOK_MAP[action]];
    if (!url) {
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, tenant_id: ctx.tenantId }),
    });

    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json({ error: text || 'Webhook failed' }, { status: res.status });
    }

    try {
      return NextResponse.json(JSON.parse(text));
    } catch {
      return NextResponse.json({ result: text });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
