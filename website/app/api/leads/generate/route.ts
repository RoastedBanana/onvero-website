import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { validateCsrf } from '@/lib/csrf';
import { isUUID } from '@/lib/validate';

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: 'Ungültiges CSRF-Token' }, { status: 403 });
    }

    // Auth check
    const supabase = await createServerSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    if (!isUUID(body.tenant_id)) {
      return NextResponse.json({ error: 'Ungültige tenant_id' }, { status: 400 });
    }

    const n8nUrl = process.env.N8N_WEBHOOK_LEAD_GENERATOR;
    const secret = process.env.N8N_WEBHOOK_SECRET;
    if (!n8nUrl || !secret) {
      return NextResponse.json({ error: 'Server-Konfiguration fehlt' }, { status: 500 });
    }

    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': secret,
      },
      body: JSON.stringify({
        tenant_id: body.tenant_id,
        profile_id: body.profile_id,
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Webhook fehlgeschlagen', status: response.status }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: 'Lead Generator gestartet' });
  } catch {
    return NextResponse.json({ error: 'Server-Fehler' }, { status: 500 });
  }
}
