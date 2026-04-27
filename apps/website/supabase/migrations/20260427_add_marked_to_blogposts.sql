ALTER TABLE public.blogposts
  ADD COLUMN IF NOT EXISTS marked BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS blogposts_marked_idx ON public.blogposts (tenant_id, marked) WHERE marked = TRUE;
