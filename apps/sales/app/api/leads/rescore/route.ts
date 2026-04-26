import { NextRequest, NextResponse } from 'next/server';
import { validateCsrf } from '@onvero/lib/csrf';
import { isUUID } from '@onvero/lib/validate';
import { getSignedHeaders } from '@onvero/lib/webhook-sign';
import { getSessionContext } from '@onvero/lib/tenant-server';

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: 'Ungültiges CSRF-Token' }, { status: 403 });
    }

    const ctx = await getSessionContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    if (!isUUID(body.lead_id)) {
      return NextResponse.json({ error: 'Ungültige lead_id' }, { status: 400 });
    }

    const n8nUrl = process.env.N8N_WEBHOOK_KI_SCORING;
    if (!n8nUrl) {
      return NextResponse.json({ error: 'Server-Konfiguration fehlt' }, { status: 500 });
    }

    const payload = JSON.stringify({ lead_id: body.lead_id, tenant_id: ctx.tenantId });
    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: getSignedHeaders(payload),
      body: payload,
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Scoring fehlgeschlagen' }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server-Fehler' }, { status: 500 });
  }
}
