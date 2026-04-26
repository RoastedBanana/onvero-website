'use client';

import { useState } from 'react';
import { Search, ShieldOff, Sparkles, X } from 'lucide-react';

interface Props {
  isExcluded: boolean;
  exclusionReason: string | null | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  websiteData: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  followUpContext: any;
}

function hasContent(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') return Object.keys(v as object).length > 0;
  return true;
}

function StructuredField({ label, value }: { label: string; value: unknown }) {
  if (value == null) return null;
  if (typeof value === 'boolean') {
    return (
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          {label}
        </div>
        <span
          style={{
            display: 'inline-block',
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 6,
            background: value ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
            border: `1px solid ${value ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.25)'}`,
            color: value ? '#ef4444' : '#22C55E',
            fontWeight: 500,
          }}
        >
          {value ? 'Ja' : 'Nein'}
        </span>
      </div>
    );
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    return (
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          {label}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {value.map((v, i) => (
            <div
              key={i}
              style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.75)',
                lineHeight: 1.5,
                display: 'flex',
                gap: 8,
              }}
            >
              <span style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>•</span>
              <span>{String(v)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (typeof value === 'string' && value.trim() === '') return null;
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 9,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.35)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>{String(value)}</div>
    </div>
  );
}

const FOLLOW_UP_LABELS: Record<string, string> = {
  company_description: 'Unternehmen',
  usp: 'USP',
  core_services: 'Kernleistungen',
  target_customers: 'Zielkunden',
  pain_points: 'Pain Points',
  tone_of_voice: 'Tone of Voice',
  unique_value: 'Alleinstellung',
  recent_news: 'Aktuelles',
  buying_signals: 'Kaufsignale',
  growth_signals: 'Growth Signals',
  tech_stack: 'Tech-Stack',
  website_highlights: 'Website Highlights',
  automation_potential: 'Automatisierungspotenzial',
  automation_opportunities: 'Automatisierungschancen',
  company_size_signals: 'Größensignale',
  personalization_hooks: 'Personalisierungs-Hooks',
  cloudflare_blocked: 'Cloudflare blockiert',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StructuredView({ data }: { data: any }) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const knownKeys = Object.keys(FOLLOW_UP_LABELS);
  const knownEntries = knownKeys.filter((k) => k in data);
  const otherEntries = Object.keys(data).filter((k) => !knownKeys.includes(k));
  return (
    <div>
      {knownEntries.map((k) => (
        <StructuredField key={k} label={FOLLOW_UP_LABELS[k]} value={data[k]} />
      ))}
      {otherEntries.map((k) => (
        <StructuredField key={k} label={k.replace(/_/g, ' ')} value={data[k]} />
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ResearchModal({ data, title, onClose }: { data: any; title: string; onClose: () => void }) {
  const isString = typeof data === 'string';
  const isStructured = data && typeof data === 'object' && !Array.isArray(data);
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0e0e0e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14,
          maxWidth: 760,
          width: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.95)' }}>{title}</div>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>
        <div style={{ overflow: 'auto', padding: 20 }}>
          {isString ? (
            <div
              style={{
                fontSize: 13,
                color: 'rgba(255,255,255,0.75)',
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {data}
            </div>
          ) : isStructured ? (
            <StructuredView data={data} />
          ) : (
            <pre
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.55,
                fontFamily: 'var(--font-dm-mono)',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResearchStatus({ isExcluded, exclusionReason, websiteData, followUpContext }: Props) {
  const [modal, setModal] = useState<null | 'deep' | 'basic'>(null);
  const hasDeepResearch = hasContent(websiteData);

  // Color theming
  const accent = isExcluded ? '#ef4444' : '#6B7AFF';
  const accentBg = isExcluded ? 'rgba(239,68,68,0.08)' : 'rgba(107,122,255,0.08)';
  const accentBorder = isExcluded ? 'rgba(239,68,68,0.25)' : 'rgba(107,122,255,0.22)';
  const accentSoftBg = isExcluded ? 'rgba(239,68,68,0.04)' : 'rgba(107,122,255,0.04)';

  // Box color/title from is_excluded; button shows whichever data we have
  const hasBasic = hasContent(followUpContext);
  const statusLabel = isExcluded ? 'Ausgeschlossen' : 'Deep Research';
  const statusIcon = isExcluded ? <ShieldOff size={14} /> : <Search size={14} />;

  return (
    <>
      <div
        style={{
          background: accentSoftBg,
          border: `1px solid ${accentBorder}`,
          borderRadius: 12,
          padding: 18,
          marginBottom: 14,
        }}
      >
        {/* Status header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: accentBg,
              border: `1px solid ${accentBorder}`,
              color: accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {statusIcon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.35)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: 2,
              }}
            >
              Recherche
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: accent }}>{statusLabel}</div>
          </div>
        </div>

        {/* Reason (shows whenever there is one, color follows is_excluded) */}
        {exclusionReason && (
          <div
            style={{
              background: 'rgba(0,0,0,0.25)',
              border: `1px solid ${accentBorder}`,
              borderRadius: 8,
              padding: '10px 12px',
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: accent,
                opacity: 0.7,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              {isExcluded ? 'Ausschlussgrund' : 'Begründung'}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55 }}>
              {exclusionReason}
            </div>
          </div>
        )}

        {/* Action buttons — show deep button when website_data exists, basic button when follow_up_context exists */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {hasDeepResearch && (
            <button
              onClick={() => setModal('deep')}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: `1px solid ${accentBorder}`,
                background: accentBg,
                color: accent,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontFamily: 'var(--font-dm-sans)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isExcluded
                  ? 'rgba(239,68,68,0.14)'
                  : 'rgba(107,122,255,0.14)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = accentBg;
              }}
            >
              <Search size={12} />
              Deep Research ansehen
            </button>
          )}
          {hasBasic && (
            <button
              onClick={() => setModal('basic')}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
                color: 'rgba(255,255,255,0.6)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontFamily: 'var(--font-dm-sans)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              }}
            >
              <Sparkles size={12} />
              Basic Research ansehen
            </button>
          )}
          {!hasDeepResearch && !hasBasic && (
            <div
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
                color: 'rgba(255,255,255,0.3)',
                fontSize: 12,
                textAlign: 'center',
                fontFamily: 'var(--font-dm-sans)',
              }}
            >
              Keine Recherche-Daten vorhanden
            </div>
          )}
        </div>
      </div>

      {modal === 'deep' && (
        <ResearchModal data={websiteData} title="Deep Research – Website Daten" onClose={() => setModal(null)} />
      )}
      {modal === 'basic' && (
        <ResearchModal data={followUpContext} title="Basic Research – Kontext" onClose={() => setModal(null)} />
      )}
    </>
  );
}
