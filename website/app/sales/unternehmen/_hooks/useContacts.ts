'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { Contact } from '../_types';

let _sb: ReturnType<typeof createBrowserClient> | null = null;
function sb() {
  if (!_sb)
    _sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  return _sb;
}

let _tid: string | null = typeof window !== 'undefined' ? sessionStorage.getItem('_tenantId') : null;

async function tid(): Promise<string | null> {
  if (_tid) return _tid;
  try {
    if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.includes('-auth-token')) {
          const s = JSON.parse(localStorage.getItem(k)!);
          const sess = Array.isArray(s) ? s[0] : s;
          if (sess?.user?.id) {
            const { data } = await sb().from('tenant_users').select('tenant_id').eq('user_id', sess.user.id).single();
            _tid = (data as { tenant_id: string } | null)?.tenant_id ?? null;
            if (_tid) sessionStorage.setItem('_tenantId', _tid);
            return _tid;
          }
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function useContacts(leadId: string) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const t = await tid();
      if (!t) {
        setLoading(false);
        return;
      }

      // Query both tables — legacy data lives in lead_contact_enrichments,
      // new pipeline data goes into lead_contacts. Merge and deduplicate by id.
      const [r1, r2] = await Promise.all([
        sb()
          .from('lead_contacts')
          .select('*')
          .eq('lead_id', leadId)
          .eq('tenant_id', t)
          .order('is_primary', { ascending: false, nullsFirst: false })
          .order('decision_maker_score', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: true }),
        sb()
          .from('lead_contact_enrichments')
          .select('*')
          .eq('lead_id', leadId)
          .order('created_at', { ascending: false }),
      ]);

      if (r1.error && r2.error) {
        setError(r1.error.message);
        setLoading(false);
        return;
      }

      const seen = new Set<string>();
      const merged: Contact[] = [];
      for (const row of [...(r1.data ?? []), ...(r2.data ?? [])]) {
        if (!seen.has(row.id)) {
          seen.add(row.id);
          merged.push(row as Contact);
        }
      }
      setContacts(merged);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  return { contacts, loading, error, refetch: fetch_ };
}
