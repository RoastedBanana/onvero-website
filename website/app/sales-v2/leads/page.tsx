'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { LEADS, getLeadStats } from '../_lead-data';
import type { Lead } from '../_lead-data';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const FILTERS = ['Alle', 'Neu', 'Qualifiziert', 'In Kontakt', 'Verloren'];
const CITY_FILTERS = ['Alle Städte', ...Array.from(new Set(LEADS.map((l) => l.city)))];

// ─── STATS BAR ───────────────────────────────────────────────────────────────

function LeadStats() {
  const s = getLeadStats(LEADS);
  const stats = [
    { label: 'Hot Leads', value: `${s.hot}`, sub: 'Score ≥ 70', color: '#F87171', bg: 'rgba(248,113,113,0.06)' },
    { label: 'Warm', value: `${s.warm}`, sub: 'Score 50–69', color: '#FBBF24', bg: 'rgba(251,191,36,0.06)' },
    { label: 'Cold', value: `${s.cold}`, sub: 'Score < 50', color: '#4E5170', bg: 'rgba(255,255,255,0.02)' },
    { label: 'Ø Score', value: `${s.avgScore}`, sub: 'aller Leads', color: '#818CF8', bg: 'rgba(99,102,241,0.06)' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
      {stats.map((st, i) => (
        <div
          key={st.label}
          style={{
            padding: '14px 16px',
            borderRadius: 10,
            background: st.bg,
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
                color: st.color,
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                letterSpacing: '-0.03em',
              }}
            >
              {st.value}
            </span>
            <span style={{ fontSize: 11, color: C.text3 }}>{st.sub}</span>
          </div>
          <div style={{ fontSize: 10, color: C.text3, marginTop: 4, letterSpacing: '0.06em', fontWeight: 500 }}>
            {st.label.toUpperCase()}
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
      <div style={{ width: 1, height: 20, background: C.border }} />
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
              }}
            >
              {f}
            </button>
          );
        })}
      </div>
      <div style={{ width: 1, height: 20, background: C.border }} />
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
          paddingRight: 28,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%234E5170' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 10px center',
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
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onLeadClick: (lead: Lead) => void;
}) {
  const headers = ['', 'Kontakt & Firma', 'KI-Score', 'Status', 'Branche', 'Pipeline', 'Aktivität'];
  const allSelected = leads.length > 0 && leads.every((l) => selected.has(l.id));

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
      {/* Batch actions */}
      {selected.size > 0 && (
        <div
          style={{
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'rgba(99,102,241,0.06)',
            borderBottom: '1px solid rgba(99,102,241,0.12)',
            animation: 'fadeInUp 0.2s ease both',
          }}
        >
          <span style={{ fontSize: 12, color: C.accentBright, fontWeight: 500 }}>{selected.size} ausgewählt</span>
          <div style={{ width: 1, height: 16, background: 'rgba(99,102,241,0.15)' }} />
          {['Exportieren', 'Status ändern', 'Löschen'].map((a, i) => (
            <button
              key={a}
              onClick={() => showToast(`${a}...`, i === 2 ? 'error' : 'info')}
              style={{
                fontSize: 11,
                color: i === 2 ? C.danger : C.accentBright,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                padding: '2px 6px',
              }}
            >
              {a}
            </button>
          ))}
        </div>
      )}

      {leads.length === 0 ? (
        <div style={{ padding: 16 }}>
          <EmptyState
            title="Keine Leads gefunden"
            description="Versuche einen anderen Filter oder generiere neue Leads mit der KI."
            icon={ICONS.search}
            action={<GlowButton>+ Lead generieren</GlowButton>}
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
              const isSelected = selected.has(lead.id);
              return (
                <tr
                  key={lead.id}
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
                      onChange={() => onToggle(lead.id)}
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
                              value={lead.score ?? 0}
                              size={32}
                              strokeWidth={2.5}
                              color={(lead.score ?? 0) >= 70 ? C.accent : C.text3}
                              label={lead.score ? `${lead.score}` : '—'}
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
                              <span style={{ color: C.text2 }}>{lead.employees}</span>
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
                          <div style={{ fontSize: 13, fontWeight: 500, color: C.text1 }}>{lead.name}</div>
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
                    <ScoreBar score={lead.score ?? 0} />
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
        </div>
      )}
    </div>
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
              padding: 14,
              minHeight: 300,
            }}
          >
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {colLeads.map((lead, i) => (
                <div
                  key={lead.id}
                  className="s-card"
                  onClick={() => onLeadClick(lead)}
                  style={{
                    padding: 14,
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
                    <ScoreBar score={lead.score ?? 0} />
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
                    padding: 20,
                    textAlign: 'center',
                    borderRadius: 8,
                    border: '1px dashed rgba(255,255,255,0.06)',
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

// ─── PAGE ────────────────────────────────────────────────────────────────────

export default function LeadsPageWrapper() {
  return (
    <Suspense>
      <LeadsPage />
    </Suspense>
  );
}

function LeadsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');

  // Map URL filter params to status filter
  const initialFilter =
    filterParam === 'qualifiziert'
      ? 'Qualifiziert'
      : filterParam === 'kontakt'
        ? 'In Kontakt'
        : filterParam === 'neu-heute'
          ? 'Neu'
          : 'Alle';

  const [statusFilter, setStatusFilter] = useState(initialFilter);
  const [cityFilter, setCityFilter] = useState('Alle Städte');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Update filter when URL changes
  useEffect(() => {
    const f = searchParams.get('filter');
    if (f === 'qualifiziert') setStatusFilter('Qualifiziert');
    else if (f === 'kontakt') setStatusFilter('In Kontakt');
    else if (f === 'neu-heute') setStatusFilter('Neu');
    else if (f === null && statusFilter !== 'Alle') {
      /* keep current */
    }
  }, [searchParams]);

  const isNeuHeute = filterParam === 'neu-heute';

  const filteredLeads = LEADS.filter((lead) => {
    // "Neu heute" filter — check created_at is today
    if (isNeuHeute) {
      const today = new Date().toDateString();
      // createdAt is like "11. April 2026"
      const leadDate = new Date(lead.createdAt.replace(/(\d+)\. (\w+) (\d+)/, '$2 $1, $3'));
      if (leadDate.toDateString() !== today) return false;
    } else if (statusFilter !== 'Alle' && lead.status !== statusFilter) {
      return false;
    }
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

  function openLead(lead: Lead) {
    router.push(`/sales-v2/leads/${lead.id}`);
  }

  // Keyboard: j/k navigate, Enter opens detail
  useEffect(() => {
    let focused = 0;
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'j') focused = Math.min(focused + 1, filteredLeads.length - 1);
      else if (e.key === 'k') focused = Math.max(focused - 1, 0);
      else if (e.key === 'Enter' && filteredLeads[focused]) {
        e.preventDefault();
        openLead(filteredLeads[focused]);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [filteredLeads]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    if (filteredLeads.every((l) => selected.has(l.id))) setSelected(new Set());
    else setSelected(new Set(filteredLeads.map((l) => l.id)));
  }

  return (
    <>
      <Breadcrumbs items={[{ label: 'Onvero Sales', href: '/sales-v2' }, { label: 'Leads' }]} />
      <PageHeader
        title="Alle Leads"
        subtitle={`${LEADS.length} Einträge · zuletzt aktualisiert vor 4 min`}
        actions={
          <>
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

      {/* Keyboard hints */}
      <div style={{ display: 'flex', gap: 12, animation: 'fadeIn 0.3s ease 0.3s both' }}>
        {[
          { keys: ['j', 'k'], label: 'navigieren' },
          { keys: ['↵'], label: 'Lead öffnen' },
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
          onLeadClick={openLead}
        />
      ) : (
        <KanbanBoard leads={filteredLeads} onLeadClick={openLead} />
      )}
    </>
  );
}
