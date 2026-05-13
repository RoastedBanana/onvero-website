'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTheme, colors } from '../layout';

type Lead = {
  id: string;
  name: string;
  city: string;
  industry: string;
  score: number;
  fit: number;
  volume: number;
  zeit: number;
  status: 'hot' | 'warm' | 'cold' | 'disqualified';
  assignee: string;
  assigneeColor: string;
  lastActivity: string;
  redflags: number;
  greenflags: number;
};

const LEADS: Lead[] = [
  {
    id: 'demo',
    name: 'Nordvik Home & Living GmbH',
    city: 'Hamburg',
    industry: 'Möbel & Einrichtung',
    score: 95,
    fit: 92,
    volume: 88,
    zeit: 96,
    status: 'hot',
    assignee: 'HL',
    assigneeColor: '#4F46E5',
    lastActivity: 'Vor 2 Std.',
    redflags: 0,
    greenflags: 4,
  },
  {
    id: '1',
    name: 'Fashion House GmbH',
    city: 'München',
    industry: 'Mode & Bekleidung',
    score: 91,
    fit: 89,
    volume: 94,
    zeit: 87,
    status: 'hot',
    assignee: 'SK',
    assigneeColor: '#7C3AED',
    lastActivity: 'Vor 4 Std.',
    redflags: 1,
    greenflags: 3,
  },
  {
    id: '2',
    name: 'TechFlow Solutions AG',
    city: 'Berlin',
    industry: 'B2B SaaS',
    score: 78,
    fit: 82,
    volume: 71,
    zeit: 79,
    status: 'warm',
    assignee: 'TB',
    assigneeColor: '#0891B2',
    lastActivity: 'Gestern',
    redflags: 1,
    greenflags: 2,
  },
  {
    id: '3',
    name: 'Küchenprofi Handel GmbH',
    city: 'Köln',
    industry: 'Haushaltsgeräte',
    score: 74,
    fit: 76,
    volume: 68,
    zeit: 80,
    status: 'warm',
    assignee: 'HL',
    assigneeColor: '#4F46E5',
    lastActivity: 'Vor 2 Tagen',
    redflags: 2,
    greenflags: 2,
  },
  {
    id: '4',
    name: 'Baumarkt Nord GmbH',
    city: 'Bremen',
    industry: 'Baumaterialien',
    score: 62,
    fit: 58,
    volume: 70,
    zeit: 60,
    status: 'warm',
    assignee: 'SK',
    assigneeColor: '#7C3AED',
    lastActivity: 'Vor 3 Tagen',
    redflags: 2,
    greenflags: 1,
  },
  {
    id: '5',
    name: 'Sporthaus Rheinland AG',
    city: 'Düsseldorf',
    industry: 'Sportartikel',
    score: 45,
    fit: 42,
    volume: 51,
    zeit: 43,
    status: 'cold',
    assignee: 'TB',
    assigneeColor: '#0891B2',
    lastActivity: 'Vor 5 Tagen',
    redflags: 3,
    greenflags: 1,
  },
  {
    id: '6',
    name: 'Textil Center Süd GmbH',
    city: 'Stuttgart',
    industry: 'Textilgroßhandel',
    score: 38,
    fit: 35,
    volume: 44,
    zeit: 36,
    status: 'cold',
    assignee: 'HL',
    assigneeColor: '#4F46E5',
    lastActivity: 'Vor 1 Woche',
    redflags: 4,
    greenflags: 0,
  },
  {
    id: '7',
    name: 'Elektroshop Online GmbH',
    city: 'Frankfurt',
    industry: 'Consumer Electronics',
    score: 22,
    fit: 20,
    volume: 28,
    zeit: 18,
    status: 'disqualified',
    assignee: 'SK',
    assigneeColor: '#7C3AED',
    lastActivity: 'Vor 2 Wochen',
    redflags: 5,
    greenflags: 0,
  },
];

const STATUS_CFG = {
  hot: { label: 'Hot', light: { bg: '#FEF2F2', color: '#DC2626' }, dark: { bg: '#2D1515', color: '#FCA5A5' } },
  warm: { label: 'Warm', light: { bg: '#FFFBEB', color: '#D97706' }, dark: { bg: '#2D2010', color: '#FCD34D' } },
  cold: { label: 'Kalt', light: { bg: '#F0F9FF', color: '#0369A1' }, dark: { bg: '#0C1F2D', color: '#7DD3FC' } },
  disqualified: {
    label: 'Disqualifiziert',
    light: { bg: '#F8FAFC', color: '#94A3B8' },
    dark: { bg: '#1A1D24', color: '#64748B' },
  },
};

type FilterStatus = 'all' | Lead['status'];

function ScoreRing({ score, size = 40 }: { score: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : score >= 40 ? '#F97316' : '#EF4444';
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8ECF0" strokeWidth={5} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - score / 100)}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill={color}
        fontSize={11}
        fontWeight={700}
        fontFamily="Inter, sans-serif"
      >
        {score}
      </text>
    </svg>
  );
}

export default function QualifizierungPage() {
  const { theme } = useTheme();
  const c = colors(theme);
  const isDark = theme === 'dark';

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [search, setSearch] = useState('');

  const EMPLOYEES = [
    { id: 'all', label: 'Alle' },
    { id: 'HL', label: 'Hans L.', color: '#4F46E5' },
    { id: 'SK', label: 'Sarah K.', color: '#7C3AED' },
    { id: 'TB', label: 'Tim B.', color: '#0891B2' },
  ];

  const filtered = LEADS.filter((l) => {
    if (filterStatus !== 'all' && l.status !== filterStatus) return false;
    if (filterAssignee !== 'all' && l.assignee !== filterAssignee) return false;
    if (
      search &&
      !l.name.toLowerCase().includes(search.toLowerCase()) &&
      !l.city.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  }).sort((a, b) => b.score - a.score);

  const hotCount = LEADS.filter((l) => l.status === 'hot').length;
  const warmCount = LEADS.filter((l) => l.status === 'warm').length;
  const avgScore = Math.round(LEADS.reduce((s, l) => s + l.score, 0) / LEADS.length);

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI strip */}
      <div style={{ display: 'flex', gap: 16 }}>
        {[
          { label: 'Hot Leads', value: hotCount, color: '#DC2626', bg: isDark ? '#2D1515' : '#FEF2F2' },
          { label: 'Warm Leads', value: warmCount, color: '#D97706', bg: isDark ? '#2D2010' : '#FFFBEB' },
          { label: 'Ø Score', value: avgScore, color: c.accent, bg: isDark ? '#1A1A2E' : '#EEF2FF' },
          { label: 'Gesamt', value: LEADS.length, color: c.text, bg: c.bgPage },
        ].map((k) => (
          <div
            key={k.label}
            style={{
              flex: 1,
              padding: '16px 20px',
              background: c.bgCard,
              border: `1px solid ${c.border}`,
              borderRadius: 12,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: c.textSub, marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Suchen..."
          style={{
            padding: '7px 12px',
            borderRadius: 8,
            border: `1px solid ${c.border}`,
            fontSize: 13,
            outline: 'none',
            color: c.text,
            background: c.bgPage,
            width: 200,
          }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'hot', 'warm', 'cold', 'disqualified'] as FilterStatus[]).map((s) => {
            const active = filterStatus === s;
            const cfg = s === 'all' ? null : STATUS_CFG[s];
            const col = s === 'all' ? null : isDark ? cfg!.dark : cfg!.light;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 99,
                  border: `1.5px solid ${active ? (col?.color ?? c.accent) : 'transparent'}`,
                  background: active ? (col?.bg ?? c.bgPage) : 'transparent',
                  color: active ? (col?.color ?? c.text) : c.textMuted,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {s === 'all' ? 'Alle' : STATUS_CFG[s].label}
              </button>
            );
          })}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {EMPLOYEES.map((e) => {
            const active = filterAssignee === e.id;
            return (
              <button
                key={e.id}
                onClick={() => setFilterAssignee(e.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 99,
                  border: `1.5px solid ${active && e.color ? e.color : 'transparent'}`,
                  background: active && e.color ? e.color + '18' : 'transparent',
                  color: active && e.color ? e.color : c.textMuted,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {e.label}
              </button>
            );
          })}
        </div>
        <Link
          href="/intelligence/leads"
          style={{
            padding: '7px 16px',
            borderRadius: 8,
            background: c.accent,
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          Alle Leads
        </Link>
      </div>

      {/* Table */}
      <div style={{ background: c.bgCard, border: `1px solid ${c.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '44px 1fr 120px 160px 100px 90px 80px',
            padding: '10px 20px',
            background: c.bgPage,
            borderBottom: `1px solid ${c.border}`,
            fontSize: 11,
            fontWeight: 700,
            color: c.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            gap: 8,
          }}
        >
          <div />
          <div>Unternehmen</div>
          <div>Status</div>
          <div>Sub-Scores</div>
          <div>Signale</div>
          <div>Zuständig</div>
          <div>Aktivität</div>
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: c.textMuted, fontSize: 14 }}>
            Keine Leads gefunden.
          </div>
        )}

        {filtered.map((lead, i) => {
          const cfg = STATUS_CFG[lead.status];
          const col = isDark ? cfg.dark : cfg.light;
          return (
            <Link
              key={lead.id}
              href={`/intelligence/leads/${lead.id}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '44px 1fr 120px 160px 100px 90px 80px',
                padding: '12px 20px',
                borderBottom: i < filtered.length - 1 ? `1px solid ${c.border}` : 'none',
                alignItems: 'center',
                gap: 8,
                textDecoration: 'none',
                color: 'inherit',
                transition: 'background 0.12s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = c.bgPage)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <ScoreRing score={lead.score} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: c.text }}>{lead.name}</div>
                <div style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>
                  {lead.city} · {lead.industry}
                </div>
              </div>
              <div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 99,
                    background: col.bg,
                    color: col.color,
                  }}
                >
                  {cfg.label}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { l: 'Fit', v: lead.fit, color: c.accent },
                  { l: 'Vol', v: lead.volume, color: '#0891B2' },
                  { l: 'Zeit', v: lead.zeit, color: '#10B981' },
                ].map((s) => (
                  <div key={s.l} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: c.textMuted }}>{s.l}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, fontSize: 12 }}>
                {lead.greenflags > 0 && <span style={{ color: '#10B981', fontWeight: 700 }}>+{lead.greenflags}</span>}
                {lead.redflags > 0 && <span style={{ color: '#EF4444', fontWeight: 700 }}>-{lead.redflags}</span>}
                {lead.greenflags === 0 && lead.redflags === 0 && <span style={{ color: c.textMuted }}>—</span>}
              </div>
              <div>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: lead.assigneeColor,
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {lead.assignee}
                </div>
              </div>
              <div style={{ fontSize: 12, color: c.textMuted }}>{lead.lastActivity}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
