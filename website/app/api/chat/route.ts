import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { validateCsrf } from '@/lib/csrf';

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) {
      return NextResponse.json({ error: 'Ungültiges CSRF-Token' }, { status: 403 });
    }

    const ip = getClientIp(req.headers);
    const { success } = await rateLimit(`chat:${ip}`, { maxRequests: 30, windowMs: 60 * 60 * 1000 });
    if (!success) {
      return NextResponse.json({ error: 'Zu viele Nachrichten. Bitte warte etwas.' }, { status: 429 });
    }

    const body = await req.json();

    if (!body.message || typeof body.message !== 'string' || body.message.length > 5000) {
      return NextResponse.json({ error: 'Nachricht ungültig oder zu lang' }, { status: 400 });
    }

    const n8nUrl = process.env.N8N_WEBHOOK_CHAT;
    if (!n8nUrl) {
      return NextResponse.json({ error: 'Server-Konfiguration fehlt' }, { status: 500 });
    }

    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
