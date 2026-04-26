import { NextResponse } from 'next/server';
import { getSignedHeaders } from '@onvero/lib/webhook-sign';
import { getSessionContext } from '@onvero/lib/tenant-server';

export async function GET() {
  try {
    const ctx = await getSessionContext();
    if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const n8nUrl = process.env.N8N_WEBHOOK_LEAD_STATS;
    if (!n8nUrl) {
      return NextResponse.json({ error: 'Server-Konfiguration fehlt' }, { status: 500 });
    }

    const payload = JSON.stringify({ tenant_id: ctx.tenantId });

    const response = await fetch(n8nUrl, {
      method: 'GET',
      headers: getSignedHeaders(payload),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Stats nicht verfügbar' }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, max-age=60' },
    });
  } catch {
    return NextResponse.json({ error: 'Server-Fehler' }, { status: 500 });
  }
}
