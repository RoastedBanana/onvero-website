import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();

  fetch('https://n8n.srv1223027.hstgr.cloud/webhook/lead-generator-run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': '59317c4c-217d-4046-93d8-15ea3e94dbb6',
    },
    body: JSON.stringify({
      tenant_id: 'df763f85-c687-42d6-be66-a2b353b89c90',
      secret: '59317c4c-217d-4046-93d8-15ea3e94dbb6',
      profile_id: 'default',
      on_demand: body.on_demand,
    }),
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
