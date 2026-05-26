import { NextRequest, NextResponse } from 'next/server';
import { getSalesSessionContext, getAdminClient } from '@/lib/session';

export const dynamic = 'force-dynamic';

const TABLE = 'Absender_Profile';

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

const ALLOWED = [
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
] as const;

type Allowed = (typeof ALLOWED)[number];

function pick(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const key of ALLOWED) {
    if (key in body) out[key as Allowed] = body[key];
  }
  return out;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getSalesSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const sanitized = pick(body);
  if (Object.keys(sanitized).length === 0) {
    return NextResponse.json({ error: 'No valid fields' }, { status: 400 });
  }

  const client = getAdminClient();
  const { data, error } = await client
    .from(TABLE)
    .update(sanitized)
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)
    .select(SELECT_COLS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ profile: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getSalesSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const client = getAdminClient();
  const { error } = await client
    .from(TABLE)
    .delete()
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
