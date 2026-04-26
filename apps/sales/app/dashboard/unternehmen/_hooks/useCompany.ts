'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { Company, CompanyStatus } from '../_types';

let _sb: ReturnType<typeof createBrowserClient> | null = null;
function sb() {
  if (!_sb)
    _sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  return _sb;
}

let _tid: string | null = typeof window !== 'undefined' ? sessionStorage.getItem('_tenantId') : null;
let _p: Promise<string | null> | null = null;

function tid(): Promise<string | null> {
  if (_tid) return Promise.resolve(_tid);
  if (_p) return _p;
  _p = (async () => {
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
      const {
        data: { user },
      } = await sb().auth.getUser();
      if (!user) return null;
      const { data } = await sb().from('tenant_users').select('tenant_id').eq('user_id', user.id).single();
      _tid = (data as { tenant_id: string } | null)?.tenant_id ?? null;
      return _tid;
    } catch {
      return null;
    } finally {
      _p = null;
    }
  })();
  return _p;
}

export function useCompany(id: string) {
  const [company, setCompany] = useState<Company | null>(null);
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
      const { data, error: e } = await sb().from('leads').select('*').eq('id', id).eq('tenant_id', t).single();
      if (e) {
        setError(e.message);
        setLoading(false);
        return;
      }
      setCompany(data as Company);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  const updateStatus = useCallback(
    async (status: CompanyStatus) => {
      setCompany((prev) => (prev ? { ...prev, status } : prev));
      try {
        const t = await tid();
        if (!t) return;
        await sb().from('leads').update({ status }).eq('id', id).eq('tenant_id', t);
      } catch (e) {
        console.error('[useCompany] updateStatus failed:', e);
      }
    },
    [id]
  );

  return { company, loading, error, refetch: fetch_, updateStatus };
}
