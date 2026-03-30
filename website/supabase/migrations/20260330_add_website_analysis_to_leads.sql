ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS website_summary TEXT,
  ADD COLUMN IF NOT EXISTS website_title TEXT,
  ADD COLUMN IF NOT EXISTS website_description TEXT,
  ADD COLUMN IF NOT EXISTS website_text TEXT,
  ADD COLUMN IF NOT EXISTS social_links JSONB;
