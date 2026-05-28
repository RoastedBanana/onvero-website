-- Fix lead deletion: leads referenced by these tables could not be deleted because
-- their FK delete_rule was NO ACTION. The DELETE API then 500'd and the lead
-- reappeared on reload. Align the rules with the rest of the lead-related FKs.

-- potential_leads.promoted_lead_id (nullable) -> SET NULL: the potential lead
-- simply becomes "not promoted" again when its promoted lead is deleted.
ALTER TABLE public.potential_leads
  DROP CONSTRAINT potential_leads_promoted_lead_id_fkey,
  ADD CONSTRAINT potential_leads_promoted_lead_id_fkey
    FOREIGN KEY (promoted_lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;

-- unassigned_emails.assigned_to_lead_id (nullable) -> SET NULL: the email
-- becomes unassigned again when the lead it was assigned to is deleted.
ALTER TABLE public.unassigned_emails
  DROP CONSTRAINT unassigned_emails_assigned_to_lead_id_fkey,
  ADD CONSTRAINT unassigned_emails_assigned_to_lead_id_fkey
    FOREIGN KEY (assigned_to_lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;

-- email_threads.lead_id (NOT NULL) -> CASCADE: a thread belongs to its lead,
-- so it is removed together with the lead.
ALTER TABLE public.email_threads
  DROP CONSTRAINT email_threads_lead_id_fkey,
  ADD CONSTRAINT email_threads_lead_id_fkey
    FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;
