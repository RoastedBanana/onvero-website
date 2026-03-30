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

  const scoreColor = (s: number | null) =>
    s === null ? '#374151' : s >= 70 ? '#22c55e' : s >= 45 ? '#f59e0b' : '#6b7280';
  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 10,
    padding: '14px 16px',
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
            <h1 style={{ fontWeight: 700, fontSize: 20, color: '#f9fafb', margin: 0 }}>Leads</h1>
            <p style={{ color: '#4b5563', fontSize: 13, margin: '2px 0 0' }}>Lead Intelligence Dashboard</p>
          </div>
          <button
            onClick={() => setGeneratorOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 18px',
              borderRadius: 8,
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#f9fafb',
              fontSize: 14,
              fontWeight: 500,
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
            fontSize: 13,
            padding: '4px 10px',
            borderRadius: 6,
            cursor: 'pointer',
            border: active ? '1px solid #e5e7eb' : '1px solid #2a2a2a',
            background: active ? '#e5e7eb' : 'transparent',
            color: active ? '#111827' : '#6b7280',
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
                {hasFilters && (
                  <button
                    onClick={resetFilters}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#6b7280',
                      fontSize: 13,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0,
                      marginLeft: 4,
                    }}
                  >
                    Zurücksetzen
                  </button>
                )}
              </div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>
                Zeige {filtered.length} von {leads.length} Leads
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
          const scoreColor = (s: number | null) =>
            s === null ? '#9ca3af' : s >= 70 ? '#16a34a' : s >= 45 ? '#d97706' : '#9ca3af';
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
                          <td
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
                            {((lead.custom_fields as Record<string, unknown>)?.industry_de as string) ||
                              ((lead.custom_fields as Record<string, unknown>)?.industry as string) ||
                              '—'}
                          </td>
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

        {/* ── Detail Panel ── */}
        {selectedLead && (
          <div
            style={{
              width: 380,
              minWidth: 320,
              maxWidth: 420,
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 700,
                    color:
                      (selectedLead.score ?? 0) >= 70
                        ? '#16a34a'
                        : (selectedLead.score ?? 0) >= 45
                          ? '#d97706'
                          : '#9ca3af',
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  {selectedLead.score ?? '—'}
                </div>
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
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                {selectedLead.phone && (
                  <button
                    onClick={() => window.open('tel:' + ((cf?.normalized_phone as string) ?? selectedLead.phone))}
                    title="Anrufen"
                    aria-label="Anrufen"
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
                    aria-label="E-Mail senden"
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
                    aria-label="Website öffnen"
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
                  aria-label="Lead löschen"
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
                  aria-label="Panel schließen"
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
                  height: 24,
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
                            fontSize: 11,
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
                        fontSize: 11,
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

                {/* AI Tags as colored badges */}
                {selectedLead.ai_tags && selectedLead.ai_tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {selectedLead.ai_tags.map((tag) => {
                      const t = tag.toLowerCase();
                      let bg = 'rgba(100,116,139,0.12)';
                      let fg = '#94a3b8';
                      if (['premium_lead', 'gut_erreichbar'].includes(t)) {
                        bg = 'rgba(74,222,128,0.12)';
                        fg = '#4ade80';
                      } else if (['firmen_email', 'telefon_vorhanden', 'linkedin_vorhanden'].includes(t)) {
                        bg = 'rgba(96,165,250,0.12)';
                        fg = '#60a5fa';
                      } else if (['ki_affin', 'automatisierungspotenzial', 'digitale_praesenz'].includes(t)) {
                        bg = 'rgba(167,139,250,0.12)';
                        fg = '#a78bfa';
                      }
                      return (
                        <span
                          key={tag}
                          style={{
                            background: bg,
                            color: fg,
                            borderRadius: 999,
                            padding: '2px 8px',
                            fontSize: '0.68rem',
                            fontWeight: 500,
                          }}
                        >
                          {tag.replace(/_/g, ' ')}
                        </span>
                      );
                    })}
                  </div>
                )}

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
                    disabled={statusUpdating}
                    style={{
                      ...field,
                      cursor: statusUpdating ? 'wait' : 'pointer',
                      background: '#0a0a0a',
                      borderColor: '#1f1f1f',
                      opacity: statusUpdating ? 0.5 : 1,
                    }}
                  >
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ── E-Mail-Skript ── */}
                {selectedLead.email_draft && (
                  <CollapsibleSection label="E-Mail-Skript">
                    <div style={{ background: '#0a0a0a', borderRadius: 8, padding: '0.85rem', position: 'relative' }}>
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(selectedLead.email_draft!).catch(() => {});
                          setCopiedField('email_draft');
                          setTimeout(() => setCopiedField(null), 500);
                        }}
                        style={{
                          position: 'absolute',
                          top: '0.6rem',
                          right: '0.6rem',
                          background: copiedField === 'email_draft' ? 'rgba(74,222,128,0.12)' : '#1a1a1a',
                          border: `1px solid ${copiedField === 'email_draft' ? 'rgba(74,222,128,0.3)' : '#2a2a2a'}`,
                          color: copiedField === 'email_draft' ? '#4ade80' : '#888',
                          borderRadius: 6,
                          padding: '0.3rem 0.6rem',
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {copiedField === 'email_draft' ? 'Kopiert ✓' : 'Kopieren'}
                      </button>
                      <p
                        style={{
                          fontSize: '0.79rem',
                          color: '#888',
                          lineHeight: 1.6,
                          margin: 0,
                          whiteSpace: 'pre-line',
                          paddingRight: '4.5rem',
                        }}
                      >
                        {selectedLead.email_draft}
                      </p>
                    </div>
                  </CollapsibleSection>
                )}

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

                {/* ── Website-Analyse ── */}
                {selectedLead.website_summary && (
                  <CollapsibleSection label="Website-Analyse">
                    <div style={{ background: '#0a0a0a', borderRadius: 8, padding: '0.85rem' }}>
                      {selectedLead.website_title && (
                        <div style={{ fontSize: '0.82rem', color: '#ccc', fontWeight: 600, marginBottom: '0.4rem' }}>
                          {selectedLead.website_title}
                        </div>
                      )}
                      <p
                        style={{
                          fontSize: '0.79rem',
                          color: '#888',
                          lineHeight: 1.6,
                          margin: 0,
                          whiteSpace: 'pre-line',
                        }}
                      >
                        {selectedLead.website_summary}
                      </p>
                    </div>
                  </CollapsibleSection>
                )}

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
