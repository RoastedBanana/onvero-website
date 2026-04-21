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
    try {
      const tid = await getTenantId();
      if (!tid) {
        setLoading(false);
        return;
      }

      const sb = getSupabase();

      // Fetch leads with contact count via subquery
      const { data, error: queryError } = await sb
        .from('leads')
        .select('*, lead_contacts(count)')
        .eq('tenant_id', tid)
        .order('fit_score', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (queryError) {
        console.error('[useCompanies] query error:', queryError);
        setError(queryError.message);
        setLoading(false);
        return;
      }

      const mapped: CompanyWithContacts[] = (data ?? []).map((row: Record<string, unknown>) => {
        const contactArr = row.lead_contacts as { count: number }[] | undefined;
        const contactCount = contactArr?.[0]?.count ?? 0;
        const { lead_contacts: _, ...rest } = row;
        return { ...rest, enriched_contacts_count: contactCount } as CompanyWithContacts;
      });

      setCompanies(mapped);
    } catch (err) {
      console.error('[useCompanies] failed:', err);
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
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
