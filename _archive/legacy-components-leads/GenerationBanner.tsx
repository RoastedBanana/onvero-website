'use client';

import { useState, useEffect, useCallback } from 'react';

interface Run {
  id: string;
  source: string;
  status: string;
  search_terms: string[];
  max_results: number;
  filters: Record<string, unknown>;
  leads_found: number;
  leads_new: number;
  leads_duplicate: number;
  started_at: string;
  completed_at: string | null;
}

interface Props {
  onStartNew?: () => void;
}

export default function GenerationBanner({ onStartNew }: Props) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [idx, setIdx] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const loadRuns = useCallback(async () => {
    try {
      const res = await fetch('/api/lead-generator-runs?limit=5');
      const { runs: data } = await res.json();
      setRuns(data ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadRuns();
    const t = setInterval(loadRuns, 15000);
    const handler = () => loadRuns();
    window.addEventListener('vero:new-leads', handler);
    return () => {
      clearInterval(t);
      window.removeEventListener('vero:new-leads', handler);
    };
  }, [loadRuns]);

  if (runs.length === 0) return null;

  const run = runs[idx];
  if (!run) return null;

  const isRunning = run.status === 'running';
  const isError = run.status === 'error';
  const date = new Date(run.started_at);
  const dateStr = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  const terms = (run.search_terms ?? []).join(', ');
  const duration = run.completed_at ? Math.round((new Date(run.completed_at).getTime() - date.getTime()) / 1000) : 0;
  const durationStr = duration > 0 ? `${Math.floor(duration / 60)} Min ${duration % 60} Sek` : '—';
  const sourceLabel = run.source === 'google_maps_apify' ? '📍 Google Maps' : '⚡ Apollo';

  const filters = run.filters as Record<string, unknown> | null;
  const filterParts: string[] = [];
  if (filters?.min_rating) filterParts.push(`Bewertung ≥${filters.min_rating}`);
  if (filters?.business_status === 'operational') filterParts.push('Nur Aktive');
  if (filters?.country_code === 'de') filterParts.push('Deutschland');
  else if (filters?.country_code === 'at') filterParts.push('Österreich');
  else if (filters?.country_code === 'ch') filterParts.push('Schweiz');

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 10,
        marginBottom: 12,
        overflow: 'hidden',
        fontFamily: 'var(--font-dm-sans)',
      }}
    >
      <style>{`@keyframes bannerPulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      {/* Collapsed row */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {/* Status dot */}
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            flexShrink: 0,
            background: isRunning ? '#F59E0B' : isError ? '#ef4444' : '#1D9E75',
            animation: isRunning ? 'bannerPulse 1.5s ease-in-out infinite' : 'none',
          }}
        />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>{sourceLabel}</span>
        <span
          style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.35)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
        >
          {terms || '—'} · {dateStr} {timeStr}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            flexShrink: 0,
            color: isRunning ? '#F59E0B' : isError ? '#ef4444' : '#1D9E75',
          }}
        >
          {isRunning ? '⟳ Läuft...' : isError ? '✗ Fehler' : `✅ ${run.leads_new ?? run.leads_found} neue Leads`}
        </span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: '0 16px 14px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div
            style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '6px 12px', marginTop: 10, fontSize: 11 }}
          >
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>Suchbegriffe:</span>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>{terms || '—'}</span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>Max. Ergebnisse:</span>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>{run.max_results} pro Begriff</span>
            {filterParts.length > 0 && (
              <>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>Filter:</span>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>{filterParts.join(' · ')}</span>
              </>
            )}
            {!isRunning && (
              <>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>Ergebnis:</span>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {run.leads_new ?? run.leads_found} neue Leads
                  {run.leads_duplicate > 0 ? ` / ${run.leads_duplicate} Duplikate` : ''}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>Laufzeit:</span>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>{durationStr}</span>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {onStartNew && (
              <button
                onClick={onStartNew}
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: '#1D9E75',
                  background: 'rgba(29,158,117,0.1)',
                  border: '1px solid rgba(29,158,117,0.2)',
                  borderRadius: 6,
                  padding: '5px 12px',
                  cursor: 'pointer',
                }}
              >
                Neue Generation starten
              </button>
            )}
            {runs.length > 1 && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
                <button
                  onClick={() => setIdx(Math.min(idx + 1, runs.length - 1))}
                  disabled={idx >= runs.length - 1}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: 'none',
                    borderRadius: 4,
                    padding: '3px 8px',
                    fontSize: 10,
                    color: idx >= runs.length - 1 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.4)',
                    cursor: idx >= runs.length - 1 ? 'default' : 'pointer',
                  }}
                >
                  ← Älter
                </button>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
                  {idx + 1}/{runs.length}
                </span>
                <button
                  onClick={() => setIdx(Math.max(idx - 1, 0))}
                  disabled={idx <= 0}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: 'none',
                    borderRadius: 4,
                    padding: '3px 8px',
                    fontSize: 10,
                    color: idx <= 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.4)',
                    cursor: idx <= 0 ? 'default' : 'pointer',
                  }}
                >
                  Neuer →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
