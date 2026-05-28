'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme, colors } from '../layout';
import { GlassPageFilters } from '@/components/ui/liquid-glass-card';

// ─── Types & Data ─────────────────────────────────────────────────────────────

type ArchivStatus = 'discovered_unscored' | 'scoring' | 'scored' | 'exported';
type ArchivSource = 'google_maps' | 'linkedin' | 'web' | 'manual';

type ArchivLead = {
  id: string;
  name: string;
  city: string;
  industry: string;
  employees: string;
  source: ArchivSource;
  status: ArchivStatus;
  score?: number;
  discoveredAt: string;
  tags: string[];
};

const ARCHIV_LEADS: ArchivLead[] = [
  {
    id: 'a1',
    name: 'Wohnwerk Hamburg GmbH',
    city: 'Hamburg',
    industry: 'Möbel & Einrichtung',
    employees: '45–80',
    source: 'google_maps',
    status: 'discovered_unscored',
    discoveredAt: 'Heute, 14:32',
    tags: ['möbel', 'b2c'],
  },
  {
    id: 'a2',
    name: 'Stilhaus Berlin AG',
    city: 'Berlin',
    industry: 'Interior Design',
    employees: '20–40',
    source: 'linkedin',
    status: 'discovered_unscored',
    discoveredAt: 'Heute, 14:32',
    tags: ['design', 'premium'],
  },
  {
    id: 'a3',
    name: 'Formschön München',
    city: 'München',
    industry: 'Möbelhandel',
    employees: '10–25',
    source: 'web',
    status: 'scoring',
    discoveredAt: 'Heute, 11:15',
    tags: ['möbel'],
  },
  {
    id: 'a4',
    name: 'Nordisk Living GmbH',
    city: 'Köln',
    industry: 'Skandinavisches Design',
    employees: '30–60',
    source: 'google_maps',
    status: 'scored',
    score: 74,
    discoveredAt: 'Gestern, 16:44',
    tags: ['design', 'nordic'],
  },
  {
    id: 'a5',
    name: 'Lofthaus Stuttgart',
    city: 'Stuttgart',
    industry: 'Premium-Möbel',
    employees: '15–30',
    source: 'linkedin',
    status: 'scored',
    score: 68,
    discoveredAt: 'Gestern, 16:44',
    tags: ['premium', 'möbel'],
  },
  {
    id: 'a6',
    name: 'Stylehaus AG',
    city: 'Düsseldorf',
    industry: 'Mode & Bekleidung',
    employees: '60–120',
    source: 'linkedin',
    status: 'scored',
    score: 81,
    discoveredAt: 'Vor 2 Tagen',
    tags: ['fashion', 'b2c'],
  },
  {
    id: 'a7',
    name: 'Urban Threads GmbH',
    city: 'Hamburg',
    industry: 'Streetwear',
    employees: '20–45',
    source: 'web',
    status: 'exported',
    score: 79,
    discoveredAt: 'Vor 3 Tagen',
    tags: ['fashion', 'streetwear'],
  },
  {
    id: 'a8',
    name: 'Modekontor Nürnberg',
    city: 'Nürnberg',
    industry: 'Textilhandel',
    employees: '30–50',
    source: 'google_maps',
    status: 'exported',
    score: 65,
    discoveredAt: 'Vor 4 Tagen',
    tags: ['textil', 'handel'],
  },
  {
    id: 'a9',
    name: 'CloudBase Solutions GmbH',
    city: 'München',
    industry: 'B2B SaaS',
    employees: '25–60',
    source: 'linkedin',
    status: 'discovered_unscored',
    discoveredAt: 'Vor 5 Tagen',
    tags: ['saas', 'b2b'],
  },
  {
    id: 'a10',
    name: 'Flowmatic AG',
    city: 'Berlin',
    industry: 'Process Automation',
    employees: '40–80',
    source: 'web',
    status: 'scored',
    score: 72,
    discoveredAt: 'Vor 5 Tagen',
    tags: ['automation', 'b2b'],
  },
];

const SOURCE_CFG: Record<ArchivSource, { label: string; color: string }> = {
  google_maps: { label: 'Google Maps', color: '#34A853' },
  linkedin: { label: 'LinkedIn', color: '#0077B5' },
  web: { label: 'Web', color: '#6366F1' },
  manual: { label: 'Manuell', color: '#94A3B8' },
};

const STATUS_CFG: Record<ArchivStatus, { label: string; color: string; bg: string }> = {
  discovered_unscored: { label: 'Entdeckt', color: '#94A3B8', bg: 'rgba(148,163,184,0.15)' },
  scoring: { label: 'Scoring läuft', color: '#F97316', bg: 'rgba(249,115,22,0.15)' },
  scored: { label: 'Bewertet', color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
  exported: { label: 'Übertragen', color: '#64748B', bg: 'rgba(100,116,139,0.12)' },
};

// ─── Same palette as leads page ───────────────────────────────────────────────

const AVATAR_PALETTE = [
  { bg: '#EEF0FF', color: '#4F46E5' },
  { bg: '#ECFDF5', color: '#059669' },
  { bg: '#FDF2F8', color: '#9D174D' },
  { bg: '#FFF7ED', color: '#C2410C' },
  { bg: '#F0F9FF', color: '#0369A1' },
  { bg: '#F5F3FF', color: '#7C3AED' },
  { bg: '#ECFEFF', color: '#0891B2' },
  { bg: '#FEF9C3', color: '#CA8A04' },
];

function avatarFor(name: string) {
  const idx = (name.charCodeAt(0) + name.charCodeAt(1)) % AVATAR_PALETTE.length;
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return { ...AVATAR_PALETTE[idx], initials };
}

function scoreColor(s: number) {
  if (s >= 80) return '#10B981';
  if (s >= 65) return '#F97316';
  return '#EF4444';
}

function glassCard(isDark: boolean, extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    background: isDark ? 'rgba(10,12,24,0.46)' : 'rgba(255,255,255,0.22)',
    backdropFilter: 'blur(22px)',
    WebkitBackdropFilter: 'blur(22px)',
    borderRadius: 16,
    borderTop: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.55)',
    borderRight: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.55)',
    borderBottom: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.55)',
    borderLeft: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.55)',
    boxShadow: isDark
      ? 'inset 1px 1px 2px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.32)'
      : 'inset 2px 2px 3px rgba(255,255,255,0.50), 0 4px 20px rgba(0,0,0,0.06)',
    ...extra,
  };
}

// ─── Visual components ────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 13;
  const circ = 2 * Math.PI * r;
  const dash = circ * (score / 100);
  const color = scoreColor(score);
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" style={{ flexShrink: 0 }}>
      <circle cx="17" cy="17" r={r} fill="none" stroke="#F1F5F9" strokeWidth="3" />
      <circle
        cx="17"
        cy="17"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        transform="rotate(-90 17 17)"
      />
      <text
        x="17"
        y="21"
        textAnchor="middle"
        fontSize="9.5"
        fontWeight="800"
        fill={color}
        fontFamily="var(--font-inter), sans-serif"
      >
        {score}
      </text>
    </svg>
  );
}

function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  isDark,
  c,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  isDark: boolean;
  c: ReturnType<typeof colors>;
}) {
  const active = checked || indeterminate;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      style={{
        width: 18,
        height: 18,
        borderRadius: 5,
        border: active ? 'none' : `1.5px solid ${c.borderStrong}`,
        background: checked ? c.accent : indeterminate ? c.accent + '22' : c.bgCard,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.15s',
        padding: 0,
        boxShadow: active ? `0 0 0 3px ${c.accent}26` : 'none',
      }}
    >
      {checked && (
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          stroke="#fff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="2 6 5 9 10 3" />
        </svg>
      )}
      {indeterminate && !checked && <div style={{ width: 8, height: 2, background: c.accent, borderRadius: 99 }} />}
    </button>
  );
}

type FilterStatus = 'all' | ArchivStatus;
type FilterSource = 'all' | ArchivSource;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ArchivPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const c = colors(theme);
  const isDark = theme === 'dark';

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterSource, setFilterSource] = useState<FilterSource>('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const filtered = ARCHIV_LEADS.filter((l) => {
    if (filterStatus !== 'all' && l.status !== filterStatus) return false;
    if (filterSource !== 'all' && l.source !== filterSource) return false;
    if (
      search &&
      !l.name.toLowerCase().includes(search.toLowerCase()) &&
      !l.city.toLowerCase().includes(search.toLowerCase()) &&
      !l.industry.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((l) => l.id)));
  }

  function promoteSelected() {
    setSelectedIds(new Set());
    router.push('/intelligence/leads');
  }

  const total = ARCHIV_LEADS.length;
  const unscored = ARCHIV_LEADS.filter((l) => l.status === 'discovered_unscored').length;
  const scoringCount = ARCHIV_LEADS.filter((l) => l.status === 'scoring').length;
  const scored = ARCHIV_LEADS.filter((l) => l.status === 'scored').length;
  const exported = ARCHIV_LEADS.filter((l) => l.status === 'exported').length;

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100%',
        padding: '84px 32px 48px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        fontFamily: 'var(--font-inter), sans-serif',
        color: c.text,
      }}
    >
      <style>{`@keyframes archiv-pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
      <GlassPageFilters />

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 4 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#10B981',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          Discovery
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1
            style={{ fontSize: 36, fontWeight: 800, color: c.text, margin: 0, letterSpacing: '-0.03em', lineHeight: 1 }}
          >
            Archiv
          </h1>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              background: 'rgba(16,185,129,0.15)',
              color: '#10B981',
              borderRadius: 99,
              padding: '3px 10px',
            }}
          >
            {total}
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginLeft: 4,
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              borderRadius: 99,
              padding: '4px 10px',
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: c.textMuted }}>Sync aktiv</span>
          </div>
        </div>
        <p style={{ fontSize: 13, color: c.textMuted, margin: '8px 0 0' }}>
          {unscored} Entdeckt · {scoringCount} Scoring · {scored} Bewertet · {exported} Übertragen
        </p>
      </div>

      {/* ── KPI cards ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          {
            label: 'Gesamt',
            value: total,
            color: '#94A3B8',
            bg: 'rgba(148,163,184,0.12)',
            sub: 'Alle Rohdaten',
            bar: (
              <div style={{ display: 'flex', height: 3, borderRadius: 99, overflow: 'hidden', marginTop: 10, gap: 1 }}>
                <div style={{ flex: unscored + scoringCount, background: '#94A3B8', borderRadius: 99 }} />
                <div style={{ flex: scored, background: '#10B981', borderRadius: 99 }} />
                <div style={{ flex: exported, background: '#64748B', borderRadius: 99 }} />
              </div>
            ),
          },
          {
            label: 'Entdeckt',
            value: unscored + scoringCount,
            color: '#F97316',
            bg: 'rgba(249,115,22,0.12)',
            sub: 'Noch nicht bewertet',
            bar: null,
          },
          {
            label: 'Bewertet',
            value: scored,
            color: '#10B981',
            bg: 'rgba(16,185,129,0.12)',
            sub: 'Bereit zur Übernahme',
            bar: null,
          },
          {
            label: 'Übertragen',
            value: exported,
            color: '#64748B',
            bg: 'rgba(100,116,139,0.12)',
            sub: 'In der Pipeline',
            bar: null,
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              ...glassCard(isDark),
              borderRadius: 12,
              padding: '16px 20px',
              borderTop: `3px solid ${s.color}`,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 14,
                right: 18,
                width: 32,
                height: 32,
                borderRadius: 8,
                background: s.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color }} />
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: c.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 6,
              }}
            >
              {s.label}
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: c.textMuted, marginTop: 4 }}>{s.sub}</div>
            {s.bar}
          </div>
        ))}
      </div>

      {/* ── Filter bar ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {/* Search */}
        <div style={{ flex: 1, position: 'relative' }}>
          <svg
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            stroke={c.textMuted}
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <circle cx="7" cy="7" r="5" />
            <line x1="11" y1="11" x2="14" y2="14" />
          </svg>
          <input
            placeholder="Suchen nach Name, Stadt, Branche..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 36px',
              border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(0,0,0,0.10)',
              borderRadius: 9,
              fontSize: 13,
              fontFamily: 'inherit',
              outline: 'none',
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(12px)',
              color: c.text,
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Status filter */}
        <div
          style={{
            display: 'flex',
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.07)',
            borderRadius: 9,
            padding: 3,
            gap: 2,
          }}
        >
          {(['all', 'discovered_unscored', 'scoring', 'scored', 'exported'] as FilterStatus[]).map((s) => {
            const labels: Record<string, string> = {
              all: 'Alle',
              discovered_unscored: 'Entdeckt',
              scoring: 'Scoring',
              scored: 'Bewertet',
              exported: 'Übertragen',
            };
            const statusColors: Record<string, string> = {
              all: c.text,
              discovered_unscored: '#94A3B8',
              scoring: '#F97316',
              scored: '#10B981',
              exported: '#64748B',
            };
            const active = filterStatus === s;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 7,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: active ? (isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.70)') : 'transparent',
                  color: active ? statusColors[s] : c.textMuted,
                  boxShadow: active ? '0 1px 4px rgba(10,37,64,0.08)' : 'none',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
              >
                {labels[s]}
              </button>
            );
          })}
        </div>

        {/* Source filter */}
        <div style={{ display: 'flex', gap: 4 }}>
          {(['all', 'google_maps', 'linkedin', 'web'] as FilterSource[]).map((s) => {
            const labels: Record<string, string> = {
              all: 'Alle Quellen',
              google_maps: 'Google Maps',
              linkedin: 'LinkedIn',
              web: 'Web',
            };
            const active = filterSource === s;
            const col = s === 'all' ? null : SOURCE_CFG[s as ArchivSource].color;
            return (
              <button
                key={s}
                onClick={() => setFilterSource(s)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 9,
                  border:
                    active && col
                      ? `1.5px solid ${col}60`
                      : isDark
                        ? '1px solid rgba(255,255,255,0.10)'
                        : '1px solid rgba(0,0,0,0.10)',
                  background: active && col ? col + '14' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.55)',
                  backdropFilter: 'blur(12px)',
                  color: active && col ? col : c.textMuted,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
              >
                {labels[s]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────────── */}
      <div style={{ ...glassCard(isDark), borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr
              style={{
                background:
                  selectedIds.size > 0
                    ? isDark
                      ? 'rgba(16,185,129,0.10)'
                      : 'rgba(16,185,129,0.06)'
                    : isDark
                      ? 'rgba(255,255,255,0.03)'
                      : 'rgba(0,0,0,0.02)',
                borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.07)',
                transition: 'background 0.15s',
              }}
            >
              <th style={{ padding: '11px 14px', width: 36 }}>
                <Checkbox
                  checked={filtered.length > 0 && selectedIds.size === filtered.length}
                  indeterminate={selectedIds.size > 0 && selectedIds.size < filtered.length}
                  onChange={toggleAll}
                  isDark={isDark}
                  c={c}
                />
              </th>
              {['Unternehmen', 'Status', 'Score', 'Quelle', 'Größe', 'Entdeckt'].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: 'left',
                    padding: '11px 14px',
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    color: c.textMuted,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
              <th style={{ padding: '11px 14px', width: 130 }} />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '48px 24px', textAlign: 'center', color: c.textMuted, fontSize: 13 }}>
                  Keine Einträge gefunden
                </td>
              </tr>
            )}
            {filtered.map((lead) => {
              const statusCfg = STATUS_CFG[lead.status];
              const sourceCfg = SOURCE_CFG[lead.source];
              const isSelected = selectedIds.has(lead.id);
              const isHovered = hoveredRow === lead.id;
              const av = avatarFor(lead.name);
              const canOpen = lead.status === 'scored' || lead.status === 'exported';

              return (
                <tr
                  key={lead.id}
                  onMouseEnter={() => setHoveredRow(lead.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => {
                    if (canOpen) router.push(`/intelligence/leads/${lead.id}`);
                  }}
                  style={{
                    borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)',
                    background: isSelected
                      ? isDark
                        ? 'rgba(16,185,129,0.12)'
                        : 'rgba(16,185,129,0.07)'
                      : isHovered
                        ? isDark
                          ? 'rgba(255,255,255,0.04)'
                          : 'rgba(0,0,0,0.03)'
                        : 'transparent',
                    cursor: canOpen ? 'pointer' : 'default',
                    transition: 'background 0.1s',
                    boxShadow: isSelected ? 'inset 3px 0 0 #10B981' : 'none',
                    userSelect: 'none',
                  }}
                >
                  <td style={{ padding: '10px 14px' }}>
                    <Checkbox checked={isSelected} onChange={() => toggleSelect(lead.id)} isDark={isDark} c={c} />
                  </td>

                  {/* Company */}
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 9,
                          background: av.bg,
                          color: av.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 800,
                          flexShrink: 0,
                          letterSpacing: '0.02em',
                        }}
                      >
                        {av.initials}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: c.text, fontSize: 13 }}>{lead.name}</div>
                        <div style={{ fontSize: 11, color: c.textMuted, marginTop: 1 }}>
                          {lead.city} · {lead.industry}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '10px 14px' }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: 99,
                        background: isDark ? statusCfg.color + '22' : statusCfg.bg,
                        color: statusCfg.color,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      {lead.status === 'scoring' && (
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: '#F97316',
                            display: 'inline-block',
                            animation: 'archiv-pulse 1.5s infinite',
                          }}
                        />
                      )}
                      {statusCfg.label}
                    </span>
                  </td>

                  {/* Score */}
                  <td style={{ padding: '10px 14px' }}>
                    {lead.score !== undefined ? (
                      <ScoreRing score={lead.score} />
                    ) : (
                      <span style={{ fontSize: 12, color: c.textMuted }}>—</span>
                    )}
                  </td>

                  {/* Source */}
                  <td style={{ padding: '10px 14px' }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 99,
                        background: sourceCfg.color + '18',
                        color: sourceCfg.color,
                        border: `1px solid ${sourceCfg.color}30`,
                      }}
                    >
                      {sourceCfg.label}
                    </span>
                  </td>

                  {/* Size */}
                  <td style={{ padding: '10px 14px', fontSize: 12, color: c.textSub }}>{lead.employees} MA</td>

                  {/* Date */}
                  <td style={{ padding: '10px 14px', fontSize: 12, color: c.textMuted }}>{lead.discoveredAt}</td>

                  {/* Action */}
                  <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                    {isHovered && lead.status === 'scored' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          promoteSelected();
                        }}
                        style={{
                          padding: '4px 12px',
                          background: '#10B981',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 7,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          fontFamily: 'var(--font-inter), sans-serif',
                        }}
                      >
                        Übernehmen →
                      </button>
                    )}
                    {isHovered && lead.status === 'discovered_unscored' && (
                      <span style={{ fontSize: 11, color: c.textMuted, fontWeight: 600 }}>Wartet auf Score</span>
                    )}
                    {isHovered && lead.status === 'scoring' && (
                      <span style={{ fontSize: 11, color: '#F97316', fontWeight: 600 }}>Scoring läuft...</span>
                    )}
                    {isHovered && lead.status === 'exported' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/intelligence/leads/${lead.id}`);
                        }}
                        style={{
                          padding: '4px 12px',
                          background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                          color: c.textSub,
                          border: isDark ? '1.5px solid rgba(255,255,255,0.12)' : '1.5px solid rgba(0,0,0,0.1)',
                          borderRadius: 7,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          fontFamily: 'var(--font-inter), sans-serif',
                        }}
                      >
                        Öffnen →
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Table footer */}
        <div
          style={{
            padding: '11px 18px',
            borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)',
            fontSize: 11,
            color: c.textMuted,
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>
            {filtered.length} von {total} Einträgen
          </span>
          {selectedIds.size > 0 && <span style={{ color: '#10B981' }}>{selectedIds.size} ausgewählt</span>}
        </div>
      </div>

      {/* ── Selection bar ─────────────────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 36,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 8000,
            background: isDark ? 'rgba(10,12,24,0.82)' : '#0A2540',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : 'none',
            borderRadius: 16,
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 12px 48px rgba(10,37,64,0.36)',
            fontFamily: 'var(--font-inter), sans-serif',
            whiteSpace: 'nowrap',
          }}
        >
          {/* Avatar stack + count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 10px' }}>
            <div style={{ display: 'flex' }}>
              {ARCHIV_LEADS.filter((l) => selectedIds.has(l.id))
                .slice(0, 3)
                .map((l, i) => {
                  const av = avatarFor(l.name);
                  return (
                    <div
                      key={l.id}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: av.color,
                        border: '2px solid #0A2540',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 8,
                        fontWeight: 800,
                        color: '#fff',
                        marginLeft: i === 0 ? 0 : -6,
                        zIndex: 3 - i,
                        position: 'relative',
                      }}
                    >
                      {av.initials[0]}
                    </div>
                  );
                })}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
              {selectedIds.size} {selectedIds.size === 1 ? 'Lead' : 'Leads'}
            </span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>ausgewählt</span>
          </div>

          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

          {/* Zu Leads übertragen */}
          <button
            onClick={promoteSelected}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 9,
              border: 'none',
              background: 'rgba(16,185,129,0.3)',
              color: '#6EE7B7',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 3v10M3 8l5 5 5-5" />
            </svg>
            Zu Leads übertragen
          </button>

          {/* Abwählen */}
          <button
            onClick={() => setSelectedIds(new Set())}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: 'none',
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              marginLeft: 2,
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="3" y1="3" x2="13" y2="13" />
              <line x1="13" y1="3" x2="3" y2="13" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
