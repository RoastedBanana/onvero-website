'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  // Primary score: SP fit score is the most meaningful, fall back to analysis confidence
  const spFit: number | undefined =
    typeof row.shipping_sps_fit_score === 'number' && row.shipping_sps_fit_score > 0
      ? row.shipping_sps_fit_score
      : undefined;

  const score: number = spFit ?? 0;

  // Tier: from generated DB column, or derive from SP fit
  const tier: string | undefined =
    (row.tier as string | undefined) ??
    (spFit != null ? (spFit >= 80 ? 'Hot+' : spFit >= 65 ? 'Hot' : spFit >= 40 ? 'Warm' : 'Kalt') : undefined);

  // Revenue: prefer actual, then estimated
  const revenue = formatRevenue(
    row.fin_revenue_eur ?? null,
    row.fin_estimated_revenue_eur ? `${(row.fin_estimated_revenue_eur / 1_000_000).toFixed(1)} Mio. €*` : null
  );

  // Financial health: "insufficient_data" → undefined (show as —)
  const rawHealth = row.fin_health_label as string | undefined;
  const finHealthLabel = rawHealth && rawHealth !== 'insufficient_data' ? rawHealth : undefined;

  return {
    id: row.id as string,
    name: (row.company_name as string) ?? '',
    city: (row.city as string) ?? '',
    industry: (row.industry as string) ?? '',
    website: (row.website as string | undefined) ?? undefined,
    score,
    tier,
    status: tierToStatus(tier),
    employees: row.num_employees ? String(row.num_employees) : '',
    revenue,
    finHealthLabel,
    finHealthScore: typeof row.fin_health_score === 'number' ? row.fin_health_score : undefined,
    spFitScore: spFit,
    hasShop: row.web_has_shop === true,
    shippingVolume: (row.shipping_estimated_volume as string | undefined) ?? undefined,
    shippingModel: (row.shipping_fulfillment_model as string | undefined) ?? undefined,
    shippingComplexity: (row.shipping_logistics_complexity as string | undefined) ?? undefined,
    primaryHook: (row.analysis_primary_hook as string | undefined) ?? undefined,
    dealTier: (row.analysis_deal_tier as string | undefined) ?? undefined,
    founded: row.founded_year ? String(row.founded_year) : undefined,
    added: row.created_at ? new Date(row.created_at as string).toLocaleDateString('de-DE') : '',
    addedTs: row.created_at ? new Date(row.created_at as string).getTime() : 0,
    enrichmentStatus: (row.enrichment_status as string) ?? 'raw',
    logo_url: (row.logo_url as string | undefined) ?? undefined,
  };
}

interface Lead {
  id: string;
  name: string;
  city: string;
  industry: string;
  website?: string;
  score: number;
  tier?: string;
  status: Status;
  employees: string;
  revenue: string;
  finHealthLabel?: string;
  finHealthScore?: number;
  spFitScore?: number;
  hasShop: boolean;
  shippingVolume?: string;
  shippingModel?: string;
  shippingComplexity?: string;
  primaryHook?: string;
  dealTier?: string;
  founded?: string;
  added: string;
  addedTs: number;
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
    borderTop: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.55)',
    borderRight: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.55)',
    borderBottom: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.55)',
    borderLeft: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.55)',
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

function ScoreRing({ score }: { score: number }) {
  const size = 36;
  const r = 14;
  const circ = 2 * Math.PI * r;
  const color = score >= 75 ? '#10B981' : score >= 50 ? '#F97316' : '#EF4444';
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={2.5} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeDasharray={`${(score / 100) * circ} ${circ}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round"
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={9}
        fontWeight={800}
        fill={color}
        fontFamily="var(--font-inter), sans-serif"
      >
        {score}
      </text>
    </svg>
  );
}

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
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const c = colors(theme);
  const isDark = theme === 'dark';

  const CACHE_KEY = 'leads_list_cache';
  const CACHE_TTL = 2 * 60_000; // 2 min

  const [leads, setLeads] = useState<Lead[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) return (JSON.parse(raw) as { data: Lead[] }).data ?? [];
    } catch {}
    return [];
  });

  const [initialLoading, setInitialLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      return !sessionStorage.getItem(CACHE_KEY);
    } catch {
      return true;
    }
  });

  const [newLeadIds, setNewLeadIds] = useState<Set<string>>(new Set());
  const knownIdsRef = useRef<Set<string>>(new Set());

  // Auto-open export modal via ?export=1
  useEffect(() => {
    if (searchParams.get('export') === '1') {
      setShowExportModal(true);
      router.replace('/intelligence/leads');
    }
  }, [searchParams, router]);

  useEffect(() => {
    // Skip fetch if cache is still fresh
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const { ts, data } = JSON.parse(raw) as { ts: number; data: Lead[] };
        if (Date.now() - ts < CACHE_TTL) {
          knownIdsRef.current = new Set(data.map((l) => l.id));
          return;
        }
      }
    } catch {}

    async function fetchLeads() {
      try {
        const res = await fetch('/api/leads');
        const d = await res.json();
        if (Array.isArray(d.leads)) {
          const mapped = d.leads.map(mapApiLead);
          setLeads(mapped);
          knownIdsRef.current = new Set(mapped.map((l: Lead) => l.id));
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: mapped }));
          } catch {}
        }
      } catch {}
      setInitialLoading(false);
    }
    fetchLeads();

    const poll = setInterval(async () => {
      try {
        const res = await fetch('/api/leads');
        const d = await res.json();
        if (!Array.isArray(d.leads)) return;
        const mapped = d.leads.map(mapApiLead);
        const fresh = mapped.filter((l: Lead) => !knownIdsRef.current.has(l.id));
        if (fresh.length > 0) {
          setNewLeadIds(new Set<string>(fresh.map((l: Lead) => l.id)));
          setTimeout(() => setNewLeadIds(new Set()), 4000);
          knownIdsRef.current = new Set(mapped.map((l: Lead) => l.id));
        }
        setLeads(mapped);
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: mapped }));
        } catch {}
      } catch {}
    }, 30_000);

    return () => clearInterval(poll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'added' | 'score'>(() => {
    if (typeof window === 'undefined') return 'score';
    return (localStorage.getItem('leads-sort') as 'name' | 'added' | 'score') ?? 'score';
  });
  const [statusFilter, setStatusFilter] = useState<'all' | 'hot' | 'warm' | 'kalt'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  const filtered = leads
    .filter((l) => {
      const q = search.toLowerCase();
      const matchSearch =
        l.name.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        (l.industry ?? '').toLowerCase().includes(q);
      if (!matchSearch) return false;
      if (statusFilter === 'all') return true;
      const t = (l.tier ?? '').toLowerCase();
      if (statusFilter === 'hot') return t.startsWith('hot');
      if (statusFilter === 'warm') return t === 'warm';
      if (statusFilter === 'kalt') return t === 'kalt' || t === 'cold' || (!t && l.spFitScore == null);
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'score') return (b.spFitScore ?? 0) - (a.spFitScore ?? 0);
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

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1
            style={{ fontSize: 34, fontWeight: 800, color: c.text, margin: 0, letterSpacing: '-0.03em', lineHeight: 1 }}
          >
            Leads
          </h1>
          <p style={{ fontSize: 13, color: c.textMuted, margin: '6px 0 0' }}>
            {mounted ? total : '—'} {mounted && total === 1 ? 'Lead' : 'Leads'} in deiner Pipeline
          </p>
        </div>
        <button
          onClick={openExportModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '9px 16px',
            background: '#4F46E5',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            boxShadow: '0 4px 14px rgba(79,70,229,0.30)',
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
          CSV Export
        </button>
      </div>

      {/* KPI strip */}
      {mounted && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Leads gesamt', value: total, color: '#4F46E5', bg: '#4F46E515' },
            {
              label: 'Hot Leads',
              value: leads.filter((l) => l.tier?.toLowerCase().startsWith('hot')).length,
              color: '#EF4444',
              bg: '#EF444415',
            },
            {
              label: 'Mit SP Fit',
              value: leads.filter((l) => l.spFitScore != null).length,
              color: '#10B981',
              bg: '#10B98115',
            },
            {
              label: 'Neu diese Woche',
              value: leads.filter((l) => l.addedTs > Date.now() - 7 * 86400_000).length,
              color: '#F97316',
              bg: '#F9731615',
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                ...glassCard(isDark),
                borderRadius: 12,
                padding: '14px 18px',
                borderTop: `3px solid ${s.color}`,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: c.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 8,
                }}
              >
                {s.label}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: '-0.03em', lineHeight: 1 }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Status filter pills */}
          {(['all', 'hot', 'warm', 'kalt'] as const).map((f) => {
            const active = statusFilter === f;
            const meta = {
              all: { label: 'Alle', color: '#4F46E5' },
              hot: { label: 'Hot', color: '#EF4444' },
              warm: { label: 'Warm', color: '#F97316' },
              kalt: { label: 'Kalt', color: '#94A3B8' },
            }[f];
            const count =
              f === 'all'
                ? leads.length
                : leads.filter((l) => {
                    const t = (l.tier ?? '').toLowerCase();
                    if (f === 'hot') return t.startsWith('hot');
                    if (f === 'warm') return t === 'warm';
                    return t === 'kalt' || t === 'cold' || (!t && l.spFitScore == null);
                  }).length;
            return (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 13px',
                  borderRadius: 99,
                  border: active
                    ? `1.5px solid ${meta.color}`
                    : `1.5px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'}`,
                  background: active ? meta.color + '15' : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.60)',
                  color: active ? meta.color : c.textMuted,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 150ms',
                }}
              >
                {f !== 'all' && <div style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color }} />}
                {meta.label}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    background: active ? meta.color + '25' : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                    borderRadius: 99,
                    padding: '1px 6px',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}

          <div style={{ width: 1, height: 20, background: c.border, margin: '0 2px' }} />

          {/* Search */}
          <div style={{ position: 'relative', width: 220 }}>
            <svg
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
              width="13"
              height="13"
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
              placeholder="Suchen…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 30px',
                border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(0,0,0,0.10)',
                borderRadius: 99,
                fontSize: 12,
                fontFamily: 'inherit',
                outline: 'none',
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.55)',
                color: c.text,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => {
              const v = e.target.value as typeof sortBy;
              setSortBy(v);
              localStorage.setItem('leads-sort', v);
            }}
            style={{
              padding: '8px 11px',
              border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(0,0,0,0.10)',
              borderRadius: 99,
              fontSize: 12,
              fontFamily: 'inherit',
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.55)',
              color: c.text,
              cursor: 'pointer',
              outline: 'none',
              fontWeight: 600,
            }}
          >
            <option value="score">SP Fit ↓</option>
            <option value="added">Neueste zuerst</option>
            <option value="name">Name A–Z</option>
          </select>
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              borderRadius: 99,
              padding: '5px 12px',
            }}
          >
            <div
              style={{ width: 6, height: 6, borderRadius: '50%', background: initialLoading ? '#F97316' : '#10B981' }}
            />
            <span style={{ fontSize: 11, fontWeight: 600, color: c.textMuted }}>
              {initialLoading ? 'Lädt…' : `${filtered.length} Treffer`}
            </span>
          </div>
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
                    {['Unternehmen', 'Branche · Stadt', 'Versandvolumen', 'Modell', 'SP Fit', 'Status', ''].map((h) => (
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
                          <Checkbox checked={isSelected} onChange={() => toggleSelect(lead.id)} isDark={isDark} c={c} />
                        </td>

                        {/* Unternehmen */}
                        <td style={{ padding: '10px 14px', maxWidth: 280 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                            <LogoAvatar
                              name={lead.name}
                              logoUrl={lead.logo_url}
                              size={36}
                              radius={10}
                              fontSize={12}
                              isDark={isDark}
                              av={av}
                            />
                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  fontWeight: 700,
                                  color: c.text,
                                  fontSize: 13,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {lead.name}
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: c.textMuted,
                                  marginTop: 2,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 5,
                                }}
                              >
                                {lead.employees && <span>{lead.employees} MA</span>}
                                {lead.employees && lead.founded && <span style={{ opacity: 0.4 }}>·</span>}
                                {lead.founded && <span>Gegr. {lead.founded}</span>}
                                {!lead.employees && !lead.founded && <span style={{ opacity: 0.4 }}>—</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Branche · Stadt */}
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: c.text, whiteSpace: 'nowrap' }}>
                            {lead.industry || '—'}
                          </div>
                          <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>{lead.city || ''}</div>
                        </td>

                        {/* Versandvolumen */}
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                          {lead.shippingVolume ? (
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{lead.shippingVolume}</div>
                              {lead.shippingComplexity && (
                                <div style={{ fontSize: 10, color: c.textMuted, marginTop: 2 }}>
                                  {(
                                    {
                                      low: 'Einfach',
                                      medium: 'Mittel',
                                      high: 'Komplex',
                                      very_high: 'Sehr komplex',
                                    } as Record<string, string>
                                  )[lead.shippingComplexity] ?? lead.shippingComplexity}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: c.textMuted, opacity: 0.4 }}>—</span>
                          )}
                        </td>

                        {/* Modell */}
                        <td style={{ padding: '10px 14px' }}>
                          {lead.shippingModel ? (
                            (() => {
                              const m = lead.shippingModel;
                              const meta =
                                m === 'Eigenversand'
                                  ? { label: 'Eigen', color: '#4F46E5', bg: '#4F46E515' }
                                  : m === '3PL'
                                    ? { label: '3PL', color: '#F97316', bg: '#F9731615' }
                                    : m === 'hybrid'
                                      ? { label: 'Hybrid', color: '#10B981', bg: '#10B98115' }
                                      : { label: m, color: '#94A3B8', bg: 'rgba(148,163,184,0.10)' };
                              return (
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    padding: '3px 9px',
                                    borderRadius: 99,
                                    background: meta.bg,
                                    color: meta.color,
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {meta.label}
                                </span>
                              );
                            })()
                          ) : (
                            <span style={{ fontSize: 12, color: c.textMuted, opacity: 0.4 }}>—</span>
                          )}
                        </td>

                        {/* SP Fit Score */}
                        <td style={{ padding: '10px 14px' }}>
                          {lead.spFitScore != null ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div
                                style={{
                                  width: 50,
                                  height: 5,
                                  borderRadius: 99,
                                  background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    width: `${lead.spFitScore}%`,
                                    height: '100%',
                                    borderRadius: 99,
                                    background:
                                      lead.spFitScore >= 70 ? '#10B981' : lead.spFitScore >= 40 ? '#F97316' : '#EF4444',
                                  }}
                                />
                              </div>
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color:
                                    lead.spFitScore >= 70 ? '#10B981' : lead.spFitScore >= 40 ? '#F97316' : '#EF4444',
                                }}
                              >
                                {lead.spFitScore}
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: c.textMuted, opacity: 0.5 }}>—</span>
                          )}
                        </td>

                        {/* Status / Tier */}
                        <td style={{ padding: '10px 14px' }}>
                          {lead.tier ? (
                            (() => {
                              const t = lead.tier.toLowerCase();
                              const color = t.startsWith('hot') ? '#EF4444' : t === 'warm' ? '#F97316' : '#94A3B8';
                              const bg = t.startsWith('hot')
                                ? 'rgba(239,68,68,0.10)'
                                : t === 'warm'
                                  ? 'rgba(249,115,22,0.10)'
                                  : 'rgba(148,163,184,0.10)';
                              return (
                                <span
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    padding: '3px 10px',
                                    borderRadius: 99,
                                    background: bg,
                                    color,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
                                  {lead.tier}
                                </span>
                              );
                            })()
                          ) : (
                            <span style={{ fontSize: 12, color: c.textMuted }}>—</span>
                          )}
                        </td>

                        {/* Öffnen */}
                        <td style={{ padding: '10px 14px', width: 80, textAlign: 'right' }}>
                          {isHovered ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/intelligence/leads/${lead.id}`);
                              }}
                              style={{
                                padding: '5px 13px',
                                background: '#4F46E5',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                fontFamily: 'var(--font-inter), sans-serif',
                              }}
                            >
                              Öffnen →
                            </button>
                          ) : (
                            <span style={{ color: c.textMuted, fontSize: 11, fontWeight: 500 }}>
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
