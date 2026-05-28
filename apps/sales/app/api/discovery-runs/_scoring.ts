import type { SupabaseClient } from '@supabase/supabase-js';

interface IngestArgs {
  client: SupabaseClient;
  tenantId: string;
  leadId: string;
  potentialLeadId?: string | null;
  discoveryRunId?: string | null;
  companyName?: string;
  structuralFieldsUpdated?: number | null;
  hrbMatchStatus?: string | null;
  scoringComplete?: boolean;
}

/**
 * Mark the originating potential_lead as scored and create the in-app
 * notification for the tenant. Idempotent on the gescored flag; safe to call
 * from both the synchronous webhook response handler and the async callback.
 */
export async function ingestScoringResult(args: IngestArgs): Promise<void> {
  const {
    client,
    tenantId,
    leadId,
    potentialLeadId,
    discoveryRunId,
    companyName,
    structuralFieldsUpdated = null,
    hrbMatchStatus = null,
    scoringComplete = true,
  } = args;

  // Resolve company name + potential_lead_id from the lead if not provided.
  let resolvedCompany = companyName;
  let resolvedPotentialId = potentialLeadId ?? null;
  let resolvedRunId = discoveryRunId ?? null;
  if (!resolvedCompany || !resolvedPotentialId || !resolvedRunId) {
    const { data: lead } = await client
      .from('leads')
      .select('company_name, custom_fields')
      .eq('id', leadId)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    if (lead) {
      if (!resolvedCompany && typeof lead.company_name === 'string') {
        resolvedCompany = lead.company_name;
      }
      const cf = (lead.custom_fields ?? {}) as Record<string, unknown>;
      if (!resolvedPotentialId && typeof cf.potential_lead_id === 'string') {
        resolvedPotentialId = cf.potential_lead_id;
      }
      if (!resolvedRunId && typeof cf.discovery_run_id === 'string') {
        resolvedRunId = cf.discovery_run_id;
      }
    }
  }

  if (resolvedPotentialId) {
    await client
      .from('potential_leads')
      .update({ gescored: true })
      .eq('id', resolvedPotentialId)
      .eq('tenant_id', tenantId);
  }

  const company = resolvedCompany ?? 'Lead';
  const title = scoringComplete
    ? `${company}: Scoring abgeschlossen`
    : `${company}: Anreicherung abgeschlossen`;
  const body = scoringComplete
    ? 'Der Lead wurde vollständig angereichert und bewertet.'
    : 'Der Lead wurde angereichert.';

  await client.from('notifications').insert({
    tenant_id: tenantId,
    type: 'lead_scoring_complete',
    title,
    body,
    link: `/dashboard/unternehmen/${leadId}`,
    payload: {
      lead_id: leadId,
      potential_lead_id: resolvedPotentialId,
      discovery_run_id: resolvedRunId,
      company_name: company,
      structural_fields_updated: structuralFieldsUpdated,
      hrb_match_status: hrbMatchStatus,
      scoring_complete: scoringComplete,
    },
  });
}
