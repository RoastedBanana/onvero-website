import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/tenant-server';

const WEBHOOK_URL = 'https://n8n.srv1223027.hstgr.cloud/webhook-test/person-enrich';

export async function POST(req: NextRequest) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.N8N_WEBHOOK_SECRET ? { 'x-onvero-secret': process.env.N8N_WEBHOOK_SECRET } : {}),
    },
    body: JSON.stringify({
      tenant_id: ctx.tenantId,
      lead_id: body.lead_id,
      apollo_person_id: body.apollo_person_id,
      get_email: body.get_email ?? false,
      get_telephone: body.get_telephone ?? false,
      generate_email: body.generate_email ?? false,
    }),
  });

  const text = await res.text();

  try {
    const data = JSON.parse(text);
    const result = Array.isArray(data) ? data[0] : data;
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON from n8n', raw: text.slice(0, 300) }, { status: 502 });
  }
}
