import { NextRequest, NextResponse } from 'next/server';
import { getSalesSessionContext, getAdminClient } from '@/lib/session';

export const dynamic = 'force-dynamic';

const TABLE = 'Absender_Profile';
const MAX_PER_FILE = 512 * 1024; // 512 KB
const MAX_TOTAL = 5 * 1024 * 1024; // 5 MB combined
const WEBHOOK_TIMEOUT_MS = 120_000; // 2 min — AI calls can take a while

type EmailTemplate = {
  name: string;
  subject: string;
  body: string;
  source: 'manual' | 'uploaded';
};

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function pickString(obj: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return '';
}

function normalizeWebhookResponse(payload: unknown): { subject: string; body: string } | null {
  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    return trimmed ? { subject: '', body: trimmed } : null;
  }
  if (Array.isArray(payload) && payload.length > 0) {
    return normalizeWebhookResponse(payload[0]);
  }
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    const nested =
      (obj.template as Record<string, unknown> | undefined) ??
      (obj.data as Record<string, unknown> | undefined) ??
      (obj.result as Record<string, unknown> | undefined) ??
      obj;
    const subject = pickString(nested, ['subject', 'betreff', 'subject_line', 'title']);
    const body = pickString(nested, ['body', 'content', 'text', 'email', 'mail', 'output']);
    if (body) return { subject, body };
  }
  return null;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getSalesSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const webhookUrl = process.env.N8N_WEBHOOK_EMAIL_STYLE_AGENT;
  if (!webhookUrl) {
    return NextResponse.json(
      { error: 'Stil-Agent ist nicht konfiguriert (Env: N8N_WEBHOOK_EMAIL_STYLE_AGENT fehlt)' },
      { status: 500 },
    );
  }

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'No form data' }, { status: 400 });

  const fileEntries = form.getAll('files');
  const files = fileEntries.filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: 'Keine Dateien hochgeladen' }, { status: 400 });
  }

  let total = 0;
  const emails: string[] = [];
  for (const file of files) {
    if (file.size > MAX_PER_FILE) {
      return NextResponse.json({ error: `"${file.name}" ist größer als 512 KB` }, { status: 400 });
    }
    total += file.size;
    if (total > MAX_TOTAL) {
      return NextResponse.json({ error: 'Gesamtgröße überschreitet 5 MB' }, { status: 400 });
    }
    const raw = await file.text();
    const lower = file.name.toLowerCase();
    const text = lower.endsWith('.html') || lower.endsWith('.htm') ? stripHtml(raw) : raw.trim();
    if (text) emails.push(text);
  }

  if (emails.length === 0) {
    return NextResponse.json({ error: 'Keine lesbaren Mails in den Dateien gefunden' }, { status: 400 });
  }

  // Call webhook
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);
  let webhookPayload: unknown;
  try {
    const wbRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ emails, tenant_id: ctx.tenantId }),
      signal: controller.signal,
    });
    if (!wbRes.ok) {
      const errText = await wbRes.text().catch(() => '');
      return NextResponse.json(
        { error: `Stil-Agent antwortete mit ${wbRes.status}: ${errText.slice(0, 200)}` },
        { status: 502 },
      );
    }
    const ct = wbRes.headers.get('content-type') ?? '';
    webhookPayload = ct.includes('application/json') ? await wbRes.json() : await wbRes.text();
  } catch (e) {
    const aborted = (e as Error).name === 'AbortError';
    return NextResponse.json(
      { error: aborted ? 'Stil-Agent hat nicht rechtzeitig geantwortet' : 'Stil-Agent nicht erreichbar' },
      { status: 504 },
    );
  } finally {
    clearTimeout(timeout);
  }

  const normalized = normalizeWebhookResponse(webhookPayload);
  if (!normalized) {
    return NextResponse.json(
      { error: 'Stil-Agent-Antwort konnte nicht gelesen werden' },
      { status: 502 },
    );
  }

  const template: EmailTemplate = {
    name: `Generierte Vorlage (${new Date().toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })})`,
    subject: normalized.subject,
    body: normalized.body,
    source: 'uploaded',
  };

  // Append to email_templates in DB
  const admin = getAdminClient();
  const { data: row, error: readErr } = await admin
    .from(TABLE)
    .select('email_templates')
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)
    .single();

  if (readErr || !row) {
    return NextResponse.json({ error: 'Profil nicht gefunden' }, { status: 404 });
  }

  const existing = Array.isArray(row.email_templates) ? (row.email_templates as EmailTemplate[]) : [];
  const next = [...existing, template];

  const { error: upErr } = await admin
    .from(TABLE)
    .update({ email_templates: next })
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId);

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  return NextResponse.json({ template, templates: next });
}
