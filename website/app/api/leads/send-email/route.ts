import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const { success } = await rateLimit(`send-email:${ip}`, { maxRequests: 10, windowMs: 60_000 });
    if (!success) return NextResponse.json({ error: 'Zu viele Anfragen' }, { status: 429 });
    const { lead_id, tenant_id, to, subject, html, text } = await req.json();

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json({ error: 'to, subject, and html/text are required' }, { status: 400 });
    }

    // Get tenant domain from Supabase
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    // Get email domain from tenant_integrations
    const { data: integration } = await supabase
      .from('tenant_integrations')
      .select('email_resend')
      .eq('tenant_id', tenant_id)
      .single();

    if (!integration?.email_resend) {
      return NextResponse.json({ error: 'E-Mail-Domain nicht konfiguriert' }, { status: 400 });
    }

    // Get logged-in user's first name from session cookie
    let fromName = 'Onvero';
    const rawCookie = cookieStore.get('onvero_user')?.value;
    if (rawCookie) {
      try {
        const sessionUser = JSON.parse(decodeURIComponent(rawCookie));
        if (sessionUser.firstName) fromName = sessionUser.firstName;
      } catch { /* keep default */ }
    }

    const fromField = `${fromName} <${integration.email_resend.trim()}>`;

    // Send via n8n webhook
    const res = await fetch(process.env.N8N_WEBHOOK_SEND_EMAIL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: fromField,
        to,
        subject,
        html: html || undefined,
        text: text || undefined,
        tenant_id,
        lead_id,
      }),
    });

    const result = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error('n8n webhook error:', result);
      return NextResponse.json({ error: result.message ?? 'E-Mail senden fehlgeschlagen' }, { status: res.status });
    }

    // Update lead status to "contacted" and log activity
    if (lead_id) {
      await supabase
        .from('leads')
        .update({ status: 'contacted', last_contacted_at: new Date().toISOString(), status_updated_at: new Date().toISOString() })
        .eq('id', lead_id);

      await supabase.from('lead_activities').insert({
        lead_id,
        tenant_id,
        type: 'email_sent',
        title: `E-Mail gesendet: ${subject}`,
        content: `An ${to} gesendet`,
        metadata: { resend_id: result.id, subject, to },
      });
    }

    return NextResponse.json({ success: true, id: result.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Interner Fehler';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
