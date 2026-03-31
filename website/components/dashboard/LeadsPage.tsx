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

interface LeadNote {
  id: string;
  lead_id: string;
  tenant_id: string;
  content: string;
  created_at: string;
  created_by: string;
}

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
  const [showFilters, setShowFilters] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [hoveredScore, setHoveredScore] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  const loadNotes = useCallback(
    async (leadId: string) => {
      if (!tenantId) return;
      try {
        const { data } = await supabase
          .from('lead_notes')
          .select('*')
          .eq('lead_id', leadId)
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false });
        setNotes(data ?? []);
      } catch {
        setNotes([]);
      }
    },
    [supabase, tenantId]
  );

  useEffect(() => {
    if (selectedLead) loadNotes(selectedLead.id);
    else {
      setNotes([]);
      setNewNote('');
    }
  }, [selectedLead?.id, loadNotes]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveNote = useCallback(async () => {
    if (!selectedLead || !tenantId || !newNote.trim()) return;
    try {
      await supabase
        .from('lead_notes')
        .insert({ lead_id: selectedLead.id, tenant_id: tenantId, content: newNote.trim() });
      setNewNote('');
      loadNotes(selectedLead.id);
      showToast('Notiz gespeichert');
    } catch {
      showToast('Fehler beim Speichern');
    }
  }, [supabase, selectedLead, tenantId, newNote, loadNotes, showToast]);

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
  // 14-day chart data (includes days with 0 leads)
  const chartData = useMemo(() => {
    const days: { date: string; count: number }[] = [];
    const counts: Record<string, number> = {};
    for (const l of leads) {
      const d = l.created_at.slice(0, 10);
      counts[d] = (counts[d] || 0) + 1;
    }
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      days.push({ date: ds, count: counts[ds] || 0 });
    }
    return days;
  }, [leads]);
  const maxByDate = Math.max(...chartData.map((d) => d.count), 1);

  // Keep byDate for backward compat
  const byDate = chartData.filter((d) => d.count > 0).map((d) => [d.date, d.count] as [string, number]);

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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minHeight: 0 }}>
        {/* ── HEADER ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 0 20px 0', marginBottom: 4 }}>
          <div style={{ flex: 1 }}>
            <h1
              style={{ fontSize: 22, fontWeight: 700, color: tokens.text.primary, margin: 0, letterSpacing: '-0.02em' }}
            >
              Leads
            </h1>
            <p style={{ fontSize: 13, color: tokens.text.muted, margin: '2px 0 0' }}>Lead Intelligence Dashboard</p>
          </div>
          <div style={{ position: 'relative', flex: '0 0 260px' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: tokens.text.muted,
                pointerEvents: 'none',
              }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Suchen..."
              style={{
                width: '100%',
                background: tokens.bg.raised,
                border: `1px solid ${tokens.bg.border}`,
                borderRadius: 8,
                padding: '8px 12px 8px 32px',
                fontSize: 13,
                color: tokens.text.primary,
                outline: 'none',
              }}
            />
          </div>
          <button
            onClick={() => setGeneratorOpen(true)}
            style={{
              background: tokens.brand.primary,
              color: tokens.text.inverse,
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Zap size={13} /> Lead Generator
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              background: showFilters ? 'rgba(255,255,255,0.08)' : 'transparent',
              border: `1px solid ${tokens.bg.borderStrong}`,
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 13,
              color: tokens.text.secondary,
              cursor: 'pointer',
            }}
          >
            Filter
          </button>
        </div>

        {/* ── COLLAPSIBLE FILTERS ── */}
        {showFilters &&
          (() => {
            const afb: React.CSSProperties = {
              background: tokens.brand.primary,
              color: tokens.text.inverse,
              border: 'none',
              borderRadius: 6,
              padding: '5px 12px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            };
            const ifb: React.CSSProperties = {
              background: 'transparent',
              color: '#6b7280',
              border: `1px solid ${tokens.bg.border}`,
              borderRadius: 6,
              padding: '5px 12px',
              fontSize: 12,
              cursor: 'pointer',
            };
            return (
              <div
                style={{
                  background: tokens.bg.surface,
                  border: `1px solid ${tokens.bg.border}`,
                  borderRadius: 10,
                  padding: 16,
                  marginBottom: 16,
                  display: 'flex',
                  gap: 20,
                  flexWrap: 'wrap',
                  alignItems: 'flex-end',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: tokens.text.muted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: 6,
                    }}
                  >
                    Score
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['all', '70+', '45-69', '<45'] as const).map((f) => (
                      <button key={f} onClick={() => setScoreRange(f)} style={scoreRange === f ? afb : ifb}>
                        {f === 'all' ? 'Alle' : f}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: tokens.text.muted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: 6,
                    }}
                  >
                    Tags
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => toggleTag('has_email')} style={tagToggles.has_email ? afb : ifb}>
                      Hat E-Mail
                    </button>
                    <button onClick={() => toggleTag('premium')} style={tagToggles.premium ? afb : ifb}>
                      Premium
                    </button>
                    <button onClick={() => toggleTag('ki_affin')} style={tagToggles.ki_affin ? afb : ifb}>
                      KI-affin
                    </button>
                  </div>
                </div>
                {hasFilters && (
                  <button
                    onClick={resetFilters}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: tokens.text.muted,
                      fontSize: 12,
                      cursor: 'pointer',
                      padding: '5px 0',
                    }}
                  >
                    Zurücksetzen
                  </button>
                )}
              </div>
            );
          })()}

        {/* ── PIPELINE STAGES ── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          {[
            { key: 'all', label: 'Alle Leads', count: leads.length },
            { key: 'new', label: 'Neu', count: leads.filter((l) => l.status === 'new').length },
            { key: 'contacted', label: 'Kontaktiert', count: leads.filter((l) => l.status === 'contacted').length },
            { key: 'qualified', label: 'Qualifiziert', count: leads.filter((l) => l.status === 'qualified').length },
            { key: 'lost', label: 'Verloren', count: leads.filter((l) => l.status === 'lost').length },
          ].map((stage) => (
            <button
              key={stage.key}
              onClick={() => setStatusFilter(stage.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 20,
                cursor: 'pointer',
                border: `1px solid ${tokens.bg.border}`,
                background: statusFilter === stage.key ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: statusFilter === stage.key ? tokens.text.primary : tokens.text.muted,
                fontSize: 13,
                fontWeight: 500,
                transition: 'all 0.15s',
              }}
            >
              <span
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: 10,
                  padding: '1px 7px',
                  fontSize: 11,
                  color: tokens.text.secondary,
                }}
              >
                {stage.count}
              </span>
              {stage.label}
            </button>
          ))}
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          <span style={{ fontSize: 12, color: tokens.text.muted }}>
            {filtered.length} von {leads.length} Leads
          </span>
        </div>

        {/* ── METRIC CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            {
              id: 'total',
              label: 'Leads gesamt',
              value: leads.length,
              sub: `${scored} gescored`,
              action: () => resetFilters(),
            },
            { id: 'score', label: 'Ø Score', value: avgScore, sub: null, action: () => {} },
            {
              id: 'premium',
              label: 'Premium',
              value: premium,
              sub: `Score 70+`,
              action: () => {
                toggleTag('premium');
              },
            },
            {
              id: 'email',
              label: 'E-Mail bereit',
              value: withEmail,
              sub: `${leads.length ? Math.round((withEmail / leads.length) * 100) : 0}%`,
              action: () => {
                toggleTag('has_email');
              },
            },
            {
              id: 'contacted',
              label: 'Kontaktiert',
              value: contacted,
              sub: `${qualified} qualifiziert`,
              action: () => setStatusFilter('contacted'),
            },
          ].map((c) => (
            <div
              key={c.id}
              onClick={c.action}
              onMouseEnter={() => setHoveredCard(c.id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                background: tokens.bg.surface,
                border: `1px solid ${hoveredCard === c.id ? tokens.bg.borderStrong : tokens.bg.border}`,
                borderRadius: tokens.radius.lg,
                padding: '16px 20px',
                cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
            >
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: c.id === 'score' ? getScoreStyle(avgScore).color : tokens.text.primary,
                  lineHeight: 1,
                }}
              >
                {c.value}
              </div>
              <div style={{ fontSize: 11, color: tokens.text.muted, marginTop: 4 }}>{c.label}</div>
              {c.sub && <div style={{ fontSize: 11, color: '#374151', marginTop: 2 }}>{c.sub}</div>}
              {c.id === 'score' && (
                <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)', marginTop: 6 }}>
                  <div
                    style={{
                      width: `${avgScore}%`,
                      height: '100%',
                      borderRadius: 2,
                      background: getScoreStyle(avgScore).bar,
                    }}
                  />
                </div>
              )}
              {c.id === 'email' && (
                <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)', marginTop: 6 }}>
                  <div
                    style={{
                      width: leads.length ? `${(withEmail / leads.length) * 100}%` : '0%',
                      height: '100%',
                      borderRadius: 2,
                      background: 'rgba(255,255,255,0.3)',
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── ANIMATED CHARTS ── */}
        <style>{`@keyframes drawLine{to{stroke-dashoffset:0}}@keyframes fadeIn{to{opacity:1}}@keyframes expandBar{to{width:var(--tw)}}@keyframes donutDraw{from{stroke-dasharray:0 176}to{stroke-dasharray:var(--dash) 176}}@keyframes funnelGrow{from{width:0}to{width:var(--tw)}}@keyframes ringPop{from{transform:scale(0.6);opacity:0}to{transform:scale(1);opacity:1}}@keyframes tooltipFade{from{opacity:0;transform:translateX(-50%) translateY(4px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,0.1)}50%{box-shadow:0 0 0 6px rgba(255,255,255,0)}}@media(prefers-reduced-motion:reduce){.anim-line,.anim-dot,.anim-bar,.anim-donut,.anim-funnel{animation:none!important;opacity:1!important;stroke-dashoffset:0!important}.anim-bar,.anim-funnel{width:var(--tw)!important}.anim-donut{stroke-dasharray:var(--dash) 176!important}}`}</style>

        {/* Row 1: Full-width Line Chart */}
        <div
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.4s ease 220ms, transform 0.4s ease 220ms',
            background: tokens.bg.surface,
            border: `1px solid ${tokens.bg.border}`,
            borderRadius: 12,
            padding: '20px 24px',
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: tokens.text.primary }}>Neue Leads</div>
              <div style={{ fontSize: 11, color: tokens.text.muted }}>Letzte 14 Tage</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: tokens.text.primary, lineHeight: 1 }}>
              {chartData.reduce((s, d) => s + d.count, 0)}
            </div>
          </div>
          {(() => {
            const W = 800,
              H = 110,
              PAD = 8;
            const pts = chartData.map((d, i) => ({
              x: PAD + (i / 13) * (W - PAD * 2),
              y: H - PAD - (d.count / maxByDate) * (H - PAD * 2),
            }));
            const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
            const areaD = pathD + ` L ${pts[13].x} ${H} L ${pts[0].x} ${H} Z`;
            return (
              <svg viewBox={`0 0 ${W} ${H + 16}`} style={{ width: '100%', height: 110, overflow: 'visible' }}>
                <defs>
                  <linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(99,102,241,0.12)" />
                    <stop offset="100%" stopColor="rgba(99,102,241,0)" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {[1, 2, 3].map((i) => (
                  <line
                    key={i}
                    x1={PAD}
                    y1={PAD + ((H - PAD * 2) / 4) * i}
                    x2={W - PAD}
                    y2={PAD + ((H - PAD * 2) / 4) * i}
                    stroke="rgba(255,255,255,0.04)"
                  />
                ))}
                <path d={areaD} fill="url(#areaG)" />
                <path d={pathD} fill="none" stroke="rgba(99,102,241,0.4)" strokeWidth={1.5} filter="url(#glow)" />
                <path
                  className="anim-line"
                  d={pathD}
                  fill="none"
                  stroke="rgba(99,102,241,0.9)"
                  strokeWidth={1.5}
                  strokeDasharray="2000"
                  strokeDashoffset="2000"
                  style={{ animation: 'drawLine 1.2s cubic-bezier(0.4,0,0.2,1) forwards', animationDelay: '0.3s' }}
                />
                {pts.map(
                  (p, i) =>
                    chartData[i].count > 0 && (
                      <circle
                        className="anim-dot"
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r={3}
                        fill="rgba(99,102,241,1)"
                        style={{
                          opacity: 0,
                          animation: 'fadeIn 0.3s ease forwards',
                          animationDelay: `${0.3 + (i / 14) * 1.2}s`,
                        }}
                      />
                    )
                )}
                {pts.map(
                  (p, i) =>
                    i % 3 === 0 && (
                      <text
                        key={`t${i}`}
                        x={p.x}
                        y={H + 14}
                        textAnchor="middle"
                        fontSize={9}
                        fill="rgba(255,255,255,0.2)"
                      >
                        {chartData[i].date.slice(8)}
                      </text>
                    )
                )}
              </svg>
            );
          })()}
        </div>

        {/* Row 2: Branchen + Donut + Funnel */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.8fr', gap: 12, marginBottom: 16 }}>
          {/* Branchen Bars */}
          <div
            style={{
              background: tokens.bg.surface,
              border: `1px solid ${tokens.bg.border}`,
              borderRadius: 12,
              padding: '18px 20px',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: tokens.text.primary, marginBottom: 12 }}>
              Top Branchen
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topIndustries.map(([name, count], i) => (
                <div key={name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.5)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 140,
                      }}
                    >
                      {name}
                    </span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{count}</span>
                  </div>
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                    <div
                      className="anim-bar"
                      style={
                        {
                          height: '100%',
                          borderRadius: 3,
                          background: i === 0 ? 'rgba(99,102,241,0.8)' : 'rgba(255,255,255,0.18)',
                          width: 0,
                          animation: 'expandBar 0.6s cubic-bezier(0.4,0,0.2,1) forwards',
                          animationDelay: `${0.1 + i * 0.08}s`,
                          '--tw': `${(count / maxInd) * 100}%`,
                        } as React.CSSProperties
                      }
                    />
                  </div>
                </div>
              ))}
              {topIndustries.length === 0 && <div style={{ fontSize: 12, color: '#374151' }}>Keine Daten</div>}
            </div>
          </div>

          {/* Score Donut */}
          <div
            style={{
              background: tokens.bg.surface,
              border: `1px solid ${tokens.bg.border}`,
              borderRadius: 12,
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: tokens.text.primary,
                marginBottom: 12,
                alignSelf: 'flex-start',
              }}
            >
              Score
            </div>
            {(() => {
              const R = 28,
                CX = 36,
                CY = 36,
                SW = 7,
                circ = 2 * Math.PI * R;
              const segs = [
                { val: hot, color: 'rgba(255,255,255,0.9)', label: 'Premium' },
                { val: warm, color: 'rgba(255,255,255,0.35)', label: 'Warm' },
                { val: cold, color: 'rgba(255,255,255,0.1)', label: 'Cold' },
              ];
              let off = 0;
              const arcs = segs.map((s) => {
                const d = leads.length > 0 ? (s.val / leads.length) * circ : 0;
                const a = { ...s, dash: d, offset: -off };
                off += d;
                return a;
              });
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <svg width={72} height={72} viewBox="0 0 72 72">
                    <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={SW} />
                    {arcs.map((a, i) => (
                      <circle
                        className="anim-donut"
                        key={i}
                        cx={CX}
                        cy={CY}
                        r={R}
                        fill="none"
                        stroke={a.color}
                        strokeWidth={SW}
                        strokeDasharray={`${a.dash} ${circ}`}
                        strokeDashoffset={a.offset}
                        transform={`rotate(-90 ${CX} ${CY})`}
                        style={
                          {
                            '--dash': `${a.dash}`,
                            animation: 'donutDraw 0.8s cubic-bezier(0.4,0,0.2,1) forwards',
                            animationDelay: `${i * 0.15}s`,
                          } as React.CSSProperties
                        }
                      />
                    ))}
                    <text
                      x={CX}
                      y={CY + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={14}
                      fontWeight={700}
                      fill="rgba(255,255,255,0.9)"
                    >
                      {leads.length}
                    </text>
                  </svg>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {segs.map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                          {s.val} {s.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Conversion Funnel */}
          <div
            style={{
              background: tokens.bg.surface,
              border: `1px solid ${tokens.bg.border}`,
              borderRadius: 12,
              padding: '18px 20px',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: tokens.text.primary, marginBottom: 12 }}>
              Conversion Funnel
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              {[
                { label: 'Generiert', count: leads.length, color: 'rgba(255,255,255,0.08)' },
                { label: 'Gescored', count: scored, color: 'rgba(255,255,255,0.15)' },
                { label: 'Mit E-Mail', count: withEmail, color: 'rgba(99,102,241,0.3)' },
                { label: 'Kontaktiert', count: contacted + qualified, color: 'rgba(99,102,241,0.6)' },
                { label: 'Qualifiziert', count: qualified, color: 'rgba(99,102,241,0.9)' },
              ].map((s, i) => {
                const pct = leads.length > 0 ? Math.max((s.count / leads.length) * 100, 6) : 6;
                const convPct = leads.length > 0 ? Math.round((s.count / leads.length) * 100) : 0;
                return (
                  <div key={i} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{ fontSize: 11, color: tokens.text.muted, width: 75, textAlign: 'right', flexShrink: 0 }}
                    >
                      {s.label}
                    </span>
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                      <div
                        className="anim-funnel"
                        style={
                          {
                            height: 8,
                            borderRadius: 4,
                            background: s.color,
                            width: 0,
                            animation: 'funnelGrow 0.6s cubic-bezier(0.4,0,0.2,1) forwards',
                            animationDelay: `${0.15 + i * 0.1}s`,
                            '--tw': `${pct}%`,
                          } as React.CSSProperties
                        }
                      />
                    </div>
                    <span style={{ fontSize: 11, color: tokens.text.secondary, width: 40, flexShrink: 0 }}>
                      {s.count} <span style={{ color: tokens.text.muted, fontSize: 10 }}>{convPct}%</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* ── LEAD TABLE ── */}
        {(() => {
          const TAG_PRIO = ['premium_lead', 'ki_affin', 'inhaber_kontakt', 'automatisierungspotenzial', 'firmen_email'];
          const thStyle: React.CSSProperties = {
            fontSize: 11,
            fontWeight: 500,
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            borderBottom: `1px solid ${tokens.bg.border}`,
            padding: '8px 16px',
            textAlign: 'left',
            cursor: 'pointer',
            userSelect: 'none',
            whiteSpace: 'nowrap',
          };
          return (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                background: tokens.bg.surface,
                border: `1px solid ${tokens.bg.border}`,
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <thead>
                <tr>
                  {[
                    { key: 'score', label: 'Score', w: 70 },
                    { key: 'name', label: 'Name / Firma', w: undefined },
                    { key: 'industry', label: 'Branche', w: 140 },
                    { key: 'status', label: 'Status', w: 140 },
                    { key: 'actions', label: '', w: 180 },
                  ].map((col) => (
                    <th
                      key={col.key}
                      style={{
                        ...thStyle,
                        width: col.w,
                        color:
                          sortBy.startsWith(col.key) || (col.key === 'score' && sortBy.startsWith('score'))
                            ? '#f9fafb'
                            : '#6b7280',
                      }}
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
                      <td
                        colSpan={5}
                        style={{ padding: '14px 16px', borderBottom: `1px solid rgba(255,255,255,0.04)` }}
                      >
                        <div
                          style={{
                            height: 10,
                            borderRadius: 4,
                            background: tokens.bg.raised,
                            width: `${40 + i * 15}%`,
                          }}
                        />
                      </td>
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#f87171', fontSize: 14 }}>
                      {error}
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ padding: '3rem', textAlign: 'center', color: tokens.text.muted, fontSize: 14 }}
                    >
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
                              color: tokens.text.muted,
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
                    const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || '—';
                    const ind =
                      ((lead.custom_fields as Record<string, unknown>)?.industry_de as string) ||
                      ((lead.custom_fields as Record<string, unknown>)?.industry as string) ||
                      '—';
                    const isHovered = hoveredRow === lead.id;
                    return (
                      <tr
                        key={lead.id}
                        onMouseEnter={() => setHoveredRow(lead.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                        onClick={() => handleSelectLead(lead)}
                        style={{
                          borderBottom: `1px solid rgba(255,255,255,0.05)`,
                          background: isHovered ? 'rgba(255,255,255,0.03)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background 0.1s',
                        }}
                      >
                        <td style={{ padding: '12px 16px', width: 70 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                            <span
                              style={{
                                fontSize: 15,
                                fontWeight: 700,
                                color: getScoreStyle(lead.score).color,
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              {lead.score ?? '—'}
                            </span>
                            {lead.score !== null && (
                              <div
                                style={{ width: 32, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}
                              >
                                <div
                                  style={{
                                    width: `${lead.score}%`,
                                    height: '100%',
                                    borderRadius: 2,
                                    background: getScoreStyle(lead.score).bar,
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                flexShrink: 0,
                                background: 'rgba(255,255,255,0.06)',
                                border: `1px solid ${tokens.bg.border}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 11,
                                fontWeight: 600,
                                color: '#6b7280',
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
                                  fontWeight: 500,
                                  color: tokens.text.primary,
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
                                    color: tokens.text.muted,
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
                          title={ind}
                          style={{
                            padding: '12px 16px',
                            fontSize: 12,
                            color: '#6b7280',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 130,
                          }}
                        >
                          {ind}
                        </td>
                        <td style={{ padding: '12px 16px' }} onClick={(e) => e.stopPropagation()}>
                          <select
                            value={lead.status}
                            onChange={(e) => handleStatusUpdate(lead.id, e.target.value)}
                            disabled={statusUpdating}
                            style={{
                              background: 'rgba(255,255,255,0.05)',
                              border: `1px solid ${tokens.bg.border}`,
                              borderRadius: 6,
                              padding: '4px 8px',
                              fontSize: 12,
                              color: tokens.text.secondary,
                              cursor: 'pointer',
                              outline: 'none',
                            }}
                          >
                            {Object.entries(STATUS_LABELS).map(([k, v]) => (
                              <option key={k} value={k}>
                                {v}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '12px 16px' }} onClick={(e) => e.stopPropagation()}>
                          <div
                            style={{
                              display: 'flex',
                              gap: 4,
                              alignItems: 'center',
                              opacity: isHovered ? 1 : 0,
                              transition: 'opacity 0.15s',
                            }}
                          >
                            {lead.email_draft && (
                              <button
                                onClick={() => {
                                  navigator.clipboard?.writeText(lead.email_draft!).catch(() => {});
                                  setCopiedField(`row_${lead.id}`);
                                  setTimeout(() => setCopiedField(null), 500);
                                }}
                                style={{
                                  background: 'rgba(255,255,255,0.06)',
                                  border: `1px solid ${tokens.bg.borderStrong}`,
                                  borderRadius: 6,
                                  padding: '4px 8px',
                                  fontSize: 11,
                                  color: tokens.text.secondary,
                                  cursor: 'pointer',
                                }}
                              >
                                {copiedField === `row_${lead.id}` ? 'Kopiert' : 'Mail'}
                              </button>
                            )}
                            {lead.status === 'new' && (
                              <button
                                onClick={() => handleStatusUpdate(lead.id, 'contacted')}
                                style={{
                                  background: 'rgba(255,255,255,0.06)',
                                  border: `1px solid ${tokens.bg.borderStrong}`,
                                  borderRadius: 6,
                                  padding: '4px 8px',
                                  fontSize: 11,
                                  color: tokens.text.secondary,
                                  cursor: 'pointer',
                                }}
                              >
                                Kontaktiert
                              </button>
                            )}
                            <button
                              onClick={() => handleSelectLead(lead)}
                              style={{
                                background: tokens.brand.primary,
                                color: tokens.text.inverse,
                                border: 'none',
                                borderRadius: 6,
                                padding: '4px 10px',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          );
        })()}

        {/* ── NOTE INPUT ── */}
        <div
          style={{
            marginTop: 16,
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            padding: '12px 0',
            borderTop: `1px solid rgba(255,255,255,0.06)`,
          }}
        >
          <input
            value={hoveredRow ? noteInput : ''}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder={hoveredRow ? 'Notiz eingeben...' : 'Lead auswaehlen um Notiz hinzuzufuegen'}
            disabled={!hoveredRow}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && noteInput.trim() && hoveredRow) {
                (async () => {
                  try {
                    await supabase
                      .from('lead_notes')
                      .insert({ lead_id: hoveredRow, tenant_id: tenantId!, content: noteInput.trim() });
                    setNoteInput('');
                    showToast('Notiz gespeichert');
                  } catch {
                    showToast('Fehler beim Speichern');
                  }
                })();
              }
            }}
            style={{
              flex: 1,
              background: tokens.bg.raised,
              border: `1px solid ${tokens.bg.border}`,
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              color: hoveredRow ? tokens.text.primary : tokens.text.muted,
              outline: 'none',
              cursor: hoveredRow ? 'text' : 'default',
            }}
          />
        </div>

        {/* ── TABLE FOOTER ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 0',
            fontSize: 12,
            color: tokens.text.muted,
          }}
        >
          <span>
            {filtered.length} Leads{filtered.length !== leads.length ? ` (von ${leads.length} gesamt)` : ''} ·{' '}
            {withEmail} mit E-Mail · {scored} gescored
          </span>
          <span style={{ color: '#374151', fontSize: 11 }}>
            Zuletzt aktualisiert:{' '}
            {new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
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
                            {/* Notes */}
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
                              Notizen
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                              {notes.map((note) => (
                                <div key={note.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                  <div
                                    style={{
                                      width: 28,
                                      height: 28,
                                      borderRadius: '50%',
                                      flexShrink: 0,
                                      background: 'rgba(255,255,255,0.06)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: 11,
                                      color: '#6b7280',
                                    }}
                                  >
                                    N
                                  </div>
                                  <div
                                    style={{
                                      flex: 1,
                                      background: tokens.bg.raised,
                                      border: `1px solid rgba(255,255,255,0.06)`,
                                      borderRadius: 8,
                                      padding: '10px 12px',
                                    }}
                                  >
                                    <div style={{ fontSize: 13, color: '#e4e4e7', lineHeight: 1.5 }}>
                                      {note.content}
                                    </div>
                                    <div style={{ fontSize: 11, color: tokens.text.muted, marginTop: 4 }}>
                                      {new Date(note.created_at).toLocaleDateString('de-DE', {
                                        day: '2-digit',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {notes.length === 0 && (
                                <div style={{ fontSize: 13, color: tokens.text.muted }}>Noch keine Notizen.</div>
                              )}
                            </div>
                            {/* New note input */}
                            <div style={{ display: 'flex', gap: 8 }}>
                              <textarea
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="Notiz hinzufuegen..."
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && e.metaKey && newNote.trim()) handleSaveNote();
                                }}
                                style={{
                                  flex: 1,
                                  background: tokens.bg.raised,
                                  border: `1px solid ${tokens.bg.border}`,
                                  borderRadius: 8,
                                  padding: '10px 12px',
                                  fontSize: 13,
                                  color: tokens.text.primary,
                                  resize: 'none',
                                  height: 72,
                                  outline: 'none',
                                }}
                              />
                              <button
                                onClick={handleSaveNote}
                                style={{
                                  background: tokens.brand.primary,
                                  color: tokens.text.inverse,
                                  border: 'none',
                                  borderRadius: 8,
                                  padding: '0 16px',
                                  fontSize: 13,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  alignSelf: 'flex-end',
                                  height: 36,
                                }}
                              >
                                Speichern
                              </button>
                            </div>
                            <div style={{ fontSize: 11, color: tokens.text.muted, marginTop: 4 }}>
                              Cmd+Enter zum Speichern
                            </div>

                            {/* Activities */}
                            {displayActivities.length > 0 && (
                              <>
                                <div
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: tokens.text.muted,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    marginTop: 24,
                                    marginBottom: 12,
                                  }}
                                >
                                  Aktivitaeten
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                  {displayActivities.map((act) => (
                                    <ActivityItem key={act.id} act={act} />
                                  ))}
                                </div>
                              </>
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
