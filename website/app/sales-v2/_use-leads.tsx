'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Lead } from './_lead-data';

// ─── SUPABASE CLIENT ─────────────────────────────────────────────────────────

let _supabase: ReturnType<typeof createBrowserClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  }
  return _supabase;
}

// ─── STATUS MAPPING ──────────────────────────────────────────────────────────

function mapStatus(s: string | null): Lead['status'] {
  if (s === 'contacted') return 'In Kontakt';
  if (s === 'qualified') return 'Qualifiziert';
  if (s === 'lost') return 'Verloren';
  return 'Neu';
}

function guessIndustry(tags: string[] | null, summary: string | null, company: string): string {
  const text = `${(tags ?? []).join(' ')} ${summary ?? ''} ${company}`.toLowerCase();
  if (text.includes('fashion') || text.includes('mode') || text.includes('frauenmode') || text.includes('korsett'))
    return 'Fashion / eCommerce';
  if (text.includes('elektro') || text.includes('werkzeug')) return 'Elektrotechnik';
  if (text.includes('lebensmittel') || text.includes('food')) return 'Lebensmittel';
  if (text.includes('medien') || text.includes('druck')) return 'Medien / Druck';
  if (text.includes('industrie') || text.includes('metall') || text.includes('maschinen')) return 'Industrie';
  if (text.includes('b2b')) return 'B2B Distribution';
  if (text.includes('optik') || text.includes('brillen')) return 'Optik';
  if (text.includes('logistik') || text.includes('versand')) return 'Logistik';
  return 'Sonstige';
}

function formatEmployees(count: number | null): string {
  if (!count) return 'Unbekannt';
  if (count < 20) return '1–20';
  if (count < 50) return '20–50';
  if (count < 200) return '50–200';
  if (count < 500) return '200–500';
  if (count < 1000) return '500–1.000';
  return '1.000+';
}

// ─── TRANSFORM DB ROW TO LEAD ────────────────────────────────────────────────

type DbLead = Record<string, unknown>;

function dbToLead(r: DbLead): Lead {
  const cf = (r.custom_fields ?? {}) as Record<string, unknown>;
  const empCount = cf.employee_count ? Number(cf.employee_count) : null;
  const score = r.score as number | null;
  const firstName = r.first_name as string;
  const lastName = r.last_name as string;
  const company = r.company_name as string;
  const aiTags = (r.ai_tags as string[] | null) ?? [];
  const aiSummary = r.ai_summary as string | null;
  const createdAt = r.created_at as string;
  const lastContacted = r.last_contacted_at as string | null;

  return {
    id: r.id as string,
    name: `${firstName} ${lastName}`,
    firstName,
    lastName,
    company,
    email: r.email as string | null,
    phone: r.phone as string | null,
    city: (r.city as string | null) ?? '',
    country: r.country as string | null,
    score,
    status: mapStatus(r.status as string),
    lastActivity: lastContacted
      ? `Kontaktiert ${new Date(lastContacted).toLocaleDateString('de-DE')}`
      : timeAgo(createdAt),
    industry: guessIndustry(aiTags, aiSummary, company),
    industryApollo: (cf.industry as string) ?? null,
    employees: formatEmployees(empCount),
    employeeCount: empCount,
    website: r.website as string | null,
    jobTitle: (cf.job_title as string) ?? null,
    linkedinUrl: (cf.linkedin_url as string)?.replace('http://', 'https://') ?? null,
    emailStatus: (cf.email_status as string) ?? null,
    aiSummary,
    aiTags,
    emailDraftSubject: r.email_draft_subject as string | null,
    emailDraftBody: r.email_draft_body as string | null,
    nextAction: r.ai_next_action as string | null,
    createdAt: new Date(createdAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }),
    lastContactedAt: lastContacted ? new Date(lastContacted).toLocaleDateString('de-DE') : null,
    followUpAt: null,
    source: (r.source as string) ?? 'Unbekannt',
    googleRating: r.google_rating as number | null,
    googleReviews: (r.google_reviews as number) ?? 0,
    googleMapsUrl: r.google_maps_url as string | null,
    scoreBreakdown: score
      ? [
          { label: 'Firmenprofil', value: Math.round(score * 0.3), max: 30 },
          { label: 'Entscheider-Level', value: Math.round(score * 0.2), max: 20 },
          { label: 'Branchenfit', value: Math.round(score * 0.25), max: 25 },
          { label: 'Versand-Signale', value: Math.round(score * 0.25), max: 25 },
        ]
      : [],
    notes: [],
    timeline: [],
  };
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffH = Math.floor((now.getTime() - d.getTime()) / 3600000);
  if (diffH < 1) return 'gerade eben';
  if (diffH < 24) return `vor ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'vor 1 Tag';
  if (diffD < 7) return `vor ${diffD} Tagen`;
  return `vor ${Math.floor(diffD / 7)} Woche${Math.floor(diffD / 7) > 1 ? 'n' : ''}`;
}

// ─── HOOK: useLeads — live from Supabase with Realtime ───────────────────────

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);

  // Initial fetch
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = getSupabase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) {
        setLoading(false);
        return;
      }

      const { data: tu } = await supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single();

      const tid = tu?.tenant_id;
      if (!tid || cancelled) {
        setLoading(false);
        return;
      }
      setTenantId(tid);

      const { data } = await supabase
        .from('leads')
        .select('*')
        .eq('tenant_id', tid)
        .order('score', { ascending: false, nullsFirst: false })
        .limit(200);

      if (!cancelled && data) {
        setLeads(data.map((r: DbLead) => dbToLead(r)));
      }
      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Realtime: listen for UPDATE on leads table
  useEffect(() => {
    if (!tenantId) return;

    const supabase = getSupabase();
    let channel: RealtimeChannel;

    channel = supabase
      .channel(`leads-${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload: { eventType: string; new: DbLead; old: { id?: string } }) => {
          if (payload.eventType === 'UPDATE') {
            const updated = dbToLead(payload.new);
            setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
          } else if (payload.eventType === 'INSERT') {
            const newLead = dbToLead(payload.new);
            setLeads((prev) => [newLead, ...prev]);
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            setLeads((prev) => prev.filter((l) => l.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId]);

  return { leads, loading, tenantId };
}
