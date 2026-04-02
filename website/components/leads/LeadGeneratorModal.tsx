'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

const TENANT_ID = 'df763f85-c687-42d6-be66-a2b353b89c90';

const INDUSTRY_OPTIONS = [
  { value: 'manufacturing', label: 'Fertigung' },
  { value: 'software', label: 'Software' },
  { value: 'healthcare', label: 'Gesundheit' },
  { value: 'construction', label: 'Bau' },
  { value: 'finance', label: 'Finanzen' },
  { value: 'logistics', label: 'Logistik' },
  { value: 'retail', label: 'Handel' },
  { value: 'real_estate', label: 'Immobilien' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'information_technology', label: 'IT-Services' },
  { value: 'consulting', label: 'Beratung' },
  { value: 'hospitality', label: 'Gastgewerbe' },
];

const COUNTRY_OPTIONS = ['DE', 'AT', 'CH'];

const STEPS = [
  { icon: '🔍', label: 'Apollo durchsuchen' },
  { icon: '✓', label: 'Duplikate prüfen' },
  { icon: '🌐', label: 'Websites analysieren' },
  { icon: '🤖', label: 'KI bewertet Leads' },
];

const CSS = `
@keyframes pulse-ring{0%,100%{box-shadow:0 0 0 0 rgba(107,122,255,0.4)}50%{box-shadow:0 0 0 14px rgba(107,122,255,0)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
`;

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface Profile {
  id: string;
  industries: string[];
  min_employees: number;
  max_employees: number;
  job_titles: string[];
  countries: string[];
  keywords: string[];
  cities: string[];
  excluded_keywords: string[];
  max_leads_per_run: number;
  last_run_at: string | null;
  total_leads_found: number | null;
}

type Phase = 'config' | 'running' | 'done' | 'error';
type GeneratorMode = 'select' | 'apollo' | 'google_maps';

export default function LeadGeneratorModal({ isOpen, onClose }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<GeneratorMode>('select');
  const [phase, setPhase] = useState<Phase>('config');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Google Maps state
  const [mapsSearchTerms, setMapsSearchTerms] = useState('');
  const [mapsMaxResults, setMapsMaxResults] = useState(50);
  const [mapsLoading, setMapsLoading] = useState(false);
  const [mapsSuccess, setMapsSuccess] = useState(false);
  const [mapsMinRating, setMapsMinRating] = useState<number | null>(null);
  const [mapsMinReviews, setMapsMinReviews] = useState<number | null>(null);
  const [mapsWebsiteFilter, setMapsWebsiteFilter] = useState<string | null>(null);
  const [mapsBusinessStatus, setMapsBusinessStatus] = useState<string | null>('operational');
  const [mapsCountry, setMapsCountry] = useState<string | null>('de');

  // Config fields
  const [industries, setIndustries] = useState<string[]>([]);
  const [minEmp, setMinEmp] = useState(10);
  const [maxEmp, setMaxEmp] = useState(500);
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [jobInput, setJobInput] = useState('');
  const [countries, setCountries] = useState<string[]>(['DE']);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [cityInput, setCityInput] = useState('');
  const [excludedKeywords, setExcludedKeywords] = useState<string[]>([]);
  const [excludedInput, setExcludedInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [leadsPerRun, setLeadsPerRun] = useState(10);

  // Running state
  const [currentStep, setCurrentStep] = useState(0);
  const [newLeadsFound, setNewLeadsFound] = useState(0);
  const [runningSeconds, setRunningSeconds] = useState(0);

  // Error state
  const [errorDetails, setErrorDetails] = useState<{ code: string; message: string } | null>(null);

  const timeHint = leadsPerRun <= 10 ? '~2 Minuten' : leadsPerRun <= 25 ? '~5 Minuten' : '~10 Minuten';

  // ── Load profile ──
  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('lead_search_profiles')
        .select('*')
        .eq('tenant_id', TENANT_ID)
        .eq('is_active', true)
        .single();
      if (data) {
        setProfile(data as Profile);
        setIndustries(data.industries ?? []);
        setMinEmp(data.min_employees ?? 10);
        setMaxEmp(data.max_employees ?? 500);
        setJobTitles(data.job_titles ?? []);
        setCountries(data.countries ?? ['DE']);
        setKeywords(data.keywords ?? []);
        setCities(data.cities ?? []);
        setExcludedKeywords(data.excluded_keywords ?? []);
        setLeadsPerRun(data.max_leads_per_run ?? 10);
      }
    } catch (e) {
      console.error('Profile load failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Reset on open ──
  useEffect(() => {
    if (isOpen) {
      setPhase('config');
      setShowAdvanced(false);
      setCurrentStep(0);
      setNewLeadsFound(0);
      setRunningSeconds(0);
      setErrorDetails(null);
      loadProfile();
    }
  }, [isOpen, loadProfile]);

  // ── Step animation during running ──
  useEffect(() => {
    if (phase !== 'running') return;
    setCurrentStep(0);
    const t = setInterval(() => {
      setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 8000);
    return () => clearInterval(t);
  }, [phase]);

  // ── Running seconds counter ──
  useEffect(() => {
    if (phase !== 'running') {
      setRunningSeconds(0);
      return;
    }
    const t = setInterval(() => setRunningSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  // ── Status polling: check for new leads every 15s ──
  useEffect(() => {
    if (phase !== 'running') return;
    let startCount = 0;
    const supabase = createClient();

    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', TENANT_ID)
      .then(({ count }) => {
        startCount = count ?? 0;
      });

    const interval = setInterval(async () => {
      const { count, error } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', TENANT_ID);
      if (error) return;
      const found = (count ?? 0) - startCount;
      if (found > 0) setNewLeadsFound(found);
    }, 15000);

    return () => clearInterval(interval);
  }, [phase]);

  // ── Close handler ──
  function handleClose() {
    const wasActive = phase === 'done' || phase === 'running';
    setPhase('config');
    setMode('select');
    setMapsSuccess(false);
    setMapsSearchTerms('');
    setMapsMaxResults(50);
    setMapsMinRating(null);
    setMapsMinReviews(null);
    setMapsWebsiteFilter(null);
    setMapsBusinessStatus('operational');
    setMapsCountry('de');
    setErrorDetails(null);
    setNewLeadsFound(0);
    setRunningSeconds(0);
    onClose();
    if (wasActive) router.refresh();
  }

  // ── Helpers ──
  function toggleIndustry(val: string) {
    setIndustries((prev) => (prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]));
  }
  function toggleCountry(val: string) {
    setCountries((prev) => (prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]));
  }
  function addPill(value: string, list: string[], setter: (v: string[]) => void) {
    const t = value.trim();
    if (t && !list.includes(t)) setter([...list, t]);
  }

  // ── Generate with error handling ──
  async function handleGenerate() {
    if (!profile) return;
    setPhase('running');
    setErrorDetails(null);
    setNewLeadsFound(0);
    setRunningSeconds(0);
    setCurrentStep(0);

    // Set localStorage with baseline count so banner tracks correctly
    try {
      const res = await fetch('/api/leads/count');
      const { count } = await res.json();
      localStorage.setItem(
        'vero_generator_running',
        JSON.stringify({
          startedAt: new Date().toISOString(),
          leadsTarget: Math.min(leadsPerRun, 25),
          baselineCount: count ?? 0,
        })
      );
    } catch {
      localStorage.setItem(
        'vero_generator_running',
        JSON.stringify({
          startedAt: new Date().toISOString(),
          leadsTarget: Math.min(leadsPerRun, 25),
          baselineCount: 0,
        })
      );
    }

    try {
      // 1. Save settings
      const supabase = createClient();
      await supabase
        .from('lead_search_profiles')
        .update({
          industries,
          min_employees: minEmp,
          max_employees: maxEmp,
          job_titles: jobTitles,
          countries,
          keywords,
          cities,
          excluded_keywords: excludedKeywords,
          max_leads_per_run: Math.min(leadsPerRun, 25),
        })
        .eq('id', profile.id);

      // 2. Call webhook with timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      let response: Response;
      try {
        response = await fetch('https://n8n.srv1223027.hstgr.cloud/webhook/lead-generator-run', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-webhook-secret': '59317c4c-217d-4046-93d8-15ea3e94dbb6',
          },
          body: JSON.stringify({ tenant_id: TENANT_ID, profile_id: profile.id }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      if (!response.ok) {
        const status = response.status;
        setErrorDetails({
          code: `HTTP_${status}`,
          message:
            status === 401
              ? 'Authentifizierung fehlgeschlagen (ungültiger API-Key)'
              : status === 404
                ? 'Webhook-URL nicht gefunden — n8n Workflow möglicherweise inaktiv'
                : status === 500
                  ? 'n8n Workflow-Fehler (interner Serverfehler)'
                  : status === 503
                    ? 'n8n Server nicht erreichbar (Service unavailable)'
                    : `Server antwortete mit Fehler ${status}`,
        });
        setPhase('error');
        return;
      }

      localStorage.removeItem('vero_generator_running');
      setTimeout(() => setPhase('done'), 800);
    } catch (err: unknown) {
      const error = err as Error & { name?: string };

      if (error.name === 'AbortError') {
        // Timeout — workflow may still be running (keep localStorage for banner)
        setTimeout(() => setPhase('done'), 500);
        return;
      }

      localStorage.removeItem('vero_generator_running');
      const isNetwork = error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError');
      setErrorDetails({
        code: isNetwork ? 'NETWORK_ERROR' : 'UNKNOWN_ERROR',
        message: isNetwork
          ? 'Netzwerkfehler — Verbindung zu n8n Server nicht möglich'
          : 'Unbekannter Fehler beim Starten des Generators',
      });
      setPhase('error');
    }
  }

  const lastRunText = profile?.last_run_at
    ? `Letzter Run: ${new Date(profile.last_run_at).toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })} · ${profile.total_leads_found ?? 0} gefunden`
    : 'Noch kein Run';

  if (!isOpen) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div
        onClick={handleClose}
        style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      />
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 61,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: mode === 'google_maps' ? 640 : 520,
            maxHeight: '85vh',
            background: '#111',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'var(--font-dm-sans)',
            pointerEvents: 'auto',
            overflow: 'hidden',
          }}
        >
          {/* ═══════════ MODE SELECT ═══════════ */}
          {phase === 'config' && mode === 'select' && (
            <div style={{ padding: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Lead Generator</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
                Wähle eine Quelle für neue Leads
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={() => setMode('apollo')}
                  style={{
                    background: 'rgba(139,92,246,0.06)',
                    border: '1px solid rgba(139,92,246,0.15)',
                    borderRadius: 10,
                    padding: '16px 18px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(139,92,246,0.12)';
                    e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(139,92,246,0.06)';
                    e.currentTarget.style.borderColor = 'rgba(139,92,246,0.15)';
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#8B5CF6', marginBottom: 4 }}>
                    ⚡ Apollo Outbound
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
                    B2B Entscheider über Apollo — CEO, GF, Inhaber
                  </div>
                </button>
                <button
                  onClick={() => setMode('google_maps')}
                  style={{
                    background: 'rgba(29,158,117,0.06)',
                    border: '1px solid rgba(29,158,117,0.15)',
                    borderRadius: 10,
                    padding: '16px 18px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(29,158,117,0.12)';
                    e.currentTarget.style.borderColor = 'rgba(29,158,117,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(29,158,117,0.06)';
                    e.currentTarget.style.borderColor = 'rgba(29,158,117,0.15)';
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1D9E75', marginBottom: 4 }}>📍 Google Maps</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
                    Lokale Betriebe für Website-Verkauf — Handwerk, Gastronomie, Einzelhandel
                  </div>
                </button>
              </div>
              <button
                onClick={handleClose}
                style={{
                  marginTop: 16,
                  width: '100%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: '8px',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                }}
              >
                Abbrechen
              </button>
            </div>
          )}

          {/* ═══════════ GOOGLE MAPS MODE ═══════════ */}
          {phase === 'config' && mode === 'google_maps' && (
            <div
              style={{ display: 'flex', flexDirection: 'column', maxHeight: 'calc(85vh - 2px)', overflow: 'hidden' }}
            >
              {/* Header */}
              <div
                style={{
                  padding: '16px 24px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <button
                  onClick={() => {
                    setMode('select');
                    setMapsSuccess(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    fontSize: 14,
                    padding: '2px 6px',
                  }}
                >
                  ←
                </button>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1D9E75' }}>📍 Google Maps Scraper</div>
              </div>

              {mapsSuccess ? (
                <div style={{ textAlign: 'center', padding: '40px 24px' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1D9E75', marginBottom: 4 }}>
                    Scraper gestartet
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Leads erscheinen in ~2 Minuten</div>
                  <button
                    onClick={handleClose}
                    style={{
                      marginTop: 16,
                      background: 'rgba(29,158,117,0.15)',
                      border: '1px solid rgba(29,158,117,0.2)',
                      borderRadius: 8,
                      padding: '8px 20px',
                      fontSize: 12,
                      color: '#1D9E75',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    Schließen
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    overflowY: 'auto',
                    padding: '16px 24px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  {/* ── Suchbegriffe ── */}
                  <div>
                    <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>
                      Suchbegriffe
                    </label>
                    <textarea
                      value={mapsSearchTerms}
                      onChange={(e) => setMapsSearchTerms(e.target.value)}
                      placeholder={'Maler Hamburg\nFriseur München\nBäcker Berlin'}
                      rows={3}
                      style={{
                        width: '100%',
                        background: '#0a0a0a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8,
                        padding: '10px 12px',
                        fontSize: 12,
                        color: '#fff',
                        resize: 'vertical',
                        outline: 'none',
                        fontFamily: 'var(--font-dm-sans)',
                      }}
                    />
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 3 }}>
                      Jede Zeile oder kommagetrennt = ein Suchauftrag
                    </div>
                  </div>

                  {/* ── Branchen-Shortcuts ── */}
                  <div>
                    <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }}>
                      Branchen-Shortcuts
                    </label>
                    {[
                      ['🔨 Maler', '⚡ Elektriker', '🔧 Klempner', '🪟 Schreiner', '🏠 Dachdecker'],
                      ['✂️ Friseur', '💆 Massage', '💅 Kosmetik', '🦷 Zahnarzt', '🏥 Arzt'],
                      ['🍕 Restaurant', '☕ Café', '🥐 Bäckerei', '🛍️ Einzelhandel', '🚗 Autowerkstatt'],
                    ].map((row, ri) => (
                      <div key={ri} style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
                        {row.map((chip) => {
                          const term = chip.replace(/^[^\s]+\s/, '');
                          return (
                            <button
                              key={chip}
                              onClick={() => {
                                const current = mapsSearchTerms.trim();
                                setMapsSearchTerms(current ? `${current}\n${term} ` : `${term} `);
                              }}
                              style={{
                                fontSize: 10,
                                padding: '3px 8px',
                                borderRadius: 12,
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                color: 'rgba(255,255,255,0.5)',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                whiteSpace: 'nowrap',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(29,158,117,0.1)';
                                e.currentTarget.style.borderColor = 'rgba(29,158,117,0.25)';
                                e.currentTarget.style.color = '#1D9E75';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                                e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                              }}
                            >
                              {chip}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* ── Ergebnis-Menge ── */}
                  <div>
                    <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>
                      Max. Ergebnisse pro Suchbegriff
                    </label>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[10, 25, 50, 100, 200].map((n) => (
                        <button
                          key={n}
                          onClick={() => setMapsMaxResults(n)}
                          style={{
                            flex: 1,
                            padding: '6px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: 'pointer',
                            border:
                              mapsMaxResults === n
                                ? '1px solid rgba(29,158,117,0.4)'
                                : '1px solid rgba(255,255,255,0.08)',
                            background: mapsMaxResults === n ? 'rgba(29,158,117,0.15)' : 'rgba(255,255,255,0.04)',
                            color: mapsMaxResults === n ? '#1D9E75' : 'rgba(255,255,255,0.5)',
                            transition: 'all 0.15s',
                          }}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Filter & Qualität ── */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                      <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Filter & Qualität</label>
                      <span
                        style={{
                          fontSize: 9,
                          color: 'rgba(255,255,255,0.25)',
                          background: 'rgba(255,255,255,0.06)',
                          padding: '1px 5px',
                          borderRadius: 4,
                        }}
                      >
                        Optional
                      </span>
                    </div>

                    {/* Min Rating */}
                    <div style={{ marginBottom: 10 }}>
                      <label
                        style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 3 }}
                      >
                        Mindest-Bewertung ★
                      </label>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {([null, 3.0, 3.5, 4.0, 4.5] as (number | null)[]).map((v) => (
                          <button
                            key={String(v)}
                            onClick={() => setMapsMinRating(v)}
                            style={{
                              flex: 1,
                              padding: '5px',
                              borderRadius: 6,
                              fontSize: 11,
                              cursor: 'pointer',
                              border:
                                mapsMinRating === v
                                  ? '1px solid rgba(29,158,117,0.4)'
                                  : '1px solid rgba(255,255,255,0.06)',
                              background: mapsMinRating === v ? 'rgba(29,158,117,0.12)' : 'transparent',
                              color: mapsMinRating === v ? '#1D9E75' : 'rgba(255,255,255,0.4)',
                              transition: 'all 0.15s',
                            }}
                          >
                            {v === null ? 'Alle' : `≥${v}`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Min Reviews */}
                    <div style={{ marginBottom: 10 }}>
                      <label
                        style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 3 }}
                      >
                        Mindest-Rezensionen
                      </label>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {([null, 5, 10, 25, 50] as (number | null)[]).map((v) => (
                          <button
                            key={String(v)}
                            onClick={() => setMapsMinReviews(v)}
                            style={{
                              flex: 1,
                              padding: '5px',
                              borderRadius: 6,
                              fontSize: 11,
                              cursor: 'pointer',
                              border:
                                mapsMinReviews === v
                                  ? '1px solid rgba(29,158,117,0.4)'
                                  : '1px solid rgba(255,255,255,0.06)',
                              background: mapsMinReviews === v ? 'rgba(29,158,117,0.12)' : 'transparent',
                              color: mapsMinReviews === v ? '#1D9E75' : 'rgba(255,255,255,0.4)',
                              transition: 'all 0.15s',
                            }}
                          >
                            {v === null ? 'Alle' : `≥${v}`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Website Filter + Business Status */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                      <div>
                        <label
                          style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 3 }}
                        >
                          Website
                        </label>
                        <div style={{ display: 'flex', gap: 3 }}>
                          {([null, 'without', 'with'] as (string | null)[]).map((v) => (
                            <button
                              key={String(v)}
                              onClick={() => setMapsWebsiteFilter(v)}
                              style={{
                                flex: 1,
                                padding: '5px',
                                borderRadius: 6,
                                fontSize: 10,
                                cursor: 'pointer',
                                border:
                                  mapsWebsiteFilter === v
                                    ? '1px solid rgba(29,158,117,0.4)'
                                    : '1px solid rgba(255,255,255,0.06)',
                                background: mapsWebsiteFilter === v ? 'rgba(29,158,117,0.12)' : 'transparent',
                                color: mapsWebsiteFilter === v ? '#1D9E75' : 'rgba(255,255,255,0.4)',
                                transition: 'all 0.15s',
                              }}
                            >
                              {v === null ? 'Alle' : v === 'without' ? 'Ohne' : 'Mit'}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label
                          style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 3 }}
                        >
                          Status
                        </label>
                        <div style={{ display: 'flex', gap: 3 }}>
                          {([null, 'operational'] as (string | null)[]).map((v) => (
                            <button
                              key={String(v)}
                              onClick={() => setMapsBusinessStatus(v)}
                              style={{
                                flex: 1,
                                padding: '5px',
                                borderRadius: 6,
                                fontSize: 10,
                                cursor: 'pointer',
                                border:
                                  mapsBusinessStatus === v
                                    ? '1px solid rgba(29,158,117,0.4)'
                                    : '1px solid rgba(255,255,255,0.06)',
                                background: mapsBusinessStatus === v ? 'rgba(29,158,117,0.12)' : 'transparent',
                                color: mapsBusinessStatus === v ? '#1D9E75' : 'rgba(255,255,255,0.4)',
                                transition: 'all 0.15s',
                              }}
                            >
                              {v === null ? 'Alle' : 'Nur Aktive'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Region */}
                    <div>
                      <label
                        style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 3 }}
                      >
                        Region
                      </label>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {(
                          [
                            { v: 'de', l: '🇩🇪 Deutschland' },
                            { v: 'at', l: '🇦🇹 Österreich' },
                            { v: 'ch', l: '🇨🇭 Schweiz' },
                            { v: null, l: 'DACH' },
                          ] as { v: string | null; l: string }[]
                        ).map(({ v, l }) => (
                          <button
                            key={String(v)}
                            onClick={() => setMapsCountry(v)}
                            style={{
                              flex: 1,
                              padding: '5px',
                              borderRadius: 6,
                              fontSize: 10,
                              cursor: 'pointer',
                              border:
                                mapsCountry === v
                                  ? '1px solid rgba(29,158,117,0.4)'
                                  : '1px solid rgba(255,255,255,0.06)',
                              background: mapsCountry === v ? 'rgba(29,158,117,0.12)' : 'transparent',
                              color: mapsCountry === v ? '#1D9E75' : 'rgba(255,255,255,0.4)',
                              transition: 'all 0.15s',
                            }}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ── Start Button ── */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
                    <button
                      onClick={async () => {
                        const terms = mapsSearchTerms
                          .split(/[,\n]/)
                          .map((s) => s.trim())
                          .filter(Boolean);
                        if (terms.length === 0) return;
                        setMapsLoading(true);
                        try {
                          await fetch('https://n8n.srv1223027.hstgr.cloud/webhook/apify-maps-import', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              tenant_id: TENANT_ID,
                              search_terms: terms,
                              max_results: mapsMaxResults,
                              min_rating: mapsMinRating,
                              min_reviews: mapsMinReviews,
                              website_filter: mapsWebsiteFilter,
                              business_status: mapsBusinessStatus,
                              country_code: mapsCountry,
                            }),
                          });
                          setMapsSuccess(true);
                        } catch {
                          setMapsSuccess(true);
                        } finally {
                          setMapsLoading(false);
                        }
                      }}
                      disabled={mapsLoading || !mapsSearchTerms.trim()}
                      style={{
                        width: '100%',
                        padding: '11px',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: mapsLoading || !mapsSearchTerms.trim() ? 'default' : 'pointer',
                        background: '#1D9E75',
                        color: '#fff',
                        border: 'none',
                        opacity: mapsLoading || !mapsSearchTerms.trim() ? 0.5 : 1,
                        transition: 'opacity 0.15s',
                      }}
                    >
                      {mapsLoading ? '⟳ Starte Scraper...' : '📍 Google Maps Scraper starten'}
                    </button>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 6 }}>
                      ~2 Min. Laufzeit · ca. 0,004€ pro Lead
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════════ APOLLO CONFIG ═══════════ */}
          {phase === 'config' && mode === 'apollo' && (
            <>
              <div
                style={{
                  padding: '20px 24px 16px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexShrink: 0,
                }}
              >
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>⚡ Lead Generator</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                    Neue B2B-Leads automatisch finden &amp; bewerten
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', maxWidth: 140, textAlign: 'right' }}>
                    {lastRunText}
                  </span>
                  <button
                    onClick={handleClose}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.06)',
                      border: 'none',
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: 14,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>

              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '20px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 18,
                }}
              >
                {loading ? (
                  <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
                    Lade Suchprofil...
                  </div>
                ) : (
                  <>
                    <div>
                      <Label text="Branchen" />
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {INDUSTRY_OPTIONS.map((opt) => {
                          const active = industries.includes(opt.value);
                          return (
                            <button
                              key={opt.value}
                              onClick={() => toggleIndustry(opt.value)}
                              style={{
                                padding: '5px 12px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: active ? 500 : 400,
                                border: active ? 'none' : '1px solid rgba(255,255,255,0.08)',
                                cursor: 'pointer',
                                background: active ? '#6B7AFF' : 'rgba(255,255,255,0.05)',
                                color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                                transition: 'all 0.15s',
                              }}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <Label text="Keywords" />
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: -6, marginBottom: 8 }}>
                        Apollo sucht Firmen die diese Begriffe erwähnen
                      </div>
                      <PillInput
                        pills={keywords}
                        setPills={setKeywords}
                        input={keywordInput}
                        setInput={setKeywordInput}
                        onAdd={() => {
                          addPill(keywordInput, keywords, setKeywords);
                          setKeywordInput('');
                        }}
                        placeholder="z.B. Automatisierung, ERP, Industrie 4.0"
                        color="#6B7AFF"
                      />
                    </div>
                    <div>
                      <Label text="Mitarbeiterzahl" />
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Von</span>
                        <NumInput value={minEmp} onChange={setMinEmp} />
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>bis</span>
                        <NumInput value={maxEmp} onChange={setMaxEmp} />
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Mitarbeiter</span>
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>
                        z.B. 10–500 für Mittelstand
                      </div>
                    </div>
                    <div>
                      <Label text="Jobtitel" />
                      <PillInput
                        pills={jobTitles}
                        setPills={setJobTitles}
                        input={jobInput}
                        setInput={setJobInput}
                        onAdd={() => {
                          addPill(jobInput, jobTitles, setJobTitles);
                          setJobInput('');
                        }}
                        placeholder="z.B. CEO, CTO, Geschäftsführer"
                      />
                    </div>
                    <div>
                      <Label text="Länder" />
                      <div style={{ display: 'flex', gap: 6 }}>
                        {COUNTRY_OPTIONS.map((c) => {
                          const active = countries.includes(c);
                          return (
                            <button
                              key={c}
                              onClick={() => toggleCountry(c)}
                              style={{
                                padding: '5px 14px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: active ? 500 : 400,
                                border: active ? 'none' : '1px solid rgba(255,255,255,0.08)',
                                cursor: 'pointer',
                                background: active ? '#6B7AFF' : 'rgba(255,255,255,0.05)',
                                color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                                transition: 'all 0.15s',
                              }}
                            >
                              {c}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <Label text="Städte / Regionen" />
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: -6, marginBottom: 8 }}>
                        Leer = ganzes Land durchsuchen
                      </div>
                      <PillInput
                        pills={cities}
                        setPills={setCities}
                        input={cityInput}
                        setInput={setCityInput}
                        onAdd={() => {
                          addPill(cityInput, cities, setCities);
                          setCityInput('');
                        }}
                        placeholder="z.B. Hamburg, München, Bayern"
                      />
                    </div>
                    <div>
                      <Label text={`Leads pro Durchlauf: ${leadsPerRun}`} />
                      <input
                        type="range"
                        min={5}
                        max={25}
                        value={leadsPerRun}
                        onChange={(e) => setLeadsPerRun(Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#6B7AFF' }}
                      />
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: 10,
                          color: 'rgba(255,255,255,0.25)',
                          marginTop: 2,
                        }}
                      >
                        <span>5</span>
                        <span>25</span>
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          marginTop: 4,
                          color:
                            leadsPerRun <= 10 ? '#22C55E' : leadsPerRun <= 20 ? '#F59E0B' : 'rgba(255,255,255,0.35)',
                        }}
                      >
                        {leadsPerRun <= 10
                          ? '⚡ Schnell · ~2-3 Min · empfohlen'
                          : leadsPerRun <= 20
                            ? '⏱ Normal · ~5-8 Min'
                            : '☕ Maximum · ~10-15 Min'}
                      </div>
                    </div>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, marginTop: 4 }}>
                      <button
                        onClick={() => setShowAdvanced((v) => !v)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          width: '100%',
                          background: 'none',
                          border: 'none',
                          color: 'rgba(255,255,255,0.35)',
                          cursor: 'pointer',
                          fontSize: 11,
                          padding: 0,
                          textAlign: 'left',
                        }}
                      >
                        <span style={{ fontSize: 10 }}>{showAdvanced ? '▲' : '▼'}</span>
                        Erweiterte Filter
                        {excludedKeywords.length > 0 && (
                          <span
                            style={{
                              background: 'rgba(107,122,255,0.15)',
                              color: '#6B7AFF',
                              fontSize: 9,
                              padding: '1px 6px',
                              borderRadius: 10,
                              marginLeft: 4,
                            }}
                          >
                            {excludedKeywords.length} aktiv
                          </span>
                        )}
                      </button>
                      {showAdvanced && (
                        <div style={{ marginTop: 10 }}>
                          <Label text="Ausschluss-Keywords" />
                          <PillInput
                            pills={excludedKeywords}
                            setPills={setExcludedKeywords}
                            input={excludedInput}
                            setInput={setExcludedInput}
                            onAdd={() => {
                              addPill(excludedInput, excludedKeywords, setExcludedKeywords);
                              setExcludedInput('');
                            }}
                            placeholder="z.B. Beratung, Startup, Agentur"
                            color="#FF5C2E"
                          />
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        background: 'rgba(107,122,255,0.08)',
                        border: '1px solid rgba(107,122,255,0.15)',
                        borderRadius: 8,
                        padding: '10px 12px',
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.5)',
                        lineHeight: 1.5,
                      }}
                    >
                      ℹ️ Sucht neue Kontakte via Apollo, bewertet mit KI, speichert direkt im Dashboard.
                    </div>
                  </>
                )}
              </div>

              <div
                style={{
                  padding: '14px 24px',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 8,
                  flexShrink: 0,
                }}
              >
                <button
                  onClick={handleClose}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    padding: '9px 16px',
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                  }}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!profile || loading}
                  style={{
                    background: '#fff',
                    color: '#000',
                    border: 'none',
                    borderRadius: 8,
                    padding: '9px 20px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: !profile || loading ? 'default' : 'pointer',
                    opacity: !profile || loading ? 0.5 : 1,
                    transition: 'opacity 0.15s',
                  }}
                >
                  ▶ Jetzt generieren
                </button>
              </div>
            </>
          )}

          {/* ═══════════ RUNNING ═══════════ */}
          {phase === 'running' && (
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'rgba(107,122,255,0.1)',
                  border: '1px solid rgba(107,122,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  animation: 'pulse-ring 2s ease-in-out infinite',
                }}
              >
                <span style={{ fontSize: 28 }}>⚡</span>
              </div>

              <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
                Lead Generator läuft...
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>
                Neue Kontakte werden gesucht &amp; bewertet
              </div>

              <div style={{ textAlign: 'left', maxWidth: 280, margin: '0 auto 20px' }}>
                {STEPS.map((step, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '6px 0',
                      opacity: i <= currentStep ? 1 : 0.25,
                      transition: 'opacity 0.5s ease',
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        transition: 'all 0.5s ease',
                        background:
                          i < currentStep
                            ? 'rgba(34,197,94,0.15)'
                            : i === currentStep
                              ? 'rgba(107,122,255,0.15)'
                              : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${i < currentStep ? 'rgba(34,197,94,0.3)' : i === currentStep ? 'rgba(107,122,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                        color: i < currentStep ? '#22C55E' : '#fff',
                      }}
                    >
                      {i < currentStep ? '✓' : step.icon}
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        color: i === currentStep ? '#fff' : 'rgba(255,255,255,0.4)',
                        transition: 'color 0.5s ease',
                      }}
                    >
                      {step.label}
                      {i === currentStep && (
                        <span
                          style={{
                            color: '#6B7AFF',
                            marginLeft: 8,
                            fontSize: 10,
                            animation: 'blink 1s ease-in-out infinite',
                          }}
                        >
                          ●
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>

              {/* Live leads counter */}
              {newLeadsFound > 0 && (
                <div
                  style={{
                    margin: '0 auto 16px',
                    maxWidth: 280,
                    padding: '8px 14px',
                    background: 'rgba(34,197,94,0.1)',
                    border: '1px solid rgba(34,197,94,0.2)',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    color: '#22C55E',
                  }}
                >
                  <span>✓</span>
                  <span>
                    {newLeadsFound} neue Lead{newLeadsFound > 1 ? 's' : ''} gefunden!
                  </span>
                </div>
              )}

              {/* Long-running hint */}
              {runningSeconds > 60 && newLeadsFound === 0 && (
                <div
                  style={{
                    margin: '0 auto 16px',
                    maxWidth: 280,
                    padding: '8px 14px',
                    background: 'rgba(245,158,11,0.08)',
                    border: '1px solid rgba(245,158,11,0.15)',
                    borderRadius: 8,
                    fontSize: 11,
                    color: 'rgba(245,158,11,0.8)',
                    lineHeight: 1.5,
                    textAlign: 'left',
                  }}
                >
                  ⏳ Läuft seit {Math.floor(runningSeconds / 60)} Min — Apollo-Suche kann bei vielen Ergebnissen länger
                  dauern.
                </div>
              )}

              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>
                Geschätzt: {timeHint}
              </div>
              {runningSeconds > 0 && (
                <div
                  style={{
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.15)',
                    fontFamily: 'var(--font-dm-mono)',
                    marginBottom: 16,
                  }}
                >
                  {runningSeconds}s
                </div>
              )}

              <button
                onClick={handleClose}
                style={{
                  background: 'none',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.4)',
                  borderRadius: 8,
                  padding: '8px 20px',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                Schließen — läuft im Hintergrund weiter
              </button>
            </div>
          )}

          {/* ═══════════ DONE ═══════════ */}
          {phase === 'done' && (
            <div style={{ textAlign: 'center', padding: '36px 24px' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'rgba(34,197,94,0.12)',
                  border: '1px solid rgba(34,197,94,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  fontSize: 28,
                }}
              >
                ✓
              </div>

              <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
                Lead Generator gestartet!
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>
                Neue Leads erscheinen in {timeHint} in deinem Dashboard.
                <br />
                Du kannst die Seite normal weiter nutzen.
              </div>

              <div
                style={{
                  background: 'rgba(107,122,255,0.08)',
                  border: '1px solid rgba(107,122,255,0.15)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.5)',
                  textAlign: 'left',
                  marginBottom: 20,
                  lineHeight: 1.5,
                }}
              >
                💡 <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Tipp:</strong> HOT-Leads erscheinen automatisch im
                roten Banner oben. Scroll nach unten oder warte auf das Update.
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button
                  onClick={handleClose}
                  style={{
                    background: '#fff',
                    color: '#000',
                    border: 'none',
                    borderRadius: 8,
                    padding: '9px 20px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Dashboard ansehen
                </button>
                <button
                  onClick={() => setPhase('config')}
                  style={{
                    background: 'none',
                    color: 'rgba(255,255,255,0.4)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    padding: '9px 16px',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Neue Suche
                </button>
              </div>
            </div>
          )}

          {/* ═══════════ ERROR ═══════════ */}
          {phase === 'error' && (
            <div style={{ textAlign: 'center', padding: '24px 20px' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  fontSize: 28,
                }}
              >
                ⚠
              </div>

              <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
                Generator konnte nicht gestartet werden
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
                Keine Leads wurden generiert. Du kannst es erneut versuchen.
              </div>

              {errorDetails && (
                <div
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 8,
                    padding: '12px 16px',
                    marginBottom: 20,
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-dm-mono)',
                        fontSize: 10,
                        background: 'rgba(239,68,68,0.15)',
                        color: '#F87171',
                        padding: '2px 8px',
                        borderRadius: 4,
                        letterSpacing: '0.05em',
                      }}
                    >
                      {errorDetails.code}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                    {errorDetails.message}
                  </div>
                </div>
              )}

              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.4)',
                  textAlign: 'left',
                  marginBottom: 20,
                  lineHeight: 1.6,
                }}
              >
                <strong style={{ color: 'rgba(255,255,255,0.6)' }}>Was jetzt?</strong>
                <br />
                {errorDetails?.code === 'NETWORK_ERROR' && 'Prüfe deine Internetverbindung und versuche es erneut.'}
                {errorDetails?.code === 'HTTP_401' && 'Kontaktiere den Support — API-Key muss aktualisiert werden.'}
                {errorDetails?.code?.startsWith('HTTP_5') &&
                  'n8n Server-Problem. Warte 1-2 Minuten und versuche es erneut.'}
                {errorDetails?.code === 'HTTP_404' && 'Der Lead-Generator Workflow ist inaktiv. Aktiviere ihn in n8n.'}
                {(!errorDetails?.code || errorDetails.code === 'UNKNOWN_ERROR') &&
                  'Versuche es erneut oder kontaktiere den Support.'}
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button
                  onClick={handleGenerate}
                  style={{
                    background: '#fff',
                    color: '#000',
                    border: 'none',
                    borderRadius: 8,
                    padding: '9px 20px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  ↻ Erneut versuchen
                </button>
                <button
                  onClick={() => setPhase('config')}
                  style={{
                    background: 'none',
                    color: 'rgba(255,255,255,0.4)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    padding: '9px 16px',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Einstellungen ändern
                </button>
              </div>

              {errorDetails && (
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(
                      `Fehlercode: ${errorDetails.code}\n${errorDetails.message}\nZeitpunkt: ${new Date().toISOString()}`
                    )
                  }
                  style={{
                    marginTop: 12,
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.2)',
                    fontSize: 10,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-dm-mono)',
                  }}
                >
                  📋 Fehlerdetails kopieren
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Label({ text }: { text: string }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.3)',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        marginBottom: 8,
      }}
    >
      {text}
    </div>
  );
}

function NumInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{
        width: 80,
        background: '#181818',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 6,
        padding: '7px 12px',
        fontSize: 13,
        color: '#fff',
        outline: 'none',
        fontFamily: 'var(--font-dm-mono)',
      }}
    />
  );
}

function PillInput({
  pills,
  setPills,
  input,
  setInput,
  onAdd,
  placeholder,
  color,
}: {
  pills: string[];
  setPills: (v: string[]) => void;
  input: string;
  setInput: (v: string) => void;
  onAdd: () => void;
  placeholder: string;
  color?: string;
}) {
  const c = color ?? 'rgba(255,255,255,0.5)';
  return (
    <>
      {pills.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
          {pills.map((p) => (
            <span
              key={p}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                background: color ? `${color}18` : 'rgba(255,255,255,0.06)',
                color: c,
                fontSize: 10,
                padding: '3px 8px',
                borderRadius: 4,
              }}
            >
              {p}
              <button
                onClick={() => setPills(pills.filter((x) => x !== p))}
                style={{
                  background: 'none',
                  border: 'none',
                  color: `${c}80`,
                  cursor: 'pointer',
                  fontSize: 10,
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder={placeholder}
          style={{
            flex: 1,
            background: '#181818',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 6,
            padding: '6px 10px',
            fontSize: 11,
            color: '#fff',
            outline: 'none',
          }}
        />
        <button
          onClick={onAdd}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: 'none',
            borderRadius: 6,
            padding: '6px 10px',
            fontSize: 11,
            color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
          }}
        >
          +
        </button>
      </div>
    </>
  );
}
