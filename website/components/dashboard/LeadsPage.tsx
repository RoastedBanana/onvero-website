'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, Zap, Trash2 } from 'lucide-react';
import UniqueLoading from '@/components/ui/grid-loading';
import { useTenant } from '@/hooks/useTenant';
import { getCsrfToken } from '@/lib/csrf';
import { GeneratorModal } from './GeneratorModal';
import {
  Lead,
  LeadActivity,
  DUMMY_CF,
  DUMMY_ACTIVITIES,
  STATUS_LABELS,
  STATUS_BG,
  STATUS_FG,
  getScoreLabel,
  getScoreColor,
  LEAD_QUALITY_STYLE,
  ACTIVITY_ICONS,
  QUALITY_COLORS,
  MESSAGE_QUALITY_COLORS,
  SCORE_MAX,
  relativeTime,
  field,
  lbl,
} from './leads-shared';

// ── Internal Components ──────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: STATUS_BG[status] ?? 'rgba(100,116,139,0.12)',
        color: STATUS_FG[status] ?? '#888',
        borderRadius: 999,
        padding: '2px 8px',
        fontSize: '0.7rem',
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
function ScoreBadge({ score }: { score: number | null }) {
  const { bg, fg } = getScoreColor(score);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        background: bg,
        color: fg,
        borderRadius: 999,
        padding: '2px 8px',
        fontSize: '0.7rem',
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {score ?? '—'} {getScoreLabel(score)}
    </span>
  );
}
function QualityBadge({ quality }: { quality: string }) {
  const s = LEAD_QUALITY_STYLE[quality.toLowerCase()] ?? { bg: 'rgba(107,114,128,0.15)', fg: '#9ca3af' };
  return (
    <span
      style={{
        display: 'inline-flex',
        background: s.bg,
        color: s.fg,
        borderRadius: 999,
        padding: '2px 8px',
        fontSize: '0.68rem',
        fontWeight: 500,
      }}
    >
      {quality}
    </span>
  );
}

function CollapsibleSection({
  label,
  defaultOpen = true,
  children,
}: {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          width: '100%',
          marginBottom: open ? '0.5rem' : 0,
        }}
      >
        <span style={{ ...lbl, margin: 0, flex: 1, textAlign: 'left' }}>{label}</span>
        <span
          style={{
            fontSize: '0.65rem',
            color: 'rgba(255,255,255,0.2)',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
            display: 'inline-block',
          }}
        >
          ▼
        </span>
      </button>
      {open && children}
    </div>
  );
}

function ActivityItem({ act }: { act: LeadActivity }) {
  const [expanded, setExpanded] = useState(false);
  const icon = ACTIVITY_ICONS[act.type] ?? ACTIVITY_ICONS.default;
  const isLong = (act.content?.length ?? 0) > 120;
  const displayContent = isLong && !expanded ? act.content!.slice(0, 120) + '…' : act.content;

  const iconColor: Record<string, string> = {
    ai_analysis: '#818cf8',
    email: '#60a5fa',
    call: '#4ade80',
    meeting: '#fb923c',
    form_submit: '#a78bfa',
    status_change: '#fde047',
    score_update: '#fde047',
  };

  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: 7,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: '0.75rem',
          color: iconColor[act.type] ?? 'rgba(255,255,255,0.3)',
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {act.is_pinned && (
          <span
            style={{
              fontSize: '0.65rem',
              color: '#fde047',
              marginBottom: '0.15rem',
              display: 'block',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Angeheftet
          </span>
        )}
        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500, lineHeight: 1.3 }}>
          {act.title ?? act.type}
        </div>
        {displayContent && (
          <div style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem', lineHeight: 1.5 }}>
            {displayContent}
            {isLong && (
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#60a5fa',
                  fontSize: '0.73rem',
                  cursor: 'pointer',
                  padding: '0 0 0 0.35rem',
                }}
              >
                {expanded ? 'weniger' : 'mehr'}
              </button>
            )}
          </div>
        )}
        <div
          style={{
            fontSize: '0.69rem',
            color: 'rgba(255,255,255,0.2)',
            marginTop: '0.25rem',
            display: 'flex',
            gap: '0.4rem',
          }}
        >
          <span>{relativeTime(act.created_at)}</span>
          {act.user_id === null && <span style={{ color: 'rgba(107,122,255,0.7)' }}>· KI</span>}
        </div>
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: '1.5rem',
        zIndex: 999,
        background: '#1a1a1a',
        border: '1px solid #2a2a2a',
        borderRadius: 8,
        padding: '0.75rem 1.1rem',
        fontSize: '0.83rem',
        color: '#ccc',
        boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
        maxWidth: 360,
        animation: 'fadeSlideIn 0.2s ease',
      }}
    >
      {msg}
    </div>
  );
}

// ── LeadsPage ────────────────────────────────────────────────────────────────

export function LeadsPage() {
  const { tenantId, supabase, loading: tenantLoading } = useTenant();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [scoreFilters, setScoreFilters] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  const loadLeads = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('v_leads_overview')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      if (err) throw err;
      setLeads(data ?? []);
    } catch {
      setError('Leads konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, [tenantId, supabase]);

  useEffect(() => {
    if (!tenantLoading) loadLeads();
  }, [tenantLoading, loadLeads]);

  const loadActivities = useCallback(
    async (leadId: string) => {
      if (!tenantId) return;
      setActivitiesLoading(true);
      setActivities([]);
      try {
        const { data } = await supabase
          .from('lead_activities')
          .select('*')
          .eq('lead_id', leadId)
          .eq('tenant_id', tenantId)
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false });
        setActivities(data ?? []);
      } catch {
        setActivities([]);
      } finally {
        setActivitiesLoading(false);
      }
    },
    [supabase, tenantId]
  );

  const handleSelectLead = useCallback(
    async (lead: Lead) => {
      setSelectedLead(lead);
      loadActivities(lead.id);
      try {
        const { data } = await supabase.from('leads').select('*').eq('id', lead.id).eq('tenant_id', tenantId!).single();
        if (data) setSelectedLead(data as Lead);
      } catch {
        /* keep partial data */
      }
    },
    [supabase, loadActivities]
  );

  const copyWithFeedback = (text: string, fieldKey: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleStatusUpdate = useCallback(
    async (leadId: string, newStatus: string) => {
      setStatusUpdating(true);
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l)));
      setSelectedLead((prev) => (prev?.id === leadId ? { ...prev, status: newStatus } : prev));
      try {
        const updates: Record<string, unknown> = { status: newStatus };
        if (newStatus === 'contacted') updates.last_contacted_at = new Date().toISOString();
        const { error: err } = await supabase.from('leads').update(updates).eq('id', leadId).eq('tenant_id', tenantId!);
        if (err) throw err;
        showToast('Status aktualisiert');
      } catch {
        showToast('Fehler beim Speichern');
      } finally {
        setStatusUpdating(false);
      }
    },
    [supabase, tenantId, showToast]
  );

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [rescoring, setRescoring] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const handleDeleteLead = useCallback(
    async (leadId: string) => {
      setDeleting(true);
      try {
        const { error: err } = await supabase.from('leads').delete().eq('id', leadId).eq('tenant_id', tenantId!);
        if (err) throw err;
        setLeads((prev) => prev.filter((l) => l.id !== leadId));
        if (selectedLead?.id === leadId) setSelectedLead(null);
        setDeleteConfirmId(null);
        showToast('Lead gelöscht');
      } catch {
        showToast('Fehler beim Löschen');
      } finally {
        setDeleting(false);
      }
    },
    [supabase, tenantId, selectedLead, showToast]
  );

  const toggleScore = (tier: string) =>
    setScoreFilters((prev) => (prev.includes(tier) ? prev.filter((x) => x !== tier) : [...prev, tier]));

  const resetFilters = () => {
    setScoreFilters([]);
    setSourceFilter('all');
    setSortBy('newest');
    setSearch('');
  };
  const hasFilters = scoreFilters.length > 0 || sourceFilter !== 'all' || sortBy !== 'newest' || search !== '';

  const filtered = useMemo(
    () =>
      leads
        .filter((l) => {
          const q = search.toLowerCase();
          const matchSearch =
            !q ||
            (l.company_name ?? '').toLowerCase().includes(q) ||
            (l.email ?? '').toLowerCase().includes(q) ||
            `${l.first_name ?? ''} ${l.last_name ?? ''}`.toLowerCase().includes(q);
          const tier = getScoreLabel(l.score);
          const matchScore = scoreFilters.length === 0 || scoreFilters.includes(tier);
          const matchSource =
            sourceFilter === 'all' || (l.source ?? '').toLowerCase().includes(sourceFilter.toLowerCase());
          return matchSearch && matchScore && matchSource;
        })
        .sort((a, b) => {
          if (sortBy === 'score_desc') return (b.score ?? 0) - (a.score ?? 0);
          if (sortBy === 'score_asc') return (a.score ?? 0) - (b.score ?? 0);
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }),
    [leads, search, scoreFilters, sourceFilter, sortBy]
  );

  const hot = leads.filter((l) => (l.score ?? 0) >= 75).length;
  const warm = leads.filter((l) => {
    const s = l.score ?? 0;
    return s >= 45 && s < 75;
  }).length;
  const newCount = leads.filter((l) => l.status === 'new').length;

  const cf = (selectedLead?.custom_fields ?? DUMMY_CF) as unknown as Record<string, unknown>;
  const displayActivities = activities.length > 0 ? activities : DUMMY_ACTIVITIES;

  const SCORE_TIERS = [
    { key: 'HOT', color: '#FF6B35', bg: 'rgba(255,107,53,0.12)', border: 'rgba(255,107,53,0.35)' },
    { key: 'WARM', color: '#FFD700', bg: 'rgba(255,215,0,0.1)', border: 'rgba(255,215,0,0.3)' },
    { key: 'COLD', color: '#6B7AFF', bg: 'rgba(107,122,255,0.1)', border: 'rgba(107,122,255,0.3)' },
  ];

  return (
    <>
      {generatorOpen && (
        <GeneratorModal
          onClose={() => setGeneratorOpen(false)}
          onGenerated={(count) => {
            showToast(`Lead Generator gestartet — ${count} Leads werden gesucht`);
            setTimeout(loadLeads, 5000);
          }}
          tenantId={tenantId}
          supabase={supabase}
        />
      )}

      <div style={{ display: 'flex', gap: '1.5rem', minHeight: 0 }}>
        {/* ── Main column ── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>
              <h1 style={{ fontWeight: 600, fontSize: '1.35rem', color: '#fff', marginBottom: '0.2rem' }}>Leads</h1>
              <p style={{ color: '#666', fontSize: '0.85rem' }}>Interessenten verwalten und Sales-Funnel verfolgen</p>
            </div>
            <button
              onClick={() => setGeneratorOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#fff',
                color: '#000',
                border: 'none',
                borderRadius: 8,
                padding: '0.6rem 1.2rem',
                fontSize: '0.83rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Zap size={14} strokeWidth={2.5} />
              Lead Generator
            </button>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
            {[
              { label: 'Gesamt', value: leads.length, color: '#fff' },
              { label: 'HOT', value: hot, color: '#FF6B35' },
              { label: 'WARM', value: warm, color: '#FFD700' },
              { label: 'Neu', value: newCount, color: '#818cf8' },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: '#0a0a0a',
                  border: '1px solid #1f1f1f',
                  borderRadius: 10,
                  padding: '1rem 1.25rem',
                }}
              >
                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.73rem', color: '#555', marginTop: '0.35rem' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filter toolbar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 200px' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#444',
                  pointerEvents: 'none',
                }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Firma, Name oder E-Mail…"
                style={{ ...field, paddingLeft: '2rem', background: '#0a0a0a', borderColor: '#1f1f1f' }}
              />
            </div>
            {SCORE_TIERS.map((tier) => {
              const active = scoreFilters.includes(tier.key);
              return (
                <button
                  key={tier.key}
                  onClick={() => toggleScore(tier.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    background: active ? tier.bg : '#0a0a0a',
                    border: `1px solid ${active ? tier.border : '#1f1f1f'}`,
                    color: active ? tier.color : '#666',
                    borderRadius: 999,
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tier.key}
                </button>
              );
            })}
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              style={{
                ...field,
                width: 'auto',
                background: '#0a0a0a',
                borderColor: '#1f1f1f',
                color: '#aaa',
                cursor: 'pointer',
                padding: '0.42rem 0.9rem',
              }}
            >
              <option value="all">Alle Quellen</option>
              <option value="website">Website</option>
              <option value="apollo">Apollo</option>
              <option value="linkedin">LinkedIn</option>
              <option value="empfehlung">Empfehlung</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                ...field,
                width: 'auto',
                background: '#0a0a0a',
                borderColor: '#1f1f1f',
                color: '#aaa',
                cursor: 'pointer',
                padding: '0.42rem 0.9rem',
              }}
            >
              <option value="newest">Neueste zuerst</option>
              <option value="score_desc">Score ↓</option>
              <option value="score_asc">Score ↑</option>
            </select>
            {hasFilters && (
              <button
                onClick={resetFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#555',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                Filter zurücksetzen
              </button>
            )}
          </div>

          {/* Lead Table */}
          <div style={{ background: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: 12, overflow: 'hidden' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.8fr 1fr 1fr 1fr 0.9fr 28px',
                padding: '0.65rem 1.25rem',
                borderBottom: '1px solid #1a1a1a',
                gap: '0.5rem',
              }}
            >
              {['Firma / Kontakt', 'E-Mail', 'Branche', 'Status', 'Score', 'Datum', ''].map((h, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: '0.69rem',
                    fontWeight: 500,
                    color: '#444',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {h}
                </span>
              ))}
            </div>
            <div style={{ maxHeight: 480, overflowY: 'auto' }}>
              {loading || tenantLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1.8fr 1fr 1fr 1fr 0.9fr 28px',
                        padding: '0.85rem 1.25rem',
                        gap: '0.5rem',
                        alignItems: 'center',
                        borderBottom: '1px solid #141414',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <div style={{ height: 10, borderRadius: 4, background: '#1a1a1a', width: '65%' }} />
                        <div style={{ height: 8, borderRadius: 4, background: '#141414', width: '40%' }} />
                      </div>
                      {[55, 40, 30, 35, 25].map((w, j) => (
                        <div key={j} style={{ height: 10, borderRadius: 4, background: '#1a1a1a', width: `${w}%` }} />
                      ))}
                    </div>
                  ))}
                </div>
              ) : error ? (
                <p style={{ color: '#f87171', fontSize: '0.85rem', padding: '2rem', textAlign: 'center' }}>{error}</p>
              ) : filtered.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '3rem 1.5rem',
                  }}
                >
                  <Search size={28} strokeWidth={1.5} style={{ color: '#444' }} />
                  <span style={{ fontSize: '0.9rem', color: '#555', fontWeight: 500 }}>Keine Leads gefunden</span>
                  <span style={{ fontSize: '0.79rem', color: '#3a3a3a', textAlign: 'center' }}>
                    Passe deine Filter an oder setze sie zurück
                  </span>
                  {hasFilters && (
                    <button
                      onClick={resetFilters}
                      style={{
                        marginTop: '0.25rem',
                        background: 'none',
                        border: '1px solid #2a2a2a',
                        color: '#666',
                        borderRadius: 7,
                        padding: '0.4rem 0.9rem',
                        fontSize: '0.79rem',
                        cursor: 'pointer',
                      }}
                    >
                      Filter zurücksetzen
                    </button>
                  )}
                </div>
              ) : (
                filtered.map((lead) => {
                  const isSelected = selectedLead?.id === lead.id;
                  const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || '—';
                  const date = new Date(lead.created_at).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: 'short',
                  });
                  const leadCf = lead.custom_fields as Record<string, unknown> | null;
                  const urgentContact =
                    (leadCf?.contact_in_hours as number | undefined) !== undefined &&
                    (leadCf!.contact_in_hours as number) <= 24;
                  const industry = (leadCf?.industry as string | undefined) ?? '—';
                  return (
                    <React.Fragment key={lead.id}>
                      <div
                        onClick={() => handleSelectLead(lead)}
                        className="lead-row"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 1.8fr 1fr 1fr 1fr 0.9fr 28px',
                          padding: '0.85rem 1.25rem',
                          gap: '0.5rem',
                          alignItems: 'center',
                          cursor: 'pointer',
                          transition: 'background 0.12s',
                          background: isSelected ? 'rgba(255,255,255,0.05)' : 'transparent',
                          borderBottom: '1px solid #141414',
                          borderLeft: `2px solid ${isSelected ? 'rgba(255,255,255,0.35)' : 'transparent'}`,
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent';
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '0.85rem',
                              color: '#fff',
                              fontWeight: 500,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {lead.company_name || name}
                          </div>
                          {lead.company_name && (
                            <div
                              style={{
                                fontSize: '0.74rem',
                                color: '#555',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {name}
                            </div>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: '#555',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {lead.email ?? '—'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#777' }}>{industry}</div>
                        <StatusBadge status={lead.status} />
                        <ScoreBadge score={lead.score} />
                        <div style={{ fontSize: '0.77rem', color: '#444' }}>{date}</div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(lead.id);
                          }}
                          className="row-trash"
                          title="Lead löschen"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#333',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0,
                            transition: 'opacity 0.15s',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      {deleteConfirmId === lead.id && (
                        <div
                          style={{
                            padding: '0.5rem 1.25rem',
                            background: 'rgba(239,68,68,0.06)',
                            borderBottom: '1px solid rgba(239,68,68,0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.5rem',
                          }}
                        >
                          <span style={{ fontSize: '0.76rem', color: '#f87171' }}>Lead löschen?</span>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmId(null);
                              }}
                              style={{
                                background: 'none',
                                border: '1px solid #333',
                                color: '#888',
                                borderRadius: 6,
                                padding: '0.25rem 0.6rem',
                                fontSize: '0.73rem',
                                cursor: 'pointer',
                              }}
                            >
                              Abbrechen
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteLead(lead.id);
                              }}
                              style={{
                                background: '#ef4444',
                                border: 'none',
                                color: '#fff',
                                borderRadius: 6,
                                padding: '0.25rem 0.6rem',
                                fontSize: '0.73rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Löschen
                            </button>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── Detail Panel ── */}
        {selectedLead && (
          <div
            style={{
              width: 380,
              flexShrink: 0,
              background: '#111',
              border: '1px solid #1f1f1f',
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 'calc(100vh - 5rem)',
              position: 'sticky',
              top: 0,
            }}
          >
            {/* Panel header */}
            <div
              style={{
                padding: '1rem 1.25rem',
                borderBottom: '1px solid #1a1a1a',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '0.75rem',
                flexShrink: 0,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: '#fff',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {selectedLead.company_name ||
                    `${selectedLead.first_name ?? ''} ${selectedLead.last_name ?? ''}`.trim() ||
                    '—'}
                </div>
                <div style={{ fontSize: '0.77rem', color: '#555', marginTop: '0.15rem' }}>
                  {[selectedLead.first_name, selectedLead.last_name].filter(Boolean).join(' ')}
                  {selectedLead.city ? ` · ${selectedLead.city}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                {selectedLead.phone && (
                  <button
                    onClick={() => window.open('tel:' + ((cf?.normalized_phone as string) ?? selectedLead.phone))}
                    title="Anrufen"
                    style={{
                      background: '#1a1a1a',
                      border: '1px solid #222',
                      color: '#888',
                      borderRadius: 7,
                      width: 29,
                      height: 29,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                    }}
                  >
                    ☎
                  </button>
                )}
                {selectedLead.email && (
                  <button
                    onClick={() => window.open('mailto:' + selectedLead.email)}
                    title="E-Mail senden"
                    style={{
                      background: '#1a1a1a',
                      border: '1px solid #222',
                      color: '#888',
                      borderRadius: 7,
                      width: 29,
                      height: 29,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                    }}
                  >
                    ✉
                  </button>
                )}
                {selectedLead.website && (
                  <a
                    href={
                      selectedLead.website.startsWith('http') ? selectedLead.website : `https://${selectedLead.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Website öffnen"
                    style={{
                      background: '#1a1a1a',
                      border: '1px solid #222',
                      color: '#888',
                      borderRadius: 7,
                      width: 29,
                      height: 29,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                      fontSize: '0.85rem',
                    }}
                  >
                    ↗
                  </a>
                )}
                <button
                  onClick={() => setDeleteConfirmId(selectedLead.id)}
                  title="Lead löschen"
                  style={{
                    background: 'none',
                    border: '1px solid #222',
                    color: '#555',
                    borderRadius: 7,
                    width: 29,
                    height: 29,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={13} />
                </button>
                <button
                  onClick={() => setSelectedLead(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#444',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    lineHeight: 1,
                    padding: '0 0 0 0.25rem',
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Delete confirmation */}
            {deleteConfirmId === selectedLead.id && (
              <div
                style={{
                  padding: '0.75rem 1.25rem',
                  background: 'rgba(239,68,68,0.06)',
                  borderBottom: '1px solid rgba(239,68,68,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: '0.79rem', color: '#f87171' }}>
                  Lead löschen? Kann nicht rückgängig gemacht werden.
                </span>
                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    style={{
                      background: 'none',
                      border: '1px solid #333',
                      color: '#888',
                      borderRadius: 6,
                      padding: '0.3rem 0.7rem',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={() => handleDeleteLead(selectedLead.id)}
                    style={{
                      background: '#ef4444',
                      border: 'none',
                      color: '#fff',
                      borderRadius: 6,
                      padding: '0.3rem 0.7rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Löschen
                  </button>
                </div>
              </div>
            )}

            {/* Scrollable body */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: '0 0 12px 12px' }}>
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 48,
                  background: 'linear-gradient(to bottom, transparent, #111)',
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              />
              <div
                style={{
                  height: '100%',
                  overflowY: 'auto',
                  padding: '1.1rem 1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                }}
              >
                {/* Disposable email warning */}
                {!!cf?.is_disposable_email && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: 8,
                      padding: '0.65rem 0.9rem',
                    }}
                  >
                    <span style={{ color: '#f87171', fontWeight: 700, fontSize: '0.85rem' }}>!</span>
                    <span style={{ fontSize: '0.79rem', color: '#f87171', fontWeight: 500 }}>
                      Wegwerf-E-Mail erkannt — Lead wahrscheinlich unbrauchbar
                    </span>
                  </div>
                )}

                {/* Badges row */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <ScoreBadge score={selectedLead.score} />
                  <StatusBadge status={selectedLead.status} />
                  {!!cf?.lead_quality &&
                    (() => {
                      const q = (cf.lead_quality as string).toLowerCase();
                      const { bg, fg } = QUALITY_COLORS[q] ?? { bg: '#1a1a1a', fg: '#666' };
                      return (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            background: bg,
                            color: fg,
                            borderRadius: 999,
                            padding: '2px 8px',
                            fontSize: '0.7rem',
                            fontWeight: 500,
                          }}
                        >
                          {cf.lead_quality as string}
                        </span>
                      );
                    })()}
                  {selectedLead.source && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        color: '#555',
                        background: '#1a1a1a',
                        borderRadius: 999,
                        padding: '2px 8px',
                      }}
                    >
                      {selectedLead.source}
                    </span>
                  )}
                </div>

                {/* Contact in hours */}
                {cf?.contact_in_hours !== undefined && (cf.contact_in_hours as number) > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'rgba(234,179,8,0.05)',
                      border: '1px solid rgba(234,179,8,0.12)',
                      borderRadius: 7,
                      padding: '0.5rem 0.85rem',
                    }}
                  >
                    <span style={{ fontSize: '0.79rem', color: 'rgba(234,179,8,0.85)' }}>
                      Empfohlen innerhalb von <strong>{cf.contact_in_hours as number} Std.</strong> kontaktieren
                    </span>
                  </div>
                )}

                {/* Status update */}
                <div>
                  <label style={lbl}>Status ändern</label>
                  <select
                    value={selectedLead.status}
                    onChange={(e) => handleStatusUpdate(selectedLead.id, e.target.value)}
                    style={{ ...field, cursor: 'pointer', background: '#0a0a0a', borderColor: '#1f1f1f' }}
                  >
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kontaktdaten */}
                <CollapsibleSection label="Kontaktdaten">
                  <div
                    style={{
                      background: '#0a0a0a',
                      borderRadius: 8,
                      padding: '0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.45rem',
                    }}
                  >
                    {selectedLead.email && (
                      <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.81rem', alignItems: 'center' }}>
                        <span style={{ color: '#444', minWidth: 72, flexShrink: 0 }}>E-Mail</span>
                        <span style={{ color: '#ccc', wordBreak: 'break-all', flex: 1 }}>{selectedLead.email}</span>
                        <button
                          onClick={() => copyWithFeedback(selectedLead.email!, 'email')}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: copiedField === 'email' ? '#4ade80' : '#444',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            padding: '0 0.15rem',
                            flexShrink: 0,
                          }}
                          title="Kopieren"
                        >
                          {copiedField === 'email' ? '✓' : '⎘'}
                        </button>
                      </div>
                    )}
                    {(cf?.normalized_phone ?? selectedLead.phone) && (
                      <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.81rem', alignItems: 'center' }}>
                        <span style={{ color: '#444', minWidth: 72, flexShrink: 0 }}>Telefon</span>
                        <span style={{ color: '#ccc', flex: 1 }}>
                          {(cf?.normalized_phone as string) ?? selectedLead.phone}
                        </span>
                        <button
                          onClick={() =>
                            copyWithFeedback((cf?.normalized_phone as string) ?? selectedLead.phone!, 'phone')
                          }
                          style={{
                            background: 'none',
                            border: 'none',
                            color: copiedField === 'phone' ? '#4ade80' : '#444',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            padding: '0 0.15rem',
                            flexShrink: 0,
                          }}
                          title="Kopieren"
                        >
                          {copiedField === 'phone' ? '✓' : '⎘'}
                        </button>
                      </div>
                    )}
                    {!!cf?.job_title && (
                      <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.81rem' }}>
                        <span style={{ color: '#444', minWidth: 72, flexShrink: 0 }}>Position</span>
                        <span style={{ color: '#ccc' }}>{cf.job_title as string}</span>
                      </div>
                    )}
                    {!!cf?.linkedin_url && (
                      <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.81rem', alignItems: 'center' }}>
                        <span style={{ color: '#444', minWidth: 72, flexShrink: 0 }}>LinkedIn</span>
                        <a
                          href={cf.linkedin_url as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#60a5fa', fontSize: '0.79rem', textDecoration: 'none' }}
                        >
                          Profil öffnen ↗
                        </a>
                      </div>
                    )}
                    {!!selectedLead.estimated_value && (
                      <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.81rem' }}>
                        <span style={{ color: '#444', minWidth: 72, flexShrink: 0 }}>Deal-Wert</span>
                        <span style={{ color: '#4ade80', fontWeight: 600 }}>
                          {new Intl.NumberFormat('de-DE', {
                            style: 'currency',
                            currency: 'EUR',
                            maximumFractionDigits: 0,
                          }).format(selectedLead.estimated_value)}
                        </span>
                      </div>
                    )}
                  </div>
                </CollapsibleSection>

                {/* AI Summary */}
                {selectedLead.ai_summary && (
                  <CollapsibleSection label="KI-Zusammenfassung">
                    <p
                      style={{
                        fontSize: '0.81rem',
                        color: '#888',
                        lineHeight: 1.6,
                        background: '#0a0a0a',
                        borderRadius: 8,
                        padding: '0.85rem',
                        margin: 0,
                      }}
                    >
                      {selectedLead.ai_summary}
                    </p>
                  </CollapsibleSection>
                )}

                {/* AI Next Action */}
                {selectedLead.ai_next_action && (
                  <div
                    style={{
                      background: 'rgba(234,179,8,0.05)',
                      border: '1px solid rgba(234,179,8,0.15)',
                      borderRadius: 8,
                      padding: '0.85rem',
                    }}
                  >
                    <label style={{ ...lbl, color: 'rgba(234,179,8,0.7)', marginBottom: '0.4rem', display: 'block' }}>
                      Empfohlene Aktion
                    </label>
                    <p style={{ fontSize: '0.81rem', color: '#ccc', lineHeight: 1.5, margin: 0 }}>
                      {selectedLead.ai_next_action}
                    </p>
                  </div>
                )}

                {/* ── Follow-up Context ── */}
                {!!cf?.follow_up_context &&
                  (() => {
                    const fuc = cf.follow_up_context as Record<string, unknown>;
                    const items = [
                      { label: 'Unternehmen', val: fuc.company_description as string | undefined },
                      { label: 'Pain Points', val: fuc.pain_points as string | undefined },
                      { label: 'Automatisierungspotenzial', val: fuc.automation_opportunities as string | undefined },
                      {
                        label: 'Gesprächseinstieg',
                        val: fuc.conversation_opener as string | undefined,
                        highlight: true,
                      },
                    ].filter((r) => r.val);
                    if (items.length === 0) return null;
                    return (
                      <CollapsibleSection label="Follow-up Kontext">
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.65rem',
                            background: '#0a0a0a',
                            borderRadius: 8,
                            padding: '0.85rem',
                          }}
                        >
                          {items.map((r) => (
                            <div key={r.label}>
                              <div
                                style={{
                                  fontSize: '0.67rem',
                                  color: r.highlight ? 'rgba(107,122,255,0.7)' : '#444',
                                  marginBottom: '0.2rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em',
                                  fontWeight: 600,
                                }}
                              >
                                {r.label}
                              </div>
                              <div
                                style={{
                                  fontSize: '0.81rem',
                                  color: r.highlight ? '#c4c8ff' : '#888',
                                  lineHeight: 1.5,
                                }}
                              >
                                {r.val}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleSection>
                    );
                  })()}

                {/* ── KI-Scoring ── */}
                <CollapsibleSection label="KI-Scoring">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {(() => {
                      const sb = (cf?.score_breakdown ?? DUMMY_CF.score_breakdown) as Record<string, number>;
                      const barLabels: Record<string, string> = {
                        kontakt_vertrauen: 'Kontakt & Vertrauen',
                        kaufbereitschaft: 'Kaufbereitschaft',
                        unternehmensfit: 'Unternehmensfit',
                        abzuege: 'Abzüge',
                      };
                      const barColors: Record<string, string> = {
                        kontakt_vertrauen: '#818cf8',
                        kaufbereitschaft: '#4ade80',
                        unternehmensfit: '#fb923c',
                        abzuege: '#f87171',
                      };
                      return Object.entries(sb).map(([k, v]) => {
                        const maxVal = SCORE_MAX[k] ?? 35;
                        const pct = Math.min((Math.abs(v) / maxVal) * 100, 100);
                        const color = barColors[k] ?? '#818cf8';
                        return (
                          <div key={k}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '0.76rem',
                                marginBottom: '0.3rem',
                              }}
                            >
                              <span style={{ color: '#666' }}>{barLabels[k] ?? k}</span>
                              <span style={{ color, fontWeight: 700 }}>
                                {v > 0 ? '+' : ''}
                                {v}
                              </span>
                            </div>
                            <div style={{ height: 4, borderRadius: 2, background: '#1a1a1a' }}>
                              <div
                                style={{
                                  height: '100%',
                                  borderRadius: 2,
                                  width: `${pct}%`,
                                  background: color,
                                  opacity: 0.75,
                                  transition: 'width 0.5s ease',
                                }}
                              />
                            </div>
                          </div>
                        );
                      });
                    })()}
                    <div
                      style={{
                        borderTop: '1px solid #1a1a1a',
                        paddingTop: '0.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.78rem',
                      }}
                    >
                      <span style={{ color: '#555' }}>Gesamt-Score</span>
                      <span style={{ fontWeight: 700, color: getScoreColor(selectedLead.score).fg }}>
                        {selectedLead.score ?? '—'} / 100
                      </span>
                    </div>
                    {/* Stärken & Bedenken — 2-col */}
                    {(() => {
                      const strengths = ((cf?.strengths ?? DUMMY_CF.strengths) as string[]) ?? [];
                      const concerns = ((cf?.concerns ?? DUMMY_CF.concerns) as string[]) ?? [];
                      if (strengths.length === 0 && concerns.length === 0) return null;
                      return (
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '0.75rem',
                            marginTop: '0.25rem',
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: '0.67rem',
                                color: '#4ade80',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                marginBottom: '0.4rem',
                              }}
                            >
                              Stärken
                            </div>
                            {strengths.map((s, i) => (
                              <div
                                key={i}
                                style={{
                                  display: 'flex',
                                  gap: '0.35rem',
                                  fontSize: '0.76rem',
                                  color: '#888',
                                  marginBottom: '0.3rem',
                                  lineHeight: 1.4,
                                }}
                              >
                                <span style={{ color: '#4ade80', flexShrink: 0 }}>✓</span>
                                {s}
                              </div>
                            ))}
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: '0.67rem',
                                color: '#fde047',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                marginBottom: '0.4rem',
                              }}
                            >
                              Bedenken
                            </div>
                            {concerns.map((s, i) => (
                              <div
                                key={i}
                                style={{
                                  display: 'flex',
                                  gap: '0.35rem',
                                  fontSize: '0.76rem',
                                  color: '#888',
                                  marginBottom: '0.3rem',
                                  lineHeight: 1.4,
                                }}
                              >
                                <span style={{ color: '#fde047', flexShrink: 0 }}>⚠</span>
                                {s}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                    {/* Red flags */}
                    {((cf?.red_flags ?? DUMMY_CF.red_flags) as string[])?.length > 0 && (
                      <div
                        style={{
                          background: 'rgba(239,68,68,0.06)',
                          border: '1px solid rgba(239,68,68,0.15)',
                          borderRadius: 7,
                          padding: '0.6rem 0.8rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.3rem',
                        }}
                      >
                        {((cf?.red_flags ?? DUMMY_CF.red_flags) as string[]).map((s, i) => (
                          <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.78rem', color: '#888' }}>
                            <span style={{ color: '#f87171', flexShrink: 0 }}>✕</span>
                            {s}
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={async () => {
                        if (!tenantId || !selectedLead) return;
                        setRescoring(true);
                        try {
                          const res = await fetch('/api/leads/rescore', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrfToken() },
                            body: JSON.stringify({ lead_id: selectedLead.id, tenant_id: tenantId }),
                          });
                          if (!res.ok) throw new Error('Scoring fehlgeschlagen');
                          showToast('KI-Scoring gestartet — Score wird aktualisiert');
                          setTimeout(() => {
                            loadLeads();
                            if (selectedLead) handleSelectLead(selectedLead);
                          }, 5000);
                        } catch {
                          showToast('Scoring konnte nicht gestartet werden');
                        } finally {
                          setRescoring(false);
                        }
                      }}
                      disabled={rescoring}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem',
                        width: '100%',
                        marginTop: '0.25rem',
                        background: '#1a1a1a',
                        border: '1px solid #2a2a2a',
                        color: rescoring ? '#555' : '#888',
                        borderRadius: 7,
                        padding: '0.45rem',
                        fontSize: '0.76rem',
                        cursor: rescoring ? 'default' : 'pointer',
                      }}
                    >
                      {rescoring ? (
                        <>
                          <UniqueLoading size="sm" /> Wird bewertet…
                        </>
                      ) : (
                        '↻ Neu bewerten'
                      )}
                    </button>
                  </div>
                </CollapsibleSection>

                {/* ── Firmenprofil — 2-col grid ── */}
                <CollapsibleSection label="Firmenprofil">
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem',
                      background: '#0a0a0a',
                      borderRadius: 8,
                      padding: '0.85rem',
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 0.75rem' }}>
                      {[
                        { label: 'Branche', val: cf?.industry },
                        { label: 'Typ', val: cf?.company_type },
                        { label: 'Größe', val: cf?.company_size },
                        {
                          label: 'Mitarbeiter',
                          val: cf?.employee_count ? `${cf.employee_count} Mitarbeiter` : undefined,
                        },
                        { label: 'Position', val: cf?.job_title },
                        { label: 'Budget', val: cf?.budget_estimate, highlight: true },
                        { label: 'Jahresumsatz', val: cf?.annual_revenue },
                      ]
                        .filter((r) => r.val)
                        .map((r) => (
                          <div key={r.label}>
                            <div
                              style={{
                                fontSize: '0.67rem',
                                color: '#444',
                                marginBottom: '0.15rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                              }}
                            >
                              {r.label}
                            </div>
                            <div
                              style={{
                                fontSize: '0.81rem',
                                color: r.highlight ? '#4ade80' : '#ccc',
                                fontWeight: r.highlight ? 600 : 400,
                              }}
                            >
                              {r.val as string}
                            </div>
                          </div>
                        ))}
                    </div>
                    {(cf?.technologies as string[])?.length > 0 && (
                      <div>
                        <div
                          style={{
                            fontSize: '0.67rem',
                            color: '#444',
                            marginBottom: '0.3rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          Technologien
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {(cf!.technologies as string[]).map((t) => (
                            <span
                              key={t}
                              style={{
                                background: 'rgba(107,122,255,0.1)',
                                color: '#818cf8',
                                borderRadius: 999,
                                padding: '2px 8px',
                                fontSize: '0.71rem',
                              }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {!!cf?.linkedin_url && (
                      <div>
                        <div
                          style={{
                            fontSize: '0.67rem',
                            color: '#444',
                            marginBottom: '0.15rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          LinkedIn
                        </div>
                        <a
                          href={cf.linkedin_url as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#60a5fa', fontSize: '0.79rem', textDecoration: 'none' }}
                        >
                          Profil öffnen ↗
                        </a>
                      </div>
                    )}
                    {!!cf?.email_status && (
                      <div>
                        <div
                          style={{
                            fontSize: '0.67rem',
                            color: '#444',
                            marginBottom: '0.15rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          E-Mail Status
                        </div>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.79rem',
                            color: (cf.email_status as string).toLowerCase() === 'verified' ? '#4ade80' : '#888',
                          }}
                        >
                          {(cf.email_status as string).toLowerCase() === 'verified' && (
                            <span
                              style={{ width: 6, height: 6, borderRadius: 3, background: '#4ade80', flexShrink: 0 }}
                            />
                          )}
                          {cf.email_status as string}
                        </span>
                      </div>
                    )}
                  </div>
                </CollapsibleSection>

                {/* ── Qualitätssignale — 2-col grid ── */}
                <CollapsibleSection label="Qualitätssignale">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {[
                      { label: 'Firmen-E-Mail', val: cf?.is_company_email as boolean | undefined },
                      { label: 'Telefon gültig', val: cf?.has_valid_phone as boolean | undefined },
                      { label: 'Website erreichbar', val: cf?.website_loaded as boolean | undefined },
                      {
                        label: 'Kein Free-Mail',
                        val: cf?.is_free_email !== undefined ? !(cf.is_free_email as boolean) : undefined,
                      },
                    ]
                      .filter((r) => r.val !== undefined)
                      .map((r) => {
                        const ok = r.val as boolean;
                        return (
                          <div
                            key={r.label}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              background: ok ? 'rgba(74,222,128,0.06)' : 'rgba(248,113,113,0.06)',
                              border: `1px solid ${ok ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)'}`,
                              borderRadius: 7,
                              padding: '0.4rem 0.65rem',
                            }}
                          >
                            <span style={{ fontSize: '0.8rem', color: ok ? '#4ade80' : '#f87171', flexShrink: 0 }}>
                              {ok ? '✓' : '✕'}
                            </span>
                            <span style={{ fontSize: '0.74rem', color: '#777' }}>{r.label}</span>
                          </div>
                        );
                      })}
                    {!!cf?.message_quality &&
                      (() => {
                        const mq = (cf.message_quality as string).toLowerCase();
                        const c = MESSAGE_QUALITY_COLORS[mq] ?? { bg: 'rgba(255,255,255,0.04)', fg: '#555' };
                        return (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              background: c.bg,
                              border: `1px solid ${c.fg}22`,
                              borderRadius: 7,
                              padding: '0.4rem 0.65rem',
                              gridColumn: 'span 2',
                            }}
                          >
                            <span style={{ fontSize: '0.74rem', color: c.fg }}>
                              Nachricht: {cf.message_quality as string}
                            </span>
                          </div>
                        );
                      })()}
                  </div>
                </CollapsibleSection>

                {/* AI Tags */}
                {selectedLead.ai_tags && selectedLead.ai_tags.length > 0 && (
                  <div>
                    <label style={lbl}>KI-Tags</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
                      {selectedLead.ai_tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            background: '#1a1a1a',
                            borderRadius: 999,
                            padding: '2px 8px',
                            fontSize: '0.74rem',
                            color: '#555',
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedLead.notes && (
                  <CollapsibleSection label="Nachricht / Notiz">
                    <p
                      style={{
                        fontSize: '0.81rem',
                        color: '#888',
                        lineHeight: 1.6,
                        background: '#0a0a0a',
                        borderRadius: 8,
                        padding: '0.85rem',
                        margin: 0,
                      }}
                    >
                      {selectedLead.notes}
                    </p>
                  </CollapsibleSection>
                )}

                {/* Activities */}
                <CollapsibleSection
                  label={`Aktivitätsverlauf${displayActivities.length > 0 ? ` (${displayActivities.length})` : ''}`}
                >
                  {activitiesLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {[1, 2, 3].map((i) => (
                        <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                          <div
                            style={{ width: 26, height: 26, borderRadius: 7, background: '#1a1a1a', flexShrink: 0 }}
                          />
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <div style={{ height: 10, borderRadius: 4, background: '#1a1a1a', width: '60%' }} />
                            <div style={{ height: 8, borderRadius: 4, background: '#141414', width: '40%' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : displayActivities.length === 0 ? (
                    <p style={{ fontSize: '0.79rem', color: '#333', textAlign: 'center', padding: '1rem 0' }}>
                      Keine Aktivitäten vorhanden.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {[...displayActivities]
                        .sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0))
                        .map((act) => (
                          <ActivityItem key={act.id} act={act} />
                        ))}
                    </div>
                  )}
                </CollapsibleSection>
              </div>
            </div>
          </div>
        )}
      </div>
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </>
  );
}
