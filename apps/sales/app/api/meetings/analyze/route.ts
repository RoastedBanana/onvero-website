import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext } from '@onvero/lib/tenant-server';

export async function POST(req: NextRequest) {
  try {
    const ctx = await getSessionContext();
    if (!ctx) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });

    const body = await req.json();

    const res = await fetch(process.env.N8N_WEBHOOK_MEETING_SUMMARIZER!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, tenant_id: ctx.tenantId }),
    });

    const text = await res.text();

    if (!res.ok) {
      return NextResponse.json({ error: text || 'n8n Webhook fehlgeschlagen' }, { status: res.status });
    }

    try {
      const json = JSON.parse(text);
      return NextResponse.json(json);
    } catch {
      return NextResponse.json({ result: text });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Interner Serverfehler';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
