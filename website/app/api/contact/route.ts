import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const { success } = rateLimit(`contact:${ip}`, { maxRequests: 5, windowMs: 15 * 60 * 1000 });
    if (!success) {
      return NextResponse.json({ error: 'Zu viele Anfragen. Bitte warte 15 Minuten.' }, { status: 429 });
    }

    const body = await req.json();

    if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
      return NextResponse.json({ error: 'Gültige E-Mail erforderlich' }, { status: 400 });
    }

    const n8nUrl = process.env.N8N_WEBHOOK_CONTACT;
    if (!n8nUrl) {
      return NextResponse.json({ error: 'Server-Konfiguration fehlt' }, { status: 500 });
    }

    const origin = req.headers.get('origin') || '';

    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': origin,
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: { 'Content-Type': response.headers.get('Content-Type') ?? 'application/json' },
    });
  } catch {
    return NextResponse.json({ error: 'Server-Fehler' }, { status: 500 });
  }
}
