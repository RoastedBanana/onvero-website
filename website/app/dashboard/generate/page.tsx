'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import GenerateForm from './components/GenerateForm';
import type { FormData } from './components/GenerateForm';
import ReasoningDisplay from './components/ReasoningDisplay';
import type { ReasoningResult } from './components/ReasoningDisplay';
import GeneratingState from './components/GeneratingState';

type GenerateState = 'form' | 'reasoning' | 'generating';

const LOADING_MESSAGES = [
  'KI analysiert deine Suchkriterien...',
  'Suchanfrage wird verfeinert...',
  'Strategie wird entwickelt...',
  'Marktdaten werden ausgewertet...',
];

export default function GeneratePage() {
  const [state, setState] = useState<GenerateState>('form');
  const [formData, setFormData] = useState<FormData | null>(null);
  const [result, setResult] = useState<ReasoningResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Rotate loading messages
  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setLoadingMsg((m) => (m + 1) % LOADING_MESSAGES.length), 2000);
    return () => clearInterval(t);
  }, [loading]);

  async function handleSubmit(data: FormData) {
    setFormData(data);
    setLoading(true);
    setError(null);
    setLoadingMsg(0);
    try {
      const res = await fetch('https://n8n.srv1223027.hstgr.cloud/webhook/lead-reasoning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-onvero-secret': 'onvero-internal-2024',
        },
        body: JSON.stringify({
          industry: data.industry,
          employee_min: data.employeeMin,
          employee_max: data.employeeMax,
          tags: data.tags,
          keywords: data.keywords,
          lead_source: 'apollo',
          tenant_id: 'df763f85-c687-42d6-be66-a2b353b89c90',
        }),
      });
      const json = await res.json();
      setResult(json);
      setState('reasoning');
    } catch {
      setError('Verbindung zum KI-Service fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: 'var(--font-dm-sans)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 32px' }}>
        <div style={{ marginBottom: 28 }}>
          <PageHeader
            title="Generate"
            badge={{ label: 'KI', variant: 'default' }}
            subtitle="Lead-Generierung mit KI-Analyse"
          />
        </div>

        {/* Loading overlay */}
        {loading && (
          <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', padding: '60px 0' }}>
            <style>{`@keyframes loadSpin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}@keyframes loadFade{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
            <div
              style={{
                width: 48,
                height: 48,
                margin: '0 auto 20px',
                borderRadius: '50%',
                border: '3px solid rgba(107,122,255,0.15)',
                borderTopColor: '#6B7AFF',
                animation: 'loadSpin 1s linear infinite',
              }}
            />
            <div
              style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', animation: 'loadFade 2s ease-in-out infinite' }}
            >
              {LOADING_MESSAGES[loadingMsg]}
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', padding: '20px 0' }}>
            <div
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.15)',
                borderRadius: 10,
                padding: 16,
              }}
            >
              <div style={{ fontSize: 13, color: '#ef4444', marginBottom: 8 }}>{error}</div>
              <button
                onClick={() => {
                  setError(null);
                  setState('form');
                }}
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.5)',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6,
                  padding: '6px 14px',
                  cursor: 'pointer',
                }}
              >
                Zurück zum Formular
              </button>
            </div>
          </div>
        )}

        {/* States */}
        {!loading && !error && state === 'form' && (
          <GenerateForm initial={formData ?? undefined} onSubmit={handleSubmit} />
        )}

        {!loading && !error && state === 'reasoning' && result && (
          <ReasoningDisplay
            result={result}
            onAdjust={() => setState('form')}
            onGenerate={() => setState('generating')}
          />
        )}

        {!loading && !error && state === 'generating' && <GeneratingState />}
      </div>
    </div>
  );
}
