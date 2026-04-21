'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { Company, CompanyStatus } from '../_types';

// ─── SUPABASE CLIENT (reuse singleton from _use-leads if available) ─────────

let _supabase: ReturnType<typeof createBrowserClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  }
  return _supabase;
}

// ─── TENANT ID (same pattern as _use-leads.tsx) ────────────────────────────

let _cachedTenantId: string | null = typeof window !== 'undefined' ? sessionStorage.getItem('_tenantId') : null;
let _authPromise: Promise<string | null> | null = null;

function readSessionFromStorage(): { userId: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('-auth-token')) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        const session = Array.isArray(parsed) ? parsed[0] : parsed;
        if (session?.user?.id) return { userId: session.user.id };
      }
    }
  } catch {}
  return null;
}

function getTenantId(): Promise<string | null> {
  if (_cachedTenantId) return Promise.resolve(_cachedTenantId);
  if (_authPromise) return _authPromise;

  _authPromise = (async () => {
    try {
      const stored = readSessionFromStorage();
      if (stored) {
        const sb = getSupabase();
        const { data } = await sb.from('tenant_users').select('tenant_id').eq('user_id', stored.userId).single();
        _cachedTenantId = (data as { tenant_id: string } | null)?.tenant_id ?? null;
      }
      if (!_cachedTenantId) {
        const sb = getSupabase();
        const {
          data: { user },
        } = await sb.auth.getUser();
        if (!user) return null;
        const { data } = await sb.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();
        _cachedTenantId = (data as { tenant_id: string } | null)?.tenant_id ?? null;
      }
      if (_cachedTenantId && typeof window !== 'undefined') {
        sessionStorage.setItem('_tenantId', _cachedTenantId);
      }
      return _cachedTenantId;
    } catch (err) {
      console.error('[useCompanies] auth failed:', err);
      return null;
    } finally {
      _authPromise = null;
    }
  })();

  return _authPromise;
}

// ─── EXTENDED TYPE (with contact count) ─────────────────────────────────────

export type CompanyWithContacts = Company & { enriched_contacts_count: number };

// ─── HOOK ───────────────────────────────────────────────────────────────────

export function useCompanies() {
  const [companies, setCompanies] = useState<CompanyWithContacts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCompanies([]);
    try {
      const tid = await getTenantId();
      if (!tid) {
        setLoading(false);
        return;
      }

      const sb = getSupabase();

      // Columns used by the list view (avoids heavy jsonb like raw_apollo_organization)
      const LIST_COLS = [
        'id', 'tenant_id', 'company_name', 'website', 'city', 'country', 'industry',
        'status', 'source', 'fit_score', 'tier', 'is_excluded', 'created_at', 'updated_at',
        'logo_url', 'primary_domain', 'company_size', 'estimated_num_employees', 'founded_year',
        'summary', 'tags', 'strengths', 'concerns', 'next_action', 'ai_scored_at',
        'linkedin_url', 'company_description', 'target_customers',
      ].join(', ');

      const CHUNK_SIZE = 20;
      const MAX_LEADS = 200;

      // Helper: enrich a batch with contact counts and append to state
      async function loadChunk(from: number, to: number, isFirst: boolean) {
        const { data, error: queryError } = await sb
          .from('leads')
          .select(LIST_COLS)
          .eq('tenant_id', tid!)
          .order('fit_score', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .range(from, to);

        if (queryError) {
          console.error('[useCompanies] chunk error:', JSON.stringify(queryError), queryError);
          if (isFirst) setError(queryError.message || 'Unbekannter Fehler beim Laden der Unternehmen');
          return 0;
        }

        const rows = data ?? [];
        if (rows.length === 0) return 0;

        // Fetch contact counts for this chunk only
        const ids = rows.map((r: Record<string, unknown>) => r.id as string);
        const { data: contactRows } = await sb
          .from('lead_contacts')
          .select('lead_id')
          .in('lead_id', ids);
        const countByLead: Record<string, number> = {};
        (contactRows ?? []).forEach((row: { lead_id: string }) => {
          countByLead[row.lead_id] = (countByLead[row.lead_id] ?? 0) + 1;
        });

        const mapped: CompanyWithContacts[] = rows.map((row: Record<string, unknown>) => ({
          ...row,
          enriched_contacts_count: countByLead[row.id as string] ?? 0,
        } as CompanyWithContacts));

        // Append — user sees rows progressively
        setCompanies((prev) => [...prev, ...mapped]);

        // First chunk is enough to stop the skeleton; subsequent chunks append
        if (isFirst) setLoading(false);

        return rows.length;
      }

      // Load first chunk synchronously (user sees first 20 asap)
      const firstLen = await loadChunk(0, CHUNK_SIZE - 1, true);

      // If fewer than a full chunk returned, we're done
      if (firstLen < CHUNK_SIZE) {
        setLoading(false);
        return;
      }

      // Continue loading the rest in the background
      let offset = CHUNK_SIZE;
      while (offset < MAX_LEADS) {
        const got = await loadChunk(offset, offset + CHUNK_SIZE - 1, false);
        if (got < CHUNK_SIZE) break;
        offset += CHUNK_SIZE;
      }
    } catch (err) {
      console.error('[useCompanies] failed:', err);
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const updateStatus = useCallback(async (id: string, status: CompanyStatus) => {
    setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    try {
      const tid = await getTenantId();
      if (!tid) return;
      const sb = getSupabase();
      await sb.from('leads').update({ status }).eq('id', id).eq('tenant_id', tid);
    } catch (err) {
      console.error('[useCompanies] updateStatus failed:', err);
    }
  }, []);

  return { companies, loading, error, refetch: fetchCompanies, updateStatus };
}
