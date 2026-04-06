'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import { HowItWorks } from '@/components/ui/how-it-works';
import { PenLine, Brain, Rocket } from 'lucide-react';
import GenerateForm from './components/GenerateForm';
import type { FormData } from './components/GenerateForm';
import ReasoningDisplay from './components/ReasoningDisplay';
import type { ReasoningResult } from './components/ReasoningDisplay';
import GeneratingState from './components/GeneratingState';
import LoadingState from './components/LoadingState';

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

  // Load last input + history on mount
  useEffect(() => {
    const last = loadLastInput();
    if (last) setFormData((prev) => ({ ...prev, freetext: last }));
    setHistory(loadHistory());
  }, []);

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
          tenant_id: 'df763f85-c687-42d6-be66-a2b353b89c90',
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
    <div style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: 'var(--font-dm-sans)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 32px' }}>
        <div style={{ marginBottom: 32 }}>
          <PageHeader title="Leads generieren" subtitle="KI-gestützte Lead-Recherche" />
        </div>

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
            onConfirm={() => {
              fetch('/api/generate/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  on_demand: {
                    apollo_industries: result.apollo_industries,
                    apollo_keywords: result.apollo_keywords,
                    refined_employee_min: result.refined_employee_min,
                    refined_employee_max: result.refined_employee_max,
                  },
                }),
              }).catch(() => {});
              setState('generating');
            }}
          />
        )}
        {state === 'generating' && <GeneratingState />}
      </div>
    </div>
  );
}
