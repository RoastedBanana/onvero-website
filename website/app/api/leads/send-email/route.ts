import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const RESEND_API_KEY = 're_5Y44imva_8TeEqVGLXuUCuEDFqFE5qv1i';

export async function POST(req: NextRequest) {
  try {
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

    const { data: tenant } = await supabase
      .from('tenants')
      .select('name, website')
      .eq('id', tenant_id)
      .single();

    const domain = tenant?.website ?? 'onvero.de';
    const fromName = tenant?.name ?? 'Onvero';
    const fromEmail = `noreply@${domain}`;

    // Send via Resend API
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        subject,
        html: html || undefined,
        text: text || undefined,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error('Resend error:', result);
      return NextResponse.json({ error: result.message ?? 'E-Mail senden fehlgeschlagen' }, { status: res.status });
    }

    // Update lead status to "contacted" and log activity
    if (lead_id) {
      await supabase
        .from('leads')
        .update({ status: 'contacted', last_contacted_at: new Date().toISOString() })
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
