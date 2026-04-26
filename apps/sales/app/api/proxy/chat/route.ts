import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext } from '@onvero/lib/tenant-server';

export async function POST(req: NextRequest) {
  try {
    const ctx = await getSessionContext();
    if (!ctx) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });

    const contentType = req.headers.get('content-type') ?? '';
    const isImage = contentType.includes('multipart') && (await req.clone().formData()).has('image');
    const url = isImage ? process.env.N8N_WEBHOOK_CHAT_IMAGE! : process.env.N8N_WEBHOOK_CHAT!;

    const res = await fetch(url, {
      method: 'POST',
      headers: contentType ? { 'Content-Type': contentType } : {},
      body: await req.arrayBuffer(),
    });

    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json({ error: text || 'Chat webhook failed' }, { status: res.status });
    }

    try {
      return NextResponse.json(JSON.parse(text));
    } catch {
      return NextResponse.json({ result: text });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
