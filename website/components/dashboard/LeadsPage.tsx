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
import { tokens, getScoreStyle, getStatusStyle } from '@/lib/design-tokens';

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
        fontSize: 11,
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
        fontSize: 11,
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
  const [scoreRange, setScoreRange] = useState<'all' | '70+' | '45-69' | '<45'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tagToggles, setTagToggles] = useState<Record<string, boolean>>({});
  const [sortBy, setSortBy] = useState('score_desc');
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
  const [showAllTags, setShowAllTags] = useState(false);
  const [activeTab, setActiveTab] = useState('E-Mail');

  // Reset tab when lead changes
  useEffect(() => {
    if (selectedLead) setActiveTab(selectedLead.email_draft ? 'E-Mail' : 'KI-Zusammenfassung');
  }, [selectedLead?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const toggleTag = (tag: string) => setTagToggles((prev) => ({ ...prev, [tag]: !prev[tag] }));

  const resetFilters = () => {
    setScoreRange('all');
    setStatusFilter('all');
    setTagToggles({});
    setSearch('');
  };
  const activeTagCount = Object.values(tagToggles).filter(Boolean).length;
  const hasFilters = scoreRange !== 'all' || statusFilter !== 'all' || activeTagCount > 0 || search !== '';

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
          const s = l.score ?? 0;
          const matchScore =
            scoreRange === 'all' ||
            (scoreRange === '70+' && s >= 70) ||
            (scoreRange === '45-69' && s >= 45 && s < 70) ||
            (scoreRange === '<45' && s < 45);
          const matchStatus = statusFilter === 'all' || l.status === statusFilter;
          const matchTags = !tagToggles.has_email || l.email_draft !== null;
          const matchPremium = !tagToggles.premium || (l.ai_tags ?? []).includes('premium_lead');
          const matchKI = !tagToggles.ki_affin || (l.ai_tags ?? []).includes('ki_affin');
          return matchSearch && matchScore && matchStatus && matchTags && matchPremium && matchKI;
        })
        .sort((a, b) => {
          if (sortBy === 'score_desc') return (b.score ?? 0) - (a.score ?? 0);
          if (sortBy === 'score_asc') return (a.score ?? 0) - (b.score ?? 0);
          if (sortBy === 'name_asc')
            return `${a.first_name ?? ''} ${a.last_name ?? ''}`.localeCompare(
              `${b.first_name ?? ''} ${b.last_name ?? ''}`
            );
          if (sortBy === 'name_desc')
            return `${b.first_name ?? ''} ${b.last_name ?? ''}`.localeCompare(
              `${a.first_name ?? ''} ${a.last_name ?? ''}`
            );
          if (sortBy === 'status_asc') return (a.status ?? '').localeCompare(b.status ?? '');
          if (sortBy === 'status_desc') return (b.status ?? '').localeCompare(a.status ?? '');
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }),
    [leads, search, scoreRange, statusFilter, tagToggles, sortBy]
  );

  const scored = leads.filter((l) => l.score !== null).length;
  const premium = leads.filter((l) => (l.ai_tags ?? []).includes('premium_lead')).length;
  const withEmail = leads.filter((l) => l.email_draft !== null).length;
  const avgScore = scored > 0 ? Math.round(leads.reduce((sum, l) => sum + (l.score ?? 0), 0) / scored) : 0;

  const hot = leads.filter((l) => (l.score ?? 0) >= 70).length;
  const warm = leads.filter((l) => {
    const s = l.score ?? 0;
    return s >= 45 && s < 70;
  }).length;
  const newCount = leads.filter((l) => l.status === 'new').length;

  const cf = (selectedLead?.custom_fields ?? DUMMY_CF) as unknown as Record<string, unknown>;
  const displayActivities = activities.length > 0 ? activities : DUMMY_ACTIVITIES;

  const cold = leads.length - hot - warm;
  const contacted = leads.filter((l) => l.status === 'contacted').length;
  const qualified = leads.filter((l) => l.status === 'qualified').length;

  // Leads over time (last 14 days)
  const byDate = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const l of leads) {
      const d = l.created_at.slice(0, 10);
      acc[d] = (acc[d] || 0) + 1;
    }
    return Object.entries(acc)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14);
  }, [leads]);
  const maxByDate = Math.max(...byDate.map(([, v]) => v), 1);

  // Top 5 industries
  const topIndustries = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const l of leads) {
      const ind =
        ((l.custom_fields as Record<string, unknown>)?.industry_de as string) ||
        ((l.custom_fields as Record<string, unknown>)?.industry as string) ||
        'Unbekannt';
      acc[ind] = (acc[ind] || 0) + 1;
    }
    return Object.entries(acc)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [leads]);
  const maxInd = topIndustries.length > 0 ? topIndustries[0][1] : 1;

  // ESC handler for overlay
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedLead(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const scoreColor = (s: number | null) => getScoreStyle(s).color;
  const cardStyle: React.CSSProperties = {
    background: tokens.bg.surface,
    border: '1px solid ' + tokens.bg.border,
    borderRadius: tokens.radius.lg,
    padding: '16px 20px',
  };

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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1
              style={{ fontSize: 28, fontWeight: 700, color: tokens.text.primary, margin: 0, letterSpacing: '-0.02em' }}
            >
              Leads
            </h1>
            <p style={{ fontSize: 14, color: tokens.text.muted, marginTop: 4 }}>Lead Intelligence Dashboard</p>
          </div>
          <button
            onClick={() => setGeneratorOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 18px',
              borderRadius: tokens.radius.md,
              cursor: 'pointer',
              background: tokens.brand.primary,
              border: 'none',
              color: tokens.text.inverse,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <Zap size={14} /> Lead Generator
          </button>
        </div>

        {/* Stats Dashboard — 5 Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#f9fafb', lineHeight: 1 }}>{leads.length}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>Leads gesamt</div>
            <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>{scored} gescored</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 28, fontWeight: 700, color: scoreColor(avgScore), lineHeight: 1 }}>{avgScore}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>Ø Score</div>
            <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)', marginTop: 6 }}>
              <div
                style={{ width: `${avgScore}%`, height: '100%', borderRadius: 2, background: scoreColor(avgScore) }}
              />
            </div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span>
                <span style={{ color: '#22c55e' }}>●</span> {hot} Premium
              </span>
              <span>
                <span style={{ color: '#f59e0b' }}>●</span> {warm} Warm
              </span>
              <span>
                <span style={{ color: '#4b5563' }}>●</span> {cold} Cold
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>Score-Verteilung</div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#f9fafb', lineHeight: 1 }}>{withEmail}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>E-Mail bereit</div>
            <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)', marginTop: 6 }}>
              <div
                style={{
                  width: leads.length ? `${(withEmail / leads.length) * 100}%` : '0%',
                  height: '100%',
                  borderRadius: 2,
                  background: '#6b7280',
                }}
              />
            </div>
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#f9fafb', lineHeight: 1 }}>{contacted}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>Kontaktiert</div>
            <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>{qualified} qualifiziert</div>
          </div>
        </div>

        {/* Mini Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>Neue Leads (letzte 14 Tage)</div>
            {byDate.length > 0 ? (
              <svg viewBox={`0 0 ${byDate.length * 28} 60`} style={{ width: '100%', height: 50 }}>
                {byDate.map(([day, count], i) => {
                  const h = Math.max((count / maxByDate) * 44, 4);
                  return (
                    <g key={day}>
                      <rect
                        x={i * 28 + 4}
                        y={44 - h}
                        width={20}
                        height={h}
                        rx={3}
                        fill={i === byDate.length - 1 ? '#f9fafb' : 'rgba(255,255,255,0.15)'}
                      />
                      <text x={i * 28 + 14} y={56} textAnchor="middle" fill="#4b5563" fontSize={9}>
                        {day.slice(8)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            ) : (
              <div style={{ fontSize: 12, color: '#374151', padding: '10px 0' }}>Keine Daten</div>
            )}
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>Top Branchen</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {topIndustries.map(([name, count]) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: 11,
                      color: '#9ca3af',
                      width: 80,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {name}
                  </span>
                  <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}>
                    <div
                      style={{
                        width: `${(count / maxInd) * 100}%`,
                        height: '100%',
                        borderRadius: 2,
                        background: 'rgba(255,255,255,0.2)',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 11, color: '#6b7280', width: 20, textAlign: 'right' }}>{count}</span>
                </div>
              ))}
              {topIndustries.length === 0 && <div style={{ fontSize: 12, color: '#374151' }}>Keine Daten</div>}
            </div>
          </div>
        </div>

        {/* Filter toolbar */}
        {(() => {
          const fb = (active: boolean): React.CSSProperties => ({
            fontSize: 12,
            padding: '4px 10px',
            borderRadius: 6,
            cursor: 'pointer',
            border: active ? '1px solid transparent' : '1px solid ' + tokens.bg.border,
            background: active ? tokens.brand.primary : 'transparent',
            color: active ? tokens.text.inverse : tokens.text.muted,
            fontWeight: active ? 600 : undefined,
            transition: 'all 0.12s',
            whiteSpace: 'nowrap',
          });
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 280 }}>
                  <Search
                    size={14}
                    style={{
                      position: 'absolute',
                      left: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#6b7280',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Name oder Firma…"
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: '1px solid #2a2a2a',
                      borderRadius: 6,
                      color: '#fff',
                      fontSize: 13,
                      padding: '5px 10px 5px 30px',
                      outline: 'none',
                    }}
                  />
                </div>
                <span style={{ color: '#333', margin: '0 2px' }}>|</span>
                {(['all', '70+', '45-69', '<45'] as const).map((r) => (
                  <button key={r} onClick={() => setScoreRange(r)} style={fb(scoreRange === r)}>
                    {r === 'all' ? 'Alle Scores' : r}
                  </button>
                ))}
                <span style={{ color: '#333', margin: '0 2px' }}>|</span>
                {[
                  ['all', 'Alle'],
                  ['new', 'New'],
                  ['contacted', 'Contacted'],
                  ['qualified', 'Qualified'],
                  ['lost', 'Lost'],
                ].map(([k, l]) => (
                  <button key={k} onClick={() => setStatusFilter(k)} style={fb(statusFilter === k)}>
                    {l}
                  </button>
                ))}
                <span style={{ color: '#333', margin: '0 2px' }}>|</span>
                <button onClick={() => toggleTag('has_email')} style={fb(!!tagToggles.has_email)}>
                  ✉ Hat E-Mail
                </button>
                <button onClick={() => toggleTag('premium')} style={fb(!!tagToggles.premium)}>
                  Premium
                </button>
                <button onClick={() => toggleTag('ki_affin')} style={fb(!!tagToggles.ki_affin)}>
                  KI-affin
                </button>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 12, color: '#4b5563' }}>
                  {filtered.length} von {leads.length} Leads
                </span>
                {hasFilters && (
                  <button
                    onClick={resetFilters}
                    style={{
                      fontSize: 12,
                      color: '#6b7280',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0,
                    }}
                  >
                    Zurücksetzen
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* Lead Table */}
        {(() => {
          const TAG_PRIO = ['premium_lead', 'ki_affin', 'inhaber_kontakt', 'automatisierungspotenzial', 'firmen_email'];
          const thStyle: React.CSSProperties = {
            fontSize: 11,
            fontWeight: 500,
            color: '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '10px 12px',
            textAlign: 'left',
            borderBottom: '1px solid #e5e7eb',
            cursor: 'pointer',
            userSelect: 'none',
            whiteSpace: 'nowrap',
          };
          const scoreColor = (s: number | null) => getScoreStyle(s).color;
          return (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                background: '#0a0a0a',
                border: '1px solid #1f1f1f',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <thead>
                <tr>
                  {[
                    { key: 'score', label: 'Score', w: 70 },
                    { key: 'name', label: 'Name / Firma', w: undefined },
                    { key: 'industry', label: 'Branche', w: 130 },
                    { key: 'tags', label: 'Tags', w: 170 },
                    { key: 'status', label: 'Status', w: 130 },
                    { key: 'email_draft', label: '✉', w: 40 },
                    { key: 'action', label: '', w: 90 },
                  ].map((col) => (
                    <th
                      key={col.key}
                      style={{ ...thStyle, width: col.w }}
                      onClick={() => {
                        if (col.key === 'score') setSortBy(sortBy === 'score_desc' ? 'score_asc' : 'score_desc');
                        else if (col.key === 'name') setSortBy(sortBy === 'name_asc' ? 'name_desc' : 'name_asc');
                        else if (col.key === 'status')
                          setSortBy(sortBy === 'status_asc' ? 'status_desc' : 'status_asc');
                      }}
                    >
                      {col.label}
                      {sortBy === 'score_desc' && col.key === 'score'
                        ? ' ↓'
                        : sortBy === 'score_asc' && col.key === 'score'
                          ? ' ↑'
                          : ''}
                      {sortBy === 'name_asc' && col.key === 'name'
                        ? ' ↑'
                        : sortBy === 'name_desc' && col.key === 'name'
                          ? ' ↓'
                          : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading || tenantLoading ? (
                  [1, 2, 3].map((i) => (
                    <tr key={i}>
                      <td colSpan={7} style={{ padding: '14px 12px', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ height: 10, borderRadius: 4, background: '#1a1a1a', width: `${40 + i * 15}%` }} />
                      </td>
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#f87171', fontSize: 14 }}>
                      {error}
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
                      Keine Leads gefunden
                      {hasFilters && (
                        <>
                          {' '}
                          —{' '}
                          <button
                            onClick={resetFilters}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#6b7280',
                              textDecoration: 'underline',
                              cursor: 'pointer',
                              fontSize: 14,
                            }}
                          >
                            Filter zurücksetzen
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ) : (
                  filtered.map((lead) => {
                    const isSelected = selectedLead?.id === lead.id;
                    const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || '—';
                    const tags = (lead.ai_tags ?? []).filter((t) => TAG_PRIO.includes(t));
                    const visibleTags = tags.slice(0, 2);
                    const extraTags = tags.length - 2;
                    return (
                      <React.Fragment key={lead.id}>
                        <tr
                          className="lead-row"
                          style={{
                            height: 48,
                            borderBottom: '1px solid #1a1a1a',
                            cursor: 'pointer',
                            transition: 'background 0.1s',
                            background: isSelected ? 'rgba(255,255,255,0.04)' : 'transparent',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.background = 'transparent';
                          }}
                          onClick={() => handleSelectLead(lead)}
                        >
                          <td style={{ padding: '0 12px', width: 70 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                              <span
                                style={{
                                  fontSize: 15,
                                  fontWeight: 700,
                                  color: scoreColor(lead.score),
                                  fontVariantNumeric: 'tabular-nums',
                                }}
                              >
                                {lead.score ?? '—'}
                              </span>
                              {lead.score !== null && (
                                <div
                                  style={{
                                    width: 32,
                                    height: 3,
                                    borderRadius: 2,
                                    background: 'rgba(255,255,255,0.08)',
                                  }}
                                >
                                  <div
                                    style={{
                                      width: `${lead.score}%`,
                                      height: '100%',
                                      borderRadius: 2,
                                      background: scoreColor(lead.score),
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '6px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '50%',
                                  flexShrink: 0,
                                  background: 'rgba(255,255,255,0.06)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: '#9ca3af',
                                  userSelect: 'none',
                                }}
                              >
                                {(lead.first_name?.[0] ?? '?').toUpperCase()}
                                {(lead.last_name?.[0] ?? '').toUpperCase()}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: 14,
                                    color: '#f9fafb',
                                    fontWeight: 500,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {name}
                                </div>
                                {lead.company_name && (
                                  <div
                                    style={{
                                      fontSize: 12,
                                      color: '#6b7280',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {lead.company_name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          {(() => {
                            const branche =
                              ((lead.custom_fields as Record<string, unknown>)?.industry_de as string) ||
                              ((lead.custom_fields as Record<string, unknown>)?.industry as string) ||
                              '—';
                            return (
                              <td
                                title={branche}
                                style={{
                                  padding: '0 12px',
                                  fontSize: 12,
                                  color: '#9ca3af',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: 130,
                                }}
                              >
                                {branche}
                              </td>
                            );
                          })()}
                          <td style={{ padding: '0 12px' }}>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'nowrap' }}>
                              {visibleTags.map((t) => (
                                <span
                                  key={t}
                                  style={{
                                    fontSize: 11,
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    background: '#1a1a1a',
                                    color: '#9ca3af',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {t.replace(/_/g, ' ')}
                                </span>
                              ))}
                              {extraTags > 0 && <span style={{ fontSize: 11, color: '#6b7280' }}>+{extraTags}</span>}
                            </div>
                          </td>
                          <td style={{ padding: '0 12px' }} onClick={(e) => e.stopPropagation()}>
                            <select
                              value={lead.status}
                              onChange={(e) => handleStatusUpdate(lead.id, e.target.value)}
                              disabled={statusUpdating}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: STATUS_FG[lead.status] ?? '#888',
                                fontSize: 13,
                                cursor: 'pointer',
                                outline: 'none',
                                padding: '2px 0',
                              }}
                            >
                              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>
                                  {v}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '0 12px', textAlign: 'center' }}>
                            {lead.email_draft && (
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard?.writeText(lead.email_draft!).catch(() => {});
                                  setCopiedField(`email_${lead.id}`);
                                  setTimeout(() => setCopiedField(null), 500);
                                }}
                                style={{
                                  color: copiedField === `email_${lead.id}` ? '#22c55e' : '#2563eb',
                                  cursor: 'pointer',
                                  fontSize: copiedField === `email_${lead.id}` ? 11 : 14,
                                }}
                                title="E-Mail kopieren"
                              >
                                {copiedField === `email_${lead.id}` ? 'Kopiert!' : '✉'}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '0 12px' }}>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectLead(lead);
                              }}
                              style={{ color: '#6b7280', fontSize: 13, cursor: 'pointer' }}
                            >
                              Details →
                            </span>
                          </td>
                        </tr>
                        {deleteConfirmId === lead.id && (
                          <tr>
                            <td
                              colSpan={7}
                              style={{
                                padding: '8px 12px',
                                background: 'rgba(239,68,68,0.06)',
                                borderBottom: '1px solid rgba(239,68,68,0.12)',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: 13, color: '#f87171' }}>Lead löschen?</span>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    style={{
                                      background: 'none',
                                      border: '1px solid #333',
                                      color: '#888',
                                      borderRadius: 6,
                                      padding: '4px 10px',
                                      fontSize: 12,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Abbrechen
                                  </button>
                                  <button
                                    onClick={() => handleDeleteLead(lead.id)}
                                    style={{
                                      background: '#ef4444',
                                      border: 'none',
                                      color: '#fff',
                                      borderRadius: 6,
                                      padding: '4px 10px',
                                      fontSize: 12,
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Löschen
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          );
        })()}

        {/* Table Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 0',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            fontSize: 12,
            color: '#4b5563',
          }}
        >
          <span>
            {filtered.length} Leads angezeigt · {scored} gescored · {withEmail} mit E-Mail
          </span>
          <button
            onClick={() => setGeneratorOpen(true)}
            style={{
              fontSize: 12,
              padding: '5px 12px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
              color: '#9ca3af',
              cursor: 'pointer',
            }}
          >
            + Mehr Leads generieren
          </button>
        </div>

        {/* ── Detail Overlay (Person View) ── */}
        {selectedLead &&
          (() => {
            const cf = (selectedLead.custom_fields ?? {}) as Record<string, unknown>;
            const breakdown = cf.score_breakdown as Record<string, number> | undefined;
            const ghostBtn: React.CSSProperties = {
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: 12,
              color: '#a1a1aa',
              cursor: 'pointer',
            };
            const handleCopyEmail = () => {
              if (!selectedLead.email_draft) return;
              navigator.clipboard?.writeText(selectedLead.email_draft).catch(() => {});
              setCopiedField('overlay_email');
              setTimeout(() => setCopiedField(null), 500);
            };
            return (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 50,
                  background: 'rgba(0,0,0,0.75)',
                  backdropFilter: 'blur(6px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={(e) => {
                  if (e.target === e.currentTarget) setSelectedLead(null);
                }}
              >
                <div
                  style={{
                    background: tokens.bg.surface,
                    borderRadius: 16,
                    width: '94vw',
                    maxWidth: 1200,
                    maxHeight: '94vh',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    border: `1px solid ${tokens.bg.borderStrong}`,
                  }}
                >
                  {/* HEADER */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '16px 24px',
                      borderBottom: `1px solid ${tokens.bg.border}`,
                    }}
                  >
                    <button
                      onClick={() => setSelectedLead(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#a1a1aa',
                        cursor: 'pointer',
                        fontSize: 18,
                        padding: '4px 8px',
                      }}
                    >
                      ←
                    </button>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: tokens.text.primary, margin: 0 }}>
                      {selectedLead.first_name} {selectedLead.last_name}
                    </h2>
                    {selectedLead.company_name && (
                      <span
                        style={{
                          background: 'rgba(255,255,255,0.08)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: 20,
                          padding: '3px 12px',
                          fontSize: 13,
                          color: '#a1a1aa',
                        }}
                      >
                        {selectedLead.company_name}
                      </span>
                    )}
                    <div style={{ flex: 1 }} />
                    <button
                      onClick={() => handleStatusUpdate(selectedLead.id, 'qualified')}
                      style={{
                        background: selectedLead.status === 'qualified' ? tokens.brand.primary : 'transparent',
                        color: selectedLead.status === 'qualified' ? tokens.text.inverse : '#a1a1aa',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 20,
                        padding: '6px 20px',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Qualifiziert
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedLead.id, 'lost')}
                      style={{
                        background: selectedLead.status === 'lost' ? 'rgba(255,255,255,0.08)' : 'transparent',
                        color: selectedLead.status === 'lost' ? tokens.text.primary : tokens.text.muted,
                        border: `1px solid ${tokens.bg.border}`,
                        borderRadius: 20,
                        padding: '6px 20px',
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      Verloren
                    </button>
                  </div>

                  {/* SCORE + ACTIONS */}
                  <div
                    style={{
                      padding: '20px 24px',
                      borderBottom: `1px solid ${tokens.bg.border}`,
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 52,
                          fontWeight: 700,
                          color: tokens.text.primary,
                          lineHeight: 1,
                          letterSpacing: '-0.03em',
                        }}
                      >
                        {selectedLead.score ?? '—'}
                        <span style={{ fontSize: 22, color: tokens.text.muted, fontWeight: 400, marginLeft: 4 }}>
                          /100
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: tokens.text.muted,
                          marginTop: 6,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Lead Score
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {selectedLead.email_draft && (
                        <button onClick={handleCopyEmail} style={ghostBtn}>
                          {copiedField === 'overlay_email' ? 'Kopiert' : 'E-Mail kopieren'}
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          if (!tenantId) return;
                          setRescoring(true);
                          try {
                            const res = await fetch('/api/leads/rescore', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrfToken() },
                              body: JSON.stringify({ lead_id: selectedLead.id, tenant_id: tenantId }),
                            });
                            if (!res.ok) throw new Error();
                            showToast('KI-Scoring gestartet');
                            setTimeout(() => {
                              loadLeads();
                              handleSelectLead(selectedLead);
                            }, 5000);
                          } catch {
                            showToast('Scoring fehlgeschlagen');
                          } finally {
                            setRescoring(false);
                          }
                        }}
                        disabled={rescoring}
                        style={ghostBtn}
                      >
                        {rescoring ? 'Wird bewertet...' : 'Neu bewerten'}
                      </button>
                    </div>
                  </div>

                  {/* SCORING DIMENSIONS */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      borderBottom: `1px solid ${tokens.bg.border}`,
                    }}
                  >
                    {[
                      { label: 'Kontaktqualitaet', key: 'kontaktqualitaet', alt: 'kontakt_vertrauen', max: 25 },
                      { label: 'Unternehmensfit', key: 'unternehmensfit', alt: 'unternehmensfit', max: 35 },
                      { label: 'Entscheidung', key: 'entscheidungsposition', alt: 'kaufbereitschaft', max: 25 },
                      { label: 'Kaufsignale', key: 'kaufsignale', alt: 'kaufsignale', max: 15 },
                    ].map((dim, i) => {
                      const val = breakdown?.[dim.key] ?? breakdown?.[dim.alt] ?? 0;
                      const pct = val / dim.max;
                      return (
                        <div
                          key={i}
                          style={{
                            padding: '12px 16px',
                            borderRight: i < 3 ? `1px solid rgba(255,255,255,0.06)` : 'none',
                          }}
                        >
                          <div
                            style={{
                              background:
                                pct >= 0.8
                                  ? 'rgba(255,255,255,0.15)'
                                  : pct >= 0.5
                                    ? 'rgba(255,255,255,0.08)'
                                    : 'rgba(255,255,255,0.03)',
                              border: `1px solid rgba(255,255,255,${pct >= 0.8 ? '0.2' : '0.08'})`,
                              borderRadius: 20,
                              padding: '4px 10px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              marginBottom: 6,
                            }}
                          >
                            <span style={{ fontSize: 13, fontWeight: 600, color: tokens.text.primary }}>
                              {val}/{dim.max}
                            </span>
                            {pct >= 0.8 && <span style={{ fontSize: 11, color: '#a1a1aa' }}>✓</span>}
                          </div>
                          <div style={{ fontSize: 11, color: tokens.text.muted }}>{dim.label}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* TWO-COLUMN BODY */}
                  <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', flex: 1, overflow: 'hidden' }}>
                    {/* LEFT: Details + KI-Analyse */}
                    <div
                      style={{
                        overflowY: 'auto',
                        padding: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        borderRight: `1px solid ${tokens.bg.border}`,
                      }}
                    >
                      {/* Details Card */}
                      <div
                        style={{
                          background: tokens.bg.raised,
                          border: `1px solid ${tokens.bg.border}`,
                          borderRadius: 12,
                          overflow: 'hidden',
                        }}
                      >
                        <div style={{ padding: '12px 16px', borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#a1a1aa' }}>Details</span>
                        </div>
                        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                          {[
                            {
                              label: 'Name',
                              value: `${selectedLead.first_name ?? ''} ${selectedLead.last_name ?? ''}`.trim() || '—',
                            },
                            { label: 'Firma', value: selectedLead.company_name ?? '—' },
                            { label: 'E-Mail', value: selectedLead.email ?? '—' },
                            { label: 'Telefon', value: (cf.normalized_phone as string) ?? selectedLead.phone ?? '—' },
                            { label: 'Stadt', value: selectedLead.city ?? '—' },
                          ].map(({ label, value }) => (
                            <div key={label}>
                              <div style={{ fontSize: 11, color: tokens.text.muted, marginBottom: 2 }}>{label}</div>
                              <div style={{ fontSize: 13, fontWeight: 500, color: tokens.text.primary }}>{value}</div>
                            </div>
                          ))}
                          {!!cf.linkedin_url && (
                            <div>
                              <div style={{ fontSize: 11, color: tokens.text.muted, marginBottom: 2 }}>LinkedIn</div>
                              <a
                                href={cf.linkedin_url as string}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  fontSize: 13,
                                  fontWeight: 500,
                                  color: tokens.text.primary,
                                  textDecoration: 'none',
                                  borderBottom: '1px solid rgba(255,255,255,0.2)',
                                }}
                              >
                                Profil offnen
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* KI-Analyse Card */}
                      <div
                        style={{
                          background: tokens.bg.raised,
                          border: `1px solid ${tokens.bg.border}`,
                          borderRadius: 12,
                          overflow: 'hidden',
                        }}
                      >
                        <div style={{ padding: '12px 16px', borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#a1a1aa' }}>KI-Analyse</span>
                        </div>
                        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {[
                            { label: 'Qualitaet', value: cf.lead_quality ?? '—' },
                            { label: 'Branche', value: (cf.industry_de as string) ?? (cf.industry as string) ?? '—' },
                            { label: 'Budget', value: cf.budget_estimate ?? '—' },
                            { label: 'Kontakt in', value: cf.contact_in_hours ? `${cf.contact_in_hours}h` : '—' },
                            { label: 'Quelle', value: selectedLead.source ?? '—' },
                          ].map(({ label, value }) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 12, color: tokens.text.muted }}>{label}</span>
                              <span style={{ fontSize: 12, fontWeight: 500, color: tokens.text.secondary }}>
                                {String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tags */}
                      {selectedLead.ai_tags && selectedLead.ai_tags.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {selectedLead.ai_tags.map((tag) => (
                            <span
                              key={tag}
                              style={{
                                background: 'rgba(255,255,255,0.06)',
                                color: '#a1a1aa',
                                borderRadius: 6,
                                padding: '2px 8px',
                                fontSize: 11,
                              }}
                            >
                              {tag.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* RIGHT: Tabs */}
                    <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                      {/* Tab Navigation */}
                      <div
                        style={{
                          display: 'flex',
                          gap: 0,
                          borderBottom: `1px solid ${tokens.bg.border}`,
                          padding: '0 20px',
                          position: 'sticky',
                          top: 0,
                          background: tokens.bg.surface,
                          zIndex: 1,
                        }}
                      >
                        {['E-Mail', 'KI-Zusammenfassung', 'Website', 'Aktivitaeten'].map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '12px 16px',
                              fontSize: 13,
                              color: activeTab === tab ? tokens.text.primary : tokens.text.muted,
                              borderBottom:
                                activeTab === tab ? `2px solid ${tokens.text.primary}` : '2px solid transparent',
                              fontWeight: activeTab === tab ? 600 : 400,
                            }}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>

                      {/* Tab Content */}
                      <div style={{ padding: 20, flex: 1 }}>
                        {activeTab === 'E-Mail' && (
                          <div>
                            {selectedLead.email_draft ? (
                              <div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: tokens.text.muted,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    marginBottom: 12,
                                  }}
                                >
                                  Bereit zum Senden
                                </div>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                  <div
                                    style={{
                                      width: 36,
                                      height: 36,
                                      borderRadius: '50%',
                                      flexShrink: 0,
                                      background: 'rgba(255,255,255,0.06)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: 14,
                                      color: '#a1a1aa',
                                    }}
                                  >
                                    @
                                  </div>
                                  <div
                                    style={{
                                      flex: 1,
                                      background: tokens.bg.raised,
                                      border: `1px solid ${tokens.bg.border}`,
                                      borderRadius: 10,
                                      padding: '12px 16px',
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                      <span style={{ fontSize: 13, fontWeight: 600, color: tokens.text.primary }}>
                                        {selectedLead.email_draft.split('\n')[0]}
                                      </span>
                                      <button
                                        onClick={handleCopyEmail}
                                        style={{
                                          background: tokens.brand.primary,
                                          color: tokens.text.inverse,
                                          border: 'none',
                                          borderRadius: 6,
                                          padding: '4px 12px',
                                          fontSize: 12,
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                        }}
                                      >
                                        {copiedField === 'overlay_email' ? 'Kopiert' : 'Kopieren'}
                                      </button>
                                    </div>
                                    <div
                                      style={{
                                        fontSize: 13,
                                        color: tokens.text.secondary,
                                        lineHeight: 1.6,
                                        whiteSpace: 'pre-line',
                                      }}
                                    >
                                      {selectedLead.email_draft.split('\n').slice(1).join('\n')}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div style={{ color: tokens.text.muted, fontSize: 13 }}>
                                Kein E-Mail-Entwurf vorhanden.
                              </div>
                            )}
                          </div>
                        )}

                        {activeTab === 'KI-Zusammenfassung' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {selectedLead.ai_summary && (
                              <div
                                style={{
                                  background: tokens.bg.raised,
                                  border: `1px solid ${tokens.bg.border}`,
                                  borderRadius: 10,
                                  padding: '14px 16px',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: tokens.text.muted,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    marginBottom: 8,
                                  }}
                                >
                                  Zusammenfassung
                                </div>
                                <p style={{ fontSize: 13, color: tokens.text.secondary, lineHeight: 1.7, margin: 0 }}>
                                  {selectedLead.ai_summary}
                                </p>
                              </div>
                            )}
                            {selectedLead.ai_next_action && (
                              <div
                                style={{
                                  background: 'rgba(255,255,255,0.04)',
                                  border: `1px solid rgba(255,255,255,0.12)`,
                                  borderRadius: 10,
                                  padding: '14px 16px',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: tokens.text.secondary,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    marginBottom: 8,
                                  }}
                                >
                                  Empfohlene Aktion
                                </div>
                                <p style={{ fontSize: 14, color: tokens.text.primary, fontWeight: 500, margin: 0 }}>
                                  {selectedLead.ai_next_action}
                                </p>
                              </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                              <div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: tokens.text.muted,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    marginBottom: 8,
                                  }}
                                >
                                  Staerken
                                </div>
                                {((cf.strengths ?? []) as string[]).map((s, i) => (
                                  <div
                                    key={i}
                                    style={{
                                      display: 'flex',
                                      gap: 8,
                                      marginBottom: 6,
                                      fontSize: 13,
                                      color: tokens.text.secondary,
                                    }}
                                  >
                                    <span style={{ color: tokens.text.primary }}>+</span> {s}
                                  </div>
                                ))}
                              </div>
                              <div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: tokens.text.muted,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    marginBottom: 8,
                                  }}
                                >
                                  Bedenken
                                </div>
                                {((cf.concerns ?? []) as string[]).map((c, i) => (
                                  <div
                                    key={i}
                                    style={{
                                      display: 'flex',
                                      gap: 8,
                                      marginBottom: 6,
                                      fontSize: 13,
                                      color: tokens.text.secondary,
                                    }}
                                  >
                                    <span style={{ color: tokens.text.muted }}>—</span> {c}
                                  </div>
                                ))}
                              </div>
                            </div>
                            {selectedLead.notes && (
                              <div
                                style={{
                                  background: tokens.bg.raised,
                                  border: `1px solid ${tokens.bg.border}`,
                                  borderRadius: 10,
                                  padding: '14px 16px',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: tokens.text.muted,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    marginBottom: 8,
                                  }}
                                >
                                  Notizen
                                </div>
                                <p
                                  style={{
                                    fontSize: 13,
                                    color: tokens.text.secondary,
                                    lineHeight: 1.6,
                                    margin: 0,
                                    whiteSpace: 'pre-line',
                                  }}
                                >
                                  {selectedLead.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {activeTab === 'Website' && (
                          <div>
                            {selectedLead.website_summary ? (
                              <div
                                style={{
                                  background: tokens.bg.raised,
                                  border: `1px solid ${tokens.bg.border}`,
                                  borderRadius: 10,
                                  padding: '14px 16px',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: tokens.text.muted,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    marginBottom: 8,
                                  }}
                                >
                                  Website-Analyse
                                </div>
                                {selectedLead.website_title && (
                                  <div
                                    style={{
                                      fontSize: 14,
                                      fontWeight: 600,
                                      color: tokens.text.primary,
                                      marginBottom: 8,
                                    }}
                                  >
                                    {selectedLead.website_title}
                                  </div>
                                )}
                                <p
                                  style={{
                                    fontSize: 13,
                                    color: tokens.text.secondary,
                                    lineHeight: 1.7,
                                    whiteSpace: 'pre-line',
                                    margin: 0,
                                  }}
                                >
                                  {selectedLead.website_summary}
                                </p>
                              </div>
                            ) : (
                              <div style={{ color: tokens.text.muted, fontSize: 13 }}>
                                Keine Website-Daten vorhanden.
                              </div>
                            )}
                          </div>
                        )}

                        {activeTab === 'Aktivitaeten' && (
                          <div>
                            {activitiesLoading ? (
                              <div style={{ color: tokens.text.muted, fontSize: 13 }}>Lade Aktivitaeten...</div>
                            ) : displayActivities.length === 0 ? (
                              <div style={{ color: tokens.text.muted, fontSize: 13 }}>
                                Keine Aktivitaeten vorhanden.
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {displayActivities.map((act) => (
                                  <ActivityItem key={act.id} act={act} />
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
      </div>
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </>
  );
}
