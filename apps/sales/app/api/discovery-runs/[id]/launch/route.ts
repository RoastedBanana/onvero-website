import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext, getAdminClient } from '@onvero/lib/tenant-server';
import { ingestScoringResult } from '../../_scoring';

const SCORING_WEBHOOK_URL = process.env.N8N_WEBHOOK_DEEP_RESEARCH_PARALLEL ?? '';

export const dynamic = 'force-dynamic';

interface PotentialLeadRow {
  id: string;
  tenant_id: string;
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
  raw_data: Record<string, unknown> | null;
}

function str(v: unknown): string | null {
  if (typeof v === 'string') {
    const t = v.trim();
    return t.length > 0 ? t : null;
  }
  if (typeof v === 'number') return String(v);
  return null;
}

export async function POST(req: NextRequest, ctxParam: { params: Promise<{ id: string }> }) {
  const { id: runId } = await ctxParam.params;
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!SCORING_WEBHOOK_URL) {
    return NextResponse.json({ error: 'N8N_WEBHOOK_DEEP_RESEARCH_PARALLEL not configured' }, { status: 500 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    potential_lead_ids?: unknown;
  };
  const ids = Array.isArray(body.potential_lead_ids)
    ? body.potential_lead_ids.filter((v): v is string => typeof v === 'string')
    : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: 'potential_lead_ids is required' }, { status: 400 });
  }

  const client = getAdminClient();

  // Confirm the run belongs to this tenant.
  const { data: run } = await client
    .from('discovery_runs')
    .select('id')
    .eq('id', runId)
    .eq('tenant_id', ctx.tenantId)
    .maybeSingle();
  if (!run) return NextResponse.json({ error: 'Run not found' }, { status: 404 });

  // Pull the potential_leads to promote.
  const { data: potentials, error: selErr } = await client
    .from('potential_leads')
    .select(
      'id, tenant_id, company_name, city, postal_code, address, country, website_url, linkedin_url, email, phone, employee_count, revenue_cents, incorporated_at, apollo_organization_id, raw_data'
    )
    .eq('tenant_id', ctx.tenantId)
    .eq('discovery_run_id', runId)
    .in('id', ids);

  if (selErr) {
    return NextResponse.json({ error: selErr.message }, { status: 500 });
  }
  if (!potentials || potentials.length === 0) {
    return NextResponse.json({ error: 'No matching potential leads' }, { status: 404 });
  }

  // Promote each potential_lead to a leads row.
  // PUBLIC_BASE_URL lets the dev host point n8n at a tunnel (ngrok/cloudflared)
  // because the production callback obviously can't be http://localhost:3001.
  const callbackBase = process.env.PUBLIC_BASE_URL?.replace(/\/$/, '') ?? req.nextUrl.origin;
  const callbackUrl = `${callbackBase}/api/webhooks/discovery-scoring-complete`;
  const promoted: { potential_lead_id: string; lead_id: string }[] = [];
  const failed: { potential_lead_id: string; company_name?: string; error: string }[] = [];

  for (const p of potentials as PotentialLeadRow[]) {
    const raw = (p.raw_data ?? {}) as Record<string, unknown>;
    const foundedYear = (() => {
      if (!p.incorporated_at) return null;
      const d = new Date(p.incorporated_at);
      return Number.isNaN(d.getTime()) ? null : d.getFullYear();
    })();

    const leadInsert: Record<string, unknown> = {
      tenant_id: ctx.tenantId,
      company_name: p.company_name,
      city: p.city,
      zip: p.postal_code,
      street: p.address,
      country: p.country,
      website: p.website_url,
      phone: p.phone,
      linkedin_url: p.linkedin_url,
      num_employees: p.employee_count,
      founded_year: foundedYear,
      apollo_organization_id: p.apollo_organization_id,
      source: 'discovery_agent',
      status: 'new',
      enrichment_status: 'raw',
      // Social links lifted from the webhook payload stored in raw_data.
      logo_url: str(raw.logo_url),
      facebook_url: str(raw.facebook_url),
      twitter_url: str(raw.twitter_url),
      instagram_url: str(raw.instagram_url),
      xing_url: str(raw.xing_url),
      youtube_url: str(raw.youtube_url),
      tiktok_url: str(raw.tiktok_url),
      github_url: str(raw.github_url),
      // Keep the raw discovery payload around for downstream agents.
      custom_fields: { discovery_run_id: runId, potential_lead_id: p.id, raw },
    };

    const { data: newLead, error: insErr } = await client.from('leads').insert(leadInsert).select('id').single();

    if (insErr || !newLead) {
      console.error('[launch] lead insert failed', {
        potential_lead_id: p.id,
        company_name: p.company_name,
        error: insErr,
      });
      failed.push({
        potential_lead_id: p.id,
        company_name: p.company_name,
        error: insErr?.message ?? 'insert failed',
      });
      continue;
    }

    await client
      .from('potential_leads')
      .update({ promoted_lead_id: newLead.id, lead_status: 'promoted' })
      .eq('id', p.id);

    promoted.push({ potential_lead_id: p.id, lead_id: newLead.id });
  }

  // If every single insert failed, surface that to the caller so we don't
  // pretend success while no webhook ever gets fired.
  if (promoted.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Kein Lead konnte angelegt werden',
        promoted,
        failed,
      },
      { status: 500 }
    );
  }

  // Fire scoring webhook per lead in parallel. The HTTP response returns
  // immediately (UI moves on), but we keep listening for each n8n response
  // body — if it carries the success payload synchronously, we materialize
  // the notification + flip gescored right there. (A separate callback POST
  // to callback_url still works as a fallback path.)
  const tenantIdForCallback = ctx.tenantId;
  void Promise.allSettled(
    promoted.map(({ lead_id, potential_lead_id }) =>
      fetch(SCORING_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.N8N_WEBHOOK_SECRET ? { 'x-onvero-secret': process.env.N8N_WEBHOOK_SECRET } : {}),
        },
        body: JSON.stringify({
          lead_id,
          tenant_id: tenantIdForCallback,
          potential_lead_id,
          discovery_run_id: runId,
          callback_url: callbackUrl,
        }),
      })
        .then(async (res) => {
          const text = await res.text().catch(() => '');
          if (!res.ok) {
            console.error('[launch] scoring webhook non-2xx', lead_id, res.status, text.slice(0, 200));
            return;
          }
          console.log('[launch] scoring webhook fired', lead_id, res.status);

          // If n8n responds synchronously with the success body, handle it
          // inline so the notification appears without waiting for the
          // (potentially unreachable in dev) callback round-trip.
          let parsed: Record<string, unknown> | null = null;
          try {
            parsed = text ? JSON.parse(text) : null;
          } catch {
            return; // not JSON — nothing to ingest
          }
          if (!parsed) return;
          const payload = (Array.isArray(parsed) ? parsed[0] : parsed) as Record<string, unknown>;
          if (!payload || typeof payload !== 'object') return;
          const responseLeadId = typeof payload.lead_id === 'string' ? payload.lead_id : lead_id;
          if (responseLeadId !== lead_id) {
            console.warn('[launch] response lead_id mismatch', { sent: lead_id, got: responseLeadId });
          }
          await ingestScoringResult({
            client,
            tenantId: tenantIdForCallback,
            leadId: lead_id,
            potentialLeadId: potential_lead_id,
            discoveryRunId: runId,
            companyName: typeof payload.company_name === 'string' ? payload.company_name : undefined,
            structuralFieldsUpdated:
              typeof payload.structural_fields_updated === 'number' ? payload.structural_fields_updated : null,
            hrbMatchStatus: typeof payload.hrb_match_status === 'string' ? payload.hrb_match_status : null,
            scoringComplete: typeof payload.scoring_complete === 'boolean' ? payload.scoring_complete : true,
          });
        })
        .catch((err) => console.error('[launch] scoring webhook rejected', lead_id, err))
    )
  );

  return NextResponse.json({
    ok: true,
    promoted,
    failed,
    webhook_url: SCORING_WEBHOOK_URL,
    callback_url: callbackUrl,
  });
}
