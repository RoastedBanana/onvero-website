'use client';

import { useState, useEffect } from 'react';
import { getSupabase, getCachedTenantId } from './_use-leads';

// ─── TYPES ───────────────────────────────────────────────────────────────────

export type Activity = {
  id: string;
  lead_id: string;
  tenant_id: string;
  type: string;
  title: string;
  content: string | null;
  created_at: string;
  company_name?: string;
  first_name?: string;
  last_name?: string;
};

// ─── TIMEOUT HELPER ─────────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)),
  ]);
}

// ─── HOOK: useActivities — fetches + subscribes to realtime ──────────────────

export function useActivities(leadId?: string) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);

  // Initial fetch — uses cached tenant ID (no extra auth call)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const tid = await getCachedTenantId();
        if (cancelled) return;
        setTenantId(tid);

        if (!tid) {
          setLoading(false);
          return;
        }

        const supabase = getSupabase();
        let query = supabase
          .from('lead_activities')
          .select('id, lead_id, tenant_id, type, title, content, created_at')
          .eq('tenant_id', tid)
          .order('created_at', { ascending: false })
          .limit(50);

        if (leadId) {
          query = query.eq('lead_id', leadId);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = (await withTimeout(query, 8000)) as { data: any[] | null };

        if (!cancelled && data) {
          const leadIds = [...new Set(data.map((a: { lead_id: string }) => a.lead_id))];

          let leadMap = new Map<string, { id: string; company_name: string; first_name: string; last_name: string }>();
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: leads } = (await withTimeout(
              supabase.from('leads').select('id, company_name, first_name, last_name').in('id', leadIds),
              5000
            )) as { data: any[] | null };
            type LeadInfo = { id: string; company_name: string; first_name: string; last_name: string };
            leadMap = new Map((leads ?? []).map((l: LeadInfo) => [l.id, l]));
          } catch {
            // Enrichment failed — show activities without lead names
          }

          const enriched: Activity[] = data.map((a: Activity) => ({
            ...a,
            company_name: leadMap.get(a.lead_id)?.company_name,
            first_name: leadMap.get(a.lead_id)?.first_name,
            last_name: leadMap.get(a.lead_id)?.last_name,
          }));

          setActivities(enriched);
        }
      } catch (err) {
        console.error('[useActivities] fetch failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [leadId]);

  // NOTE: Realtime disabled — Supabase Realtime WebSocket causes a Web Locks
  // deadlock (supabase-js #2013) that freezes the entire app after ~3 minutes.
  // Activities are loaded fresh on each page visit instead.

  return { activities, loading, tenantId };
}

// ─── WRITE ACTIVITY ──────────────────────────────────────────────────────────

export async function writeActivity(leadId: string, type: string, title: string, content?: string | null) {
  try {
    const supabase = getSupabase();
    const tid = await getCachedTenantId();
    if (!tid) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from('lead_activities').insert({
      lead_id: leadId,
      tenant_id: tid,
      user_id: user?.id ?? null,
      type,
      title,
      content: content ?? null,
    });
  } catch (err) {
    console.error('[writeActivity] failed:', err);
  }
}

// ─── UPDATE LEAD STATUS (DB + Activity) ──────────────────────────────────────

const STATUS_MAP: Record<string, string> = {
  Neu: 'new',
  'In Kontakt': 'contacted',
  Qualifiziert: 'qualified',
  Verloren: 'lost',
};

export async function updateLeadStatus(leadId: string, oldStatus: string, newStatus: string) {
  try {
    const dbStatus = STATUS_MAP[newStatus] ?? 'new';

    // Use API route (server-side Supabase client) to avoid RLS/Web Locks issues
    const res = await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: dbStatus }),
    });

    if (!res.ok) {
      // Fallback: try direct Supabase client
      const supabase = getSupabase();
      const tid = await getCachedTenantId();
      if (tid) {
        await supabase.from('leads').update({ status: dbStatus }).eq('id', leadId).eq('tenant_id', tid);
      }
    }

    await writeActivity(leadId, 'status_change', `Status geändert: ${oldStatus} → ${newStatus}`);
  } catch (err) {
    console.error('[updateLeadStatus] failed:', err);
  }
}

// ─── ACTIVITY TYPE STYLING ───────────────────────────────────────────────────

export function getActivityStyle(type: string): { color: string; icon: string } {
  switch (type) {
    case 'status_change':
      return { color: '#818CF8', icon: 'M9 5l7 7-7 7' };
    case 'email_sent':
      return {
        color: '#34D399',
        icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      };
    case 'email_draft':
      return {
        color: '#A78BFA',
        icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      };
    case 'note_added':
      return {
        color: '#FBBF24',
        icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      };
    case 'score_update':
      return {
        color: '#38BDF8',
        icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
      };
    case 'lead_created':
      return { color: '#818CF8', icon: 'M12 4v16m8-8H4' };
    case 'meeting_scheduled':
      return {
        color: '#38BDF8',
        icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      };
    case 'outreach_generated':
      return { color: '#A78BFA', icon: 'M13 10V3L4 14h7v7l9-11h-7z' };
    default:
      return { color: '#4E5170', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' };
  }
}

// ─── FORMAT TIME ─────────────────────────────────────────────────────────────

export function formatActivityTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'gerade eben';
  if (diffMin < 60) return `vor ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `vor ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'gestern';
  if (diffD < 7) return `vor ${diffD} Tagen`;
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
}
