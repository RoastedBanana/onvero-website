-- Meetings tables migration — applied via Supabase MCP on 2026-04-13

CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Video', 'Telefon', 'Vor Ort')),
  status TEXT NOT NULL DEFAULT 'Geplant' CHECK (status IN ('Geplant', 'Aktiv', 'Abgeschlossen')),
  date DATE NOT NULL,
  time TIME NOT NULL,
  duration INTEGER NOT NULL DEFAULT 25,
  phases JSONB NOT NULL DEFAULT '[]'::jsonb,
  product TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  from_suggestion BOOLEAN DEFAULT FALSE,
  win_loss TEXT CHECK (win_loss IN ('won', 'lost', 'pending') OR win_loss IS NULL),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.meeting_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  storage_path TEXT,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  mime_type TEXT DEFAULT 'audio/webm',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.meeting_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  transcript TEXT,
  language TEXT DEFAULT 'de',
  provider TEXT DEFAULT 'groq',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.meeting_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  text TEXT NOT NULL,
  timestamp_seconds INTEGER NOT NULL DEFAULT 0,
  phase_id TEXT,
  phase_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.meeting_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  summary TEXT,
  action_items JSONB DEFAULT '[]'::jsonb,
  ai_insights JSONB DEFAULT '[]'::jsonb,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative') OR sentiment IS NULL),
  talk_ratio_user REAL,
  talk_ratio_customer REAL,
  follow_up_draft TEXT,
  coaching_scores JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.meeting_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  lead_name TEXT NOT NULL,
  company TEXT NOT NULL,
  email_snippet TEXT,
  suggested_type TEXT DEFAULT 'Video',
  suggested_duration INTEGER DEFAULT 25,
  reason TEXT,
  dismissed BOOLEAN DEFAULT FALSE,
  accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meetings_tenant ON public.meetings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_meetings_lead ON public.meetings(lead_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON public.meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON public.meetings(date DESC);
CREATE INDEX IF NOT EXISTS idx_meeting_recordings_meeting ON public.meeting_recordings(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_meeting ON public.meeting_transcripts(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_notes_meeting ON public.meeting_notes(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_analysis_meeting ON public.meeting_analysis(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_suggestions_tenant ON public.meeting_suggestions(tenant_id);

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meetings_tenant_isolation" ON public.meetings
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "meeting_recordings_tenant_isolation" ON public.meeting_recordings
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "meeting_transcripts_tenant_isolation" ON public.meeting_transcripts
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "meeting_notes_tenant_isolation" ON public.meeting_notes
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "meeting_analysis_tenant_isolation" ON public.meeting_analysis
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "meeting_suggestions_tenant_isolation" ON public.meeting_suggestions
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
