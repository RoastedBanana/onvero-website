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

    // Select only columns actually used by the UI (avoids heavy jsonb fields)
    const LEADS_COLUMNS = [
      'id', 'tenant_id', 'company_name', 'phone', 'website', 'city', 'country',
      'status', 'source', 'ai_scored_at', 'created_at', 'updated_at',
      'apollo_organization_id', 'fit_score', 'is_excluded',
      'tags', 'company_size', 'company_type', 'industry', 'summary',
      'strengths', 'concerns', 'next_action', 'linkedin_url', 'twitter_url',
      'facebook_url', 'logo_url', 'primary_domain', 'founded_year',
      'estimated_num_employees', 'annual_revenue_printed', 'apollo_industry',
      'apollo_keywords', 'apollo_short_description', 'technology_names',
      'company_description', 'core_services', 'target_customers', 'pain_points',
      'automation_potential', 'tech_stack', 'growth_signals', 'company_size_signals',
      'tone_of_voice', 'usp', 'personalization_hooks', 'automation_opportunities',
      'website_highlights', 'partner_customer_urls', 'cloudflare_blocked',
      'website_scraped_at', 'tier', 'follow_up_context',
    ].join(', ');

    const result = (await withTimeout(
      supabase.from('leads').select(LEADS_COLUMNS).eq('tenant_id', tid).order('created_at', { ascending: false }).limit(200),
      30000
    )) as { data: DbLead[] | null; error: { message: string } | null };

    if (result.error) {
      console.error('[useLeads] query failed:', result.error.message);
      setStore({ loading: false });
      return;
    }

    const data = result.data;
    if (data && data.length > 0) {
      console.log('[useLeads] columns:', Object.keys(data[0]));
      setStore({ leads: data.map((r: DbLead) => dbToLead(r)), loading: false });
    } else {
      console.warn('[useLeads] no leads found for tenant', tid);
      setStore({ leads: [], loading: false });
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseFollowUpContext(raw: any): Lead['followUpContext'] {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return null; }
  }
  return raw as Lead['followUpContext'];
}

function dbToLead(r: DbLead): Lead {
  const company = (r.company_name as string) ?? '';
  const score = (r.total_score as number | null) ?? null;
  const createdAt = r.created_at as string;
  const empCount = r.estimated_num_employees ? Number(r.estimated_num_employees) : null;
  const industry = (r.industry as string) ?? '';

  const fitScore = r.fit_score as number | null;
  const contactScore = r.contact_quality_score as number | null;
  const decisionScore = r.decision_maker_score as number | null;

  return {
    id: r.id as string,
    company,
    phone: (r.phone as string) ?? null,
    city: (r.city as string | null) ?? '',
    country: r.country as string | null,
    score,
    status: mapStatus(r.status as string),
    lastActivity: timeAgo(createdAt),
    industry,
    industryApollo: (r.apollo_industry as string) ?? null,
    employees: (r.company_size as string) ?? formatEmployees(empCount),
    employeeCount: empCount,
    website: r.website as string | null,
    linkedinUrl: ((r.linkedin_url as string) ?? '')?.replace('http://', 'https://') || null,
    logoUrl: (r.logo_url as string) ?? null,
    primaryDomain: (r.primary_domain as string) ?? null,
    foundedYear: (r.founded_year as number) ?? null,
    annualRevenuePrinted: (r.annual_revenue_printed as string) ?? null,
    companySize: (r.company_size as string) ?? null,
    companyType: (r.company_type as string) ?? null,
    tier: (r.tier as string) ?? (score && score >= 70 ? 'Hot' : score && score >= 45 ? 'Warm' : 'Cold'),
    summary: (r.summary as string) ?? null,
    strengths: (r.strengths as string[]) ?? [],
    concerns: (r.concerns as string[]) ?? [],
    nextAction: (r.next_action as string) ?? null,
    tags: (r.tags as string[]) ?? [],
    technologyNames: (r.technology_names as string[]) ?? [],
    source: (r.source as string) ?? 'Unbekannt',
    createdAt: new Date(createdAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }),
    // Website deep research fields
    companyDescription: (r.company_description as string) ?? null,
    usp: (r.usp as string) ?? null,
    coreServices: (r.core_services as string[]) ?? null,
    targetCustomers: (r.target_customers as string) ?? null,
    painPoints: (r.pain_points as string[]) ?? null,
    automationPotential: (r.automation_potential as string) ?? null,
    automationOpportunities: (r.automation_opportunities as string[]) ?? null,
    growthSignals: (r.growth_signals as string[]) ?? null,
    companySizeSignals: (r.company_size_signals as string) ?? null,
    toneOfVoice: (r.tone_of_voice as string) ?? null,
    personalizationHooks: (r.personalization_hooks as string[]) ?? null,
    websiteHighlights: (r.website_highlights as string) ?? null,
    techStack: (r.tech_stack as string[]) ?? null,
    partnerCustomerUrls: (r.partner_customer_urls as string[]) ?? null,
    websiteScrapedAt: (r.website_scraped_at as string) ?? null,
    // Follow-up context
    followUpContext: parseFollowUpContext(r.follow_up_context),
    // Social links
    twitterUrl: (r.twitter_url as string) ?? null,
    facebookUrl: (r.facebook_url as string) ?? null,
    // Score breakdown
    fitScore: fitScore ?? null,
    contactQualityScore: contactScore ?? null,
    decisionMakerScore: decisionScore ?? null,
    scoreBreakdown: score
      ? [
          { label: 'Unternehmensfit', value: fitScore ?? Math.round(score * 0.4), max: 40 },
          { label: 'Kontaktqualität', value: contactScore ?? Math.round(score * 0.3), max: 30 },
          { label: 'Entscheider-Position', value: decisionScore ?? Math.round(score * 0.3), max: 30 },
        ]
      : [],
    isExcluded: (r.is_excluded as boolean) ?? false,
    exclusionReason: (r.exclusion_reason as string) ?? null,
    apolloOrganizationId: (r.apollo_organization_id as string) ?? null,
    name: company,
    // Legacy compat — empty defaults
    firstName: '',
    lastName: '',
    email: null,
    jobTitle: null,
    emailDraftSubject: null,
    emailDraftBody: null,
    emailDraft: null,
    googleRating: null,
    googleReviews: 0,
    googleMapsUrl: null,
    notes: [],
    timeline: [],
    employmentHistory: [],
    websiteData: null,
    organisation: null,
    aiSummary: (r.summary as string) ?? null,
    redFlags: [],
    buyingSignals: [],
    emailStatus: null,
    newsArticles: [],
    newsSignals: [],
    googleBusinessStatus: null,
    googleMapsSignals: [],
    googleMapsMatchedName: null,
    googleMapsMatchScore: null,
    aiTags: (r.tags as string[]) ?? [],
    statusUpdatedAt: null,
    lastContactedAt: null,
    hasNewsSignal: false,
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

/** Optimistically update a lead in the local store (instant UI, no re-fetch) */
export function updateLeadInStore(leadId: string, patch: Partial<Lead>) {
  _store = {
    ..._store,
    leads: _store.leads.map((l) => (l.id === leadId ? { ...l, ...patch } : l)),
  };
  _listeners.forEach((fn) => fn());
}
