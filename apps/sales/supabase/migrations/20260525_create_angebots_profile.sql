-- Angebots-Profile (offer profiles) per tenant — applied via Supabase MCP on 2026-05-25

CREATE TABLE IF NOT EXISTS public.angebots_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Neues Angebots-Profil',
  unternehmen TEXT NOT NULL DEFAULT '',
  beschreibung TEXT NOT NULL DEFAULT '',
  pain_points JSONB NOT NULL DEFAULT '[]'::jsonb,
  value_proposition TEXT NOT NULL DEFAULT '',
  referenzen JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_angebots_profile_tenant ON public.angebots_profile(tenant_id);
CREATE INDEX IF NOT EXISTS idx_angebots_profile_updated ON public.angebots_profile(updated_at DESC);

ALTER TABLE public.angebots_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "angebots_profile_tenant_isolation" ON public.angebots_profile
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));

CREATE TRIGGER angebots_profile_updated_at
  BEFORE UPDATE ON public.angebots_profile
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
