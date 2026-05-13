import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSessionContext } from '@onvero/lib/tenant-server';

export const dynamic = 'force-dynamic';

interface ImportRow {
  company_name: string;
  website?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
  phone?: string;
  email?: string;
  industry?: string;
  employees?: string;
  revenue?: string;
  founded?: string;
  linkedin_url?: string;
  contact_name?: string;
  contact_role?: string;
  contact_email?: string;
  shop_system?: string;
  carrier?: string;
  description?: string;
  source?: string;
}

function getAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey) {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
  }
  return null;
}

function clean(v: string | undefined): string | null {
  const s = v?.trim();
  return s && s.length > 0 ? s : null;
}

export async function POST(req: NextRequest) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let rows: ImportRow[];
  try {
    const body = await req.json();
    rows = body.rows;
    if (!Array.isArray(rows) || rows.length === 0) throw new Error('empty');
  } catch {
    return NextResponse.json({ error: 'Ungültige Daten.' }, { status: 400 });
  }

  if (rows.length > 500) {
    return NextResponse.json({ error: 'Maximal 500 Leads pro Import.' }, { status: 400 });
  }

  const client = getAdmin();
  if (!client) {
    return NextResponse.json({ error: 'Serverkonfiguration fehlt.' }, { status: 500 });
  }

  const now = new Date().toISOString();
  const toInsert = rows.map((row) => ({
    tenant_id: ctx.tenantId,
    company_name: row.company_name.trim(),
    website: clean(row.website),
    city: clean(row.city),
    state: clean(row.state),
    country: clean(row.country),
    zip: clean(row.zip),
    phone: clean(row.phone),
    email: clean(row.email),
    industry: clean(row.industry),
    employees: clean(row.employees),
    revenue: clean(row.revenue),
    founded: clean(row.founded),
    linkedin_url: clean(row.linkedin_url),
    contact_name: clean(row.contact_name),
    contact_role: clean(row.contact_role),
    contact_email: clean(row.contact_email),
    shop_system: clean(row.shop_system),
    carrier: clean(row.carrier),
    description: clean(row.description),
    status: 'cold',
    fit_score: 0,
    source: clean(row.source) ?? 'csv_import',
    created_at: now,
    updated_at: now,
  }));

  const { data: inserted, error: insertError } = await client.from('leads').insert(toInsert).select('id, company_name');

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const insertedIds = (inserted ?? []).map((r: { id: string }) => r.id);

  const enrichWebhook = process.env.N8N_WEBHOOK_LEAD_GENERATOR;
  const enrichSecret = process.env.N8N_LEAD_GENERATOR_SECRET;

  if (enrichWebhook && enrichSecret && insertedIds.length > 0) {
    fetch(enrichWebhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': enrichSecret,
      },
      body: JSON.stringify({
        tenant_id: ctx.tenantId,
        secret: enrichSecret,
        mode: 'enrich_imported',
        lead_ids: insertedIds,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({
    imported: insertedIds.length,
    lead_ids: insertedIds,
    enrich_triggered: !!(enrichWebhook && enrichSecret),
  });
}
