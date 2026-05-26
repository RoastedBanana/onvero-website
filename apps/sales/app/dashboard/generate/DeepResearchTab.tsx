'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { C, SvgIcon, ICONS } from '../_shared';

type Phase = 'form' | 'loading' | 'results' | 'importing' | 'done';

interface DiscoveredLead {
  company_name?: string;
  name?: string;
  website?: string;
  domain?: string;
  url?: string;
  industry?: string;
  branche?: string;
  city?: string;
  location?: string;
  country?: string;
  employees?: string | number;
  employee_count?: string | number;
  size?: string;
  description?: string;
  reasoning?: string;
  fit?: string;
  linkedin_url?: string;
  linkedin?: string;
  [key: string]: unknown;
}

const LOADING_MESSAGES = [
  'Discovery-Agent wird gestartet...',
  'Markt wird durchsucht...',
  'Unternehmen werden gefiltert...',
  'Daten werden angereichert...',
  'Ergebnisse werden zusammengestellt...',
];

// ─── Flexible response parser ─────────────────────────────────────────────
function extractLeads(payload: unknown): DiscoveredLead[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as DiscoveredLead[];
  if (typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    for (const key of ['leads', 'companies', 'results', 'items', 'data']) {
      const v = obj[key];
      if (Array.isArray(v)) return v as DiscoveredLead[];
    }
    // Single lead object fallback
    if (obj.company_name || obj.name || obj.website || obj.domain) {
      return [obj as DiscoveredLead];
    }
  }
  return [];
}

function leadKey(l: DiscoveredLead, idx: number): string {
  return (
    (l.website as string) ||
    (l.domain as string) ||
    (l.url as string) ||
    (l.linkedin_url as string) ||
    (l.linkedin as string) ||
    (l.company_name as string) ||
    (l.name as string) ||
    `lead-${idx}`
  );
}

function leadName(l: DiscoveredLead): string {
  return (l.company_name || l.name || 'Unbenanntes Unternehmen') as string;
}

function leadWebsite(l: DiscoveredLead): string | null {
  return ((l.website || l.domain || l.url) as string) || null;
}

function leadIndustry(l: DiscoveredLead): string | null {
  return ((l.industry || l.branche) as string) || null;
}

function leadLocation(l: DiscoveredLead): string | null {
  const parts = [l.city || l.location, l.country].filter(Boolean) as string[];
  return parts.length ? parts.join(', ') : null;
}

function leadEmployees(l: DiscoveredLead): string | null {
  const v = l.employees ?? l.employee_count ?? l.size;
  return v != null ? String(v) : null;
}

function leadReasoning(l: DiscoveredLead): string | null {
  return ((l.reasoning || l.fit || l.description) as string) || null;
}

export default function DeepResearchTab({ tenantId }: { tenantId: string | null }) {
  const [phase, setPhase] = useState<Phase>('form');
  const [freetext, setFreetext] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [leads, setLeads] = useState<DiscoveredLead[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rawResponse, setRawResponse] = useState<unknown>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [importedCount, setImportedCount] = useState(0);

  useEffect(() => {
    if (phase !== 'loading') return;
    const t = setInterval(() => setMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length), 3000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'loading') return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleSubmit = useCallback(async () => {
    if (!freetext.trim() || !tenantId) return;
    setPhase('loading');
    setError(null);
    setElapsed(0);
    setMsgIdx(0);
    setLeads([]);
    setSelected(new Set());
    setRawResponse(null);

    try {
      const res = await fetch('/api/generate/discovery-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freetext, tenant_id: tenantId }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }

      setRawResponse(json.data ?? json);
      const parsed = extractLeads(json.data ?? json);
      setLeads(parsed);
      // Pre-select all by default
      setSelected(new Set(parsed.map((l, i) => leadKey(l, i))));
      setPhase('results');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
      setPhase('form');
    }
  }, [freetext, tenantId]);

  const toggleSelect = useCallback((key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (prev.size === leads.length) return new Set();
      return new Set(leads.map((l, i) => leadKey(l, i)));
    });
  }, [leads]);

  const handleImport = useCallback(async () => {
    const rows = leads
      .map((l, i) => ({ lead: l, key: leadKey(l, i) }))
      .filter(({ key }) => selected.has(key))
      .map(({ lead }) => ({
        company_name: leadName(lead),
        website: leadWebsite(lead) ?? undefined,
        industry: leadIndustry(lead) ?? undefined,
        city: (lead.city as string) ?? undefined,
        country: (lead.country as string) ?? undefined,
        employees: leadEmployees(lead) ?? undefined,
        linkedin_url: ((lead.linkedin_url || lead.linkedin) as string) ?? undefined,
        description: leadReasoning(lead) ?? undefined,
        source: 'discovery-agent',
      }));

    if (rows.length === 0) return;

    setPhase('importing');
    setError(null);
    try {
      const res = await fetch('/api/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setImportedCount(rows.length);
      window.dispatchEvent(new Event('vero:new-leads'));
      setPhase('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import fehlgeschlagen');
      setPhase('results');
    }
  }, [leads, selected]);

  const canSubmit = freetext.trim().length >= 10;
  const selectedCount = useMemo(() => selected.size, [selected]);

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
            Der Agent recherchiert eigenst&auml;ndig Unternehmen und schl&auml;gt potenzielle Leads vor
          </p>
        </div>

        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: 32,
            maxWidth: 680,
            margin: '0 auto',
          }}
        >
          <label
            style={{ fontSize: 13, fontWeight: 600, color: C.text2, display: 'block', marginBottom: 10 }}
          >
            Beschreibe, welche Unternehmen du suchst
          </label>
          <textarea
            value={freetext}
            onChange={(e) => setFreetext(e.target.value)}
            placeholder="z.B. 'SaaS Unternehmen in Deutschland mit 50-200 Mitarbeitern die eine CRM-Lösung brauchen'"
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

          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}
          >
            <span style={{ fontSize: 11, color: C.text3 }}>{freetext.length} Zeichen</span>
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
                boxShadow: canSubmit ? '0 2px 16px rgba(52,211,153,0.25)' : 'none',
              }}
            >
              <SvgIcon d={ICONS.spark} size={15} />
              Generieren &rarr;
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── LOADING ────────────────────────────────────────────────────────────
  if (phase === 'loading' || phase === 'importing') {
    return (
      <div
        style={{
          maxWidth: 640,
          margin: '48px auto 0',
          animation: 'fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
          textAlign: 'center',
        }}
      >
        <style>{`
          @keyframes drSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          @keyframes drPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
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
          {phase === 'importing' ? 'Leads werden importiert...' : 'Discovery-Agent arbeitet...'}
        </div>
        <div
          style={{
            fontSize: 13,
            color: C.text3,
            animation: 'drPulse 2s ease infinite',
          }}
        >
          {phase === 'importing' ? 'Bitte kurz warten' : LOADING_MESSAGES[msgIdx]}
        </div>
        {phase === 'loading' && (
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
        )}
      </div>
    );
  }

  // ─── RESULTS ────────────────────────────────────────────────────────────
  if (phase === 'results') {
    return (
      <div style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both', maxWidth: 880, margin: '0 auto' }}>
        <div style={{ marginTop: 16, marginBottom: 20, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.text1, margin: 0 }}>
              {leads.length} potenzielle Leads gefunden
            </h2>
            <p style={{ fontSize: 13, color: C.text2, margin: '6px 0 0' }}>
              W&auml;hle die Leads, die du in deine Liste importieren m&ouml;chtest.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => {
                setPhase('form');
                setLeads([]);
                setSelected(new Set());
              }}
              style={{
                padding: '10px 18px',
                background: 'transparent',
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                fontSize: 13,
                color: C.text2,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Neue Suche
            </button>
            <button
              onClick={handleImport}
              disabled={selectedCount === 0}
              style={{
                padding: '10px 22px',
                background:
                  selectedCount > 0 ? 'linear-gradient(135deg, #059669, #34D399)' : C.surface2,
                color: selectedCount > 0 ? '#fff' : C.text3,
                border: selectedCount > 0 ? 'none' : `1px solid ${C.border}`,
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: selectedCount > 0 ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
                boxShadow: selectedCount > 0 ? '0 2px 12px rgba(52,211,153,0.25)' : 'none',
              }}
            >
              {selectedCount} importieren &rarr;
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 16,
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

        {leads.length === 0 ? (
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: 32,
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 14, color: C.text2, margin: 0 }}>
              Der Agent hat keine Leads zur&uuml;ckgegeben. Die Rohantwort wird unten angezeigt &mdash;
              vermutlich passt das Response-Format noch nicht.
            </p>
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                marginBottom: 10,
                cursor: 'pointer',
              }}
              onClick={toggleAll}
            >
              <input
                type="checkbox"
                checked={selected.size === leads.length && leads.length > 0}
                onChange={toggleAll}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontSize: 12, color: C.text2 }}>
                {selected.size === leads.length ? 'Alle abw&auml;hlen' : 'Alle ausw&auml;hlen'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {leads.map((lead, idx) => {
                const key = leadKey(lead, idx);
                const isSelected = selected.has(key);
                const website = leadWebsite(lead);
                const industry = leadIndustry(lead);
                const location = leadLocation(lead);
                const employees = leadEmployees(lead);
                const reasoning = leadReasoning(lead);

                return (
                  <div
                    key={key}
                    onClick={() => toggleSelect(key)}
                    style={{
                      display: 'flex',
                      gap: 14,
                      padding: '14px 16px',
                      background: isSelected ? 'rgba(52,211,153,0.04)' : C.surface,
                      border: `1px solid ${isSelected ? 'rgba(52,211,153,0.25)' : C.border}`,
                      borderRadius: 10,
                      cursor: 'pointer',
                      transition: 'background 0.15s, border-color 0.15s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(key)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ marginTop: 3, cursor: 'pointer', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: C.text1 }}>
                          {leadName(lead)}
                        </span>
                        {website && (
                          <a
                            href={website.startsWith('http') ? website : `https://${website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{ fontSize: 12, color: '#34D399', textDecoration: 'none' }}
                          >
                            {website.replace(/^https?:\/\//, '')}
                          </a>
                        )}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: 14,
                          marginTop: 4,
                          fontSize: 11,
                          color: C.text3,
                          flexWrap: 'wrap',
                        }}
                      >
                        {industry && <span>{industry}</span>}
                        {location && <span>{location}</span>}
                        {employees && <span>{employees} MA</span>}
                      </div>
                      {reasoning && (
                        <p
                          style={{
                            fontSize: 12,
                            color: C.text2,
                            margin: '8px 0 0',
                            lineHeight: 1.55,
                          }}
                        >
                          {reasoning}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Debug: raw response toggle */}
        {rawResponse != null && (
          <div style={{ marginTop: 28 }}>
            <button
              onClick={() => setShowRaw((v) => !v)}
              style={{
                background: 'transparent',
                border: 'none',
                color: C.text3,
                fontSize: 11,
                cursor: 'pointer',
                fontFamily: 'inherit',
                padding: 0,
              }}
            >
              {showRaw ? '▾ Rohantwort verbergen' : '▸ Rohantwort anzeigen (Debug)'}
            </button>
            {showRaw && (
              <pre
                style={{
                  marginTop: 8,
                  padding: 14,
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  fontSize: 11,
                  color: C.text2,
                  overflow: 'auto',
                  maxHeight: 320,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                }}
              >
                {JSON.stringify(rawResponse, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    );
  }

  // ─── DONE ───────────────────────────────────────────────────────────────
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
        {importedCount} {importedCount === 1 ? 'Lead' : 'Leads'} importiert!
      </h2>
      <p style={{ fontSize: 14, color: C.text2, margin: '0 0 32px', lineHeight: 1.6 }}>
        Die neuen Leads sind jetzt in deiner Liste verf&uuml;gbar.
      </p>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <Link
          href="/dashboard/unternehmen"
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
          }}
        >
          &rarr; Zu den Leads
        </Link>
        <button
          onClick={() => {
            setPhase('form');
            setFreetext('');
            setLeads([]);
            setSelected(new Set());
            setRawResponse(null);
            setElapsed(0);
            setImportedCount(0);
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
          }}
        >
          Neue Suche
        </button>
      </div>
    </div>
  );
}
