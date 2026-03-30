import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    if (!body.lead_id || !body.tenant_id) {
      return NextResponse.json({ error: 'lead_id und tenant_id erforderlich' }, { status: 400 });
    }

    const n8nUrl = process.env.N8N_WEBHOOK_KI_SCORING;
    if (!n8nUrl) {
      return NextResponse.json({ error: 'Server-Konfiguration fehlt' }, { status: 500 });
    }

    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id: body.lead_id, tenant_id: body.tenant_id }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Scoring fehlgeschlagen' }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server-Fehler' }, { status: 500 });
  }
}
