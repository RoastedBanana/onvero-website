'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Zap, FileText } from 'lucide-react';
import UniqueLoading from '@/components/ui/grid-loading';
import { getCsrfToken } from '@/lib/csrf';
import { createBrowserClient } from '@supabase/ssr';

function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

// ── GeneratorModal helpers ────────────────────────────────────────────────────

const CHIP_SUGGESTIONS: Record<string, string[]> = {
  Branche: [
    'Immobilien',
    'Produktion',
    'Handel',
    'IT & Software',
    'Bau & Handwerk',
    'Beratung',
    'Finanzen',
    'Gesundheit',
    'Logistik',
    'Automotive',
    'Marketing',
    'Gastronomie',
  ],
  Position: [
    'Geschäftsführer',
    'CEO',
    'COO',
    'CTO',
    'CFO',
    'Inhaber',
    'Managing Director',
    'Head of Operations',
    'IT-Leiter',
    'Vertriebsleiter',
    'Marketingleiter',
  ],
  Technologie: [
    'SAP',
    'Salesforce',
    'HubSpot',
    'Shopify',
    'Microsoft 365',
    'Slack',
    'Zoom',
    'Jira',
    'Notion',
    'Pipedrive',
    'Zoho',
    'Mailchimp',
  ],
  Stadt: [
    'Hamburg',
    'München',
    'Berlin',
    'Frankfurt',
    'Köln',
    'Stuttgart',
    'Düsseldorf',
    'Dresden',
    'Leipzig',
    'Hannover',
    'Wien',
    'Zürich',
  ],
  Keyword: [
    'Automatisierung',
    'Digitalisierung',
    'Prozessoptimierung',
    'Wachstum',
    'Skalierung',
    'KI',
    'Effizienz',
    'Innovation',
  ],
};

function GChipInput({
  chips,
  onChange,
  placeholder,
  suggestionKey,
}: {
  chips: string[];
  onChange: (c: string[]) => void;
  placeholder: string;
  suggestionKey?: string;
}) {
  const [val, setVal] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const add = (v?: string) => {
    const t = (v ?? val).trim();
    if (t && !chips.includes(t)) onChange([...chips, t]);
    setVal('');
    setShowSuggestions(false);
  };
  const suggestions = suggestionKey ? (CHIP_SUGGESTIONS[suggestionKey] ?? []) : [];
  const filtered = suggestions.filter(
    (s) => !chips.includes(s) && (!val || s.toLowerCase().includes(val.toLowerCase()))
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: chips.length ? '0.5rem' : 0 }}>
        {chips.map((c) => (
          <span
            key={c}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              background: 'rgba(107,122,255,0.12)',
              border: '1px solid rgba(107,122,255,0.25)',
              color: '#c4c8ff',
              borderRadius: 999,
              padding: '0.2rem 0.55rem',
              fontSize: '0.78rem',
            }}
          >
            {c}
            <button
              type="button"
              onClick={() => onChange(chips.filter((x) => x !== c))}
              style={{
                background: 'none',
                border: 'none',
                color: '#666',
                cursor: 'pointer',
                fontSize: '0.8rem',
                lineHeight: 1,
                padding: 0,
              }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        <input
          value={val}
          onChange={(e) => {
            setVal(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          style={{
            flex: 1,
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: 6,
            color: '#ccc',
            fontSize: '0.8rem',
            padding: '0.4rem 0.7rem',
            outline: 'none',
          }}
        />
        <button
          type="button"
          onClick={() => {
            if (val.trim()) add();
            else setShowSuggestions((s) => !s);
          }}
          style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            color: '#888',
            borderRadius: 6,
            padding: '0 0.75rem',
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          +
        </button>
      </div>
      {showSuggestions && filtered.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 10,
            marginTop: 4,
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: 6,
            maxHeight: 160,
            overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}
        >
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                color: '#ccc',
                fontSize: '0.79rem',
                padding: '0.45rem 0.75rem',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(107,122,255,0.12)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function GToggle({ on, onChange }: { on: boolean; onChange?: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange?.(!on)}
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        background: on ? '#6B7AFF' : '#2a2a2a',
        border: `1px solid ${on ? '#6B7AFF' : '#333'}`,
        cursor: onChange ? 'pointer' : 'default',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 2,
          left: on ? 17 : 2,
          width: 14,
          height: 14,
          borderRadius: 7,
          background: '#fff',
          transition: 'left 0.2s',
        }}
      />
    </div>
  );
}

function GSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: '0.68rem',
        fontWeight: 600,
        color: '#555',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: '0.65rem',
      }}
    >
      {children}
    </div>
  );
}

// ── GeneratorModal ─────────────────────────────────────────────────────────────

const INDUSTRY_LABELS: Record<string, string> = {
  retail: 'Handel',
  manufacturing: 'Produktion',
  professional_services: 'Beratung/Dienstleistung',
  real_estate: 'Immobilien',
  construction: 'Bau/Handwerk',
};
const SENIORITY_KEYS = ['c_suite', 'director', 'manager'] as const;
const DEPT_KEYS = ['operations', 'finance', 'information_technology'] as const;

type ProfileRow = {
  id: string;
  name: string;
  industries: string[] | null;
  employee_min: number | null;
  employee_max: number | null;
  technologies: string[] | null;
  job_titles: string[] | null;
  seniority_levels: string[] | null;
  departments: string[] | null;
  countries: string[] | null;
  cities: string[] | null;
  keywords: string[] | null;
  excluded_domains: string[] | null;
  max_leads_per_run: number | null;
  schedule_enabled: boolean | null;
  schedule_time: string | null;
  schedule_days: boolean[] | null;
  only_verified_emails: boolean | null;
};
type GeneratorRow = {
  used_searches: number | null;
  search_limit: number | null;
  reset_date: string | null;
  last_run_at: string | null;
  last_run_leads: number | null;
  total_leads_generated: number | null;
};

export function GeneratorModal({
  onClose,
  onGenerated,
  tenantId,
  supabase,
}: {
  onClose: () => void;
  onGenerated: (count: number) => void;
  tenantId: string | null;
  supabase: ReturnType<typeof createClient>;
}) {
  const [tab, setTab] = useState<'zielgruppe' | 'einstellungen' | 'verlauf'>('zielgruppe');
  const [showBanner, setShowBanner] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [generator, setGenerator] = useState<GeneratorRow | null>(null);
  const [savedLabel, setSavedLabel] = useState('');
  const [generating, setGenerating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Form state
  const [branchen, setBranchen] = useState<string[]>([]);
  const [empMin, setEmpMin] = useState(5);
  const [empMax, setEmpMax] = useState(250);
  const [techs, setTechs] = useState<string[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [seniority, setSeniority] = useState({ c_suite: true, director: true, manager: true });
  const [abteilungen, setAbteilungen] = useState({ operations: false, finance: false, information_technology: false });
  const [countries, setCountries] = useState<string[]>(['🇩🇪 Deutschland', '🇦🇹 Österreich', '🇨🇭 Schweiz']);
  const [cities, setCities] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [excludedDomains, setExcludedDomains] = useState<string[]>([]);
  const [domainsOpen, setDomainsOpen] = useState(false);
  const [leadCount, setLeadCount] = useState(10);
  const [scheduleOn, setScheduleOn] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('08:00');
  const [weekdays, setWeekdays] = useState([true, true, true, true, true, false, false]);
  const [onlyVerified, setOnlyVerified] = useState(true);

  const LS_KEY = 'onvero_lead_gen_filters';

  const applyFilters = (src: {
    industries?: string[];
    employee_min?: number;
    employee_max?: number;
    technologies?: string[];
    job_titles?: string[];
    countries?: string[];
    cities?: string[];
    keywords?: string[];
    excluded_domains?: string[];
    lead_count?: number;
  }) => {
    if (src.industries) setBranchen(src.industries);
    if (src.employee_min !== undefined) setEmpMin(src.employee_min);
    if (src.employee_max !== undefined) setEmpMax(src.employee_max);
    if (src.technologies) setTechs(src.technologies);
    if (src.job_titles) setPositions(src.job_titles);
    if (src.countries) setCountries(src.countries);
    if (src.cities) setCities(src.cities);
    if (src.keywords) setKeywords(src.keywords);
    if (src.excluded_domains) setExcludedDomains(src.excluded_domains);
    if (src.lead_count !== undefined) setLeadCount(src.lead_count);
  };

  // Load data on mount
  useEffect(() => {
    if (!tenantId) {
      setDataLoading(false);
      return;
    }
    (async () => {
      setDataLoading(true);
      const [genRes, profRes] = await Promise.all([
        supabase.from('tenant_lead_generator').select('*').eq('tenant_id', tenantId).single(),
        supabase
          .from('lead_search_profiles')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
      ]);
      if (genRes.data) setGenerator(genRes.data as GeneratorRow);
      if (profRes.data) {
        const p = profRes.data as ProfileRow;
        setProfile(p);
        // Try localStorage first, then DB values
        const cached = (() => {
          try {
            return JSON.parse(localStorage.getItem(LS_KEY) ?? '');
          } catch {
            return null;
          }
        })();
        if (cached) {
          applyFilters(cached);
        } else {
          setBranchen((p.industries ?? []).map((s) => INDUSTRY_LABELS[s] ?? s));
          setEmpMin(p.employee_min ?? 5);
          setEmpMax(p.employee_max ?? 250);
          setTechs(p.technologies ?? []);
          setPositions(p.job_titles ?? []);
          setCountries(p.countries ?? ['🇩🇪 Deutschland', '🇦🇹 Österreich', '🇨🇭 Schweiz']);
          setCities(p.cities ?? []);
          setKeywords(p.keywords ?? []);
          setExcludedDomains(p.excluded_domains ?? []);
          setLeadCount(Math.min(p.max_leads_per_run ?? 10, 25));
        }
        setSeniority({
          c_suite: (p.seniority_levels ?? []).includes('c_suite'),
          director: (p.seniority_levels ?? []).includes('director'),
          manager: (p.seniority_levels ?? []).includes('manager'),
        });
        setAbteilungen({
          operations: (p.departments ?? []).includes('operations'),
          finance: (p.departments ?? []).includes('finance'),
          information_technology: (p.departments ?? []).includes('information_technology'),
        });
        setScheduleOn(p.schedule_enabled ?? false);
        setScheduleTime(p.schedule_time ?? '08:00');
        setWeekdays(p.schedule_days ?? [true, true, true, true, true, false, false]);
        setOnlyVerified(p.only_verified_emails ?? true);
      }
      setDataLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, supabase]);

  const buildProfilePayload = () => ({
    industries: branchen,
    employee_min: empMin,
    employee_max: empMax,
    technologies: techs,
    job_titles: positions,
    seniority_levels: SENIORITY_KEYS.filter((k) => seniority[k]),
    departments: DEPT_KEYS.filter((k) => abteilungen[k]),
    countries,
    cities,
    keywords,
    excluded_domains: excludedDomains,
    max_leads_per_run: leadCount,
    schedule_enabled: scheduleOn,
    schedule_time: scheduleTime,
    schedule_days: weekdays,
    only_verified_emails: onlyVerified,
  });

  const saveProfile = async () => {
    if (!profile?.id || !tenantId) return;
    await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/patch-search-profile?id=${profile.id}&tenant_id=${tenantId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(buildProfilePayload()),
      }
    );
    setSavedLabel('Gespeichert ✓');
    setTimeout(() => setSavedLabel(''), 2500);
  };

  const persistToLS = () => {
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({
          industries: branchen,
          employee_min: empMin,
          employee_max: empMax,
          technologies: techs,
          job_titles: positions,
          countries,
          cities,
          keywords,
          excluded_domains: excludedDomains,
          lead_count: leadCount,
        })
      );
    } catch {
      /* quota */
    }
  };

  const triggerDebounce = () => {
    persistToLS();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(saveProfile, 2000);
  };

  const used = generator?.used_searches ?? 0;
  const limit = generator?.search_limit ?? 1000;
  const pct = Math.round((used / limit) * 100);
  const remaining = limit - used;
  const budgetEmpty = remaining <= 0;

  const handleGenerate = async () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setGenerating(true);
    await saveProfile();
    try {
      const res = await fetch('/api/leads/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrfToken() },
        body: JSON.stringify({ tenant_id: tenantId, profile_id: profile?.id }),
      });
      if (res.ok) {
        onGenerated(leadCount);
        onClose();
      }
    } catch {
      /* silent — toast will still show */
    } finally {
      setGenerating(false);
    }
  };

  const TABS = [
    { key: 'zielgruppe', label: 'Zielgruppe' },
    { key: 'einstellungen', label: 'Einstellungen' },
    { key: 'verlauf', label: 'Verlauf' },
  ] as const;

  const SkeletonBar = ({ w = '100%', h = 12 }: { w?: string; h?: number }) => (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 4,
        background: 'linear-gradient(90deg,#1e1e1e 25%,#272727 50%,#1e1e1e 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite',
      }}
    />
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div
        style={{
          background: '#141414',
          border: '1px solid #222',
          borderRadius: 8,
          width: 580,
          maxWidth: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── STICKY HEADER ── */}
        <div style={{ padding: '1.25rem 1.5rem 0', borderBottom: '1px solid #1f1f1f', flexShrink: 0 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '0.15rem',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <Zap size={15} strokeWidth={2.5} /> Lead Generator
              </div>
              <div style={{ fontSize: '0.78rem', color: '#555', marginTop: '0.1rem' }}>
                Neue qualifizierte Leads automatisch finden
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#444',
                cursor: 'pointer',
                fontSize: '1.3rem',
                lineHeight: 1,
                padding: 0,
                marginTop: '0.1rem',
              }}
            >
              ×
            </button>
          </div>

          {/* Budget bar */}
          <div style={{ margin: '0.9rem 0 0.75rem' }}>
            {dataLoading ? (
              <>
                <SkeletonBar w="60%" h={10} />
                <div style={{ marginTop: '0.4rem' }}>
                  <SkeletonBar h={5} />
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.74rem',
                    color: '#555',
                    marginBottom: '0.35rem',
                  }}
                >
                  <span style={{ color: budgetEmpty ? '#f87171' : '#888' }}>
                    {used.toLocaleString('de-DE')} / {limit.toLocaleString('de-DE')} Searches diesen Monat
                  </span>
                  {generator?.reset_date && (
                    <span style={{ color: '#444' }}>
                      Reset am{' '}
                      {new Date(generator.reset_date).toLocaleDateString('de-DE', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
                <div style={{ height: 5, borderRadius: 3, background: '#222' }}>
                  <div
                    style={{
                      height: '100%',
                      borderRadius: 3,
                      width: `${Math.min(pct, 100)}%`,
                      background: budgetEmpty ? '#f87171' : 'linear-gradient(90deg,#6B7AFF,#818cf8)',
                    }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0 }}>
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${tab === t.key ? '#6B7AFF' : 'transparent'}`,
                  color: tab === t.key ? '#fff' : '#555',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: tab === t.key ? 600 : 400,
                  padding: '0.5rem 1rem 0.6rem',
                  transition: 'all 0.15s',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
          {/* No profile state */}
          {!dataLoading && !profile && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                padding: '3rem 1rem',
                color: '#555',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '1.2rem', color: '#444' }}>
                <FileText size={28} strokeWidth={1.5} />
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Noch kein Suchprofil angelegt</div>
              <div style={{ fontSize: '0.78rem', color: '#444' }}>
                Erstelle ein Suchprofil in den Einstellungen, um den Lead Generator zu nutzen.
              </div>
            </div>
          )}

          {/* ═══ TAB 1: ZIELGRUPPE ═══ */}
          {tab === 'zielgruppe' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* AI Banner */}
              {showBanner && !dataLoading && profile && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    background: 'rgba(107,122,255,0.08)',
                    borderLeft: '3px solid #6B7AFF',
                    borderRadius: '0 6px 6px 0',
                    padding: '0.75rem 1rem',
                  }}
                >
                  <span style={{ fontSize: '0.8rem', color: '#a0a8ff', flex: 1, lineHeight: 1.5 }}>
                    <strong style={{ color: '#b4baff' }}>KI-Vorschlag</strong> — Diese Filter wurden basierend auf
                    deinen bisherigen Leads vorgeschlagen. Du kannst sie jederzeit anpassen.
                  </span>
                  <button
                    onClick={() => setShowBanner(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#444',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      lineHeight: 1,
                      padding: 0,
                      flexShrink: 0,
                    }}
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Skeleton */}
              {dataLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {[80, 120, 100].map((h, i) => (
                    <div key={i} style={{ background: '#1a1a1a', borderRadius: 6, padding: '1rem', height: h }}>
                      <SkeletonBar w="40%" h={10} />
                      <div style={{ marginTop: '0.85rem' }}>
                        <SkeletonBar h={28} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* UNTERNEHMEN */}
              {!dataLoading && profile && (
                <>
                  <div style={{ background: '#1a1a1a', borderRadius: 6, padding: '1rem' }}>
                    <GSectionLabel>Unternehmen</GSectionLabel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: '0.45rem' }}>Branchen</div>
                        <GChipInput
                          chips={branchen}
                          onChange={(v) => {
                            setBranchen(v);
                            triggerDebounce();
                          }}
                          placeholder="+ Branche hinzufügen"
                          suggestionKey="Branche"
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: '0.45rem' }}>
                          Mitarbeiter:{' '}
                          <span style={{ color: '#ccc' }}>
                            {empMin} bis {empMax}
                          </span>
                        </div>
                        <div style={{ position: 'relative', height: 24, margin: '0.25rem 0' }}>
                          <div
                            style={{
                              position: 'absolute',
                              top: '50%',
                              left: 0,
                              right: 0,
                              height: 4,
                              borderRadius: 2,
                              background: '#2a2a2a',
                              transform: 'translateY(-50%)',
                            }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              top: '50%',
                              height: 4,
                              borderRadius: 2,
                              background: '#6B7AFF',
                              transform: 'translateY(-50%)',
                              left: `${(empMin / 1000) * 100}%`,
                              right: `${((1000 - empMax) / 1000) * 100}%`,
                            }}
                          />
                          <input
                            type="range"
                            min={1}
                            max={1000}
                            value={empMin}
                            onChange={(e) => {
                              const v = +e.target.value;
                              if (v < empMax - 5) {
                                setEmpMin(v);
                                triggerDebounce();
                              }
                            }}
                            style={{
                              position: 'absolute',
                              inset: 0,
                              width: '100%',
                              opacity: 0,
                              cursor: 'pointer',
                              height: '100%',
                              zIndex: 2,
                            }}
                          />
                          <input
                            type="range"
                            min={1}
                            max={1000}
                            value={empMax}
                            onChange={(e) => {
                              const v = +e.target.value;
                              if (v > empMin + 5) {
                                setEmpMax(v);
                                triggerDebounce();
                              }
                            }}
                            style={{
                              position: 'absolute',
                              inset: 0,
                              width: '100%',
                              opacity: 0,
                              cursor: 'pointer',
                              height: '100%',
                              zIndex: 3,
                            }}
                          />
                          {[
                            { pct: (empMin / 1000) * 100, val: empMin },
                            { pct: (empMax / 1000) * 100, val: empMax },
                          ].map((h, i) => (
                            <div
                              key={i}
                              style={{
                                position: 'absolute',
                                top: '50%',
                                left: `${h.pct}%`,
                                transform: 'translate(-50%,-50%)',
                                width: 14,
                                height: 14,
                                borderRadius: 7,
                                background: '#fff',
                                border: '2px solid #6B7AFF',
                                zIndex: 4,
                                pointerEvents: 'none',
                              }}
                            >
                              <div
                                style={{
                                  position: 'absolute',
                                  bottom: '120%',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  fontSize: '0.65rem',
                                  color: '#aaa',
                                  whiteSpace: 'nowrap',
                                  background: '#1a1a1a',
                                  padding: '1px 4px',
                                  borderRadius: 3,
                                }}
                              >
                                {h.val}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.67rem',
                            color: '#444',
                            marginTop: '0.5rem',
                          }}
                        >
                          <span>1</span>
                          <span>1.000</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: '0.45rem' }}>
                          Technologien <span style={{ color: '#444' }}>(optional)</span>
                        </div>
                        <GChipInput
                          chips={techs}
                          onChange={(v) => {
                            setTechs(v);
                            triggerDebounce();
                          }}
                          placeholder="+ Technologie hinzufügen"
                          suggestionKey="Technologie"
                        />
                      </div>
                    </div>
                  </div>

                  {/* KONTAKTPERSON */}
                  <div style={{ background: '#1a1a1a', borderRadius: 6, padding: '1rem' }}>
                    <GSectionLabel>Kontaktperson</GSectionLabel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: '0.45rem' }}>
                          Position / Jobtitel
                        </div>
                        <GChipInput
                          chips={positions}
                          onChange={(v) => {
                            setPositions(v);
                            triggerDebounce();
                          }}
                          placeholder="+ Position hinzufügen"
                          suggestionKey="Position"
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: '0.5rem' }}>Seniority</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                          {(
                            [
                              ['c_suite', 'C-Level'],
                              ['director', 'Director'],
                              ['manager', 'Manager'],
                            ] as const
                          ).map(([k, label]) => (
                            <label
                              key={k}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                color: '#aaa',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={seniority[k]}
                                onChange={(e) => {
                                  setSeniority((s) => ({ ...s, [k]: e.target.checked }));
                                  triggerDebounce();
                                }}
                                style={{ accentColor: '#6B7AFF' }}
                              />
                              {label}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: '0.5rem' }}>Abteilung</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                          {(
                            [
                              ['operations', 'Operations'],
                              ['finance', 'Finanzen'],
                              ['information_technology', 'IT'],
                            ] as const
                          ).map(([k, label]) => (
                            <label
                              key={k}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                color: '#aaa',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={abteilungen[k]}
                                onChange={(e) => {
                                  setAbteilungen((a) => ({ ...a, [k]: e.target.checked }));
                                  triggerDebounce();
                                }}
                                style={{ accentColor: '#6B7AFF' }}
                              />
                              {label}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* GEOGRAFIE */}
                  <div style={{ background: '#1a1a1a', borderRadius: 6, padding: '1rem' }}>
                    <GSectionLabel>Geografie</GSectionLabel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: '0.45rem' }}>Länder</div>
                        <GChipInput
                          chips={countries}
                          onChange={(v) => {
                            setCountries(v);
                            triggerDebounce();
                          }}
                          placeholder="+ Land hinzufügen"
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: '0.45rem' }}>
                          Städte <span style={{ color: '#444' }}>(optional)</span>
                        </div>
                        <GChipInput
                          chips={cities}
                          onChange={(v) => {
                            setCities(v);
                            triggerDebounce();
                          }}
                          placeholder="+ Stadt hinzufügen"
                          suggestionKey="Stadt"
                        />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: '0.45rem' }}>
                          Keywords <span style={{ color: '#444' }}>(optional)</span>
                        </div>
                        <GChipInput
                          chips={keywords}
                          onChange={(v) => {
                            setKeywords(v);
                            triggerDebounce();
                          }}
                          placeholder="+ Keyword hinzufügen"
                          suggestionKey="Keyword"
                        />
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => setDomainsOpen((o) => !o)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#555',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.65rem',
                              display: 'inline-block',
                              transform: domainsOpen ? 'rotate(90deg)' : 'none',
                              transition: 'transform 0.2s',
                            }}
                          >
                            ▶
                          </span>
                          Domains ausschließen ({excludedDomains.length})
                        </button>
                        {domainsOpen && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <GChipInput
                              chips={excludedDomains}
                              onChange={(v) => {
                                setExcludedDomains(v);
                                triggerDebounce();
                              }}
                              placeholder="+ domain.de hinzufügen"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ═══ TAB 2: EINSTELLUNGEN ═══ */}
          {tab === 'einstellungen' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Anzahl Leads */}
              <div style={{ background: '#1a1a1a', borderRadius: 6, padding: '1rem' }}>
                <GSectionLabel>Anzahl Leads</GSectionLabel>
                <div style={{ fontSize: '0.82rem', color: '#888', marginBottom: '0.85rem' }}>
                  Wie viele Leads möchtest du generieren?{' '}
                  <span style={{ color: '#666' }}>(bis zu {leadCount} Leads)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    onClick={() => {
                      setLeadCount((c) => Math.max(1, c - 5));
                      triggerDebounce();
                    }}
                    style={{
                      width: 32,
                      height: 32,
                      background: '#222',
                      border: '1px solid #333',
                      color: '#ccc',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={25}
                    value={leadCount}
                    onChange={(e) => {
                      setLeadCount(Math.min(25, Math.max(1, +e.target.value)));
                      triggerDebounce();
                    }}
                    style={{
                      width: 64,
                      textAlign: 'center',
                      background: '#222',
                      border: '1px solid #333',
                      color: '#fff',
                      borderRadius: 6,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      padding: '0.35rem',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => {
                      setLeadCount((c) => Math.min(25, c + 5));
                      triggerDebounce();
                    }}
                    style={{
                      width: 32,
                      height: 32,
                      background: '#222',
                      border: '1px solid #333',
                      color: '#ccc',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    +
                  </button>
                </div>
                <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span style={{ fontSize: '0.73rem', color: '#444' }}>
                    Max. 25 pro Lauf · Apollo Basic: 50 Credits/Monat
                  </span>
                  <span style={{ fontSize: '0.73rem', color: '#444' }}>
                    Verbleibend diesen Monat: {remaining.toLocaleString('de-DE')} Searches
                  </span>
                </div>
              </div>

              {/* Zeitplan */}
              <div style={{ background: '#1a1a1a', borderRadius: 6, padding: '1rem' }}>
                <GSectionLabel>Zeitplan</GSectionLabel>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: scheduleOn ? '0.85rem' : 0,
                  }}
                >
                  <span style={{ fontSize: '0.82rem', color: '#aaa' }}>Täglich automatisch ausführen</span>
                  <GToggle
                    on={scheduleOn}
                    onChange={(v) => {
                      setScheduleOn(v);
                      triggerDebounce();
                    }}
                  />
                </div>
                {scheduleOn && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.78rem', color: '#666' }}>Uhrzeit</span>
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => {
                          setScheduleTime(e.target.value);
                          triggerDebounce();
                        }}
                        style={{
                          background: '#222',
                          border: '1px solid #333',
                          color: '#ccc',
                          borderRadius: 6,
                          fontSize: '0.82rem',
                          padding: '0.3rem 0.6rem',
                          outline: 'none',
                        }}
                      />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#555', marginBottom: '0.4rem' }}>Wochentage</div>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((d, i) => (
                          <button
                            key={d}
                            onClick={() => {
                              setWeekdays((w) => w.map((v, j) => (j === i ? !v : v)));
                              triggerDebounce();
                            }}
                            style={{
                              width: 34,
                              height: 28,
                              borderRadius: 5,
                              background: weekdays[i] ? 'rgba(107,122,255,0.2)' : '#222',
                              border: `1px solid ${weekdays[i] ? '#6B7AFF' : '#333'}`,
                              color: weekdays[i] ? '#a0a8ff' : '#555',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              fontWeight: weekdays[i] ? 600 : 400,
                            }}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Qualität */}
              <div style={{ background: '#1a1a1a', borderRadius: 6, padding: '1rem' }}>
                <GSectionLabel>Qualität</GSectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.82rem', color: '#aaa' }}>Nur verifizierte E-Mails</div>
                      <div style={{ fontSize: '0.73rem', color: '#555', marginTop: '0.15rem' }}>
                        Reduziert Menge, erhöht Qualität
                      </div>
                    </div>
                    <GToggle
                      on={onlyVerified}
                      onChange={(v) => {
                        setOnlyVerified(v);
                        triggerDebounce();
                      }}
                    />
                  </div>
                  <div
                    style={{
                      borderTop: '1px solid #222',
                      paddingTop: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.82rem', color: '#aaa' }}>Duplikate überspringen</div>
                      <div style={{ fontSize: '0.73rem', color: '#555', marginTop: '0.15rem' }}>
                        Bereits vorhandene Leads werden automatisch übersprungen
                      </div>
                    </div>
                    <GToggle on={true} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ TAB 3: VERLAUF ═══ */}
          {tab === 'verlauf' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {dataLoading ? (
                [1, 2].map((i) => (
                  <div key={i} style={{ background: '#1a1a1a', borderRadius: 6, padding: '0.85rem 1rem', height: 64 }}>
                    <SkeletonBar w="50%" h={10} />
                    <div style={{ marginTop: '0.5rem' }}>
                      <SkeletonBar w="70%" h={8} />
                    </div>
                  </div>
                ))
              ) : generator?.last_run_at ? (
                <div
                  style={{
                    background: '#1a1a1a',
                    borderRadius: 6,
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.82rem', color: '#ccc', fontWeight: 500, marginBottom: '0.25rem' }}>
                      {new Date(generator.last_run_at).toLocaleString('de-DE', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      Uhr
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#555' }}>
                      <span style={{ color: '#4ade80' }}>{generator.last_run_leads ?? 0} neu</span> generiert
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      background: 'rgba(74,222,128,0.1)',
                      color: '#4ade80',
                      borderRadius: 999,
                      padding: '2px 8px',
                      flexShrink: 0,
                    }}
                  >
                    Erfolgreich
                  </span>
                </div>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#444', fontSize: '0.82rem' }}>
                  Noch keine Läufe
                </div>
              )}
              {!dataLoading && (
                <div
                  style={{
                    marginTop: '0.25rem',
                    padding: '0.75rem 1rem',
                    background: '#1a1a1a',
                    borderRadius: 6,
                    fontSize: '0.8rem',
                    color: '#666',
                  }}
                >
                  Gesamt:{' '}
                  <strong style={{ color: '#ccc' }}>
                    {(generator?.total_leads_generated ?? 0).toLocaleString('de-DE')} neue Leads
                  </strong>{' '}
                  generiert
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── STICKY FOOTER ── */}
        <div style={{ borderTop: '1px solid #1f1f1f', padding: '0.9rem 1.5rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div style={{ minWidth: 0 }}>
              {dataLoading ? (
                <SkeletonBar w="160px" h={10} />
              ) : (
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: '#555',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Suchprofil: {profile?.name ?? '—'}
                  {savedLabel && <span style={{ color: '#4ade80', marginLeft: '0.5rem' }}>{savedLabel}</span>}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', flexShrink: 0 }}>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: '1px solid #2a2a2a',
                  color: '#777',
                  borderRadius: 6,
                  padding: '0.5rem 1rem',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                Abbrechen
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating || budgetEmpty || !profile}
                title={budgetEmpty ? 'Kein Budget mehr' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  background: generating || budgetEmpty || !profile ? '#1f1f1f' : '#fff',
                  color: generating || budgetEmpty || !profile ? '#555' : '#000',
                  border: 'none',
                  borderRadius: 6,
                  padding: '0.5rem 1.15rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: generating || budgetEmpty || !profile ? 'default' : 'pointer',
                }}
              >
                {generating ? (
                  <>
                    <UniqueLoading size="sm" /> Generiert…
                  </>
                ) : budgetEmpty ? (
                  'Kein Budget mehr'
                ) : (
                  <>
                    <Zap size={13} /> Jetzt generieren
                  </>
                )}
              </button>
            </div>
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.67rem', color: '#333', textAlign: 'center' }}>
            Apollo.io API · Webhook-Secret wird sicher übertragen
          </div>
        </div>
      </div>
    </div>
  );
}
