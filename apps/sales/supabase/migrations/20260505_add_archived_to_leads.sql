ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS leads_archived_tenant_idx
  ON public.leads (tenant_id, archived);
