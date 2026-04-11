'use client';

import { useState, useEffect } from 'react';
import {
  C,
  SvgIcon,
  PageHeader,
  GhostButton,
  ScoreBar,
  StatusBadge,
  ICONS,
  Breadcrumbs,
  GlowButton,
  HoverCard,
  EmptyState,
  showToast,
  ProgressRing,
} from '../_shared';
import { SlideOver } from '../_slide-over';

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Lead = {
  name: string;
  company: string;
  city: string;
  score: number;
  status: 'Qualifiziert' | 'In Kontakt' | 'Neu' | 'Verloren';
  pipeline: string | null;
  lastActivity: string;
  industry: string;
  employees: string;
};

// ─── MOCK DATA ───────────────────────────────────────────────────────────────

const LEADS: Lead[] = [
  {
    name: 'Marcus Weber',
    company: 'Stackbase GmbH',
    city: 'Hamburg',
    score: 94,
    status: 'Qualifiziert',
    pipeline: '€12.000',
    lastActivity: 'vor 2h',
    industry: 'SaaS',
    employees: '50–100',
  },
  {
    name: 'Sophie Richter',
    company: 'Fenris Labs',
    city: 'Berlin',
    score: 88,
    status: 'In Kontakt',
    pipeline: '€8.500',
    lastActivity: 'vor 4h',
    industry: 'KI / ML',
    employees: '20–50',
  },
  {
    name: 'Lars Jansen',
    company: 'Nordsee Digital',
    city: 'Bremen',
    score: 71,
    status: 'Neu',
    pipeline: null,
    lastActivity: 'vor 1 Tag',
    industry: 'Agentur',
    employees: '10–20',
  },
  {
    name: 'Anna Bergmann',
    company: 'Vaulted GmbH',
    city: 'München',
    score: 85,
    status: 'Qualifiziert',
    pipeline: '€6.200',
    lastActivity: 'vor 6h',
    industry: 'FinTech',
    employees: '100–250',
  },
  {
    name: 'Tom Schreiber',
    company: 'Axflow AG',
    city: 'Zürich',
    score: 92,
    status: 'In Kontakt',
    pipeline: '€18.000',
    lastActivity: 'vor 30 min',
    industry: 'Industrie',
    employees: '250+',
  },
  {
    name: 'Mia Keller',
    company: 'Lightspark',
    city: 'Frankfurt',
    score: 67,
    status: 'Neu',
    pipeline: null,
    lastActivity: 'vor 2 Tagen',
    industry: 'E-Commerce',
    employees: '20–50',
  },
  {
    name: 'Jonas Braun',
    company: 'Deepmark',
    city: 'Stuttgart',
    score: 78,
    status: 'Qualifiziert',
    pipeline: '€4.800',
    lastActivity: 'vor 1 Tag',
    industry: 'Marketing',
    employees: '10–20',
  },
  {
    name: 'Clara Wolff',
    company: 'Silo Labs',
    city: 'Hamburg',
    score: 91,
    status: 'Qualifiziert',
    pipeline: '€9.100',
    lastActivity: 'vor 3h',
    industry: 'SaaS',
    employees: '50–100',
  },
  {
    name: 'Fabian Scholz',
    company: 'Routex',
    city: 'Köln',
    score: 63,
    status: 'Neu',
    pipeline: null,
    lastActivity: 'vor 3 Tagen',
    industry: 'Logistik',
    employees: '100–250',
  },
  {
    name: 'Elena Hartmann',
    company: 'Kairon Medical',
    city: 'München',
    score: 82,
    status: 'In Kontakt',
    pipeline: '€7.400',
    lastActivity: 'vor 5h',
    industry: 'MedTech',
    employees: '50–100',
  },
  {
    name: 'Niklas Frey',
    company: 'Pipeforge',
    city: 'Berlin',
    score: 76,
    status: 'Qualifiziert',
    pipeline: '€5.100',
    lastActivity: 'vor 1 Tag',
    industry: 'SaaS',
    employees: '20–50',
  },
  {
    name: 'Lena Fischer',
    company: 'Greenvolt',
    city: 'Hamburg',
    score: 58,
    status: 'Verloren',
    pipeline: null,
    lastActivity: 'vor 5 Tagen',
    industry: 'CleanTech',
    employees: '10–20',
  },
];

const FILTERS = ['Alle', 'Neu', 'Qualifiziert', 'In Kontakt', 'Verloren'];
const CITY_FILTERS = ['Alle Städte', 'Hamburg', 'Berlin', 'München', 'Zürich', 'Köln'];

// ─── STATS ───────────────────────────────────────────────────────────────────

function LeadStats() {
  const stats = [
    { label: 'Hot Leads', value: '6', sub: 'Score ≥ 85', color: '#F87171', bg: 'rgba(248,113,113,0.06)' },
    { label: 'Warm', value: '4', sub: 'Score 65–84', color: '#FBBF24', bg: 'rgba(251,191,36,0.06)' },
    { label: 'Cold', value: '2', sub: 'Score < 65', color: '#4E5170', bg: 'rgba(255,255,255,0.02)' },
    { label: 'Ø Score', value: '78.8', sub: 'aller Leads', color: '#818CF8', bg: 'rgba(99,102,241,0.06)' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
      {stats.map((s, i) => (
        <div
          key={s.label}
          style={{
            padding: '14px 16px',
            borderRadius: 10,
            background: s.bg,
            border: `1px solid ${C.border}`,
            animation: 'scaleIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
            animationDelay: `${i * 0.06}s`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: s.color,
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                letterSpacing: '-0.03em',
              }}
            >
              {s.value}
            </span>
            <span style={{ fontSize: 11, color: C.text3 }}>{s.sub}</span>
          </div>
          <div style={{ fontSize: 10, color: C.text3, marginTop: 4, letterSpacing: '0.06em', fontWeight: 500 }}>
            {s.label.toUpperCase()}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── FILTER BAR ──────────────────────────────────────────────────────────────

function FilterBar({
  activeStatus,
  activeCity,
  onStatusChange,
  onCityChange,
  search,
  onSearchChange,
}: {
  activeStatus: string;
  activeCity: string;
  onStatusChange: (s: string) => void;
  onCityChange: (c: string) => void;
  search: string;
  onSearchChange: (s: string) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
        animation: 'fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both',
      }}
    >
      {/* Search */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '7px 14px',
          borderRadius: 8,
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${C.border}`,
          minWidth: 200,
        }}
      >
        <SvgIcon d={ICONS.search} size={12} color={C.text3} />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Lead suchen..."
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: C.text1,
            fontSize: 12,
            fontFamily: 'inherit',
            width: '100%',
          }}
        />
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: C.border }} />

      {/* Status Filters */}
      <div style={{ display: 'flex', gap: 4 }}>
        {FILTERS.map((f) => {
          const isActive = activeStatus === f;
          return (
            <button
              key={f}
              className="s-chip"
              onClick={() => onStatusChange(f)}
              style={{
                border: `1px solid ${isActive ? C.borderAccent : C.border}`,
                borderRadius: 8,
                padding: '5px 12px',
                fontSize: 11,
                fontWeight: isActive ? 500 : 400,
                background: isActive ? C.accentGhost : 'transparent',
                color: isActive ? C.accentBright : C.text3,
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: isActive ? 'inset 0 1px 0 rgba(255,255,255,0.03)' : 'none',
              }}
            >
              {f}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: C.border }} />

      {/* City Filter */}
      <select
        value={activeCity}
        onChange={(e) => onCityChange(e.target.value)}
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: '6px 12px',
          fontSize: 11,
          color: C.text2,
          fontFamily: 'inherit',
          cursor: 'pointer',
          outline: 'none',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%234E5170' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 10px center',
          paddingRight: 28,
        }}
      >
        {CITY_FILTERS.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── TABLE ───────────────────────────────────────────────────────────────────

function LeadTable({
  leads,
  selected,
  onToggle,
  onToggleAll,
  onLeadClick,
}: {
  leads: Lead[];
  selected: Set<string>;
  onToggle: (name: string) => void;
  onToggleAll: () => void;
  onLeadClick: (lead: Lead) => void;
}) {
  const headers = ['', 'Kontakt & Firma', 'KI-Score', 'Status', 'Branche', 'Pipeline', 'Letzte Aktivität'];
  const allSelected = leads.length > 0 && leads.every((l) => selected.has(l.name));

  return (
    <div
      style={{
        borderRadius: 12,
        border: `1px solid ${C.border}`,
        overflow: 'hidden',
        background: C.surface,
        boxShadow: '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
        animation: 'fadeInUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both',
      }}
    >
      {/* Batch action bar */}
      {selected.size > 0 && (
        <div
          style={{
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'rgba(99,102,241,0.06)',
            borderBottom: `1px solid rgba(99,102,241,0.12)`,
            animation: 'fadeInUp 0.2s ease both',
          }}
        >
          <span style={{ fontSize: 12, color: C.accentBright, fontWeight: 500 }}>{selected.size} ausgewählt</span>
          <div style={{ width: 1, height: 16, background: 'rgba(99,102,241,0.15)' }} />
          <button
            onClick={() => showToast(`${selected.size} Leads exportiert`, 'success')}
            style={{
              fontSize: 11,
              color: C.accentBright,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              padding: '2px 6px',
            }}
          >
            Exportieren
          </button>
          <button
            onClick={() => showToast('Status geändert', 'info')}
            style={{
              fontSize: 11,
              color: C.accentBright,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              padding: '2px 6px',
            }}
          >
            Status ändern
          </button>
          <button
            onClick={() => showToast(`${selected.size} Leads gelöscht`, 'error')}
            style={{
              fontSize: 11,
              color: C.danger,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              padding: '2px 6px',
            }}
          >
            Löschen
          </button>
        </div>
      )}

      {leads.length === 0 ? (
        <div style={{ padding: 16 }}>
          <EmptyState
            title="Keine Leads gefunden"
            description="Versuche einen anderen Filter oder generiere neue Leads mit der KI."
            icon={ICONS.search}
            action={
              <GlowButton onClick={() => showToast('Lead-Generator wird gestartet...', 'info')}>
                + Lead generieren
              </GlowButton>
            }
          />
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.015)' }}>
              {headers.map((h, hi) => (
                <th
                  key={h || 'check'}
                  style={{
                    textAlign: 'left',
                    padding: hi === 0 ? '12px 12px 12px 18px' : '12px 18px',
                    fontSize: 10,
                    letterSpacing: '0.08em',
                    color: C.text3,
                    fontWeight: 500,
                    borderBottom: `1px solid ${C.border}`,
                    width: hi === 0 ? 36 : undefined,
                  }}
                >
                  {hi === 0 ? (
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={onToggleAll}
                      style={{ accentColor: C.accent, cursor: 'pointer', width: 14, height: 14 }}
                    />
                  ) : (
                    h
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, i) => {
              const isSelected = selected.has(lead.name);
              return (
                <tr
                  key={lead.name}
                  className="s-row"
                  onClick={() => onLeadClick(lead)}
                  style={{
                    borderBottom: i < leads.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                    cursor: 'pointer',
                    animation: 'fadeIn 0.3s ease both',
                    animationDelay: `${0.25 + i * 0.03}s`,
                    background: isSelected ? 'rgba(99,102,241,0.04)' : undefined,
                  }}
                >
                  {/* Checkbox */}
                  <td style={{ padding: '14px 12px 14px 18px', width: 36 }} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggle(lead.name)}
                      style={{ accentColor: C.accent, cursor: 'pointer', width: 14, height: 14 }}
                    />
                  </td>
                  {/* Contact with HoverCard */}
                  <td style={{ padding: '14px 18px' }}>
                    <HoverCard
                      content={
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <ProgressRing
                              value={lead.score}
                              size={32}
                              strokeWidth={2.5}
                              color={lead.score >= 85 ? C.accent : C.text3}
                              label={`${lead.score}`}
                            />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500, color: C.text1 }}>{lead.name}</div>
                              <div style={{ fontSize: 11, color: C.text3 }}>{lead.company}</div>
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
                            <div>
                              <span style={{ color: C.text3 }}>Stadt:</span>{' '}
                              <span style={{ color: C.text2 }}>{lead.city}</span>
                            </div>
                            <div>
                              <span style={{ color: C.text3 }}>Branche:</span>{' '}
                              <span style={{ color: C.text2 }}>{lead.industry}</span>
                            </div>
                            <div>
                              <span style={{ color: C.text3 }}>Größe:</span>{' '}
                              <span style={{ color: C.text2 }}>{lead.employees} MA</span>
                            </div>
                            <div>
                              <span style={{ color: C.text3 }}>Pipeline:</span>{' '}
                              <span style={{ color: C.text2 }}>{lead.pipeline ?? '—'}</span>
                            </div>
                          </div>
                        </div>
                      }
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: `linear-gradient(135deg, ${C.surface2}, ${C.surface3})`,
                            border: `1px solid ${C.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                            fontWeight: 500,
                            color: C.text2,
                            flexShrink: 0,
                          }}
                        >
                          {lead.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: C.text1, letterSpacing: '-0.01em' }}>
                            {lead.name}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: C.text3,
                              marginTop: 2,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5,
                            }}
                          >
                            <span>{lead.company}</span>
                            <span style={{ opacity: 0.25, fontSize: 8 }}>●</span>
                            <span>{lead.city}</span>
                          </div>
                        </div>
                      </div>
                    </HoverCard>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <ScoreBar score={lead.score} />
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <StatusBadge status={lead.status} />
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{ fontSize: 11.5, color: C.text2 }}>{lead.industry}</span>
                    <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{lead.employees} MA</div>
                  </td>
                  <td
                    style={{
                      padding: '14px 18px',
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      fontSize: 12.5,
                      fontWeight: lead.pipeline ? 500 : 400,
                      color: lead.pipeline ? C.text1 : C.text3,
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {lead.pipeline ?? '—'}
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: 11, color: C.text3 }}>{lead.lastActivity}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Table footer */}
      {leads.length > 0 && (
        <div
          style={{
            padding: '12px 18px',
            borderTop: `1px solid ${C.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.01)',
          }}
        >
          <span style={{ fontSize: 11, color: C.text3 }}>
            {leads.length} von {LEADS.length} Leads
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: p === 1 ? C.accentGhost : 'transparent',
                  border: `1px solid ${p === 1 ? C.borderAccent : C.border}`,
                  color: p === 1 ? C.accent : C.text3,
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PAGE ────────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const [statusFilter, setStatusFilter] = useState('Alle');
  const [cityFilter, setCityFilter] = useState('Alle Städte');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [focusedRow, setFocusedRow] = useState(0);
  const [slideOverLead, setSlideOverLead] = useState<Lead | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  const filteredLeads = LEADS.filter((lead) => {
    if (statusFilter !== 'Alle' && lead.status !== statusFilter) return false;
    if (cityFilter !== 'Alle Städte' && lead.city !== cityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        lead.name.toLowerCase().includes(q) ||
        lead.company.toLowerCase().includes(q) ||
        lead.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Keyboard navigation: j/k to move, Enter to open, Esc to close
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (slideOverLead) {
        if (e.key === 'Escape') setSlideOverLead(null);
        return;
      }
      if (e.key === 'j') setFocusedRow((i) => Math.min(i + 1, filteredLeads.length - 1));
      else if (e.key === 'k') setFocusedRow((i) => Math.max(i - 1, 0));
      else if (e.key === 'Enter' && filteredLeads[focusedRow]) {
        e.preventDefault();
        setSlideOverLead(filteredLeads[focusedRow]);
      } else if (e.key === 'x' && filteredLeads[focusedRow]) {
        toggleSelect(filteredLeads[focusedRow].name);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [filteredLeads, focusedRow, slideOverLead]);

  function toggleSelect(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function toggleAll() {
    if (filteredLeads.every((l) => selected.has(l.name))) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredLeads.map((l) => l.name)));
    }
  }

  return (
    <>
      <Breadcrumbs items={[{ label: 'Onvero Sales', href: '/sales-v2' }, { label: 'Leads' }]} />
      <PageHeader
        title="Alle Leads"
        subtitle={`${LEADS.length} Einträge · zuletzt aktualisiert vor 4 min`}
        actions={
          <>
            {/* View mode toggle */}
            <div
              style={{
                display: 'flex',
                gap: 1,
                padding: 2,
                borderRadius: 7,
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${C.border}`,
              }}
            >
              {(['table', 'kanban'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 5,
                    border: 'none',
                    background: viewMode === m ? C.accentGhost : 'transparent',
                    color: viewMode === m ? C.accentBright : C.text3,
                    fontSize: 11,
                    fontWeight: viewMode === m ? 500 : 400,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {m === 'table' ? 'Tabelle' : 'Kanban'}
                </button>
              ))}
            </div>
            <GhostButton>Export</GhostButton>
            <GlowButton onClick={() => showToast('Lead-Generator wird gestartet...', 'info')}>
              + Lead generieren
            </GlowButton>
          </>
        }
      />
      <LeadStats />
      <FilterBar
        activeStatus={statusFilter}
        activeCity={cityFilter}
        onStatusChange={setStatusFilter}
        onCityChange={setCityFilter}
        search={search}
        onSearchChange={setSearch}
      />

      {/* Keyboard hint */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          animation: 'fadeIn 0.3s ease 0.3s both',
        }}
      >
        {[
          { keys: ['j', 'k'], label: 'navigieren' },
          { keys: ['↵'], label: 'Lead öffnen' },
          { keys: ['x'], label: 'auswählen' },
        ].map((h) => (
          <div key={h.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {h.keys.map((k) => (
              <kbd
                key={k}
                style={{
                  fontSize: 9,
                  color: C.text3,
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${C.border}`,
                  borderRadius: 3,
                  padding: '1px 5px',
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                }}
              >
                {k}
              </kbd>
            ))}
            <span style={{ fontSize: 10, color: C.text3 }}>{h.label}</span>
          </div>
        ))}
      </div>

      {viewMode === 'table' ? (
        <LeadTable
          leads={filteredLeads}
          selected={selected}
          onToggle={toggleSelect}
          onToggleAll={toggleAll}
          onLeadClick={setSlideOverLead}
        />
      ) : (
        <KanbanBoard leads={filteredLeads} onLeadClick={setSlideOverLead} />
      )}

      <SlideOver lead={slideOverLead} onClose={() => setSlideOverLead(null)} />
    </>
  );
}

// ─── KANBAN BOARD ────────────────────────────────────────────────────────────

const KANBAN_COLUMNS: { status: Lead['status']; color: string }[] = [
  { status: 'Neu', color: '#4E5170' },
  { status: 'In Kontakt', color: '#818CF8' },
  { status: 'Qualifiziert', color: '#34D399' },
  { status: 'Verloren', color: '#F87171' },
];

function KanbanBoard({ leads, onLeadClick }: { leads: Lead[]; onLeadClick: (l: Lead) => void }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${KANBAN_COLUMNS.length}, 1fr)`,
        gap: 12,
        animation: 'fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both',
      }}
    >
      {KANBAN_COLUMNS.map((col) => {
        const colLeads = leads.filter((l) => l.status === col.status);
        return (
          <div
            key={col.status}
            style={{
              background: 'rgba(255,255,255,0.01)',
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: '14px',
              minHeight: 300,
            }}
          >
            {/* Column header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
                padding: '0 4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: col.color,
                    boxShadow: `0 0 6px ${col.color}40`,
                  }}
                />
                <span style={{ fontSize: 12, fontWeight: 500, color: C.text1 }}>{col.status}</span>
              </div>
              <span
                style={{
                  fontSize: 10,
                  color: C.text3,
                  padding: '2px 7px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)',
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                }}
              >
                {colLeads.length}
              </span>
            </div>

            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {colLeads.map((lead, i) => (
                <div
                  key={lead.name}
                  className="s-card"
                  onClick={() => onLeadClick(lead)}
                  style={{
                    padding: '14px',
                    borderRadius: 10,
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.03)',
                    animation: 'fadeInUp 0.3s ease both',
                    animationDelay: `${0.1 + i * 0.04}s`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        background: `linear-gradient(135deg, ${C.surface2}, ${C.surface3})`,
                        border: `1px solid ${C.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 9,
                        fontWeight: 500,
                        color: C.text2,
                      }}
                    >
                      {lead.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: C.text1 }}>{lead.name}</div>
                      <div style={{ fontSize: 10, color: C.text3 }}>{lead.company}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <ScoreBar score={lead.score} />
                    {lead.pipeline && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: C.text1,
                          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                        }}
                      >
                        {lead.pipeline}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {colLeads.length === 0 && (
                <div
                  style={{
                    padding: '20px',
                    textAlign: 'center',
                    borderRadius: 8,
                    border: `1px dashed rgba(255,255,255,0.06)`,
                  }}
                >
                  <div style={{ fontSize: 11, color: C.text3 }}>Keine Leads</div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
