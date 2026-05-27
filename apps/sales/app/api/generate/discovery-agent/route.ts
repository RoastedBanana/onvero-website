import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext, getAdminClient } from '@onvero/lib/tenant-server';

const WEBHOOK_URL = process.env.N8N_WEBHOOK_DISCOVERY_AGENT ?? '';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!WEBHOOK_URL) {
    return NextResponse.json(
      { error: 'N8N_WEBHOOK_DISCOVERY_AGENT not configured' },
      { status: 500 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const setup = (body.setup ?? null) as Record<string, unknown> | null;

  // Resolve the selected Angebotsprofil (full row) for the current tenant.
  const angebotsProfileId =
    setup && typeof setup.angebots_profile_id === 'string' ? setup.angebots_profile_id : null;

  let angebotsProfile: Record<string, unknown> | null = null;
  if (angebotsProfileId) {
    const client = getAdminClient();
    const { data } = await client
      .from('angebots_profile')
      .select(
        'id, name, unternehmen, beschreibung, pain_points, value_proposition, referenzen',
      )
      .eq('tenant_id', ctx.tenantId)
      .eq('id', angebotsProfileId)
      .maybeSingle();
    angebotsProfile = data ?? null;
  }

  const payload = {
    tenant_id: ctx.tenantId,
    setup,
    angebots_profile: angebotsProfile,
  };

  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.N8N_WEBHOOK_SECRET
        ? { 'x-onvero-secret': process.env.N8N_WEBHOOK_SECRET }
        : {}),
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON from n8n', raw: text.slice(0, 500) },
      { status: 502 },
    );
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: 'Webhook failed', status: res.status, detail: data },
      { status: res.status },
    );
  }

  return NextResponse.json({ ok: true, data });
}
