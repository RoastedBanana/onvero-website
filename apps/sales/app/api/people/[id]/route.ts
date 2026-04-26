import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext, getAdminClient } from '@onvero/lib/tenant-server';
import { isUUID } from '@onvero/lib/validate';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!isUUID(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const admin = getAdminClient();
  const { data, error } = await admin
    .from('lead_contact_enrichments')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ contact: data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!isUUID(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const body = await req.json();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.email_draft_subject === 'string') update.email_draft_subject = body.email_draft_subject;
  if (typeof body.email_draft_body === 'string') update.email_draft_body = body.email_draft_body;

  if (Object.keys(update).length === 1) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const admin = getAdminClient();
  const { data, error } = await admin
    .from('lead_contact_enrichments')
    .update(update)
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ contact: data });
}
