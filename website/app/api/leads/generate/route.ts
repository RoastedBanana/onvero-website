import { NextRequest, NextResponse } from 'next/server';

const N8N_URL = 'https://n8n.srv1223027.hstgr.cloud/webhook/lead-generator-run';
const WEBHOOK_SECRET = '59317c4c-217d-4046-93d8-15ea3e94dbb6';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const response = await fetch(N8N_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': WEBHOOK_SECRET,
      },
      body: JSON.stringify({
        tenant_id: body.tenant_id,
        profile_id: body.profile_id,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Webhook fehlgeschlagen', status: response.status },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, message: 'Lead Generator gestartet' });
  } catch {
    return NextResponse.json({ error: 'Server-Fehler' }, { status: 500 });
  }
}
