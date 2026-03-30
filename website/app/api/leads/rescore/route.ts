import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { validateCsrf } from '@/lib/csrf';
import { isUUID } from '@/lib/validate';
import { getSignedHeaders } from '@/lib/webhook-sign';

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: 'Ungültiges CSRF-Token' }, { status: 403 });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    if (!isUUID(body.lead_id) || !isUUID(body.tenant_id)) {
      return NextResponse.json({ error: 'Ungültige lead_id oder tenant_id' }, { status: 400 });
    }

    const n8nUrl = process.env.N8N_WEBHOOK_KI_SCORING;
    if (!n8nUrl) {
      return NextResponse.json({ error: 'Server-Konfiguration fehlt' }, { status: 500 });
    }

    const payload = JSON.stringify({ lead_id: body.lead_id, tenant_id: body.tenant_id });
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
