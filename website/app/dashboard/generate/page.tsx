'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import { HowItWorks } from '@/components/ui/how-it-works';
import { PenLine, Brain, Rocket, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import GenerateForm from './components/GenerateForm';
import type { FormData } from './components/GenerateForm';
import ReasoningDisplay from './components/ReasoningDisplay';
import type { ReasoningResult } from './components/ReasoningDisplay';
import GeneratingState from './components/GeneratingState';
import LoadingState from './components/LoadingState';
import { useTenant } from '@/hooks/useTenant';

const HISTORY_KEY = 'onvero_generate_history';
const LAST_INPUT_KEY = 'onvero_generate_last_input';

interface HistoryEntry {
  freetext: string;
  date: string;
}

function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveToHistory(freetext: string) {
  if (!freetext.trim()) return;
  const h = loadHistory().filter((e) => e.freetext !== freetext);
  h.unshift({ freetext, date: new Date().toISOString() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 5)));
}

function loadLastInput(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(LAST_INPUT_KEY) ?? '';
}

type GenerateState = 'form' | 'loading' | 'reasoning' | 'generating';

export default function GeneratePage() {
  const { tenantId } = useTenant();
  const [state, setState] = useState<GenerateState>('form');
  const [formData, setFormData] = useState<FormData>({
    freetext: '',
    industry: '',
    employeeMin: 10,
    employeeMax: 500,
    tags: [],
    keywords: [],
    leadSource: 'apollo',
  });
  const [result, setResult] = useState<ReasoningResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [missingProfileFields, setMissingProfileFields] = useState<string[] | null>(null);

  // Load last input + history on mount
  useEffect(() => {
    const last = loadLastInput();
    if (last) setFormData((prev) => ({ ...prev, freetext: last }));
    setHistory(loadHistory());
  }, []);

  // Check profile completeness whenever tenant changes
  useEffect(() => {
    if (!tenantId) return;
    const REQUIRED: { key: string; label: string }[] = [
      { key: 'company_name', label: 'Firmenname' },
      { key: 'company_description', label: 'Was ihr macht' },
      { key: 'target_customers', label: 'Zielkunden' },
      { key: 'usp', label: 'USP' },
      { key: 'sender_name', label: 'Absender Name' },
      { key: 'sender_role', label: 'Absender Rolle' },
      { key: 'services', label: 'Services' },
    ];
    fetch('/api/profile')
      .then((r) => r.json())
      .then((d) => {
        if (!d.profile) {
          setMissingProfileFields(REQUIRED.map((f) => f.label));
          return;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p: any = d.profile;
        const missing = REQUIRED.filter((f) => {
          const v = p[f.key];
          if (v == null) return true;
          if (Array.isArray(v)) return v.length === 0;
          if (typeof v === 'string') return v.trim() === '';
          return false;
        }).map((f) => f.label);
        setMissingProfileFields(missing);
      })
      .catch(() => setMissingProfileFields(null));
  }, [tenantId]);

  const handleSubmit = async (data: FormData) => {
    setFormData(data);
    setState('loading');
    // Persist input
    localStorage.setItem(LAST_INPUT_KEY, data.freetext);
    saveToHistory(data.freetext);
    setHistory(loadHistory());

    try {
      const res = await fetch('/api/generate/reasoning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freetext: data.freetext,
          industry: data.industry || undefined,
          employee_min: data.employeeMin,
          employee_max: data.employeeMax,
          tags: data.tags.length > 0 ? data.tags : undefined,
          keywords: data.keywords.length > 0 ? data.keywords : undefined,
          lead_source: 'apollo',
          tenant_id: tenantId,
        }),
      });
      const json: ReasoningResult = await res.json();
      setResult(json);
      setState('reasoning');
    } catch {
      setResult({
        success: true,
        reasoning: `Suche basierend auf: "${data.freetext.slice(0, 100)}"`,
        strategy: 'Standard Apollo-Suche mit deinen Kriterien.',
        apollo_keywords: data.tags.concat(data.keywords),
        apollo_industries: data.industry ? [data.industry] : [],
        refined_employee_min: data.employeeMin,
        refined_employee_max: data.employeeMax,
        confidence: 50,
        why_contact_even_if_low_score: 'Auch Leads mit niedrigerem Score können wertvolle Kontakte sein.',
      });
      setState('reasoning');
    }
  };

  const handleHistoryClick = (entry: HistoryEntry) => {
    setFormData((prev) => ({ ...prev, freetext: entry.freetext }));
    localStorage.setItem(LAST_INPUT_KEY, entry.freetext);
  };

  const handleHistoryDelete = (entry: HistoryEntry) => {
    const updated = loadHistory().filter((e) => e.freetext !== entry.freetext);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    setHistory(updated);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#050505', fontFamily: 'var(--font-dm-sans)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 32px' }}>
        <div style={{ marginBottom: 32 }}>
          <PageHeader title="Leads generieren" subtitle="KI-gestützte Lead-Recherche" />
        </div>

        {state === 'form' && missingProfileFields && missingProfileFields.length > 0 && (
          <div
            style={{
              maxWidth: 560,
              margin: '0 auto 16px',
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 12,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={14} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#ef4444', marginBottom: 4 }}>
                Dein Profil ist noch nicht fertig eingerichtet
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55, marginBottom: 8 }}>
                Ohne ein vollständiges Unternehmensprofil kann die KI keine personalisierten Suchanfragen und
                E-Mails erstellen. Folgende Felder fehlen noch:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                {missingProfileFields.map((f) => (
                  <span
                    key={f}
                    style={{
                      fontSize: 11,
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      color: 'rgba(239,68,68,0.85)',
                      padding: '2px 8px',
                      borderRadius: 6,
                    }}
                  >
                    {f}
                  </span>
                ))}
              </div>
              <Link
                href="/dashboard/settings"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  padding: '7px 14px',
                  borderRadius: 7,
                  background: '#ef4444',
                  color: '#fff',
                  textDecoration: 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#dc2626')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#ef4444')}
              >
                Profil vervollständigen →
              </Link>
            </div>
          </div>
        )}

        {state === 'form' && (
          <>
            <div style={{ marginBottom: 24, maxWidth: 560, margin: '0 auto 24px' }}>
              <HowItWorks
                storageKey="generate"
                title="So generierst du Leads"
                compact
                steps={[
                  {
                    icon: <PenLine className="w-5 h-5 text-white/50" />,
                    title: 'Beschreiben',
                    description: 'Beschreibe in eigenen Worten welche Kunden du suchst.',
                    benefits: ['Freitext wie im Chat', 'Branche, Größe, Technologien', 'So spezifisch wie du willst'],
                  },
                  {
                    icon: <Brain className="w-5 h-5 text-[#6B7AFF]" />,
                    title: 'KI analysiert',
                    description: 'Die KI verfeinert deine Suche und zeigt dir die Strategie.',
                    benefits: [
                      'Keywords & Industrien werden optimiert',
                      'Konfidenz-Score zeigt Qualität',
                      'Du kannst anpassen vor dem Start',
                    ],
                  },
                  {
                    icon: <Rocket className="w-5 h-5 text-[#22C55E]" />,
                    title: 'Leads erscheinen',
                    description: 'Die Pipeline läuft ~2 Min. im Hintergrund, Leads erscheinen automatisch.',
                    benefits: [
                      'Apollo-Suche + Website-Analyse',
                      'Jeder Lead wird KI-gescored',
                      'Personalisierte E-Mails werden erstellt',
                    ],
                  },
                ]}
              />
            </div>

            {/* History */}
            {history.length > 0 && (
              <div style={{ maxWidth: 560, margin: '0 auto 16px' }}>
                <div
                  style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.25)',
                    marginBottom: 6,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  Letzte Suchen
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {history.map((entry, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.02)',
                        overflow: 'hidden',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                      }}
                    >
                      <button
                        onClick={() => handleHistoryClick(entry)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flex: 1,
                          padding: '8px 12px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontFamily: 'inherit',
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            color: 'rgba(255,255,255,0.5)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1,
                            marginRight: 12,
                          }}
                        >
                          {entry.freetext}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            color: 'rgba(255,255,255,0.2)',
                            flexShrink: 0,
                            fontFamily: 'var(--font-dm-mono)',
                          }}
                        >
                          {new Date(entry.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                        </span>
                      </button>
                      <button
                        onClick={() => handleHistoryDelete(entry)}
                        title="Löschen"
                        style={{
                          padding: '8px 10px',
                          background: 'none',
                          border: 'none',
                          borderLeft: '1px solid rgba(255,255,255,0.05)',
                          color: 'rgba(255,255,255,0.15)',
                          cursor: 'pointer',
                          fontSize: 12,
                          flexShrink: 0,
                          transition: 'color 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.15)')}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <GenerateForm initialData={formData} onSubmit={handleSubmit} />
          </>
        )}
        {state === 'loading' && <LoadingState />}
        {state === 'reasoning' && result && (
          <ReasoningDisplay
            result={result}
            onBack={() => setState('form')}
            onConfirm={async ({
              leadCount,
              apolloKeywords,
              apolloIndustries,
              apolloTitles,
              apolloLocations,
              employeeMin,
              employeeMax,
            }) => {
              if (!tenantId) {
                alert('Kein Tenant gefunden. Bitte neu einloggen.');
                return;
              }
              setState('generating');
              try {
                // 1) Persist edits to lead_run_execution (if we have an ID)
                if (result.execution_id) {
                  const upd = await fetch(`/api/generate/execution/${result.execution_id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      apollo_keywords: apolloKeywords,
                      apollo_industries: apolloIndustries,
                      person_titles: apolloTitles,
                      person_locations: apolloLocations,
                      refined_employee_min: employeeMin,
                      refined_employee_max: employeeMax,
                      lead_count: leadCount,
                    }),
                  });
                  if (!upd.ok) {
                    const err = await upd.json().catch(() => ({}));
                    console.error('Execution update failed:', err);
                    alert(`Konnte Anpassungen nicht speichern: ${err.error ?? upd.status}`);
                    setState('reasoning');
                    return;
                  }
                }

                // 2) Trigger workflow
                const res = await fetch('/api/generate/trigger', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    tenant_id: tenantId,
                    profile_id: 'default',
                    execution_id: result.execution_id,
                    lead_count: leadCount,
                    on_demand: {
                      execution_id: result.execution_id,
                      apollo_industries: apolloIndustries,
                      apollo_keywords: apolloKeywords,
                      person_titles: apolloTitles,
                      person_locations: apolloLocations,
                      refined_employee_min: employeeMin,
                      refined_employee_max: employeeMax,
                      lead_count: leadCount,
                    },
                  }),
                });
                if (!res.ok) {
                  const err = await res.json().catch(() => ({}));
                  console.error('Trigger failed:', err);
                  alert(`Workflow konnte nicht gestartet werden: ${err.error ?? res.status}`);
                  setState('reasoning');
                }
              } catch (e) {
                console.error('Trigger error:', e);
                alert('Netzwerkfehler beim Starten des Workflows.');
                setState('reasoning');
              }
            }}
          />
        )}
        {state === 'generating' && <GeneratingState />}
      </div>
    </div>
  );
}
