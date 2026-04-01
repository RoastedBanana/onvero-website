import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getSignedHeaders } from '@/lib/webhook-sign';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const n8nUrl = process.env.N8N_WEBHOOK_LEAD_STATS;
    if (!n8nUrl) {
      return NextResponse.json({ error: 'Server-Konfiguration fehlt' }, { status: 500 });
    }

    const tenantId = req.nextUrl.searchParams.get('tenant_id');
    const payload = JSON.stringify({ tenant_id: tenantId });

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
