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
import { getLeadStats } from '../_lead-data';
import type { Lead } from '../_lead-data';
import { updateLeadStatus } from '../_activities';
import { useLeads } from '../_use-leads';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const FILTERS = ['Alle', 'Neu', 'Qualifiziert', 'In Kontakt', 'Verloren'];

// ─── STATS BAR ───────────────────────────────────────────────────────────────

function LeadStats({ leads }: { leads: Lead[] }) {
  const s = getLeadStats(leads);
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
  cityFilters,
}: {
  activeStatus: string;
  activeCity: string;
  onStatusChange: (s: string) => void;
  onCityChange: (c: string) => void;
  search: string;
  onSearchChange: (s: string) => void;
  cityFilters: string[];
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
        {cityFilters.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── TABLE ───────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: Lead['status'][] = ['Neu', 'In Kontakt', 'Qualifiziert', 'Verloren'];
const STATUS_COLORS: Record<string, string> = {
  Neu: 'rgba(255,255,255,0.3)',
  'In Kontakt': '#A5B4FC',
  Qualifiziert: '#34D399',
  Verloren: '#F87171',
};

function InlineStatusDropdown({ status, onChange }: { status: Lead['status']; onChange: (s: Lead['status']) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '3px 10px',
          borderRadius: 6,
          border: 'none',
          fontSize: 11,
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'inherit',
          background:
            status === 'Qualifiziert'
              ? 'rgba(52,211,153,0.06)'
              : status === 'In Kontakt'
                ? 'rgba(99,102,241,0.06)'
                : status === 'Verloren'
                  ? 'rgba(248,113,113,0.06)'
                  : 'rgba(255,255,255,0.03)',
          color: STATUS_COLORS[status],
          transition: 'all 0.15s ease',
        }}
      >
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: STATUS_COLORS[status] }} />
        {status}
        <svg
          width={8}
          height={8}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 4,
              zIndex: 100,
              background: C.surface,
              border: `1px solid ${C.borderLight}`,
              borderRadius: 8,
              padding: 3,
              minWidth: 140,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              animation: 'scaleIn 0.12s ease both',
            }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: 5,
                  border: 'none',
                  background: status === opt ? 'rgba(99,102,241,0.06)' : 'transparent',
                  color: C.text1,
                  fontSize: 11,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                }}
              >
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: STATUS_COLORS[opt] }} />
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function LeadTable({
  leads,
  selected,
  onToggle,
  onToggleAll,
  onLeadClick,
  onStatusChange,
}: {
  leads: Lead[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onLeadClick: (lead: Lead) => void;
  onStatusChange: (leadId: string, oldStatus: string, newStatus: Lead['status']) => void;
}) {
  const headers = ['', 'Kontakt & Firma', 'KI-Score', 'Status', 'Branche', 'Aktivität'];
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
                    <InlineStatusDropdown
                      status={lead.status}
                      onChange={(s) => onStatusChange(lead.id, lead.status, s)}
                    />
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{ fontSize: 11.5, color: C.text2 }}>{lead.industry}</span>
                    <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{lead.employees} MA</div>
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
          <span style={{ fontSize: 11, color: C.text3 }}>{leads.length} Leads</span>
        </div>
      )}
    </div>
  );
}

// ─── KANBAN BOARD — Drag & Drop ──────────────────────────────────────────────

const KANBAN_COLS: { status: Lead['status']; color: string; label: string }[] = [
  { status: 'Neu', color: '#4E5170', label: 'Neu' },
  { status: 'In Kontakt', color: '#818CF8', label: 'In Kontakt' },
  { status: 'Qualifiziert', color: '#34D399', label: 'Qualifiziert' },
  { status: 'Verloren', color: '#F87171', label: 'Verloren' },
];

function KanbanBoard({
  leads,
  onLeadClick,
  onStatusChange,
}: {
  leads: Lead[];
  onLeadClick: (l: Lead) => void;
  onStatusChange: (leadId: string, oldStatus: string, newStatus: Lead['status']) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  function handleDragStart(e: React.DragEvent, leadId: string) {
    setDragId(leadId);
    e.dataTransfer.effectAllowed = 'move';
    // Make drag image slightly transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.4';
    }
  }

  function handleDragEnd(e: React.DragEvent) {
    setDragId(null);
    setDragOver(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  }

  function handleDrop(targetStatus: Lead['status']) {
    if (!dragId) return;
    const lead = leads.find((l) => l.id === dragId);
    if (!lead || lead.status === targetStatus) {
      setDragId(null);
      setDragOver(null);
      return;
    }
    onStatusChange(lead.id, lead.status, targetStatus);
    setDragId(null);
    setDragOver(null);
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 10,
        animation: 'fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both',
      }}
    >
      {KANBAN_COLS.map((col) => {
        const colLeads = leads.filter((l) => l.status === col.status);
        const isOver = dragOver === col.status && dragId !== null;
        const dragLead = dragId ? leads.find((l) => l.id === dragId) : null;
        const isDragSource = dragLead?.status === col.status;

        return (
          <div
            key={col.status}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              setDragOver(col.status);
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(col.status);
            }}
            style={{
              background: isOver && !isDragSource ? `${col.color}06` : C.surface,
              border: `1px solid ${isOver && !isDragSource ? `${col.color}25` : C.border}`,
              borderRadius: 12,
              padding: '0',
              minHeight: 340,
              transition: 'border-color 0.2s ease, background 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Column header */}
            <div
              style={{
                padding: '14px 16px',
                borderBottom: `1px solid ${C.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 3,
                    height: 16,
                    borderRadius: 2,
                    background: col.color,
                    boxShadow: `0 0 6px ${col.color}30`,
                  }}
                />
                <span style={{ fontSize: 12, fontWeight: 500, color: C.text1 }}>{col.label}</span>
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: col.color,
                  fontWeight: 600,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                }}
              >
                {colLeads.length}
              </span>
            </div>

            {/* Cards */}
            <div style={{ padding: 10, flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {colLeads.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onLeadClick(lead)}
                  className="s-card"
                  style={{
                    padding: '14px 16px',
                    borderRadius: 10,
                    background: C.bg,
                    border: `1px solid ${C.border}`,
                    cursor: 'grab',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                    transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
                  }}
                >
                  {/* Top: Avatar + Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background:
                          (lead.score ?? 0) >= 70
                            ? 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))'
                            : `linear-gradient(135deg, ${C.surface2}, ${C.surface3})`,
                        border: `1px solid ${(lead.score ?? 0) >= 70 ? 'rgba(99,102,241,0.2)' : C.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 500,
                        color: (lead.score ?? 0) >= 70 ? C.accent : C.text3,
                        flexShrink: 0,
                      }}
                    >
                      {lead.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: C.text1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {lead.name}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: C.text3,
                          marginTop: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {lead.company}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Job title + City */}
                  {lead.jobTitle && (
                    <div style={{ fontSize: 10, color: C.accent, marginBottom: 8 }}>{lead.jobTitle}</div>
                  )}

                  {/* Bottom: Score + Industry */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: 8,
                      borderTop: `1px solid rgba(255,255,255,0.04)`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {lead.score !== null && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                            color: (lead.score ?? 0) >= 70 ? C.accent : (lead.score ?? 0) >= 50 ? '#FBBF24' : C.text3,
                          }}
                        >
                          {lead.score}
                        </span>
                      )}
                      <span style={{ fontSize: 10, color: C.text3 }}>{lead.city}</span>
                    </div>
                    {lead.email && (
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 4,
                          background: 'rgba(52,211,153,0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <SvgIcon d={ICONS.mail} size={9} color="#34D399" />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Drop zone indicator */}
              {isOver && !isDragSource && (
                <div
                  style={{
                    padding: 16,
                    borderRadius: 10,
                    textAlign: 'center',
                    border: `1.5px dashed ${col.color}40`,
                    background: `${col.color}04`,
                    animation: 'fadeIn 0.15s ease both',
                  }}
                >
                  <span style={{ fontSize: 11, color: col.color }}>Hierher verschieben</span>
                </div>
              )}

              {colLeads.length === 0 && !isOver && (
                <div
                  style={{
                    padding: 24,
                    textAlign: 'center',
                    borderRadius: 10,
                    border: '1px dashed rgba(255,255,255,0.05)',
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: 11, color: C.text3 }}>Keine Leads</span>
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
  const { leads: liveLeads, loading: leadsLoading } = useLeads();

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

  // Optimistic status overrides — instant UI update before DB roundtrip
  const [statusOverrides, setStatusOverrides] = useState<Record<string, Lead['status']>>({});

  function changeStatus(leadId: string, oldStatus: string, newStatus: Lead['status']) {
    // Instant local update
    setStatusOverrides((prev) => ({ ...prev, [leadId]: newStatus }));
    showToast(`Status → ${newStatus}`, 'success');
    // Persist to DB + write activity
    updateLeadStatus(leadId, oldStatus, newStatus);
  }

  // Merge live leads with optimistic overrides
  const mergedLeads = liveLeads.map((l) => (statusOverrides[l.id] ? { ...l, status: statusOverrides[l.id] } : l));

  // Clear overrides when realtime catches up
  useEffect(() => {
    if (Object.keys(statusOverrides).length === 0) return;
    const updated: Record<string, Lead['status']> = {};
    for (const [id, overrideStatus] of Object.entries(statusOverrides)) {
      const live = liveLeads.find((l) => l.id === id);
      // Keep override only if live hasn't caught up yet
      if (live && live.status !== overrideStatus) updated[id] = overrideStatus;
    }
    if (Object.keys(updated).length !== Object.keys(statusOverrides).length) {
      setStatusOverrides(updated);
    }
  }, [liveLeads]);

  const cityFilters = ['Alle Städte', ...Array.from(new Set(mergedLeads.map((l) => l.city).filter(Boolean)))];

  useEffect(() => {
    const f = searchParams.get('filter');
    if (f === 'qualifiziert') setStatusFilter('Qualifiziert');
    else if (f === 'kontakt') setStatusFilter('In Kontakt');
    else if (f === 'neu-heute') setStatusFilter('Neu');
  }, [searchParams]);

  const isNeuHeute = filterParam === 'neu-heute';

  const filteredLeads = mergedLeads.filter((lead) => {
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
        subtitle={leadsLoading ? 'Laden...' : `${mergedLeads.length} Einträge · live aus Supabase`}
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
      <LeadStats leads={mergedLeads} />
      <FilterBar
        activeStatus={statusFilter}
        activeCity={cityFilter}
        onStatusChange={setStatusFilter}
        onCityChange={setCityFilter}
        search={search}
        onSearchChange={setSearch}
        cityFilters={cityFilters}
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

      {leadsLoading ? (
        <div
          style={{
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            overflow: 'hidden',
            background: C.surface,
            padding: '20px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
            animation: 'fadeIn 0.3s ease both',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                border: `2px solid ${C.border}`,
                borderTopColor: C.accent,
                animation: 'gradient-spin 0.8s linear infinite',
              }}
            />
            <span style={{ fontSize: 13, color: C.text2 }}>Leads werden geladen...</span>
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 0',
                borderBottom: `1px solid rgba(255,255,255,0.03)`,
                animation: 'fadeIn 0.3s ease both',
                animationDelay: `${i * 0.05}s`,
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)' }} />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    height: 12,
                    width: '40%',
                    borderRadius: 4,
                    background: 'rgba(255,255,255,0.05)',
                    marginBottom: 6,
                  }}
                />
                <div style={{ height: 10, width: '25%', borderRadius: 4, background: 'rgba(255,255,255,0.03)' }} />
              </div>
              <div style={{ height: 10, width: 50, borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
              <div style={{ height: 20, width: 70, borderRadius: 6, background: 'rgba(255,255,255,0.03)' }} />
            </div>
          ))}
        </div>
      ) : viewMode === 'table' ? (
        <LeadTable
          leads={filteredLeads}
          selected={selected}
          onToggle={toggleSelect}
          onToggleAll={toggleAll}
          onLeadClick={openLead}
          onStatusChange={changeStatus}
        />
      ) : (
        <KanbanBoard leads={filteredLeads} onLeadClick={openLead} onStatusChange={changeStatus} />
      )}
    </>
  );
}
