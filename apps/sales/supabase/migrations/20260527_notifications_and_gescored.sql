-- Notifications table + potential_leads.gescored flag
-- Applied via Supabase MCP on 2026-05-27

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  user_id UUID,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  link TEXT,
  read_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_tenant_created
  ON public.notifications(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires
  ON public.notifications(expires_at);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_tenant_isolation" ON public.notifications
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid())
  );

-- Mark when a potential lead has been promoted, enriched and scored.
ALTER TABLE public.potential_leads
  ADD COLUMN IF NOT EXISTS gescored BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_potential_leads_gescored
  ON public.potential_leads(discovery_run_id, gescored);
