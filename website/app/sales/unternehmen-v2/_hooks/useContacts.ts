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
      const { data, error: e } = await sb()
        .from('lead_contacts')
        .select('*')
        .eq('lead_id', leadId)
        .eq('tenant_id', t)
        .order('is_primary', { ascending: false, nullsFirst: false })
        .order('decision_maker_score', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: true });
      if (e) {
        setError(e.message);
        setLoading(false);
        return;
      }
      setContacts((data ?? []) as Contact[]);
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
