import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext, getAdminClient } from '@onvero/lib/tenant-server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function sessionIdFor(leadId: string, userId: string) {
  return `lead-${leadId}-${userId}`;
}

function extractReply(payload: unknown): string {
  if (payload == null) return '';
  if (typeof payload === 'string') return payload;
  if (Array.isArray(payload)) return extractReply(payload[0]);
  if (typeof payload === 'object') {
    const o = payload as Record<string, unknown>;
    for (const k of ['output', 'text', 'message', 'reply', 'response', 'answer', 'content']) {
      const v = o[k];
      if (typeof v === 'string' && v.trim()) return v;
    }
    if (o.data) return extractReply(o.data);
    if (o.json) return extractReply(o.json);
  }
  return '';
}

// ─── Load conversation history for this lead's session ───────────────────────
export async function GET(req: NextRequest) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });

  const leadId = new URL(req.url).searchParams.get('leadId')?.trim();
  if (!leadId) return NextResponse.json({ error: 'leadId erforderlich' }, { status: 400 });

  const sessionId = sessionIdFor(leadId, ctx.userId);
  const admin = getAdminClient();
  const { data, error } = await admin
    .from('chat_histories')
    .select('role, content, created_at')
    .eq('session_id', sessionId)
    .eq('tenant_id', ctx.tenantId)
    .eq('user_id', ctx.userId)
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data ?? [] });
}

// ─── Send a message to the research agent ────────────────────────────────────
export async function POST(req: NextRequest) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });

  const webhookUrl = process.env.N8N_WEBHOOK_LEAD_RESEARCH_CHAT;
  if (!webhookUrl) return NextResponse.json({ error: 'Webhook nicht konfiguriert' }, { status: 500 });

  let leadId = '';
  let message = '';
  try {
    const body = await req.json();
    leadId = String(body.leadId ?? '').trim();
    message = String(body.message ?? '').trim();
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 });
  }
  if (!leadId || !message) {
    return NextResponse.json({ error: 'leadId und message erforderlich' }, { status: 400 });
  }

  const sessionId = sessionIdFor(leadId, ctx.userId);
  const admin = getAdminClient();

  // First message of the session → inject the Lead-ID so the agent has context.
  const { count } = await admin
    .from('chat_histories')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .eq('user_id', ctx.userId);
  const isFirst = (count ?? 0) === 0;

  // Clear stale status rows so the client only polls status for THIS request.
  await admin.from('lead_chat_status').delete().eq('session_id', sessionId);

  const chatInput = isFirst ? `Lead-ID: ${leadId} — ${message}` : message;

  let reply = '';
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sendMessage', sessionId, chatInput }),
    });
    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json({ error: text || 'Chat-Webhook fehlgeschlagen' }, { status: res.status });
    }
    let payload: unknown = text;
    try {
      payload = JSON.parse(text);
    } catch {
      /* plain-text response */
    }
    reply = extractReply(payload) || (typeof payload === 'string' ? payload : '');
    if (!reply.trim()) reply = 'Ich konnte dazu keine Antwort erzeugen. Bitte formuliere die Frage anders.';
  } catch (err) {
    const m = err instanceof Error ? err.message : 'Interner Fehler';
    return NextResponse.json({ error: m }, { status: 502 });
  }

  // Persist the completed exchange so it can be reloaded later.
  await admin.from('chat_histories').insert([
    { session_id: sessionId, tenant_id: ctx.tenantId, user_id: ctx.userId, role: 'user', content: message },
    { session_id: sessionId, tenant_id: ctx.tenantId, user_id: ctx.userId, role: 'assistant', content: reply },
  ]);

  return NextResponse.json({ reply });
}
