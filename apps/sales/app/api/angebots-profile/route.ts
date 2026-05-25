import { NextRequest, NextResponse } from 'next/server';
import { getSalesSessionContext, getAdminClient } from '@/lib/session';

export const dynamic = 'force-dynamic';

const ALLOWED = [
  'name',
  'unternehmen',
  'beschreibung',
  'pain_points',
  'value_proposition',
  'referenzen',
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
    .from('angebots_profile')
    .select('id, name, unternehmen, beschreibung, pain_points, value_proposition, referenzen, created_at, updated_at')
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
    .from('angebots_profile')
    .insert({
      tenant_id: ctx.tenantId,
      created_by: ctx.userId,
      ...sanitized,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ profile: data });
}
