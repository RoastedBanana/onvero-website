'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { C, SvgIcon, ICONS } from '../_shared';

type Phase = 'form' | 'analyzing' | 'strategy' | 'done';

interface StrategyResult {
  strategy?: string;
  reasoning?: string;
  [key: string]: unknown;
}

const LOADING_MESSAGES = [
  'Agent wird gestartet...',
  'Zielmarkt wird analysiert...',
  'Unternehmen werden recherchiert...',
  'Kontaktpersonen werden identifiziert...',
  'Daten werden angereichert...',
];

export default function DeepResearchTab({ tenantId }: { tenantId: string | null }) {
  const [phase, setPhase] = useState<Phase>('form');
  const [freetext, setFreetext] = useState('');
  const [strategyResult, setStrategyResult] = useState<StrategyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msgIdx, setMsgIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // Cycle loading messages
  useEffect(() => {
    if (phase !== 'analyzing' && phase !== 'strategy') return;
    const t = setInterval(() => {
      setMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(t);
  }, [phase]);

  // Timer
  useEffect(() => {
    if (phase !== 'analyzing' && phase !== 'strategy') return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleSubmit = useCallback(async () => {
    if (!freetext.trim() || !tenantId) return;
    setPhase('analyzing');
    setError(null);
    setElapsed(0);
    setMsgIdx(0);
    setStrategyResult(null);

    try {
      const res = await fetch('/api/generate/apollo-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freetext, tenant_id: tenantId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();

      if (data.strategy || data.reasoning) {
        setStrategyResult(data);
        setPhase('strategy');
      } else if (data.success || data.status === 'done' || data.status === 'completed') {
        setStrategyResult(data);
        setPhase('done');
      } else {
        // Webhook returned data but no strategy yet — treat as first response with partial data
        setStrategyResult(data);
        setPhase('strategy');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
      setPhase('form');
    }
  }, [freetext, tenantId]);

  // Poll lead_generator_runs for completion when in strategy phase
  useEffect(() => {
    if (phase !== 'strategy') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/lead-generator-runs?status=running&limit=1');
        const data = await res.json();
        // If no running runs exist, assume the agent finished
        if (data.runs && data.runs.length === 0) {
          setPhase('done');
        }
        // Also check if the latest run is completed
        if (data.runs?.[0]?.status === 'completed' || data.runs?.[0]?.status === 'done') {
          setPhase('done');
        }
      } catch {
        // ignore polling errors
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [phase]);

  const canSubmit = freetext.trim().length >= 10;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: '14px 16px',
    fontSize: 14,
    color: C.text1,
    outline: 'none',
    fontFamily: 'inherit',
    lineHeight: 1.7,
    resize: 'vertical' as const,
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  // ─── FORM ───────────────────────────────────────────────────────────────
  if (phase === 'form') {
    return (
      <div style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginTop: 28, marginBottom: 32 }}>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 700,
              margin: 0,
              background: 'linear-gradient(135deg, #34D399 0%, #059669 40%, #047857 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            Deep Research Agent
            <span style={{ display: 'inline-flex', animation: 'sparkPulse 2.5s ease infinite' }}>
              <SvgIcon d={ICONS.spark} size={22} color="#34D399" />
            </span>
          </h2>
          <p style={{ fontSize: 14, color: C.text2, margin: '10px 0 0' }}>
            Der Agent recherchiert eigenst&auml;ndig Unternehmen und findet die besten Leads
          </p>
        </div>

        {/* Input card */}
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: 32,
            maxWidth: 680,
            margin: '0 auto',
            transition: 'border-color 0.3s, box-shadow 0.3s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(52,211,153,0.25)';
            e.currentTarget.style.boxShadow = '0 4px 32px rgba(52,211,153,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = C.border;
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <label style={{ fontSize: 13, fontWeight: 600, color: C.text2, display: 'block', marginBottom: 10 }}>
            Beschreibe, welche Unternehmen du suchst
          </label>
          <textarea
            value={freetext}
            onChange={(e) => setFreetext(e.target.value)}
            placeholder="z.B. 'SaaS Unternehmen in Deutschland mit 50-200 Mitarbeitern die eine CRM-Lösung brauchen' oder 'Logistikunternehmen in der DACH-Region die noch kein automatisiertes Warehouse-Management haben'"
            rows={6}
            style={inputStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(52,211,153,0.35)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(52,211,153,0.08)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.boxShadow = 'none';
            }}
          />

          {error && (
            <div
              style={{
                marginTop: 12,
                padding: '10px 14px',
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 8,
                fontSize: 12,
                color: '#F87171',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
            <span style={{ fontSize: 11, color: C.text3 }}>
              {freetext.length} Zeichen
            </span>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                background: canSubmit ? 'linear-gradient(135deg, #059669, #34D399)' : C.surface2,
                color: canSubmit ? '#fff' : C.text3,
                border: canSubmit ? 'none' : `1px solid ${C.border}`,
                borderRadius: 10,
                padding: '13px 36px',
                fontSize: 14,
                fontWeight: 600,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s ease',
                boxShadow: canSubmit ? '0 2px 16px rgba(52,211,153,0.25)' : 'none',
              }}
            >
              <SvgIcon d={ICONS.spark} size={15} />
              Agent starten &rarr;
            </button>
          </div>
        </div>

        {/* How it works */}
        <div
          style={{
            maxWidth: 680,
            margin: '32px auto 0',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
          }}
        >
          {[
            { icon: '01', title: 'Beschreiben', desc: 'Du beschreibst deine Zielgruppe in eigenen Worten.' },
            { icon: '02', title: 'Agent recherchiert', desc: 'Der Agent analysiert den Markt und entwickelt eine Strategie.' },
            { icon: '03', title: 'Leads erscheinen', desc: 'Qualifizierte Leads werden automatisch in deine Liste importiert.' },
          ].map((s) => (
            <div
              key={s.icon}
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: '20px 16px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#34D399',
                  letterSpacing: '0.08em',
                  marginBottom: 8,
                }}
              >
                {s.icon}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text1, marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 11, color: C.text3, lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── ANALYZING / STRATEGY (loading continues) ──────────────────────────
  if (phase === 'analyzing' || phase === 'strategy') {
    return (
      <div
        style={{
          maxWidth: 640,
          margin: '48px auto 0',
          animation: 'fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        }}
      >
        {/* Spinner + status */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <style>{`
            @keyframes drSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            @keyframes drPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
            @keyframes drFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          `}</style>

          <div
            style={{
              width: 56,
              height: 56,
              margin: '0 auto 20px',
              borderRadius: '50%',
              border: '3px solid rgba(52,211,153,0.1)',
              borderTopColor: '#34D399',
              animation: 'drSpin 0.9s linear infinite',
            }}
          />

          <div style={{ fontSize: 15, fontWeight: 600, color: C.text1, marginBottom: 6 }}>
            {phase === 'analyzing' ? 'Agent arbeitet...' : 'Leads werden generiert...'}
          </div>
          <div
            style={{
              fontSize: 13,
              color: C.text3,
              animation: 'drPulse 2s ease infinite',
            }}
          >
            {LOADING_MESSAGES[msgIdx]}
          </div>
          <div
            style={{
              fontSize: 11,
              color: C.text3,
              marginTop: 8,
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            }}
          >
            {formatTime(elapsed)}
          </div>
        </div>

        {/* Strategy card (appears after first webhook response) */}
        {phase === 'strategy' && strategyResult && (
          <div style={{ animation: 'drFadeIn 0.5s ease both' }}>
            {strategyResult.reasoning && (
              <div
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: 24,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      background: 'rgba(52,211,153,0.1)',
                      border: '1px solid rgba(52,211,153,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <SvgIcon
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      size={14}
                      color="#34D399"
                    />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>Reasoning</span>
                </div>
                <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {strategyResult.reasoning}
                </div>
              </div>
            )}

            {strategyResult.strategy && (
              <div
                style={{
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: 24,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      background: 'rgba(99,102,241,0.1)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <SvgIcon d={ICONS.chart} size={14} color={C.accent} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>Strategie</span>
                </div>
                <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {strategyResult.strategy}
                </div>
              </div>
            )}

            {/* Still loading indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                marginTop: 24,
                padding: '14px 20px',
                background: 'rgba(52,211,153,0.04)',
                border: '1px solid rgba(52,211,153,0.1)',
                borderRadius: 10,
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  border: '2px solid rgba(52,211,153,0.15)',
                  borderTopColor: '#34D399',
                  animation: 'drSpin 0.9s linear infinite',
                }}
              />
              <span style={{ fontSize: 12, color: '#34D399', fontWeight: 500 }}>
                Leads werden im Hintergrund generiert...
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── DONE ──────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        maxWidth: 520,
        margin: '80px auto 0',
        textAlign: 'center',
        animation: 'fadeInUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          margin: '0 auto 20px',
          borderRadius: '50%',
          background: 'rgba(52,211,153,0.1)',
          border: '1px solid rgba(52,211,153,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 32px rgba(52,211,153,0.15)',
        }}
      >
        <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>

      <h2 style={{ fontSize: 24, fontWeight: 700, color: C.text1, margin: '0 0 8px' }}>
        Fertig!
      </h2>
      <p style={{ fontSize: 14, color: C.text2, margin: '0 0 32px', lineHeight: 1.6 }}>
        Der Agent hat die Recherche abgeschlossen. Deine neuen Leads sind jetzt verf&uuml;gbar.
      </p>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <Link
          href="/sales/unternehmen"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 28px',
            background: 'linear-gradient(135deg, #059669, #34D399)',
            color: '#fff',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
            boxShadow: '0 2px 16px rgba(52,211,153,0.3)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = 'brightness(1.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = 'brightness(1)';
          }}
        >
          &rarr; Zu den Leads
        </Link>
        <button
          onClick={() => {
            setPhase('form');
            setFreetext('');
            setStrategyResult(null);
            setElapsed(0);
          }}
          style={{
            padding: '12px 24px',
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            fontSize: 13,
            color: C.text2,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = C.border;
          }}
        >
          Neue Suche
        </button>
      </div>
    </div>
  );
}
