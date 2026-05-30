'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTheme, colors, useUser } from './layout';
import { GlassCard, GlassPageFilters } from '@/components/ui/liquid-glass-card';
import { Search, ArrowRight, Download, TrendingUp, Zap, Users, Star, Sparkles } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

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

function tierMeta(tier?: string) {
  const t = (tier ?? '').toLowerCase();
  if (t === 'hot+') return { bg: 'rgba(239,68,68,0.13)', text: '#EF4444', dot: '#EF4444' };
  if (t === 'hot') return { bg: 'rgba(239,68,68,0.10)', text: '#F87171', dot: '#EF4444' };
  if (t === 'warm') return { bg: 'rgba(249,115,22,0.12)', text: '#F97316', dot: '#F97316' };
  return { bg: 'rgba(148,163,184,0.10)', text: '#94A3B8', dot: '#94A3B8' };
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return 'gerade eben';
  if (mins < 60) return `vor ${mins} Min.`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `vor ${hrs} Std.`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'gestern';
  if (days < 7) return `vor ${days} Tagen`;
  return new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
}

function greeting(firstName?: string, lastName?: string) {
  const h = new Date().getHours();
  const salut = h < 12 ? 'Guten Morgen' : h < 18 ? 'Hallo' : 'Guten Abend';
  const name = [firstName, lastName].filter(Boolean).join(' ');
  return name ? `${salut}, ${name}` : salut;
}

// ─── Count-up animation ───────────────────────────────────────────────────────

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
        borderRadius: 9,
        background: logoUrl && !err ? (isDarkBg() ? 'rgba(255,255,255,0.06)' : '#F4F5F8') : bgs[idx],
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
function isDarkBg() {
  return false;
} // replaced by prop in usage

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  accent,
  icon,
  isDark,
  c,
  href,
}: {
  label: string;
  value: number;
  sub: string;
  accent: string;
  icon: React.ReactNode;
  isDark: boolean;
  c: ReturnType<typeof colors>;
  href?: string;
}) {
  const animated = useCountUp(value);
  const [hovered, setHovered] = useState(false);
  const inner = (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        height: '100%',
        boxSizing: 'border-box',
        background: hovered ? (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)') : 'transparent',
        transition: 'background 150ms',
        cursor: href ? 'pointer' : 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: c.textMuted,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: accent + '15',
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
        <div style={{ fontSize: 34, fontWeight: 800, color: c.text, letterSpacing: '-0.03em', lineHeight: 1 }}>
          {animated.toLocaleString('de-DE')}
        </div>
        <div style={{ fontSize: 12, color: c.textMuted, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
          {sub}
          {href && hovered && <ArrowRight size={11} color={accent} />}
        </div>
      </div>
      {/* accent line bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 20,
          right: 20,
          height: 2,
          borderRadius: 99,
          background: `linear-gradient(90deg, ${accent}, transparent)`,
          opacity: hovered ? 0.6 : 0,
          transition: 'opacity 200ms',
        }}
      />
    </div>
  );
  return (
    <GlassCard isDark={isDark} style={{ position: 'relative', overflow: 'hidden', height: '100%' }}>
      {href ? (
        <Link href={href} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
          {inner}
        </Link>
      ) : (
        inner
      )}
    </GlassCard>
  );
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const size = 36;
  const r = 14;
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
        fontSize={8.5}
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
  const tm = tierMeta(lead.tier);
  const initials = lead.company_name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  const bgs = ['#EEF0FF', '#ECFDF5', '#FDF2F8', '#FFF7ED', '#F0F9FF', '#F5F3FF'];
  const fgs = ['#4F46E5', '#059669', '#9D174D', '#C2410C', '#0369A1', '#7C3AED'];
  const idx = (lead.company_name.charCodeAt(0) + (lead.company_name.charCodeAt(1) || 0)) % bgs.length;
  const [logoErr, setLogoErr] = useState(false);

  return (
    <Link
      href={`/intelligence/leads/${lead.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 20px',
        borderBottom: !isLast ? `1px solid ${c.border}` : 'none',
        textDecoration: 'none',
        background: hovered ? (isDark ? 'rgba(79,70,229,0.04)' : 'rgba(79,70,229,0.03)') : 'transparent',
        transition: 'background 100ms',
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: lead.logo_url && !logoErr ? (isDark ? 'rgba(255,255,255,0.06)' : '#F4F5F8') : bgs[idx],
          color: fgs[idx],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 800,
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        {lead.logo_url && !logoErr ? (
          <img
            src={lead.logo_url}
            alt={lead.company_name}
            onError={() => setLogoErr(true)}
            style={{ width: 24, height: 24, objectFit: 'contain' }}
          />
        ) : (
          initials
        )}
      </div>
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
            padding: '2px 9px',
            borderRadius: 99,
            background: tm.bg,
            color: tm.text,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: tm.dot }} />
          {lead.tier}
        </span>
      )}
      <span style={{ fontSize: 11, color: c.textMuted, flexShrink: 0, width: 72, textAlign: 'right' }}>
        {relativeTime(lead.created_at)}
      </span>
    </Link>
  );
}

// ─── Leads Trend Chart ────────────────────────────────────────────────────────

function LeadsTrendChart({ leads, isDark, c }: { leads: Lead[]; isDark: boolean; c: ReturnType<typeof colors> }) {
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const end = new Date();
    end.setDate(end.getDate() - (7 - i) * 7);
    const start = new Date(end);
    start.setDate(end.getDate() - 7);
    return {
      label: end.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }),
      leads: leads.filter((l) => {
        const t = new Date(l.created_at).getTime();
        return t >= start.getTime() && t < end.getTime();
      }).length,
    };
  });

  const accent = '#4F46E5';
  const gridColor = isDark ? '#242630' : '#F0F0F0';
  const maxVal = Math.max(...weeks.map((w) => w.leads), 1);
  const growth =
    weeks.length >= 2 && weeks[weeks.length - 2].leads > 0
      ? Math.round(
          ((weeks[weeks.length - 1].leads - weeks[weeks.length - 2].leads) / weeks[weeks.length - 2].leads) * 100
        )
      : null;

  return (
    <GlassCard isDark={isDark} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
          <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>Neue Leads pro Woche · 8 Wochen</div>
        </div>
        {growth !== null && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              borderRadius: 99,
              background: growth >= 0 ? '#10B98115' : '#EF444415',
              border: `1px solid ${growth >= 0 ? '#10B98130' : '#EF444430'}`,
            }}
          >
            <TrendingUp size={12} color={growth >= 0 ? '#10B981' : '#EF4444'} />
            <span style={{ fontSize: 12, fontWeight: 700, color: growth >= 0 ? '#10B981' : '#EF4444' }}>
              {growth >= 0 ? '+' : ''}
              {growth}%
            </span>
          </div>
        )}
      </div>
      {/* Stats strip */}
      <div style={{ display: 'flex', padding: '10px 20px', gap: 24, borderBottom: `1px solid ${c.border}` }}>
        {[
          { label: 'Gesamt', value: weeks.reduce((s, w) => s + w.leads, 0) },
          { label: 'Peak', value: maxVal },
          { label: 'Ø/Woche', value: Math.round(weeks.reduce((s, w) => s + w.leads, 0) / 8) },
        ].map((m) => (
          <div key={m.label}>
            <div style={{ fontSize: 11, color: c.textMuted, fontWeight: 600 }}>{m.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: c.text, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 160, padding: '12px 8px 4px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={weeks} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={accent} stopOpacity={0.18} />
                <stop offset="95%" stopColor={accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 8" stroke={gridColor} horizontal vertical={false} />
            <XAxis
              dataKey="label"
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
                      fontFamily: 'var(--font-inter)',
                    }}
                  >
                    <div style={{ color: c.textMuted, marginBottom: 4, fontSize: 11 }}>{label}</div>
                    <div style={{ color: accent, fontWeight: 800, fontSize: 17 }}>{payload[0]?.value} Leads</div>
                  </div>
                );
              }}
            />
            <Area
              dataKey="leads"
              type="monotone"
              stroke={accent}
              strokeWidth={2.5}
              fill="url(#tg)"
              dot={false}
              activeDot={{ r: 5, fill: accent, stroke: isDark ? '#1E2028' : '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}

// ─── Animated Score Distribution (21First style) ──────────────────────────────

function ScoreDistChart({ leads, isDark, c }: { leads: Lead[]; isDark: boolean; c: ReturnType<typeof colors> }) {
  const buckets = [
    { label: 'Sehr gut', range: '76–100', min: 76, max: 100, color: '#10B981', bg: '#10B98112' },
    { label: 'Gut', range: '51–75', min: 51, max: 75, color: '#F59E0B', bg: '#F59E0B12' },
    { label: 'Okay', range: '26–50', min: 26, max: 50, color: '#F97316', bg: '#F9731612' },
    { label: 'Niedrig', range: '0–25', min: 0, max: 25, color: '#EF4444', bg: '#EF444412' },
  ].map((b) => ({
    ...b,
    count: leads.filter((l) => {
      const s = l.lead_score ?? l.fit_score ?? 0;
      return s >= b.min && s <= b.max;
    }).length,
  }));

  const maxCount = Math.max(...buckets.map((b) => b.count), 1);
  const total = buckets.reduce((s, b) => s + b.count, 0);

  return (
    <GlassCard isDark={isDark} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
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
          <div style={{ fontSize: 15, fontWeight: 700, color: c.text }}>Score-Verteilung</div>
          <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>Qualität deiner Lead-Pipeline</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: c.text, letterSpacing: '-0.03em', lineHeight: 1 }}>
            {total}
          </div>
          <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>bewertet</div>
        </div>
      </div>

      {/* Rows */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        {buckets.map((b, i) => {
          const pct = maxCount > 0 ? (b.count / maxCount) * 100 : 0;
          const sharePct = total > 0 ? Math.round((b.count / total) * 100) : 0;
          return (
            <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Label + range */}
              <div style={{ width: 68, flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: c.text, lineHeight: 1.2 }}>{b.label}</div>
                <div style={{ fontSize: 10, color: c.textMuted, marginTop: 1 }}>{b.range}</div>
              </div>
              {/* Progress track */}
              <div
                style={{
                  flex: 1,
                  height: 7,
                  borderRadius: 99,
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                  overflow: 'hidden',
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: i * 0.06, duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
                  style={{ height: '100%', borderRadius: 99, background: b.color }}
                />
              </div>
              {/* Count + % */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  flexShrink: 0,
                  width: 56,
                  justifyContent: 'flex-end',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 800, color: c.text }}>{b.count}</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: b.color,
                    background: b.bg,
                    padding: '1px 5px',
                    borderRadius: 99,
                  }}
                >
                  {sharePct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

function QuickActions({ isDark, c }: { isDark: boolean; c: ReturnType<typeof colors> }) {
  const router = useRouter();

  const actions = [
    {
      icon: <Search size={14} />,
      label: 'Leads suchen',
      desc: 'KI-gestützte Suche starten',
      accent: '#4F46E5',
      onClick: () => router.push('/intelligence/generate'),
    },
    {
      icon: <Users size={14} />,
      label: 'Alle Leads',
      desc: 'Vollständige Lead-Tabelle',
      accent: '#10B981',
      onClick: () => router.push('/intelligence/leads'),
    },
    {
      icon: <Download size={14} />,
      label: 'CSV Export',
      desc: 'Leads als Datei exportieren',
      accent: '#F97316',
      onClick: () => router.push('/intelligence/leads?export=1'),
    },
  ];

  return (
    <GlassCard isDark={isDark} style={{ padding: '16px 18px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 12 }}>Schnellaktionen</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
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
  desc,
  accent,
  onClick,
  isDark,
  c,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  accent: string;
  onClick: () => void;
  isDark: boolean;
  c: ReturnType<typeof colors>;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: '9px 12px',
        borderRadius: 10,
        background: hovered ? accent + '12' : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
        border: `1px solid ${hovered ? accent + '40' : c.border}`,
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 150ms',
        width: '100%',
        fontFamily: 'var(--font-inter), Inter, sans-serif',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: accent + '15',
          color: accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'background 150ms',
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: c.text, lineHeight: 1.2 }}>{label}</div>
        <div style={{ fontSize: 11, color: c.textMuted, marginTop: 1 }}>{desc}</div>
      </div>
      <ArrowRight
        size={13}
        color={hovered ? accent : c.textMuted}
        style={{ transition: 'color 150ms', flexShrink: 0 }}
      />
    </button>
  );
}

// ─── Lead-Verteilung ──────────────────────────────────────────────────────────

function StatusBar({ leads, c, isDark }: { leads: Lead[]; c: ReturnType<typeof colors>; isDark: boolean }) {
  const hot = leads.filter((l) => l.tier?.toLowerCase().startsWith('hot')).length;
  const warm = leads.filter((l) => l.tier?.toLowerCase() === 'warm').length;
  const cold = leads.length - hot - warm;
  const total = leads.length || 1;

  const tiles = [
    { label: 'Hot', count: hot, pct: Math.round((hot / total) * 100), color: '#EF4444', glow: 'rgba(239,68,68,0.18)' },
    {
      label: 'Warm',
      count: warm,
      pct: Math.round((warm / total) * 100),
      color: '#F97316',
      glow: 'rgba(249,115,22,0.15)',
    },
    {
      label: 'Kalt',
      count: cold,
      pct: Math.round((cold / total) * 100),
      color: '#94A3B8',
      glow: 'rgba(148,163,184,0.12)',
    },
  ];

  return (
    <GlassCard isDark={isDark} style={{ padding: '16px 18px', flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 14 }}>Lead-Verteilung</div>

      {/* Tiles */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {tiles.map((t, i) => (
          <motion.div
            key={t.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            style={{
              flex: 1,
              padding: '14px 10px 12px',
              borderRadius: 12,
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
              border: `1px solid ${t.color}30`,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: `0 0 20px ${t.glow}, inset 0 1px 0 rgba(255,255,255,0.12)`,
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top accent line */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '20%',
                right: '20%',
                height: 2,
                borderRadius: 99,
                background: t.color,
                opacity: 0.8,
              }}
            />
            <div style={{ fontSize: 26, fontWeight: 900, color: t.color, letterSpacing: '-0.04em', lineHeight: 1 }}>
              {t.count}
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: c.textMuted,
                marginTop: 5,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
              }}
            >
              {t.label}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: t.color, marginTop: 3, opacity: 0.85 }}>{t.pct}%</div>
          </motion.div>
        ))}
      </div>

      {/* Segmented bar */}
      <div style={{ display: 'flex', height: 4, borderRadius: 99, overflow: 'hidden', gap: 2 }}>
        {tiles.map((t) =>
          t.pct > 0 ? (
            <motion.div
              key={t.label}
              initial={{ flex: 0 }}
              animate={{ flex: t.pct }}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              style={{ background: t.color, borderRadius: 99, opacity: 0.8 }}
            />
          ) : null
        )}
      </div>
    </GlassCard>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UebersichtPage() {
  const { theme } = useTheme();
  const c = colors(theme);
  const isDark = theme === 'dark';
  const user = useUser();

  const CACHE_KEY = 'dashboard_leads_cache';
  const CACHE_TTL = 3 * 60_000; // 3 min

  // Lazy init — reads cache synchronously before first render, zero flicker
  const [leads, setLeads] = useState<Lead[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) return (JSON.parse(raw) as { data: Lead[] }).data ?? [];
    } catch {}
    return [];
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      return !sessionStorage.getItem(CACHE_KEY);
    } catch {}
    return true;
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Check if cache is still fresh — if yes, skip fetch entirely
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (raw) {
        const { ts } = JSON.parse(raw) as { ts: number; data: Lead[] };
        if (Date.now() - ts < CACHE_TTL) return; // data is fresh
      }
    } catch {}

    // Fetch fresh data in background (user already sees cached data)
    fetch('/api/leads')
      .then((r) => r.json())
      .then((d) => {
        const data: Lead[] = d.leads ?? [];
        setLeads(data);
        setLoading(false);
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
        } catch {}
      })
      .catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = leads.length;
  const hot = leads.filter((l) => l.tier?.toLowerCase().startsWith('hot')).length;
  const enriched = leads.filter((l) => l.enrichment_status === 'layer2_done').length;
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newThisWeek = leads.filter((l) => new Date(l.created_at).getTime() > oneWeekAgo).length;
  const recent = [...leads]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

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
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 34, fontWeight: 800, color: c.text, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {mounted ? greeting(user?.firstName, user?.lastName) : ' '}
          </div>
          {mounted && (
            <div style={{ fontSize: 13, color: c.textMuted, marginTop: 6 }}>
              {today}
              {newThisWeek > 0 ? ` · ${newThisWeek} neue Leads diese Woche` : ''}
            </div>
          )}
        </div>
        <Link
          href="/intelligence/generate"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 10,
            background: '#4F46E5',
            color: '#fff',
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 700,
            boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
            transition: 'opacity 150ms',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.88')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
        >
          <Search size={14} />
          Neue Leads suchen
        </Link>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <KpiCard
          label="Leads gesamt"
          value={total}
          sub="in deiner Pipeline"
          accent="#4F46E5"
          icon={<Users size={14} />}
          isDark={isDark}
          c={c}
          href="/intelligence/leads"
        />
        <KpiCard
          label="Hot Leads"
          value={hot}
          sub="bereit zur Kontaktaufnahme"
          accent="#EF4444"
          icon={<Zap size={14} />}
          isDark={isDark}
          c={c}
          href="/intelligence/leads"
        />
        <KpiCard
          label="Angereichert"
          value={enriched}
          sub="vollständige KI-Analyse"
          accent="#10B981"
          icon={<Star size={14} />}
          isDark={isDark}
          c={c}
        />
        <KpiCard
          label="Neu diese Woche"
          value={newThisWeek}
          sub="in den letzten 7 Tagen"
          accent="#F97316"
          icon={<TrendingUp size={14} />}
          isDark={isDark}
          c={c}
        />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <LeadsTrendChart leads={leads} isDark={isDark} c={c} />
        <ScoreDistChart leads={leads} isDark={isDark} c={c} />
      </div>

      {/* Bottom Row — equal height left/right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14, alignItems: 'stretch' }}>
        {/* Recent Leads */}
        <GlassCard isDark={isDark} style={{ overflow: 'hidden' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: `1px solid ${c.border}`,
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: c.text }}>Neueste Leads</div>
              <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>
                Zuletzt hinzugefügt · {recent.length} Einträge
              </div>
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
              Alle anzeigen <ArrowRight size={12} />
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

        {/* Right sidebar — fills same height as left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <QuickActions isDark={isDark} c={c} />
          {!loading && leads.length > 0 && <StatusBar leads={leads} c={c} isDark={isDark} />}
        </div>
      </div>
    </div>
  );
}
