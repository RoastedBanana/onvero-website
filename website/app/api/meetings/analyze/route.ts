import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch('https://n8n.srv1223027.hstgr.cloud/webhook/meeting-summarizer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await res.text();

    if (!res.ok) {
      return NextResponse.json(
        { error: text || 'n8n Webhook fehlgeschlagen' },
        { status: res.status },
      );
    }

    // Forward whatever n8n returns
    try {
      const json = JSON.parse(text);
      return NextResponse.json(json);
    } catch {
      return NextResponse.json({ result: text });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Interner Serverfehler';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
