import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext } from '@onvero/lib/tenant-server';

export async function POST(req: NextRequest) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });

  const webhookUrl = process.env.N8N_WEBHOOK_EMAIL_AI_REWRITE;
  if (!webhookUrl) {
    return NextResponse.json({ error: 'Webhook nicht konfiguriert' }, { status: 500 });
  }

  try {
    const { prompt, subject, body, lead_id } = await req.json();

    if (!prompt || !body) {
      return NextResponse.json({ error: 'prompt und body sind erforderlich' }, { status: 400 });
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, subject, body, lead_id, tenant_id: ctx.tenantId }),
    });

    const result = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json({ error: result.message ?? 'KI-Änderung fehlgeschlagen' }, { status: res.status });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Interner Fehler';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
