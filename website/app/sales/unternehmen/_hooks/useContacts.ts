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
      // new pipeline data goes into lead_contacts. Merge and deduplicate by apollo_person_id.
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

      // Dedup by apollo_person_id (same across both tables); prefer enrichment
      // (has email/phone/draft after the enrich step). Fall back to row.id if
      // apollo_person_id is missing.
      const byPerson = new Map<string, Contact>();
      const addRow = (row: Record<string, unknown>, source: 'contact' | 'enrichment') => {
        const c = row as unknown as Contact;
        const raw = (c.raw_apollo_person ?? (c as unknown as { raw_apollo_response?: Record<string, unknown> }).raw_apollo_response) as Record<string, unknown> | null;
        // Fall back to Apollo's obfuscated last_name if ours is missing
        if (!c.last_name && raw) {
          const obf = (raw['last_name_obfuscated'] ?? raw['last_name']) as string | null | undefined;
          if (obf) c.last_name = obf;
        }
        if (!c.full_name) {
          const full = [c.first_name, c.last_name].filter(Boolean).join(' ');
          if (full) c.full_name = full;
        }
        const key = (c.apollo_person_id && String(c.apollo_person_id)) || `id:${c.id}`;
        const existing = byPerson.get(key);
        if (!existing) {
          byPerson.set(key, c);
          return;
        }
        // Enrichment wins over contact (richer data), but merge missing fields from other side
        const preferred = source === 'enrichment' ? c : existing;
        const secondary = source === 'enrichment' ? existing : c;
        const merged = { ...secondary, ...preferred } as Contact;
        // Preserve non-null fields
        if (!merged.email) merged.email = secondary.email ?? preferred.email;
        if (!merged.phone) merged.phone = secondary.phone ?? preferred.phone;
        if (!merged.last_name) merged.last_name = secondary.last_name ?? preferred.last_name;
        if (!merged.full_name) merged.full_name = secondary.full_name ?? preferred.full_name;
        byPerson.set(key, merged);
      };

      (r1.data ?? []).forEach((row: Record<string, unknown>) => addRow(row, 'contact'));
      (r2.data ?? []).forEach((row: Record<string, unknown>) => addRow(row, 'enrichment'));

      setContacts(Array.from(byPerson.values()));
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
