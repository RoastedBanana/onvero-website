-- Add sender_email column to tenant_ai_profile
-- Used as the "from" address when sending outreach emails
ALTER TABLE public.tenant_ai_profile
  ADD COLUMN IF NOT EXISTS sender_email text;

COMMENT ON COLUMN public.tenant_ai_profile.sender_email IS
  'From-Adresse für Outreach-Emails (z.B. "jan@contact.onvero.de")';
