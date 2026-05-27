'use client';

import React, { useMemo, useState } from 'react';
import { colors } from '../layout';
import { EXPORT_FIELD_GROUPS, DEFAULT_SELECTED_FIELDS } from './_export-fields';

type Scope = 'selected' | 'filtered' | 'all';
type Format = 'csv' | 'xlsx';

export type ExportLeadsModalProps = {
  isDark: boolean;
  c: ReturnType<typeof colors>;
  selectedIds: string[];
  filteredIds: string[];
  allIds: string[];
  onClose: () => void;
};

export function ExportLeadsModal({
  isDark,
  c,
  selectedIds,
  filteredIds,
  allIds,
  onClose,
}: ExportLeadsModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [scope, setScope] = useState<Scope>(selectedIds.length > 0 ? 'selected' : 'filtered');
  const [format, setFormat] = useState<Format>('csv');
  const [fields, setFields] = useState<Set<string>>(() => new Set(DEFAULT_SELECTED_FIELDS));
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set(['stammdaten']));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const idsByScope: Record<Scope, string[]> = {
    selected: selectedIds,
    filtered: filteredIds,
    all: allIds,
  };
  const targetIds = idsByScope[scope];

  const scopeOptions: { value: Scope; label: string; count: number; disabled?: boolean }[] = [
    { value: 'selected', label: 'Markierte Leads', count: selectedIds.length, disabled: selectedIds.length === 0 },
    { value: 'filtered', label: 'Gefilterte Liste', count: filteredIds.length },
    { value: 'all', label: 'Alle geladenen Leads', count: allIds.length },
  ];

  function toggleField(key: string) {
    setFields((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleGroupOpen(id: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function setGroupAll(groupId: string, on: boolean) {
    const group = EXPORT_FIELD_GROUPS.find((g) => g.id === groupId);
    if (!group) return;
    setFields((prev) => {
      const next = new Set(prev);
      for (const f of group.fields) {
        if (on) next.add(f.key);
        else next.delete(f.key);
      }
      return next;
    });
  }

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const g of EXPORT_FIELD_GROUPS) {
      counts[g.id] = g.fields.filter((f) => fields.has(f.key)).length;
    }
    return counts;
  }, [fields]);

  const totalSelectedFields = fields.size;
  const canExport = targetIds.length > 0 && totalSelectedFields > 0;

  async function handleExport() {
    if (!canExport || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/leads/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadIds: targetIds,
          fields: Array.from(fields),
          format,
        }),
      });
      if (!res.ok) {
        let msg = 'Export fehlgeschlagen';
        try {
          const j = await res.json();
          if (j?.error) msg = String(j.error);
        } catch {}
        throw new Error(msg);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = format === 'xlsx' ? 'xlsx' : 'csv';
      a.download = `leads-export-${new Date().toISOString().slice(0, 10)}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export fehlgeschlagen');
    } finally {
      setSubmitting(false);
    }
  }

  const accent = '#10B981';
  const fontFamily = 'var(--font-inter), sans-serif';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(10,37,64,0.3)',
        backdropFilter: 'blur(4px)',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: c.bgCard,
          borderRadius: 16,
          width: 'min(640px, calc(100vw - 32px))',
          maxHeight: 'calc(100vh - 64px)',
          boxShadow: '0 24px 60px rgba(10,37,64,0.18)',
          border: `1px solid ${c.border}`,
          fontFamily,
          color: c.text,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: `1px solid ${c.border}`,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 16,
          }}
        >
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: c.text, margin: '0 0 4px' }}>
              Leads exportieren
            </h2>
            <div style={{ fontSize: 12, color: c.textSub }}>
              Schritt {step} von 2 —{' '}
              {step === 1 ? 'Welche Leads sollen exportiert werden?' : `Welche Felder? (${targetIds.length} Leads)`}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Schließen"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: 'none',
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              color: c.textSub,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="3" x2="13" y2="13" />
              <line x1="13" y1="3" x2="3" y2="13" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {scopeOptions.map((opt) => {
                const active = scope === opt.value;
                const disabled = opt.disabled;
                return (
                  <button
                    key={opt.value}
                    onClick={() => !disabled && setScope(opt.value)}
                    disabled={disabled}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '14px 16px',
                      borderRadius: 12,
                      border: active ? `1.5px solid ${accent}` : `1px solid ${c.border}`,
                      background: active
                        ? isDark
                          ? 'rgba(16,185,129,0.10)'
                          : 'rgba(16,185,129,0.06)'
                        : c.bgCard,
                      color: c.text,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.45 : 1,
                      fontFamily,
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        border: active ? `5px solid ${accent}` : `1.5px solid ${c.border}`,
                        background: active ? '#fff' : 'transparent',
                        flexShrink: 0,
                        transition: 'all 0.15s',
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{opt.label}</div>
                      <div style={{ fontSize: 12, color: c.textSub, marginTop: 2 }}>
                        {opt.count} {opt.count === 1 ? 'Lead' : 'Leads'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {EXPORT_FIELD_GROUPS.map((group) => {
                const open = openGroups.has(group.id);
                const count = groupCounts[group.id];
                const total = group.fields.length;
                const allOn = count === total;
                return (
                  <div
                    key={group.id}
                    style={{
                      border: `1px solid ${c.border}`,
                      borderRadius: 12,
                      background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '12px 14px',
                        cursor: 'pointer',
                      }}
                      onClick={() => toggleGroupOpen(group.id)}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          transform: open ? 'rotate(90deg)' : 'none',
                          transition: 'transform 0.15s',
                          color: c.textSub,
                          flexShrink: 0,
                        }}
                      >
                        <polyline points="6 4 10 8 6 12" />
                      </svg>
                      <div style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>{group.label}</div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: count > 0 ? accent : c.textSub,
                          background: count > 0 ? (isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.08)') : 'transparent',
                          padding: '2px 8px',
                          borderRadius: 99,
                        }}
                      >
                        {count}/{total}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setGroupAll(group.id, !allOn);
                        }}
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: 7,
                          border: `1px solid ${c.border}`,
                          background: 'transparent',
                          color: c.textSub,
                          cursor: 'pointer',
                          fontFamily,
                        }}
                      >
                        {allOn ? 'Keine' : 'Alle'}
                      </button>
                    </div>
                    {open && (
                      <div
                        style={{
                          padding: '4px 14px 14px',
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                          gap: 6,
                          borderTop: `1px solid ${c.border}`,
                          paddingTop: 12,
                          marginTop: 0,
                        }}
                      >
                        {group.fields.map((f) => {
                          const checked = fields.has(f.key);
                          return (
                            <label
                              key={f.key}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '6px 8px',
                                borderRadius: 7,
                                cursor: 'pointer',
                                fontSize: 13,
                                color: c.text,
                                userSelect: 'none',
                              }}
                            >
                              <span
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleField(f.key);
                                }}
                                style={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: 4,
                                  border: checked ? `1.5px solid ${accent}` : `1.5px solid ${c.border}`,
                                  background: checked ? accent : 'transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  transition: 'all 0.12s',
                                }}
                              >
                                {checked && (
                                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 8 7 12 13 4" />
                                  </svg>
                                )}
                              </span>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleField(f.key)}
                                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                                tabIndex={-1}
                              />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {error && (
            <div
              style={{
                marginTop: 14,
                padding: '10px 12px',
                borderRadius: 8,
                background: isDark ? 'rgba(220,38,38,0.15)' : 'rgba(220,38,38,0.08)',
                color: '#DC2626',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: `1px solid ${c.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
          }}
        >
          {step === 2 && (
            <div style={{ display: 'flex', gap: 6, marginRight: 'auto' }}>
              <button
                type="button"
                onClick={() => setFormat('csv')}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: format === 'csv' ? `1.5px solid ${accent}` : `1px solid ${c.border}`,
                  background: format === 'csv' ? (isDark ? 'rgba(16,185,129,0.10)' : 'rgba(16,185,129,0.06)') : 'transparent',
                  color: format === 'csv' ? accent : c.textSub,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily,
                }}
              >
                CSV
              </button>
              <button
                type="button"
                onClick={() => setFormat('xlsx')}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: format === 'xlsx' ? `1.5px solid ${accent}` : `1px solid ${c.border}`,
                  background: format === 'xlsx' ? (isDark ? 'rgba(16,185,129,0.10)' : 'rgba(16,185,129,0.06)') : 'transparent',
                  color: format === 'xlsx' ? accent : c.textSub,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily,
                }}
              >
                Excel
              </button>
            </div>
          )}

          {step === 1 ? (
            <button
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: 9,
                border: `1px solid ${c.border}`,
                background: 'transparent',
                color: c.textSub,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily,
                marginLeft: 'auto',
              }}
            >
              Abbrechen
            </button>
          ) : (
            <button
              onClick={() => setStep(1)}
              style={{
                padding: '10px 18px',
                borderRadius: 9,
                border: `1px solid ${c.border}`,
                background: 'transparent',
                color: c.textSub,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily,
              }}
            >
              Zurück
            </button>
          )}

          {step === 1 ? (
            <button
              onClick={() => setStep(2)}
              disabled={targetIds.length === 0}
              style={{
                padding: '10px 20px',
                borderRadius: 9,
                border: 'none',
                background: targetIds.length === 0 ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)') : accent,
                color: targetIds.length === 0 ? c.textSub : '#fff',
                fontSize: 13,
                fontWeight: 700,
                cursor: targetIds.length === 0 ? 'not-allowed' : 'pointer',
                fontFamily,
              }}
            >
              Weiter
            </button>
          ) : (
            <button
              onClick={handleExport}
              disabled={!canExport || submitting}
              style={{
                padding: '10px 20px',
                borderRadius: 9,
                border: 'none',
                background: !canExport || submitting ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)') : accent,
                color: !canExport || submitting ? c.textSub : '#fff',
                fontSize: 13,
                fontWeight: 700,
                cursor: !canExport || submitting ? 'not-allowed' : 'pointer',
                fontFamily,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {submitting ? (
                <>
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      border: '2px solid rgba(255,255,255,0.4)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'export-spin 0.7s linear infinite',
                    }}
                  />
                  Exportiere…
                </>
              ) : (
                <>Exportieren ({targetIds.length})</>
              )}
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes export-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
