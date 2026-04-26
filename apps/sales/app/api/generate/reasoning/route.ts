import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext, getAdminClient } from '@onvero/lib/tenant-server';

export async function POST(req: NextRequest) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  const webhookUrl = process.env.N8N_WEBHOOK_LEAD_REASONING;
  if (!webhookUrl)
    return NextResponse.json({ error: 'N8N_WEBHOOK_LEAD_REASONING nicht konfiguriert' }, { status: 500 });

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.N8N_WEBHOOK_SECRET ? { 'x-onvero-secret': process.env.N8N_WEBHOOK_SECRET } : {}),
    },
    body: JSON.stringify({ ...body, tenant_id: ctx.tenantId }),
  });

  const text = await res.text();

  try {
    const data = JSON.parse(text);
    const webhook = Array.isArray(data) ? data[0] : data;
    const executionId = webhook.id ?? webhook.execution_id;

    if (executionId) {
      const admin = getAdminClient();
      const { data: row } = await admin
        .from('lead_run_executions')
        .select('*')
        .eq('id', executionId)
        .eq('tenant_id', ctx.tenantId)
        .maybeSingle();

      if (row) {
        return NextResponse.json({
          ...row,
          execution_id: executionId,
          success: true,
        });
      }
    }

    if (executionId) webhook.execution_id = executionId;
    return NextResponse.json(webhook);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON from n8n', raw: text.slice(0, 200) }, { status: 502 });
  }
}
