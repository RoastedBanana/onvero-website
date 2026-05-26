import { NextRequest, NextResponse } from 'next/server';
import { getSalesSessionContext, getAdminClient } from '@/lib/session';

export const dynamic = 'force-dynamic';

const TABLE = 'Absender_Profile';
const MAX_PER_FILE = 512 * 1024; // 512 KB
const MAX_TOTAL = 5 * 1024 * 1024; // 5 MB combined
const WEBHOOK_TIMEOUT_MS = 120_000;

const SELECT_COLS = [
  'id',
  'profile_name',
  'sender_first_name',
  'sender_last_name',
  'sender_role',
  'sender_email',
  'sender_linkedin_url',
  'sender_photo_url',
  'outreach_goal',
  'tonality',
  'writing_style',
  'formality',
  'greeting_style',
  'max_email_words',
  'language',
  'angebots_profile_id',
  'email_templates',
  'email_signature_html',
  'calendar_link',
  'forbidden_phrases',
  'forbidden_claims',
  'created_at',
  'updated_at',
].join(', ');

type EmailTemplate = {
  name: string;
  subject: string;
  body: string;
  source: 'manual' | 'uploaded';
  type?: string;
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

function pickString(o: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return undefined;
}

function pickNumber(o: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() && Number.isFinite(Number(v))) return Number(v);
  }
  return undefined;
}

function pickStringArray(o: Record<string, unknown>, ...keys: string[]): string[] | undefined {
  for (const k of keys) {
    const v = o[k];
    if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string' && x.trim() !== '');
  }
  return undefined;
}

function pickTemplateArray(o: Record<string, unknown>, ...keys: string[]): EmailTemplate[] {
  for (const k of keys) {
    const v = o[k];
    if (!Array.isArray(v)) continue;
    const out: EmailTemplate[] = [];
    for (const raw of v) {
      if (!raw || typeof raw !== 'object') continue;
      const r = raw as Record<string, unknown>;
      const name = pickString(r, 'name', 'title') ?? 'Vorlage';
      const subject = pickString(r, 'subject', 'betreff') ?? '';
      const body = pickString(r, 'body', 'content', 'text', 'mail') ?? '';
      if (!body) continue;
      const type = pickString(r, 'type', 'category', 'kind');
      out.push({ name, subject, body, source: 'uploaded', ...(type ? { type } : {}) });
    }
    if (out.length) return out;
  }
  return [];
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
      body: JSON.stringify({ emails, tenant_id: ctx.tenantId, absender_profile_id: id }),
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

  // Normalize: array of objects → take first; object → use as-is; string → wrap into body-only template
  let item: Record<string, unknown> | null = null;
  if (Array.isArray(webhookPayload) && webhookPayload.length > 0 && typeof webhookPayload[0] === 'object') {
    item = webhookPayload[0] as Record<string, unknown>;
  } else if (webhookPayload && typeof webhookPayload === 'object' && !Array.isArray(webhookPayload)) {
    item = webhookPayload as Record<string, unknown>;
  } else if (typeof webhookPayload === 'string' && webhookPayload.trim()) {
    item = { email_templates: [{ name: 'Generierte Vorlage', subject: '', body: webhookPayload.trim() }] };
  }

  if (!item) {
    return NextResponse.json({ error: 'Stil-Agent-Antwort konnte nicht gelesen werden' }, { status: 502 });
  }

  // Build scalar patch — only include fields the webhook actually returned
  const patch: Record<string, unknown> = {};

  const formality = pickString(item, 'formality');
  if (formality === 'du' || formality === 'sie') patch.formality = formality;

  const tonality = pickString(item, 'tonality');
  if (tonality !== undefined) patch.tonality = tonality;

  const writingStyle = pickString(item, 'writing_style');
  if (writingStyle !== undefined) patch.writing_style = writingStyle;

  const language = pickString(item, 'language');
  if (language !== undefined) patch.language = language;

  const greetingStyle = pickString(item, 'greeting_style');
  if (greetingStyle !== undefined) patch.greeting_style = greetingStyle;

  const maxEmailWords = pickNumber(item, 'max_email_words');
  if (maxEmailWords !== undefined) patch.max_email_words = maxEmailWords;

  const emailSignatureHtml = pickString(item, 'email_signature_html');
  if (emailSignatureHtml !== undefined) patch.email_signature_html = emailSignatureHtml;

  const outreachGoal = pickString(item, 'outreach_goal');
  if (outreachGoal !== undefined) patch.outreach_goal = outreachGoal;

  // Array fields — merge with existing rows
  const admin = getAdminClient();
  const { data: existing, error: readErr } = await admin
    .from(TABLE)
    .select('email_templates, forbidden_claims, forbidden_phrases')
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)
    .single();

  if (readErr || !existing) {
    return NextResponse.json({ error: 'Profil nicht gefunden' }, { status: 404 });
  }

  const newTemplates = pickTemplateArray(item, 'email_templates', 'templates');
  if (newTemplates.length) {
    const existingTemplates = Array.isArray(existing.email_templates)
      ? (existing.email_templates as EmailTemplate[])
      : [];
    patch.email_templates = [...existingTemplates, ...newTemplates];
  }

  const newClaims = pickStringArray(item, 'forbidden_claims');
  if (newClaims && newClaims.length) {
    const existingClaims = Array.isArray(existing.forbidden_claims)
      ? (existing.forbidden_claims as string[])
      : [];
    patch.forbidden_claims = Array.from(new Set([...existingClaims, ...newClaims]));
  }

  const newPhrases = pickStringArray(item, 'forbidden_phrases');
  if (newPhrases && newPhrases.length) {
    const existingPhrases = Array.isArray(existing.forbidden_phrases)
      ? (existing.forbidden_phrases as string[])
      : [];
    patch.forbidden_phrases = Array.from(new Set([...existingPhrases, ...newPhrases]));
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Stil-Agent hat keine Felder zurückgegeben' }, { status: 502 });
  }

  const { data: updated, error: upErr } = await admin
    .from(TABLE)
    .update(patch)
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)
    .select(SELECT_COLS)
    .single();

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
  return NextResponse.json({ profile: updated, addedTemplates: newTemplates });
}
