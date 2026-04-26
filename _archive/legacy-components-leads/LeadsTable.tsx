'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Lead } from '@/lib/leads-client';
import { updateLeadStatus } from '@/lib/leads-client';
import LeadAvatar from '@/components/ui/LeadAvatar';

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null || score === undefined) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <style>{`@keyframes scorePulse{0%,100%{opacity:0.4}50%{opacity:1}}`}</style>
        <span
          style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', animation: 'scorePulse 1.5s ease-in-out infinite' }}
        >
          ...
        </span>
      </div>
    );
  }
  const isHot = score >= 70;
  const isWarm = score >= 45;
  const letter = isHot ? 'H' : isWarm ? 'W' : 'C';
  const color = isHot ? '#FF5C2E' : isWarm ? '#F59E0B' : '#6B7AFF';
  return (
    <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 3 }}>
      <span style={{ fontSize: 16, fontWeight: 700, color, fontFamily: 'var(--font-dm-mono)' }}>{score}</span>
      <span style={{ fontSize: 8, fontWeight: 600, color, opacity: 0.5, fontFamily: 'var(--font-dm-mono)' }}>
        {letter}
      </span>
    </div>
  );
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: 'Neu', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  contacted: { label: 'Kontaktiert', color: '#6B7AFF', bg: 'rgba(107,122,255,0.12)' },
  qualified: { label: 'Qualifiziert', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  lost: { label: 'Verloren', color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.06)' },
};

const STATUS_OPTIONS = [
  { value: 'new', label: 'Neu' },
  { value: 'contacted', label: 'Kontaktiert' },
  { value: 'qualified', label: 'Qualifiziert' },
  { value: 'lost', label: 'Verloren' },
];

function InlineStatusDropdown({
  lead,
  onStatusChange,
}: {
  lead: Lead;
  onStatusChange?: (id: string, status: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const s = STATUS_MAP[lead.status] ?? STATUS_MAP.new;

  async function handleChange(newStatus: string) {
    setUpdating(true);
    try {
      await updateLeadStatus(lead.id, newStatus);
      setOpen(false);
      onStatusChange?.(lead.id, newStatus);
    } catch (e) {
      console.error('Status update failed:', e);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        style={{
          background: s.bg,
          color: s.color,
          borderRadius: 20,
          padding: '3px 10px',
          fontSize: 11,
          fontWeight: 500,
          border: 'none',
          cursor: 'pointer',
          transition: 'opacity 0.15s',
          opacity: updating ? 0.5 : 1,
        }}
      >
        {s.label} ▾
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={() => setOpen(false)} />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 4,
              background: '#111',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10,
              overflow: 'hidden',
              zIndex: 31,
              minWidth: 130,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={(e) => {
                  e.stopPropagation();
                  handleChange(opt.value);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '7px 12px',
                  background: lead.status === opt.value ? 'rgba(255,255,255,0.06)' : 'transparent',
                  color: lead.status === opt.value ? '#e8e8e8' : 'rgba(255,255,255,0.45)',
                  border: 'none',
                  fontSize: 11,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                onMouseLeave={(e) => {
                  if (lead.status !== opt.value) e.currentTarget.style.background = 'transparent';
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Checkbox({
  checked,
  onChange,
  indeterminate,
}: {
  checked: boolean;
  onChange: () => void;
  indeterminate?: boolean;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      style={{
        width: 16,
        height: 16,
        borderRadius: 4,
        border: `1.5px solid ${checked || indeterminate ? '#6B7AFF' : 'rgba(255,255,255,0.12)'}`,
        background: checked || indeterminate ? 'rgba(107,122,255,0.2)' : 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.2s cubic-bezier(0.32,0.72,0,1)',
        padding: 0,
      }}
    >
      {checked && (
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <path
            d="M2.5 6L5 8.5L9.5 3.5"
            stroke="#6B7AFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {indeterminate && !checked && <div style={{ width: 8, height: 2, borderRadius: 1, background: '#6B7AFF' }} />}
    </button>
  );
}

interface LeadsTableProps {
  leads: Lead[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onStatusChange?: (id: string, status: string) => void;
  onLeadsDeleted?: (ids: string[]) => void;
  onCompare?: (selectedLeads: Lead[]) => void;
}

export default function LeadsTable({
  leads,
  selectedId,
  onSelect,
  onStatusChange,
  onLeadsDeleted,
  onCompare,
}: LeadsTableProps) {
  const [sortBy, setSortBy] = useState<'score' | 'date'>('score');
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [rowDeleteId, setRowDeleteId] = useState<string | null>(null);
  const [rowDeleting, setRowDeleting] = useState(false);

  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelected(new Set());
    setBulkStatusOpen(false);
    setDeleteConfirm(false);
  }, []);

  useEffect(() => {
    if (!selectMode) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exitSelectMode();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [selectMode, exitSelectMode]);

  const sorted = [...leads].sort((a, b) =>
    sortBy === 'score' ? b.score - a.score : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === sorted.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sorted.map((l) => l.id)));
    }
  }

  async function bulkStatusChange(newStatus: string) {
    setBulkActionLoading(true);
    try {
      await Promise.all(Array.from(selected).map((id) => updateLeadStatus(id, newStatus)));
      selected.forEach((id) => onStatusChange?.(id, newStatus));
      exitSelectMode();
    } catch (e) {
      console.error('Bulk status change failed:', e);
    } finally {
      setBulkActionLoading(false);
    }
  }

  async function bulkDelete() {
    setBulkActionLoading(true);
    try {
      const ids = Array.from(selected);
      await Promise.all(ids.map((id) => fetch(`/api/leads/${id}`, { method: 'DELETE' })));
      onLeadsDeleted?.(ids);
      exitSelectMode();
    } catch (e) {
      console.error('Bulk delete failed:', e);
    } finally {
      setBulkActionLoading(false);
    }
  }

  function exportSelected() {
    const selectedLeads = sorted.filter((l) => selected.has(l.id));
    const headers = ['Name', 'Firma', 'E-Mail', 'Score', 'Status', 'Branche', 'Stadt', 'Telefon', 'Website', 'Datum'];
    const rows = selectedLeads.map((l) => [
      l.name,
      l.company,
      l.email,
      String(l.score),
      STATUS_MAP[l.status]?.label ?? l.status,
      l.industry ?? '',
      l.city ?? '',
      l.phone ?? '',
      l.website ?? '',
      new Date(l.createdAt).toLocaleDateString('de-DE'),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `onvero-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const allSelected = sorted.length > 0 && selected.size === sorted.length;
  const someSelected = selected.size > 0 && !allSelected;

  const gridCols = selectMode ? '36px 64px 1fr 200px 140px 120px 100px' : '64px 1fr 200px 140px 120px 100px 48px';

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.04)',
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <style>{`
        div:hover > .row-delete-btn { opacity: 1 !important; }
        .leads-row { transition: background 0.3s cubic-bezier(0.32,0.72,0,1); }
        .leads-select-btn { opacity: 0; transition: opacity 0.2s ease; }
        .leads-row:hover .leads-select-btn { opacity: 1; }
      `}</style>

      {/* -- Bulk Action Bar -- */}
      {selectMode && selected.size > 0 && (
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 20px',
            background: 'rgba(107,122,255,0.06)',
            borderBottom: '1px solid rgba(107,122,255,0.1)',
            backdropFilter: 'blur(12px)',
            animation: 'fadeSlideIn 0.3s cubic-bezier(0.32,0.72,0,1)',
          }}
        >
          <style>{`@keyframes fadeSlideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#6B7AFF',
              fontFamily: 'var(--font-dm-mono)',
              minWidth: 80,
            }}
          >
            {selected.size} ausgewählt
          </span>

          <div style={{ flex: 1 }} />

          {/* Status ändern */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setBulkStatusOpen(!bulkStatusOpen)}
              disabled={bulkActionLoading}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 11,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.color = '#e8e8e8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              Status ändern
            </button>
            {bulkStatusOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={() => setBulkStatusOpen(false)} />
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: 4,
                    background: '#111',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 10,
                    overflow: 'hidden',
                    zIndex: 31,
                    minWidth: 150,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  }}
                >
                  {STATUS_OPTIONS.map((opt) => {
                    const st = STATUS_MAP[opt.value];
                    return (
                      <button
                        key={opt.value}
                        onClick={() => bulkStatusChange(opt.value)}
                        disabled={bulkActionLoading}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          width: '100%',
                          padding: '8px 14px',
                          background: 'transparent',
                          color: 'rgba(255,255,255,0.5)',
                          border: 'none',
                          fontSize: 11,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div
                          style={{ width: 6, height: 6, borderRadius: '50%', background: st.color, flexShrink: 0 }}
                        />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Vergleichen */}
          {selected.size >= 2 && selected.size <= 3 && onCompare && (
            <button
              onClick={() => {
                const selectedLeads = sorted.filter((l) => selected.has(l.id));
                onCompare(selectedLeads);
              }}
              style={{
                background: 'rgba(107,122,255,0.08)',
                border: '1px solid rgba(107,122,255,0.12)',
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 11,
                fontWeight: 500,
                color: '#6B7AFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(107,122,255,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(107,122,255,0.08)';
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="8" height="18" rx="1" />
                <rect x="14" y="3" width="8" height="18" rx="1" />
              </svg>
              Vergleichen
            </button>
          )}

          {/* Exportieren */}
          <button
            onClick={exportSelected}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: 11,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = '#e8e8e8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            CSV Export
          </button>

          {/* Löschen */}
          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              style={{
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.1)',
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 11,
                fontWeight: 500,
                color: '#ef4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.06)';
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Löschen
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 500 }}>{selected.size} löschen?</span>
              <button
                onClick={bulkDelete}
                disabled={bulkActionLoading}
                style={{
                  background: '#ef4444',
                  border: 'none',
                  borderRadius: 6,
                  padding: '5px 12px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#fff',
                  cursor: 'pointer',
                  opacity: bulkActionLoading ? 0.5 : 1,
                }}
              >
                {bulkActionLoading ? '...' : 'Ja, löschen'}
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 6,
                  padding: '5px 12px',
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                }}
              >
                Abbrechen
              </button>
            </div>
          )}

          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.06)', margin: '0 2px' }} />

          <button
            onClick={exitSelectMode}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.3)',
              cursor: 'pointer',
              fontSize: 11,
              padding: '4px 8px',
              borderRadius: 6,
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
          >
            Abbrechen
          </button>
        </div>
      )}

      {/* -- Table Header -- */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: gridCols,
          padding: '12px 20px',
          background: 'rgba(255,255,255,0.03)',
          alignItems: 'center',
          borderRadius: '16px 16px 0 0',
        }}
      >
        {selectMode && <Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleAll} />}
        {[
          { key: 'score', label: 'SCORE' },
          { key: null, label: 'NAME / FIRMA' },
          { key: null, label: 'E-MAIL' },
          { key: null, label: 'BRANCHE' },
          { key: null, label: 'STATUS' },
          { key: 'date', label: 'DATUM' },
        ].map(({ key, label }) => (
          <div
            key={label}
            onClick={() => key && setSortBy(key as 'score' | 'date')}
            style={{
              fontSize: 9,
              fontWeight: 500,
              color: key && sortBy === key ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
              cursor: key ? 'pointer' : 'default',
              userSelect: 'none',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (key) e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
            }}
            onMouseLeave={(e) => {
              if (key)
                e.currentTarget.style.color = key && sortBy === key ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)';
            }}
          >
            {label}
            {key && sortBy === key ? ' ↓' : ''}
          </div>
        ))}
        {!selectMode && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            {sorted.length > 0 && (
              <button
                onClick={() => setSelectMode(true)}
                className="leads-select-btn"
                style={{
                  background: 'none',
                  border: 'none',
                  borderRadius: 6,
                  padding: '4px 6px',
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.25)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.25)';
                }}
                title="Auswählen"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* -- Rows -- */}
      {sorted.map((lead) => {
        const isSelected = selected.has(lead.id);
        const isNewLead = Date.now() - new Date(lead.createdAt).getTime() < 24 * 60 * 60 * 1000;
        const isActive = selectedId === lead.id;
        return (
          <div
            key={lead.id}
            className="leads-row"
            onClick={() => {
              if (selectMode) {
                toggleSelect(lead.id);
              } else {
                onSelect(selectedId === lead.id ? null : lead.id);
              }
            }}
            style={{
              display: 'grid',
              gridTemplateColumns: gridCols,
              padding: '0 20px',
              height: 56,
              borderLeft: isActive ? '2px solid #6B7AFF' : '2px solid transparent',
              alignItems: 'center',
              cursor: 'pointer',
              background:
                selectMode && isSelected
                  ? 'rgba(107,122,255,0.06)'
                  : isActive
                    ? 'rgba(255,255,255,0.06)'
                    : 'transparent',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              if (selectMode && isSelected) return;
              if (!isActive) el.style.background = 'rgba(255,255,255,0.04)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              if (selectMode && isSelected) {
                el.style.background = 'rgba(107,122,255,0.06)';
                return;
              }
              if (!isActive) el.style.background = 'transparent';
            }}
          >
            {selectMode && <Checkbox checked={isSelected} onChange={() => toggleSelect(lead.id)} />}
            <ScoreBadge score={lead.score} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {isNewLead && (
                <div
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: '#22C55E',
                    flexShrink: 0,
                    boxShadow: '0 0 6px rgba(34,197,94,0.4)',
                  }}
                />
              )}
              <LeadAvatar website={lead.website} companyName={lead.company} score={lead.score} logoUrl={lead.logoUrl} />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#e8e8e8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lead.name}
                  </span>
                  {lead.source === 'apollo_outbound' && (
                    <span
                      style={{
                        fontSize: 9,
                        color: '#8B5CF6',
                        background: 'rgba(139,92,246,0.08)',
                        padding: '1px 5px',
                        borderRadius: 6,
                        flexShrink: 0,
                        fontWeight: 500,
                      }}
                    >
                      Apollo
                    </span>
                  )}
                  {(lead.source === 'Website-Formular' || lead.source === 'website') && (
                    <span
                      style={{
                        fontSize: 9,
                        color: 'rgba(255,255,255,0.3)',
                        background: 'rgba(255,255,255,0.04)',
                        padding: '1px 5px',
                        borderRadius: 6,
                        flexShrink: 0,
                        fontWeight: 500,
                      }}
                    >
                      Website
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{lead.company}</div>
              </div>
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.35)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {lead.email}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{lead.industry?.split('/')[0] ?? '—'}</div>
            <InlineStatusDropdown lead={lead} onStatusChange={onStatusChange} />
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-dm-mono)' }}>
              {new Date(lead.createdAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
            </div>
            {!selectMode && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {rowDeleteId === lead.id ? (
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        setRowDeleting(true);
                        try {
                          await fetch(`/api/leads/${lead.id}`, { method: 'DELETE' });
                          onLeadsDeleted?.([lead.id]);
                        } catch {
                          /* ignore */
                        }
                        setRowDeleting(false);
                        setRowDeleteId(null);
                      }}
                      disabled={rowDeleting}
                      style={{
                        background: '#ef4444',
                        border: 'none',
                        borderRadius: 4,
                        padding: '2px 8px',
                        fontSize: 10,
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: 600,
                        opacity: rowDeleting ? 0.5 : 1,
                      }}
                    >
                      {rowDeleting ? '...' : 'Ja'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRowDeleteId(null);
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: 'none',
                        borderRadius: 4,
                        padding: '2px 8px',
                        fontSize: 10,
                        color: 'rgba(255,255,255,0.35)',
                        cursor: 'pointer',
                      }}
                    >
                      Nein
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRowDeleteId(lead.id);
                    }}
                    className="row-delete-btn"
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: 11,
                      color: 'rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      padding: '2px 4px',
                      opacity: 0,
                      transition: 'opacity 0.2s ease, color 0.2s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.1)')}
                    title="Lead löschen"
                  >
                    x
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
