'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTheme, colors, useUser } from './layout';
import { GlassCard, GlassPageFilters } from '@/components/ui/liquid-glass-card';
import { Search, Plus, Download, TrendingUp, Zap, Users, Star } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lead {
  id: string;
  company_name: string;
  city?: string;
  industry?: string;
  lead_score?: number;
  fit_score?: number;
  tier?: string;
  enrichment_status?: string;
  logo_url?: string;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(s: number) {
  if (s >= 75) return '#10B981';
  if (s >= 50) return '#F97316';
  return '#EF4444';
}

function tierColor(tier?: string) {
  const t = (tier ?? '').toLowerCase();
  if (t.startsWith('hot')) return { bg: 'rgba(239,68,68,0.12)', text: '#EF4444' };
  if (t === 'warm') return { bg: 'rgba(249,115,22,0.12)', text: '#F97316' };
  return { bg: 'rgba(148,163,184,0.12)', text: '#94A3B8' };
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `vor ${mins} Min.`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `vor ${hrs} Std.`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'gestern';
  if (days < 7) return `vor ${days} Tagen`;
  return new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
}

// ─── Count-up ─────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(0);
  const frame = useRef<number>(0);
  const start = useRef<number | null>(null);
  useEffect(() => {
    start.current = null;
    function step(ts: number) {
      if (start.current === null) start.current = ts;
      const p = Math.min((ts - start.current) / duration, 1);
      setValue(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) frame.current = requestAnimationFrame(step);
    }
    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration]);
  return value;
}

// ─── Logo Avatar ──────────────────────────────────────────────────────────────

function LogoAvatar({ name, logoUrl, size = 36 }: { name: string; logoUrl?: string; size?: number }) {
  const [err, setErr] = useState(false);
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  const bgs = ['#EEF0FF', '#ECFDF5', '#FDF2F8', '#FFF7ED', '#F0F9FF', '#F5F3FF'];
  const fgs = ['#4F46E5', '#059669', '#9D174D', '#C2410C', '#0369A1', '#7C3AED'];
  const idx = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % bgs.length;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        background: logoUrl && !err ? '#F4F5F8' : bgs[idx],
        color: fgs[idx],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.32,
        fontWeight: 800,
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {logoUrl && !err ? (
        <img
          src={logoUrl}
          alt={name}
          onError={() => setErr(true)}
          style={{ width: size - 10, height: size - 10, objectFit: 'contain' }}
        />
      ) : (
        initials
      )}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  accent,
  icon,
  isDark,
  c,
}: {
  label: string;
  value: number;
  sub: string;
  accent: string;
  icon: React.ReactNode;
  isDark: boolean;
  c: ReturnType<typeof colors>;
}) {
  const animated = useCountUp(value);
  return (
    <GlassCard isDark={isDark} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: c.textMuted,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: accent + '18',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: accent,
          }}
        >
          {icon}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 32, fontWeight: 800, color: c.text, letterSpacing: '-0.03em', lineHeight: 1 }}>
          {animated.toLocaleString('de-DE')}
        </div>
        <div style={{ fontSize: 12, color: c.textMuted, marginTop: 6 }}>{sub}</div>
      </div>
    </GlassCard>
  );
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const size = 38;
  const r = 15;
  const circ = 2 * Math.PI * r;
  const color = scoreColor(score);
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
        fontFamily="var(--font-inter), Inter, sans-serif"
      >
        {score}
      </text>
    </svg>
  );
}

// ─── Lead Row ─────────────────────────────────────────────────────────────────

function LeadRow({
  lead,
  isLast,
  c,
  isDark,
}: {
  lead: Lead;
  isLast: boolean;
  c: ReturnType<typeof colors>;
  isDark: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const score = lead.lead_score ?? lead.fit_score ?? 0;
  const tc = tierColor(lead.tier);
  return (
    <Link
      href={`/intelligence/leads/${lead.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 20px',
        borderBottom: !isLast ? `1px solid ${c.border}` : 'none',
        textDecoration: 'none',
        background: hovered ? (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)') : 'transparent',
        transition: 'background 100ms',
      }}
    >
      <LogoAvatar name={lead.company_name} logoUrl={lead.logo_url} size={34} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: c.text,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {lead.company_name}
        </div>
        <div style={{ fontSize: 11, color: c.textMuted, marginTop: 1 }}>
          {[lead.city, lead.industry].filter(Boolean).join(' · ')}
        </div>
      </div>
      {score > 0 && <ScoreRing score={score} />}
      {lead.tier && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 99,
            background: tc.bg,
            color: tc.text,
            flexShrink: 0,
          }}
        >
          {lead.tier}
        </span>
      )}
      <span style={{ fontSize: 11, color: c.textMuted, flexShrink: 0, width: 68, textAlign: 'right' }}>
        {relativeTime(lead.created_at)}
      </span>
    </Link>
  );
}

// ─── Leads Trend Chart (real data from created_at) ────────────────────────────

function LeadsTrendChart({ leads, isDark, c }: { leads: Lead[]; isDark: boolean; c: ReturnType<typeof colors> }) {
  // Build last 8 weeks from real data
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (7 - i) * 7);
    const start = new Date(d);
    start.setDate(d.getDate() - 7);
    const count = leads.filter((l) => {
      const t = new Date(l.created_at).getTime();
      return t >= start.getTime() && t < d.getTime();
    }).length;
    return {
      label: `KW ${i + 1}`,
      woche: d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }),
      leads: count,
    };
  });

  const gradientId = 'trend-grad';
  const gridColor = isDark ? '#242630' : '#F0F0F0';
  const accentColor = '#4F46E5';

  return (
    <GlassCard isDark={isDark} style={{ overflow: 'hidden', height: '100%', boxSizing: 'border-box' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px 12px',
          borderBottom: `1px solid ${c.border}`,
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: c.text }}>Leads Entwicklung</div>
          <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>Neue Leads pro Woche</div>
        </div>
        <div
          style={{
            fontSize: 11,
            color: c.textMuted,
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            padding: '4px 10px',
            borderRadius: 99,
            fontWeight: 600,
          }}
        >
          8 Wochen
        </div>
      </div>
      <div style={{ height: 180, padding: '12px 8px 4px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={weeks} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={accentColor} stopOpacity={0.15} />
                <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 8" stroke={gridColor} horizontal vertical={false} />
            <XAxis
              dataKey="woche"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: c.textMuted, fontFamily: 'var(--font-inter), Inter, sans-serif' }}
              tickMargin={8}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: gridColor }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div
                    style={{
                      background: isDark ? '#1E2028' : '#fff',
                      border: `1px solid ${c.border}`,
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: 12,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                      fontFamily: 'var(--font-inter), Inter, sans-serif',
                    }}
                  >
                    <div style={{ color: c.textMuted, marginBottom: 4, fontSize: 11 }}>{label}</div>
                    <div style={{ color: accentColor, fontWeight: 800, fontSize: 16 }}>{payload[0]?.value} Leads</div>
                  </div>
                );
              }}
            />
            <Area
              dataKey="leads"
              type="monotone"
              stroke={accentColor}
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 5, fill: accentColor, stroke: isDark ? '#1E2028' : '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}

// ─── Score Distribution Chart ─────────────────────────────────────────────────

function ScoreDistChart({ leads, isDark, c }: { leads: Lead[]; isDark: boolean; c: ReturnType<typeof colors> }) {
  const buckets = [
    { label: '0–25', min: 0, max: 25, color: '#EF4444' },
    { label: '26–50', min: 26, max: 50, color: '#F97316' },
    { label: '51–75', min: 51, max: 75, color: '#F59E0B' },
    { label: '76–100', min: 76, max: 100, color: '#10B981' },
  ].map((b) => ({
    ...b,
    count: leads.filter((l) => {
      const s = l.lead_score ?? l.fit_score ?? 0;
      return s >= b.min && s <= b.max;
    }).length,
  }));

  return (
    <GlassCard isDark={isDark} style={{ overflow: 'hidden', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${c.border}` }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: c.text }}>Score-Verteilung</div>
        <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>Leads nach Score-Bereich</div>
      </div>
      <div style={{ height: 180, padding: '12px 8px 4px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={buckets} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="4 8" stroke={isDark ? '#242630' : '#F0F0F0'} horizontal vertical={false} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: c.textMuted, fontFamily: 'var(--font-inter), Inter, sans-serif' }}
              tickMargin={8}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', radius: 6 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div
                    style={{
                      background: isDark ? '#1E2028' : '#fff',
                      border: `1px solid ${c.border}`,
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: 12,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                      fontFamily: 'var(--font-inter), Inter, sans-serif',
                    }}
                  >
                    <div style={{ color: c.textMuted, marginBottom: 4, fontSize: 11 }}>Score {label}</div>
                    <div style={{ color: payload[0]?.payload?.color, fontWeight: 800, fontSize: 16 }}>
                      {payload[0]?.value} Leads
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {buckets.map((b, i) => (
                <Cell key={i} fill={b.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}

// ─── Status Distribution ──────────────────────────────────────────────────────

function StatusBar({ leads, c, isDark }: { leads: Lead[]; c: ReturnType<typeof colors>; isDark: boolean }) {
  const hot = leads.filter((l) => l.tier?.toLowerCase().startsWith('hot')).length;
  const warm = leads.filter((l) => l.tier?.toLowerCase() === 'warm').length;
  const cold = leads.length - hot - warm;
  const total = leads.length || 1;
  const bars = [
    { label: 'Hot', count: hot, pct: (hot / total) * 100, color: '#EF4444' },
    { label: 'Warm', count: warm, pct: (warm / total) * 100, color: '#F97316' },
    { label: 'Kalt', count: cold, pct: (cold / total) * 100, color: '#94A3B8' },
  ];
  return (
    <GlassCard isDark={isDark} style={{ padding: '18px 20px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 14 }}>Lead-Verteilung</div>
      <div style={{ display: 'flex', height: 8, borderRadius: 99, overflow: 'hidden', gap: 2, marginBottom: 16 }}>
        {bars.map(
          (b) => b.pct > 0 && <div key={b.label} style={{ flex: b.pct, background: b.color, borderRadius: 99 }} />
        )}
      </div>
      {bars.map((b) => (
        <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: c.textSub, flex: 1 }}>{b.label}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{b.count}</span>
          <span style={{ fontSize: 11, color: c.textMuted, width: 34, textAlign: 'right' }}>{Math.round(b.pct)}%</span>
        </div>
      ))}
    </GlassCard>
  );
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

function QuickActions({ isDark, c }: { isDark: boolean; c: ReturnType<typeof colors> }) {
  const actions = [
    { icon: <Search size={14} />, label: 'Leads suchen', href: '/intelligence/generate', accent: '#4F46E5' },
    { icon: <Plus size={14} />, label: 'Alle Leads', href: '/intelligence/leads', accent: '#10B981' },
    { icon: <Download size={14} />, label: 'Exportieren', href: '/intelligence/leads', accent: '#F97316' },
  ];
  return (
    <GlassCard isDark={isDark} style={{ padding: '18px 20px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 12 }}>Schnellaktionen</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {actions.map((a) => (
          <ActionBtn key={a.label} {...a} isDark={isDark} c={c} />
        ))}
      </div>
    </GlassCard>
  );
}

function ActionBtn({
  icon,
  label,
  href,
  accent,
  isDark,
  c,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  accent: string;
  isDark: boolean;
  c: ReturnType<typeof colors>;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 10,
        background: hovered
          ? isDark
            ? 'rgba(255,255,255,0.07)'
            : 'rgba(0,0,0,0.04)'
          : isDark
            ? 'rgba(255,255,255,0.03)'
            : 'rgba(0,0,0,0.02)',
        border: `1px solid ${c.border}`,
        textDecoration: 'none',
        transition: 'background 100ms',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: accent + '18',
          color: accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: c.text, flex: 1 }}>{label}</span>
      <svg style={{ color: c.textMuted }} width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path
          d="M2.5 9.5L9.5 2.5M9.5 2.5H4.5M9.5 2.5V7.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UebersichtPage() {
  const { theme } = useTheme();
  const c = colors(theme);
  const isDark = theme === 'dark';
  const user = useUser();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    fetch('/api/leads')
      .then((r) => r.json())
      .then((d) => {
        setLeads(d.leads ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const total = leads.length;
  const hot = leads.filter((l) => l.tier?.toLowerCase().startsWith('hot')).length;
  const enriched = leads.filter((l) => l.enrichment_status === 'layer2_done').length;
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newThisWeek = leads.filter((l) => new Date(l.created_at).getTime() > oneWeekAgo).length;
  const recent = [...leads]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const today = mounted
    ? new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
    : '';

  return (
    <div
      style={{
        position: 'relative',
        padding: '108px 40px 56px',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        fontFamily: 'var(--font-inter), Inter, sans-serif',
        minHeight: '100%',
      }}
    >
      <GlassPageFilters />

      {/* Greeting */}
      <div>
        <div style={{ fontSize: 36, fontWeight: 800, color: c.text, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          {mounted ? (user?.firstName ? `Hey, ${user.firstName}` : 'Hey') : ' '}
        </div>
        {mounted && (
          <div style={{ fontSize: 13, color: c.textMuted, marginTop: 6 }}>
            {today}
            {newThisWeek > 0 ? ` · ${newThisWeek} neue Leads diese Woche` : ''}
          </div>
        )}
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <KpiCard
          label="Leads gesamt"
          value={total}
          sub="in deiner Pipeline"
          accent="#4F46E5"
          icon={<Users size={15} />}
          isDark={isDark}
          c={c}
        />
        <KpiCard
          label="Hot Leads"
          value={hot}
          sub="bereit zur Kontaktaufnahme"
          accent="#EF4444"
          icon={<Zap size={15} />}
          isDark={isDark}
          c={c}
        />
        <KpiCard
          label="Angereichert"
          value={enriched}
          sub="vollständige Analyse"
          accent="#10B981"
          icon={<Star size={15} />}
          isDark={isDark}
          c={c}
        />
        <KpiCard
          label="Neu diese Woche"
          value={newThisWeek}
          sub="in den letzten 7 Tagen"
          accent="#F97316"
          icon={<TrendingUp size={15} />}
          isDark={isDark}
          c={c}
        />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, minHeight: 260 }}>
        <LeadsTrendChart leads={leads} isDark={isDark} c={c} />
        <ScoreDistChart leads={leads} isDark={isDark} c={c} />
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14, alignItems: 'start' }}>
        {/* Recent Leads */}
        <GlassCard isDark={isDark} style={{ overflow: 'hidden' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: `1px solid ${c.border}`,
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: c.text }}>Neueste Leads</div>
              <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>Zuletzt hinzugefügt</div>
            </div>
            <Link
              href="/intelligence/leads"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#4F46E5',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              Alle anzeigen
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2.5 9.5L9.5 2.5M9.5 2.5H4.5M9.5 2.5V7.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
          {loading ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: c.textMuted, fontSize: 13 }}>Lädt…</div>
          ) : recent.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: c.textMuted, fontSize: 13 }}>
              Noch keine Leads vorhanden.
            </div>
          ) : (
            recent.map((lead, i) => (
              <LeadRow key={lead.id} lead={lead} isLast={i === recent.length - 1} c={c} isDark={isDark} />
            ))
          )}
        </GlassCard>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <QuickActions isDark={isDark} c={c} />
          {!loading && leads.length > 0 && <StatusBar leads={leads} c={c} isDark={isDark} />}
        </div>
      </div>
    </div>
  );
}
