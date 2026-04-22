import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/tenant-server';

const WEBHOOK_URL = process.env.N8N_WEBHOOK_EMAIL_REWRITE ?? '';

export async function POST(req: NextRequest) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!WEBHOOK_URL) return NextResponse.json({ error: 'N8N_WEBHOOK_EMAIL_REWRITE not configured' }, { status: 500 });

  const body = await req.json();

  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.N8N_WEBHOOK_SECRET ? { 'x-onvero-secret': process.env.N8N_WEBHOOK_SECRET } : {}),
    },
    body: JSON.stringify({
      prompt: body.prompt ?? '',
      subject: body.subject ?? '',
      body: body.body ?? '',
      lead_id: body.lead_id,
      tenant_id: ctx.tenantId,
      people_id: body.people_id,
    }),
  });

  const text = await res.text();
  try {
    const data = JSON.parse(text);
    const result = Array.isArray(data) ? data[0] : data;
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON from n8n', raw: text.slice(0, 200) }, { status: 502 });
  }
}
