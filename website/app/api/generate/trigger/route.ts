import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { isUUID } from '@/lib/validate';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    if (!isUUID(body.tenant_id)) {
      return NextResponse.json({ error: 'Ungültige tenant_id' }, { status: 400 });
    }

    // Verify the user actually belongs to this tenant
    const { data: membership } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', user.id)
      .eq('tenant_id', body.tenant_id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const secret = process.env.N8N_LEAD_GENERATOR_SECRET;
    const webhookUrl = process.env.N8N_WEBHOOK_LEAD_GENERATOR;

    if (!secret || !webhookUrl) {
      const missing: string[] = [];
      if (!secret) missing.push('N8N_LEAD_GENERATOR_SECRET');
      if (!webhookUrl) missing.push('N8N_WEBHOOK_LEAD_GENERATOR');
      console.error('[generate/trigger] missing env vars:', missing);
      return NextResponse.json(
        {
          error: `Server-Konfiguration fehlt: ${missing.join(', ')}`,
          missing,
        },
        { status: 500 },
      );
    }

    const rawCount = Number(body.lead_count ?? body.on_demand?.lead_count);
    const leadCount = Number.isFinite(rawCount) ? Math.min(100, Math.max(10, Math.round(rawCount))) : 50;

    const onDemand = { ...(body.on_demand ?? {}), lead_count: leadCount };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': secret,
      },
      body: JSON.stringify({
        tenant_id: body.tenant_id,
        secret,
        profile_id: body.profile_id ?? 'default',
        execution_id: body.execution_id ?? body.on_demand?.execution_id,
        lead_count: leadCount,
        on_demand: onDemand,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return NextResponse.json(
        { error: 'Webhook fehlgeschlagen', status: res.status, detail: text },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: 'Server-Fehler', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
