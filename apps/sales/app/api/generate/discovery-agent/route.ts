import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext, getAdminClient } from '@onvero/lib/tenant-server';

const WEBHOOK_URL = process.env.N8N_WEBHOOK_DISCOVERY_AGENT ?? '';

export const dynamic = 'force-dynamic';

// ─── helpers ───────────────────────────────────────────────────────────────

function str(v: unknown): string {
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return Math.round(v);
  if (typeof v === 'string' && v.trim().length > 0) {
    const n = Number(v);
    if (Number.isFinite(n)) return Math.round(n);
  }
  return null;
}

function normalizeUrl(u: string): string | null {
  const t = u.trim();
  if (!t) return null;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

const URL_LIKE = /\b((?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s"',]*)?)/i;
const SKIP_DOMAINS = ['linkedin.com', 'twitter.com', 'x.com', 'facebook.com', 'instagram.com'];

function deepFindUrl(obj: unknown, depth = 0): string | null {
  if (!obj || depth > 3) return null;
  if (typeof obj === 'string') {
    const m = obj.match(URL_LIKE);
    if (m && !SKIP_DOMAINS.some((d) => m[1].toLowerCase().includes(d))) return m[1];
    return null;
  }
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const f = deepFindUrl(item, depth + 1);
      if (f) return f;
    }
    return null;
  }
  if (typeof obj === 'object') {
    for (const v of Object.values(obj as Record<string, unknown>)) {
      const f = deepFindUrl(v, depth + 1);
      if (f) return f;
    }
  }
  return null;
}

function extractLeads(payload: unknown): Record<string, unknown>[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    for (const key of ['leads', 'companies', 'results', 'items', 'data']) {
      const v = obj[key];
      if (Array.isArray(v)) return v as Record<string, unknown>[];
    }
    if (obj.company_name || obj.name || obj.website || obj.domain) {
      return [obj];
    }
  }
  return [];
}

interface PotentialLeadInsert {
  tenant_id: string;
  discovery_run_id: string;
  discovery_source: 'discovery_agent';
  discovery_query: string | null;
  company_name: string;
  city: string | null;
  postal_code: string | null;
  address: string | null;
  country: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  email: string | null;
  phone: string | null;
  employee_count: number | null;
  revenue_cents: number | null;
  incorporated_at: string | null;
  apollo_organization_id: string | null;
  apollo_domain: string | null;
  raw_data: Record<string, unknown>;
}

function isoDate(v: unknown): string | null {
  const s = str(v).trim();
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function bigNum(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return Math.round(v);
  if (typeof v === 'string' && v.trim().length > 0) {
    const n = Number(v);
    if (Number.isFinite(n)) return Math.round(n);
  }
  return null;
}

function mapLeadForInsert(
  raw: Record<string, unknown>,
  tenantId: string,
  runId: string,
  query: string | null,
): PotentialLeadInsert | null {
  const companyName = str(
    raw.company_name ?? raw.name ?? raw.firma ?? raw.unternehmen,
  ).trim();
  if (!companyName) return null;

  const urlRaw =
    str(
      raw.url ??
        raw.website ??
        raw.website_url ??
        raw.homepage ??
        raw.link ??
        raw.domain ??
        raw.apollo_domain ??
        raw.web ??
        raw.company_url ??
        raw.firma_url ??
        raw.webseite ??
        '',
    ) || deepFindUrl(raw) || '';
  const website = urlRaw ? normalizeUrl(urlRaw) : null;

  const linkedin = str(raw.linkedin_url ?? raw.linkedin ?? '').trim();
  const apolloDomain = str(raw.apollo_domain ?? '').trim() || null;

  return {
    tenant_id: tenantId,
    discovery_run_id: runId,
    discovery_source: 'discovery_agent',
    discovery_query: query,
    company_name: companyName,
    city: str(raw.city ?? raw.location ?? raw.standort ?? raw.ort).trim() || null,
    postal_code: str(raw.postal_code ?? raw.zip ?? raw.plz).trim() || null,
    address: str(raw.address ?? raw.adresse).trim() || null,
    country: str(raw.country ?? raw.land).trim() || null,
    website_url: website,
    linkedin_url: linkedin ? normalizeUrl(linkedin) : null,
    email: str(raw.email).trim() || null,
    phone: str(raw.phone ?? raw.telefon).trim() || null,
    employee_count: num(raw.employee_count ?? raw.employees ?? raw.mitarbeiter ?? raw.size),
    revenue_cents: bigNum(raw.revenue_cents ?? raw.revenue),
    incorporated_at: isoDate(raw.incorporated_at ?? raw.founded ?? raw.founded_at),
    apollo_organization_id: str(raw.apollo_organization_id).trim() || null,
    apollo_domain: apolloDomain,
    raw_data: raw,
  };
}

function buildRunName(setup: Record<string, unknown> | null): string {
  if (!setup) return 'Neue Suche';
  const fokus = str(setup.recherche_fokus).trim();
  const orte = Array.isArray(setup.orte) ? (setup.orte as unknown[]).map(str) : [];
  const queries = Array.isArray(setup.weitere_queries)
    ? (setup.weitere_queries as unknown[]).map(str)
    : [];
  const parts = [fokus, orte[0], queries[0]].filter((v) => v && v.length > 0);
  return parts.join(' · ').slice(0, 120) || 'Neue Suche';
}

// ─── handler ───────────────────────────────────────────────────────────────

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

  const angebotsProfileId =
    setup && typeof setup.angebots_profile_id === 'string' ? setup.angebots_profile_id : null;

  const client = getAdminClient();

  // Resolve full Angebotsprofil for the webhook payload.
  let angebotsProfile: Record<string, unknown> | null = null;
  if (angebotsProfileId) {
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

  // Create the discovery_runs row up front so we have an ID for n8n.
  const { data: run, error: runErr } = await client
    .from('discovery_runs')
    .insert({
      tenant_id: ctx.tenantId,
      user_id: ctx.userId,
      name: buildRunName(setup),
      status: 'running',
      setup: setup ?? {},
      angebots_profile_id: angebotsProfileId,
    })
    .select('id, name, status, created_at')
    .single();

  if (runErr || !run) {
    return NextResponse.json(
      { error: 'Could not create discovery_run', detail: runErr?.message },
      { status: 500 },
    );
  }

  const payload = {
    tenant_id: ctx.tenantId,
    discovery_run_id: run.id,
    setup,
    angebots_profile: angebotsProfile,
  };

  // Call n8n. Wrap so we can mark the run as failed on any error.
  let webhookData: unknown = null;
  try {
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
    try {
      webhookData = text ? JSON.parse(text) : null;
    } catch {
      throw new Error(`Invalid JSON from n8n: ${text.slice(0, 200)}`);
    }

    if (!res.ok) {
      throw new Error(
        typeof (webhookData as { error?: string })?.error === 'string'
          ? (webhookData as { error: string }).error
          : `Webhook ${res.status}`,
      );
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown webhook error';
    await client
      .from('discovery_runs')
      .update({ status: 'failed', error: message })
      .eq('id', run.id);
    return NextResponse.json(
      { error: 'Webhook failed', detail: message, discovery_run_id: run.id },
      { status: 502 },
    );
  }

  // Persist returned leads. n8n may also insert; we keep the API authoritative
  // so the run is always populated even if the workflow doesn't write back.
  const rawLeads = extractLeads(webhookData);
  const query = setup
    ? [
        str(setup.recherche_fokus),
        ...(Array.isArray(setup.weitere_queries)
          ? (setup.weitere_queries as unknown[]).map(str)
          : []),
      ]
        .filter(Boolean)
        .join(' · ') || null
    : null;

  const inserts = rawLeads
    .map((l) => mapLeadForInsert(l, ctx.tenantId, run.id, query))
    .filter((v): v is PotentialLeadInsert => v !== null);

  if (inserts.length > 0) {
    const { error: insertErr } = await client.from('potential_leads').insert(inserts);
    if (insertErr) {
      await client
        .from('discovery_runs')
        .update({ status: 'failed', error: `Insert failed: ${insertErr.message}` })
        .eq('id', run.id);
      return NextResponse.json(
        { error: 'Lead insert failed', detail: insertErr.message, discovery_run_id: run.id },
        { status: 500 },
      );
    }
  }

  await client
    .from('discovery_runs')
    .update({ status: 'completed', lead_count: inserts.length })
    .eq('id', run.id);

  return NextResponse.json({
    ok: true,
    discovery_run_id: run.id,
    run_name: run.name,
    lead_count: inserts.length,
    data: webhookData,
  });
}
