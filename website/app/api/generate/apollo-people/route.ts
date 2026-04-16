import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/tenant-server';

const WEBHOOK_URL = 'https://n8n.srv1223027.hstgr.cloud/webhook/apollo-people-agent';

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
      company_name: body.company_name,
      company_domain: body.company_domain,
      lead_id: body.lead_id,
    }),
  });

  const text = await res.text();

  try {
    const data = JSON.parse(text);
    // Response is [{success, persons: [...], ...}]
    const wrapper = Array.isArray(data) ? data[0] : data;
    const persons = wrapper?.persons ?? wrapper?.people ?? wrapper?.contacts ?? [];
    return NextResponse.json({
      persons,
      company_name: wrapper?.company_name ?? null,
      persons_count: wrapper?.persons_count ?? persons.length,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON from n8n', raw: text.slice(0, 300) }, { status: 502 });
  }
}
