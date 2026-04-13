'use client';

import { useState, useEffect, useSyncExternalStore, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { Lead } from './_lead-data';

// ─── SUPABASE CLIENT (singleton) ────────────────────────────────────────────

let _supabase: ReturnType<typeof createBrowserClient> | null = null;
export function getSupabase() {
  if (!_supabase) {
    _supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  }
  return _supabase;
}

// ─── TIMEOUT HELPER ─────────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)),
  ]);
}

// ─── CACHED AUTH + TENANT (deduplicated — only 1 call no matter how many hooks) ─

let _authPromise: Promise<string | null> | null = null;
let _cachedTenantId: string | null = null;

// Try to restore tenant ID from sessionStorage (survives page navigations)
if (typeof window !== 'undefined') {
  _cachedTenantId = sessionStorage.getItem('_tenantId');
}

// Read Supabase session directly from localStorage — bypasses Web Locks deadlock bug
// (supabase-js #2013, #2111). Never calls getSession() or getUser() which can hang.
export function readSessionFromStorage(): { userId: string; accessToken: string; email?: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    // Supabase stores session in localStorage as sb-<ref>-auth-token
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('-auth-token')) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        // Can be stored as array [session] or as object
        const session = Array.isArray(parsed) ? parsed[0] : parsed;
        if (session?.user?.id && session?.access_token) {
          return { userId: session.user.id, accessToken: session.access_token, email: session.user.email };
        }
      }
    }
  } catch {}
  return null;
}

export function getCachedTenantId(): Promise<string | null> {
  if (_cachedTenantId) return Promise.resolve(_cachedTenantId);
  if (_authPromise) return _authPromise;

  _authPromise = (async () => {
    try {
      // Fast path: read session directly from localStorage (no Web Locks, no network)
      const stored = readSessionFromStorage();
      if (stored) {
        const supabase = getSupabase();
        const { data: tu } = (await withTimeout(
          supabase.from('tenant_users').select('tenant_id').eq('user_id', stored.userId).single(),
          8000
        )) as { data: { tenant_id: string } | null };
        _cachedTenantId = tu?.tenant_id ?? null;
      }

      // Fallback: if no localStorage session, try getUser (with strict timeout)
      if (!_cachedTenantId) {
        const supabase = getSupabase();
        const {
          data: { user },
        } = (await withTimeout(supabase.auth.getUser(), 5000)) as {
          data: { user: { id: string } | null };
        };
        if (!user) return null;
        const { data: tu } = (await withTimeout(
          supabase.from('tenant_users').select('tenant_id').eq('user_id', user.id).single(),
          5000
        )) as { data: { tenant_id: string } | null };
        _cachedTenantId = tu?.tenant_id ?? null;
      }

      if (_cachedTenantId && typeof window !== 'undefined') {
        sessionStorage.setItem('_tenantId', _cachedTenantId);
      }
      return _cachedTenantId;
    } catch (err) {
      console.error('[auth] failed:', err);
      return null;
    } finally {
      _authPromise = null;
    }
  })();

  return _authPromise;
}

// ─── SHARED LEADS STORE (single fetch, all hooks subscribe) ─────────────────

type LeadsState = { leads: Lead[]; loading: boolean; tenantId: string | null };

let _store: LeadsState = { leads: [], loading: true, tenantId: null };
let _listeners = new Set<() => void>();
let _initialized = false;
function setStore(partial: Partial<LeadsState>) {
  _store = { ..._store, ...partial };
  _listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  _listeners.add(fn);
  // Initialize on first subscriber
  if (!_initialized) {
    _initialized = true;
    initLeadsStore();
  }
  return () => {
    _listeners.delete(fn);
  };
}

function getSnapshot(): LeadsState {
  return _store;
}

async function initLeadsStore() {
  try {
    const tid = await getCachedTenantId();
    if (!tid) {
      setStore({ loading: false });
      return;
    }
    setStore({ tenantId: tid });

    const supabase = getSupabase();
    const { data } = (await withTimeout(
      supabase
        .from('leads')
        .select(
          `id, company_name, first_name, last_name, email, phone,
           website, street, city, zip, country,
           status, score, source, notes, estimated_value,
           ai_summary, ai_tags, ai_next_action, ai_scored_at,
           email_draft_subject, email_draft_body,
           google_rating, google_reviews, google_maps_url,
           custom_fields, last_contacted_at, follow_up_at, created_at,
           employment_history, tenant_id`
        )
        .eq('tenant_id', tid)
        .order('score', { ascending: false, nullsFirst: false })
        .limit(200),
      10000
    )) as { data: DbLead[] | null };

    if (data) {
      setStore({ leads: data.map((r: DbLead) => dbToLead(r)), loading: false });
    } else {
      setStore({ loading: false });
    }

    // NOTE: Realtime disabled — Supabase Realtime WebSocket causes a Web Locks
    // deadlock (supabase-js #2013) that freezes the entire app after ~3 minutes.
    // Data is refreshed on navigation instead. Re-enable once supabase-js fixes the bug.
  } catch (err) {
    console.error('[useLeads] init failed:', err);
    setStore({ loading: false });
  }
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
    employmentHistory: ((r.employment_history as unknown[] | null) ?? []).map((e: unknown) => {
      const entry = e as Record<string, unknown>;
      return {
        title: (entry.title as string) ?? '',
        company: (entry.organization_name ?? entry.name ?? entry.company ?? '') as string,
        startDate: (entry.start_date ?? entry.startDate ?? null) as string | null,
        endDate: (entry.end_date ?? entry.endDate ?? null) as string | null,
        current: entry.current === true,
      };
    }),
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

// ─── HOOK: useLeads — shared store, single fetch ────────────────────────────

export function useLeads() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { leads: state.leads, loading: state.loading, tenantId: state.tenantId };
}

/** Re-fetch leads from Supabase and update the shared store */
export function refreshLeads() {
  _initialized = false;
  initLeadsStore();
}
