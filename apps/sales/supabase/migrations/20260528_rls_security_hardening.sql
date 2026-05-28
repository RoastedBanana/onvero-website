-- Tenant-isolation hardening before the SmartParcel customer launch.
--
-- Context: the browser uses the anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY) and the
-- customer-facing `intelligence` app reaches data only through service-role API
-- routes. None of the objects below are queried directly from the browser, so
-- locking them down to service_role has no app impact.

-- 1) Tables that had RLS disabled → reachable directly via the anon key (incl.
--    lead_chat_status, which the advisor flagged for exposing sensitive columns).
--    Enabling RLS with no policy denies anon/authenticated; service_role bypasses.
alter table public.lead_chat_status     enable row level security;
alter table public.lead_daily_stats     enable row level security;
alter table public.lead_run_executions  enable row level security;

-- 2) Two policies were granted to role `public` with USING(true)/WITH CHECK(true)
--    despite being named "Service role full access" — this let any anon key
--    read/write/delete every tenant's rows. Replace with service_role-only,
--    matching the convention used across the rest of the schema.
drop policy if exists "Service role full access on discovery_cursors" on public.discovery_cursors;
create policy "service_role_all" on public.discovery_cursors
  for all to service_role using (true) with check (true);

drop policy if exists "Service role full access on potential_leads" on public.potential_leads;
create policy "service_role_all" on public.potential_leads
  for all to service_role using (true) with check (true);

-- 3) SECURITY DEFINER views bypass the caller's RLS. Make them run as the caller
--    (service_role still bypasses; anon is bound by the underlying tables' RLS).
--    credit_usage_summary already had security_invoker = on.
alter view public.v_tenant_lead_stats set (security_invoker = on);
alter view public.seo_llm_context     set (security_invoker = on);
