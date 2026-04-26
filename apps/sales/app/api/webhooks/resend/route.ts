import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHmac, timingSafeEqual } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function verifyResendSignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;
  const expected = createHmac('sha256', secret).update(body).digest('base64');
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();

    // Verify webhook signature
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (secret) {
      const signature = req.headers.get('resend-signature') ?? req.headers.get('x-resend-signature');
      if (!verifyResendSignature(body, signature, secret)) {
        console.error('Resend webhook signature verification failed');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(body);
    const type = event.type;

    if (type !== 'email.bounced' && type !== 'email.complained') {
      return NextResponse.json({ ok: true });
    }

    const data = event.data;
    const to = data.to?.[0] ?? data.to;
    const resendId = data.email_id ?? data.id;
    const subject = data.subject ?? '';
    const reason = data.bounce?.message ?? data.reason ?? type;

    // Find tenant via lead_activities matching this resend_id
    const { data: activity } = await supabase
      .from('lead_activities')
      .select('tenant_id')
      .eq('metadata->>resend_id', resendId)
      .single();

    await supabase.from('email_bounces').insert({
      tenant_id: activity?.tenant_id ?? null,
      resend_id: resendId,
      email_to: to,
      subject,
      bounce_type: type === 'email.bounced' ? 'bounce' : 'complaint',
      reason,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Resend webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
