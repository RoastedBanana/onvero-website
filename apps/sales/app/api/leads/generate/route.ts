import { NextRequest, NextResponse } from 'next/server';
import { validateCsrf } from '@/lib/csrf';
import { getSignedHeaders } from '@/lib/webhook-sign';
import { getSessionContext } from '@/lib/tenant-server';

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: 'Ungültiges CSRF-Token' }, { status: 403 });
    }

    const ctx = await getSessionContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    const n8nUrl = process.env.N8N_WEBHOOK_LEAD_GENERATOR;
    if (!n8nUrl) {
      return NextResponse.json({ error: 'Server-Konfiguration fehlt' }, { status: 500 });
    }

    const payload = JSON.stringify({ tenant_id: ctx.tenantId, profile_id: body.profile_id });
    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: getSignedHeaders(payload),
      body: payload,
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Webhook fehlgeschlagen', status: response.status }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: 'Lead Generator gestartet' });
  } catch {
    return NextResponse.json({ error: 'Server-Fehler' }, { status: 500 });
  }
}
