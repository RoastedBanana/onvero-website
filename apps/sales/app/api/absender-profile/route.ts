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
  'writing_style',
  'formality',
  'greeting_style',
  'max_email_words',
  'language',
  'angebots_profile_id',
  'email_templates',
  'email_signature_html',
  'calendar_link',
  'key_differentiators',
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
  'writing_style',
  'formality',
  'greeting_style',
  'max_email_words',
  'language',
  'angebots_profile_id',
  'email_templates',
  'email_signature_html',
  'calendar_link',
  'key_differentiators',
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

export async function GET() {
  const ctx = await getSalesSessionContext();
  if (!ctx) return NextResponse.json({ profiles: [] }, { status: 401 });

  const client = getAdminClient();
  const { data, error } = await client
    .from(TABLE)
    .select(SELECT_COLS)
    .eq('tenant_id', ctx.tenantId)
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ profiles: [], error: error.message }, { status: 500 });
  return NextResponse.json({ profiles: data ?? [] });
}

export async function POST(req: NextRequest) {
  const ctx = await getSalesSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const sanitized = pick(body);

  const client = getAdminClient();
  const { data, error } = await client
    .from(TABLE)
    .insert({
      tenant_id: ctx.tenantId,
      ...sanitized,
    })
    .select(SELECT_COLS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ profile: data });
}
