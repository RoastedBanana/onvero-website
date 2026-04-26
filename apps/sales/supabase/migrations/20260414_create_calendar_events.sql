CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  date DATE NOT NULL,
  time TIME,
  duration INTEGER DEFAULT 30,
  type TEXT NOT NULL DEFAULT 'manual' CHECK (type IN ('meeting', 'follow_up', 'reminder', 'email', 'manual')),
  color TEXT,
  completed BOOLEAN DEFAULT FALSE,
  auto_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_tenant ON public.calendar_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON public.calendar_events(date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_meeting ON public.calendar_events(meeting_id);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calendar_events_tenant_isolation" ON public.calendar_events
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM public.tenant_users WHERE user_id = auth.uid())
  );
