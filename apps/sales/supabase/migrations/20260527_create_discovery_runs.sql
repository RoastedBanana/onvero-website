-- Discovery-Agent runs + link from existing potential_leads
-- Applied via Supabase MCP on 2026-05-27

CREATE TABLE IF NOT EXISTS public.discovery_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  user_id UUID,
  name TEXT NOT NULL DEFAULT 'Neue Suche',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status = ANY (ARRAY['pending'::text, 'running'::text, 'completed'::text, 'failed'::text])),
  setup JSONB NOT NULL DEFAULT '{}'::jsonb,
  angebots_profile_id UUID REFERENCES public.angebots_profile(id) ON DELETE SET NULL,
  lead_count INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discovery_runs_tenant
  ON public.discovery_runs(tenant_id, created_at DESC);

ALTER TABLE public.discovery_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "discovery_runs_tenant_isolation" ON public.discovery_runs
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid())
  );

CREATE TRIGGER discovery_runs_updated_at
  BEFORE UPDATE ON public.discovery_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Link each potential lead to the run that produced it.
ALTER TABLE public.potential_leads
  ADD COLUMN IF NOT EXISTS discovery_run_id UUID
  REFERENCES public.discovery_runs(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_potential_leads_discovery_run
  ON public.potential_leads(discovery_run_id);

-- Allow 'discovery_agent' as discovery_source.
ALTER TABLE public.potential_leads
  DROP CONSTRAINT IF EXISTS potential_leads_discovery_source_check;

ALTER TABLE public.potential_leads
  ADD CONSTRAINT potential_leads_discovery_source_check
  CHECK (discovery_source = ANY (
    ARRAY['openregister'::text, 'apollo'::text, 'manual'::text, 'discovery_agent'::text]
  ));
