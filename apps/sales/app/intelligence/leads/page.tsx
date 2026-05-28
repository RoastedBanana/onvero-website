'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme, colors } from '../layout';
import { GlassPageFilters } from '@/components/ui/liquid-glass-card';
import { ExportLeadsModal } from './_ExportLeadsModal';

// ─── Types & Data ─────────────────────────────────────────────────────────────

type Status = 'hot' | 'warm' | 'cold';

const SHOP_SYSTEM_KEYWORDS = [
  'Shopify',
  'Shopware 6',
  'Shopware 5',
  'Shopware',
  'WooCommerce',
  'JTL',
  'Plentymarkets',
  'Magento',
  'OXID',
  'PrestaShop',
  'Gambio',
];

function detectShopSystem(techStack: string[] | null): string {
  if (!Array.isArray(techStack)) return '';
  for (const keyword of SHOP_SYSTEM_KEYWORDS) {
    if (techStack.some((t) => t.toLowerCase().includes(keyword.toLowerCase()))) return keyword;
  }
  return '';
}

function tierToStatus(tier: string | null | undefined): Status {
  const t = (tier ?? '').toLowerCase();
  if (t === 'hot+' || t === 'hot') return 'hot';
  if (t === 'warm') return 'warm';
  return 'cold';
}

function formatRevenue(eur: number | null | undefined, scraped: string | null | undefined): string {
  if (eur) return `${(eur / 1_000_000).toFixed(1)} Mio. €`;
  return scraped ?? '';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApiLead(row: any): Lead {
  const score: number =
    typeof row.lead_score === 'number' && row.lead_score > 0
      ? row.lead_score
      : typeof row.fit_score === 'number' && row.fit_score > 0
        ? row.fit_score
        : 0;
  const signals: number = Array.isArray(row.growth_signals) ? row.growth_signals.length : 0;
  const shopSystem = detectShopSystem(row.web_tech_stack);

  return {
    id: row.id as string,
    name: (row.company_name as string) ?? '',
    city: (row.city as string) ?? '',
    industry: (row.industry as string) ?? '',
    system: shopSystem,
    carrier: '',
    score,
    fit: score > 0 ? Math.round(score * 0.95) : 0,
    volume: score > 0 ? Math.round(score * 0.9) : 0,
    timing: score > 0 ? Math.round(score * 0.95) : 0,
    l1: true,
    l2: !!(row.industry && row.city),
    l3: !!(Array.isArray(row.web_tech_stack) && row.web_tech_stack.length > 0),
    l4: signals > 0,
    status: tierToStatus(row.tier),
    employees: row.num_employees ? String(row.num_employees) : (row.estimated_employees_scraped ?? ''),
    revenue: formatRevenue(row.fin_revenue_eur, row.estimated_revenue_scraped),
    added: row.created_at ? new Date(row.created_at as string).toLocaleDateString('de-DE') : '',
    addedTs: row.created_at ? new Date(row.created_at as string).getTime() : 0,
    signals: signals > 0 ? signals : undefined,
    enrichmentStatus: (row.enrichment_status as string) ?? 'raw',
    logo_url: (row.logo_url as string | undefined) ?? undefined,
  };
}

interface Lead {
  id: string;
  name: string;
  city: string;
  industry: string;
  system: string;
  carrier: string;
  score: number;
  fit: number;
  volume: number;
  timing: number;
  l1: boolean;
  l2: boolean;
  l3: boolean;
  l4: boolean;
  status: Status;
  employees: string;
  revenue: string;
  added: string;
  addedTs: number;
  signals?: number;
  enrichmentStatus?: string;
  logo_url?: string;
}

const AVATAR_PALETTE = [
  { bg: '#EEF0FF', color: '#4F46E5' },
  { bg: '#ECFDF5', color: '#059669' },
  { bg: '#FDF2F8', color: '#9D174D' },
  { bg: '#FFF7ED', color: '#C2410C' },
  { bg: '#F0F9FF', color: '#0369A1' },
  { bg: '#F5F3FF', color: '#7C3AED' },
  { bg: '#ECFEFF', color: '#0891B2' },
  { bg: '#FEF9C3', color: '#CA8A04' },
];

function avatarFor(name: string) {
  const idx = (name.charCodeAt(0) + name.charCodeAt(1)) % AVATAR_PALETTE.length;
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return { ...AVATAR_PALETTE[idx], initials };
}

function LogoAvatar({
  name,
  logoUrl,
  size,
  radius,
  fontSize,
  isDark,
  av,
}: {
  name: string;
  logoUrl?: string;
  size: number;
  radius: number;
  fontSize: number;
  isDark: boolean;
  av: ReturnType<typeof avatarFor>;
}) {
  const [err, setErr] = React.useState(false);
  const show = !!logoUrl && !err;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: show ? (isDark ? 'rgba(255,255,255,0.06)' : '#F4F5F8') : av.bg,
        color: av.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize,
        fontWeight: 800,
        flexShrink: 0,
        letterSpacing: '0.02em',
        overflow: 'hidden',
      }}
    >
      {show ? (
        <img
          src={logoUrl}
          alt={name}
          onError={() => setErr(true)}
          style={{ width: size - 10, height: size - 10, objectFit: 'contain' }}
        />
      ) : (
        av.initials
      )}
    </div>
  );
}

function glassCard(isDark: boolean, extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    background: isDark ? 'rgba(10,12,24,0.46)' : 'rgba(255,255,255,0.22)',
    backdropFilter: 'blur(22px)',
    WebkitBackdropFilter: 'blur(22px)',
    borderRadius: 16,
    border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.55)',
    boxShadow: isDark
      ? 'inset 1px 1px 2px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.32)'
      : 'inset 2px 2px 3px rgba(255,255,255,0.50), 0 4px 20px rgba(0,0,0,0.06)',
    ...extra,
  };
}

// ─── Visual components ────────────────────────────────────────────────────────

function LayerBar({ l1, l2, l3, l4 }: { l1: boolean; l2: boolean; l3: boolean; l4: boolean }) {
  const layers = [l1, l2, l3, l4];
  const filled = layers.filter(Boolean).length;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      <div style={{ display: 'flex', gap: 2 }}>
        {layers.map((f, i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 16,
              borderRadius: 3,
              background: f ? '#4F46E5' : '#E8ECF0',
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 10, color: filled === 4 ? '#4F46E5' : '#697386', fontWeight: 700, marginLeft: 4 }}>
        {filled}/4
      </span>
    </div>
  );
}

function SystemPill({ name }: { name: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    Shopify: { bg: '#ECFDF5', color: '#059669' },
    'Shopware 6': { bg: '#EEF0FF', color: '#4F46E5' },
    'Shopware 5': { bg: '#F5F3FF', color: '#7C3AED' },
    WooCommerce: { bg: '#F0F9FF', color: '#0369A1' },
    JTL: { bg: '#FFF7ED', color: '#C2410C' },
    Plentymarkets: { bg: '#FDF2F8', color: '#9D174D' },
    Magento: { bg: '#FEF9C3', color: '#CA8A04' },
  };
  const style = map[name] ?? { bg: '#F1F5F9', color: '#697386' };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 5,
        fontSize: 11,
        fontWeight: 700,
        background: style.bg,
        color: style.color,
        whiteSpace: 'nowrap',
      }}
    >
      {name}
    </span>
  );
}

function CarrierPill({ name, isDark }: { name: string; isDark: boolean }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 5,
        fontSize: 11,
        fontWeight: 600,
        background: isDark ? '#23242F' : '#F7F8FC',
        color: isDark ? '#94A3B8' : '#425466',
        border: `1px solid ${isDark ? '#272833' : '#E8ECF0'}`,
        whiteSpace: 'nowrap',
      }}
    >
      {name}
    </span>
  );
}

function SignalBadge({ count }: { count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: '#F59E0B',
          boxShadow: '0 0 0 2px rgba(245,158,11,0.25)',
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: 11, fontWeight: 700, color: '#D97706' }}>{count}</span>
    </div>
  );
}

// ─── Custom checkbox ──────────────────────────────────────────────────────────

function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  isDark,
  c,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  isDark: boolean;
  c: ReturnType<typeof colors>;
}) {
  const active = checked || indeterminate;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      style={{
        width: 18,
        height: 18,
        borderRadius: 5,
        border: active ? 'none' : `1.5px solid ${c.borderStrong}`,
        background: checked ? c.accent : indeterminate ? c.accent + '22' : c.bgCard,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.15s',
        padding: 0,
        boxShadow: active ? `0 0 0 3px ${c.accent}26` : 'none',
      }}
    >
      {checked && (
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          stroke="#fff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="2 6 5 9 10 3" />
        </svg>
      )}
      {indeterminate && !checked && <div style={{ width: 8, height: 2, background: c.accent, borderRadius: 99 }} />}
    </button>
  );
}

// ─── Delete modal ─────────────────────────────────────────────────────────────

function DeleteModal({
  count,
  onConfirm,
  onCancel,
  isDark,
  c,
}: {
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
  isDark: boolean;
  c: ReturnType<typeof colors>;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(10,37,64,0.3)',
        backdropFilter: 'blur(4px)',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        style={{
          background: c.bgCard,
          borderRadius: 16,
          padding: '32px',
          width: 400,
          boxShadow: '0 24px 60px rgba(10,37,64,0.18)',
          border: `1px solid ${c.border}`,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: isDark ? '#2D1515' : '#FEF2F2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            stroke="#DC2626"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H4L3 6" />
            <path d="M8 6V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2" />
          </svg>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: c.text, margin: '0 0 8px' }}>
          {count} {count === 1 ? 'Lead' : 'Leads'} löschen?
        </h2>
        <p style={{ fontSize: 14, color: c.textSub, lineHeight: 1.6, margin: '0 0 28px' }}>
          Diese Aktion kann nicht rückgängig gemacht werden. Die ausgewählten Leads werden dauerhaft entfernt.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '10px',
              border: `1.5px solid ${c.border}`,
              borderRadius: 9,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              background: c.bgCard,
              color: c.textSub,
              fontFamily: 'var(--font-inter), sans-serif',
            }}
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: 9,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              background: '#DC2626',
              color: '#fff',
              fontFamily: 'var(--font-inter), sans-serif',
            }}
          >
            Löschen
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const c = colors(theme);
  const isDark = theme === 'dark';

  const [leads, setLeads] = useState<Lead[]>([]);
  const [archivedLeads, setArchivedLeads] = useState<Lead[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [newLeadIds, setNewLeadIds] = useState<Set<string>>(new Set());
  const knownIdsRef = useRef<Set<string>>(new Set());
  const [showArchive, setShowArchive] = useState(false);

  useEffect(() => {
    async function fetchLeads() {
      try {
        const res = await fetch('/api/leads');
        const data = await res.json();
        if (Array.isArray(data.leads)) {
          const mapped = data.leads.map(mapApiLead);
          setLeads(mapped);
          knownIdsRef.current = new Set(mapped.map((l: Lead) => l.id));
        }
      } catch {}
      setInitialLoading(false);
    }

    fetchLeads();

    const poll = setInterval(async () => {
      try {
        const res = await fetch('/api/leads');
        const data = await res.json();
        if (!Array.isArray(data.leads)) return;
        const mapped = data.leads.map(mapApiLead);
        const fresh = mapped.filter((l: Lead) => !knownIdsRef.current.has(l.id));
        if (fresh.length > 0) {
          const freshIds = new Set<string>(fresh.map((l: Lead) => l.id));
          setNewLeadIds(freshIds);
          setTimeout(() => setNewLeadIds(new Set()), 4000);
          knownIdsRef.current = new Set(mapped.map((l: Lead) => l.id));
        }
        setLeads(mapped);
      } catch {}
    }, 15000);

    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    if (showArchive) {
      fetch('/api/leads?archived=true')
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data.leads)) setArchivedLeads(data.leads.map(mapApiLead));
        })
        .catch(() => {});
    }
  }, [showArchive]);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'added'>(() => {
    if (typeof window === 'undefined') return 'added';
    return (localStorage.getItem('leads-sort') as 'name' | 'added') ?? 'added';
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  const filtered = leads
    .filter((l) => {
      const q = search.toLowerCase();
      return l.name.toLowerCase().includes(q) || l.city.toLowerCase().includes(q) || l.industry.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return b.addedTs - a.addedTs;
    });

  const total = leads.length;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setLastSelectedId(id);
  }

  function toggleSelectAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
      setLastSelectedId(null);
    } else {
      setSelectedIds(new Set(filtered.map((l) => l.id)));
    }
  }

  function handleRowClick(e: React.MouseEvent, lead: Lead) {
    if (e.shiftKey) {
      e.preventDefault();
      if (lastSelectedId) {
        const lastIdx = filtered.findIndex((l) => l.id === lastSelectedId);
        const currIdx = filtered.findIndex((l) => l.id === lead.id);
        const [start, end] = lastIdx <= currIdx ? [lastIdx, currIdx] : [currIdx, lastIdx];
        const rangeIds = new Set(filtered.slice(start, end + 1).map((l) => l.id));
        setSelectedIds((prev) => new Set([...prev, ...rangeIds]));
      } else {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.has(lead.id) ? next.delete(lead.id) : next.add(lead.id);
          return next;
        });
      }
      setLastSelectedId(lead.id);
    } else {
      router.push(`/intelligence/leads/${lead.id}`);
    }
  }

  function confirmDelete() {
    const ids = new Set(selectedIds);
    setLeads((prev) => prev.filter((l) => !ids.has(l.id)));
    knownIdsRef.current = new Set([...knownIdsRef.current].filter((id) => !ids.has(id)));
    ids.forEach((id) => fetch(`/api/leads/${id}`, { method: 'DELETE' }).catch(() => {}));
    setSelectedIds(new Set());
    setShowDeleteModal(false);
  }

  function archiveSelected() {
    const ids = new Set(selectedIds);
    setLeads((prev) => prev.filter((l) => !ids.has(l.id)));
    knownIdsRef.current = new Set([...knownIdsRef.current].filter((id) => !ids.has(id)));
    ids.forEach((id) =>
      fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true }),
      }).catch(() => {})
    );
    setSelectedIds(new Set());
  }

  function restoreLead(id: string) {
    const lead = archivedLeads.find((l) => l.id === id);
    if (!lead) return;
    setArchivedLeads((prev) => prev.filter((l) => l.id !== id));
    setLeads((prev) => [lead, ...prev]);
    knownIdsRef.current.add(id);
    fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archived: false }),
    }).catch(() => {});
  }

  function openExportModal() {
    setShowExportModal(true);
  }

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100%',
        padding: '84px 32px 48px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        fontFamily: 'var(--font-inter), sans-serif',
        color: c.text,
      }}
    >
      <GlassPageFilters />

      {/* Page header — floating on aurora */}
      <div style={{ marginBottom: 4 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#10B981',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          Qualifizierung
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1
            style={{ fontSize: 36, fontWeight: 800, color: c.text, margin: 0, letterSpacing: '-0.03em', lineHeight: 1 }}
          >
            Leads
          </h1>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              background: 'rgba(16,185,129,0.15)',
              color: '#10B981',
              borderRadius: 99,
              padding: '3px 10px',
            }}
          >
            {total}
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginLeft: 4,
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              borderRadius: 99,
              padding: '4px 10px',
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: initialLoading ? '#F97316' : '#10B981',
              }}
            />
            <span style={{ fontSize: 11, fontWeight: 700, color: c.textMuted }}>
              {initialLoading ? 'Lädt…' : 'Live · alle 15s'}
            </span>
          </div>
        </div>
        <p style={{ fontSize: 13, color: c.textMuted, margin: '8px 0 0' }}>
          {total} {total === 1 ? 'Lead' : 'Leads'}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Stats */}
        <div style={{ display: 'flex', gap: 14 }}>
          <div
            style={{
              ...glassCard(isDark),
              borderRadius: 12,
              padding: '16px 20px',
              borderTop: '3px solid #10B981',
              position: 'relative',
              overflow: 'hidden',
              minWidth: 200,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 14,
                right: 18,
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(16,185,129,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: c.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 6,
              }}
            >
              Gesamt
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#10B981', lineHeight: 1 }}>{total}</div>
            <div style={{ fontSize: 11, color: c.textMuted, marginTop: 4 }}>
              {total === 1 ? 'Lead' : 'Leads'}
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Archiv-Toggle */}
          <button
            onClick={() => setShowArchive((v) => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 13px',
              border: `1.5px solid ${showArchive ? '#10B981' : isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'}`,
              borderRadius: 9,
              background: showArchive
                ? 'rgba(16,185,129,0.12)'
                : isDark
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(255,255,255,0.50)',
              color: showArchive ? '#10B981' : c.textMuted,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              flexShrink: 0,
              position: 'relative',
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="1" y="4" width="14" height="10" rx="1.5" />
              <path d="M1 4l2-3h10l2 3" />
              <line x1="6" y1="8" x2="10" y2="8" />
            </svg>
            Archiv
            {archivedLeads.length > 0 && (
              <span
                style={{
                  background: c.accent,
                  color: '#fff',
                  borderRadius: 99,
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '1px 6px',
                  marginLeft: 2,
                }}
              >
                {archivedLeads.length}
              </span>
            )}
          </button>

          <div style={{ flex: 1, position: 'relative' }}>
            <svg
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke={c.textMuted}
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <circle cx="7" cy="7" r="5" />
              <line x1="11" y1="11" x2="14" y2="14" />
            </svg>
            <input
              placeholder="Suchen nach Name, Stadt, Branche..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 36px',
                border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(0,0,0,0.10)',
                borderRadius: 9,
                fontSize: 13,
                fontFamily: 'inherit',
                outline: 'none',
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(12px)',
                color: c.text,
                boxSizing: 'border-box',
              }}
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => {
              const v = e.target.value as typeof sortBy;
              setSortBy(v);
              localStorage.setItem('leads-sort', v);
            }}
            style={{
              padding: '8px 12px',
              border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(0,0,0,0.10)',
              borderRadius: 9,
              fontSize: 12,
              fontFamily: 'inherit',
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(12px)',
              color: c.text,
              cursor: 'pointer',
              outline: 'none',
              fontWeight: 600,
            }}
          >
            <option value="added">Neueste zuerst</option>
            <option value="name">Name</option>
          </select>
          <button
            onClick={openExportModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(0,0,0,0.10)',
              borderRadius: 9,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(12px)',
              color: c.textSub,
              fontFamily: 'inherit',
              flexShrink: 0,
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 2v9M4 7l4 4 4-4" />
              <line x1="2" y1="14" x2="14" y2="14" />
            </svg>
            CSV
          </button>
        </div>

        {/* ── TABLE VIEW ─────────────────────────────────────────────────── */}
        <div style={{ ...glassCard(isDark), borderRadius: 14, overflow: 'hidden' }}>
            {initialLoading ? (
              <div style={{ padding: '24px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: 52,
                      borderRadius: 8,
                      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                      animation: 'pulse 1.4s ease-in-out infinite',
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
                <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
              </div>
            ) : (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr
                      style={{
                        background:
                          selectedIds.size > 0
                            ? isDark
                              ? 'rgba(16,185,129,0.10)'
                              : 'rgba(16,185,129,0.06)'
                            : isDark
                              ? 'rgba(255,255,255,0.03)'
                              : 'rgba(0,0,0,0.02)',
                        borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.07)',
                        transition: 'background 0.15s',
                      }}
                    >
                      <th style={{ padding: '11px 14px', width: 36 }}>
                        <Checkbox
                          checked={filtered.length > 0 && selectedIds.size === filtered.length}
                          indeterminate={selectedIds.size > 0 && selectedIds.size < filtered.length}
                          onChange={toggleSelectAll}
                          isDark={isDark}
                          c={c}
                        />
                      </th>
                      {[
                        'Unternehmen',
                        'Stadt',
                        'Branche',
                        'Shop-System',
                        'Carrier',
                        'Layer',
                        'Signale',
                        'Aktion',
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: 'left',
                            padding: '11px 14px',
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.07em',
                            color: c.textMuted,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((lead) => {
                      const isSelected = selectedIds.has(lead.id);
                      const isHovered = hoveredRow === lead.id;
                      const isNew = newLeadIds.has(lead.id);
                      const av = avatarFor(lead.name);
                      return (
                        <tr
                          key={lead.id}
                          onClick={(e) => handleRowClick(e, lead)}
                          onMouseEnter={() => setHoveredRow(lead.id)}
                          onMouseLeave={() => setHoveredRow(null)}
                          style={{
                            borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)',
                            background: isNew
                              ? 'rgba(16,185,129,0.10)'
                              : isSelected
                                ? isDark
                                  ? 'rgba(16,185,129,0.12)'
                                  : 'rgba(16,185,129,0.07)'
                                : isHovered
                                  ? isDark
                                    ? 'rgba(255,255,255,0.04)'
                                    : 'rgba(0,0,0,0.03)'
                                  : 'transparent',
                            cursor: 'pointer',
                            transition: 'background 0.4s',
                            boxShadow: isNew ? 'inset 3px 0 0 #10B981' : isSelected ? 'inset 3px 0 0 #10B981' : 'none',
                            userSelect: 'none',
                          }}
                        >
                          <td style={{ padding: '10px 14px' }}>
                            <Checkbox
                              checked={isSelected}
                              onChange={() => toggleSelect(lead.id)}
                              isDark={isDark}
                              c={c}
                            />
                          </td>

                          {/* Company name with avatar */}
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <LogoAvatar
                                name={lead.name}
                                logoUrl={lead.logo_url}
                                size={34}
                                radius={9}
                                fontSize={11}
                                isDark={isDark}
                                av={av}
                              />
                              <div>
                                <div style={{ fontWeight: 700, color: c.text, fontSize: 13 }}>{lead.name}</div>
                                <div style={{ fontSize: 11, color: c.textMuted, marginTop: 1 }}>
                                  {lead.employees} MA · {lead.revenue}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: '10px 14px', color: c.textSub, fontSize: 13 }}>{lead.city}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span
                              style={{
                                fontSize: 12,
                                color: c.textSub,
                                background: c.bgPage,
                                border: `1px solid ${c.border}`,
                                borderRadius: 5,
                                padding: '2px 7px',
                                fontWeight: 600,
                              }}
                            >
                              {lead.industry}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <SystemPill name={lead.system} />
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <CarrierPill name={lead.carrier} isDark={isDark} />
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <LayerBar l1={lead.l1} l2={lead.l2} l3={lead.l3} l4={lead.l4} />
                          </td>

                          {/* Signals */}
                          <td style={{ padding: '10px 14px' }}>
                            {lead.signals ? (
                              <SignalBadge count={lead.signals} />
                            ) : (
                              <span style={{ fontSize: 11, color: c.textMuted }}>—</span>
                            )}
                          </td>

                          <td style={{ padding: '10px 14px', width: 90 }}>
                            {isHovered ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/intelligence/leads/${lead.id}`);
                                }}
                                style={{
                                  padding: '4px 12px',
                                  background: c.accent,
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: 7,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                  fontFamily: 'var(--font-inter), sans-serif',
                                }}
                              >
                                Öffnen →
                              </button>
                            ) : (
                              <span style={{ color: c.textMuted, fontSize: 11, fontWeight: 600 }}>
                                {lead.added.replace('.2026', '')}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div
                  style={{
                    padding: '11px 18px',
                    borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)',
                    fontSize: 11,
                    color: c.textMuted,
                    fontWeight: 600,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>
                    {filtered.length} von {leads.length} Leads
                  </span>
                  {selectedIds.size > 0 && <span style={{ color: '#10B981' }}>{selectedIds.size} ausgewählt</span>}
                </div>
              </>
            )}
          </div>

        {/* ── ARCHIV VIEW ────────────────────────────────────────────────── */}
        {showArchive && (
          <div style={{ ...glassCard(isDark), borderRadius: 14, overflow: 'hidden' }}>
            <div
              style={{
                padding: '14px 20px',
                borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)',
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 16 16"
                fill="none"
                stroke={c.textMuted}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="1" y="4" width="14" height="10" rx="1.5" />
                <path d="M1 4l2-3h10l2 3" />
                <line x1="6" y1="8" x2="10" y2="8" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 700, color: c.text }}>Archiv</span>
              <span style={{ fontSize: 12, color: c.textMuted }}>
                {archivedLeads.length} {archivedLeads.length === 1 ? 'Lead' : 'Leads'}
              </span>
            </div>
            {archivedLeads.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: c.textMuted, fontSize: 13 }}>
                Keine archivierten Leads
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr
                    style={{
                      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)',
                    }}
                  >
                    {['Unternehmen', 'Branche', 'System', ''].map((h, i) => (
                      <th
                        key={i}
                        style={{
                          padding: '9px 16px',
                          textAlign: 'left',
                          fontSize: 11,
                          fontWeight: 600,
                          color: c.textMuted,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {archivedLeads.map((l) => (
                    <tr
                      key={l.id}
                      style={{
                        borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)',
                      }}
                    >
                      <td style={{ padding: '11px 16px' }}>
                        <div style={{ fontWeight: 600, color: c.text }}>{l.name}</div>
                        <div style={{ fontSize: 11, color: c.textMuted }}>{l.city}</div>
                      </td>
                      <td style={{ padding: '11px 16px', fontSize: 12, color: c.textSub }}>{l.industry}</td>
                      <td style={{ padding: '11px 16px' }}>
                        <SystemPill name={l.system} />
                      </td>
                      <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => restoreLead(l.id)}
                          style={{
                            padding: '5px 12px',
                            border: isDark ? '1.5px solid rgba(255,255,255,0.12)' : '1.5px solid rgba(0,0,0,0.1)',
                            borderRadius: 7,
                            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                            color: c.text,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                          }}
                        >
                          Wiederherstellen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ── SELECTION BAR ─────────────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 36,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 8000,
            background: isDark ? c.bgCard : '#0A2540',
            borderRadius: 16,
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 12px 48px rgba(10,37,64,0.36)',
            fontFamily: 'var(--font-inter), sans-serif',
            whiteSpace: 'nowrap',
            border: isDark ? `1px solid ${c.border}` : 'none',
          }}
        >
          {/* Avatar stack + count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 10px' }}>
            <div style={{ display: 'flex' }}>
              {leads
                .filter((l) => selectedIds.has(l.id))
                .slice(0, 3)
                .map((l, i) => {
                  const av = avatarFor(l.name);
                  return (
                    <div
                      key={l.id}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: av.color,
                        border: `2px solid ${isDark ? c.bgCard : '#0A2540'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 8,
                        fontWeight: 800,
                        color: '#fff',
                        marginLeft: i === 0 ? 0 : -6,
                        zIndex: 3 - i,
                        position: 'relative',
                      }}
                    >
                      {av.initials[0]}
                    </div>
                  );
                })}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
              {selectedIds.size} {selectedIds.size === 1 ? 'Lead' : 'Leads'}
            </span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>ausgewählt</span>
          </div>

          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

          {/* Exportieren */}
          <button
            onClick={openExportModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 13px',
              borderRadius: 9,
              border: 'none',
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 2v9M4 7l4 4 4-4" />
              <line x1="2" y1="14" x2="14" y2="14" />
            </svg>
            CSV
          </button>

          {/* Archivieren */}
          <button
            onClick={archiveSelected}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 13px',
              borderRadius: 9,
              border: 'none',
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="1.5" y="2" width="13" height="4" rx="1" />
              <path d="M2.5 6v6.5a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V6" />
              <line x1="6" y1="9" x2="10" y2="9" />
            </svg>
            Archivieren
          </button>

          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

          {/* Löschen */}
          <button
            onClick={() => setShowDeleteModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 13px',
              borderRadius: 9,
              border: 'none',
              background: 'rgba(220,38,38,0.25)',
              color: '#FCA5A5',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="2 4 4 4 14 4" />
              <path d="M13 4l-.7 9a1 1 0 0 1-1 .9H4.7a1 1 0 0 1-1-.9L3 4" />
              <path d="M5.5 4V2.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V4" />
            </svg>
            Löschen
          </button>

          {/* Abbrechen */}
          <button
            onClick={() => {
              setSelectedIds(new Set());
            }}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: 'none',
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              marginLeft: 2,
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="3" y1="3" x2="13" y2="13" />
              <line x1="13" y1="3" x2="3" y2="13" />
            </svg>
          </button>
        </div>
      )}

      {showDeleteModal && (
        <DeleteModal
          count={selectedIds.size}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
          isDark={isDark}
          c={c}
        />
      )}

      {showExportModal && (
        <ExportLeadsModal
          isDark={isDark}
          c={c}
          selectedIds={Array.from(selectedIds)}
          filteredIds={filtered.map((l) => l.id)}
          allIds={leads.map((l) => l.id)}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}
