'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme, colors, useUser } from './layout';
import { GlassCard, GlassPageFilters } from '@/components/ui/liquid-glass-card';
import { Search, Plus, Download, TrendingUp, Zap, Users, Star } from 'lucide-react';

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
  if (!tier) return { bg: 'rgba(148,163,184,0.12)', text: '#94A3B8' };
  const t = tier.toLowerCase();
  if (t === 'hot+') return { bg: 'rgba(239,68,68,0.12)', text: '#EF4444' };
  if (t === 'hot') return { bg: 'rgba(239,68,68,0.10)', text: '#F87171' };
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
      const e = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(e * target));
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
  const colors = ['#EEF0FF', '#ECFDF5', '#FDF2F8', '#FFF7ED', '#F0F9FF', '#F5F3FF'];
  const textColors = ['#4F46E5', '#059669', '#9D174D', '#C2410C', '#0369A1', '#7C3AED'];
  const idx = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % colors.length;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        background: logoUrl && !err ? '#F4F5F8' : colors[idx],
        color: textColors[idx],
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
    <GlassCard isDark={isDark} style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, letterSpacing: '0.04em' }}>{label}</span>
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
        <div style={{ fontSize: 30, fontWeight: 800, color: c.text, letterSpacing: '-0.03em', lineHeight: 1 }}>
          {animated.toLocaleString('de-DE')}
        </div>
        <div style={{ fontSize: 12, color: c.textMuted, marginTop: 5 }}>{sub}</div>
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

// ─── Recent Lead Row ──────────────────────────────────────────────────────────

function RecentLeadRow({
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
        gap: 14,
        padding: '12px 20px',
        borderBottom: !isLast ? `1px solid ${c.border}` : 'none',
        textDecoration: 'none',
        background: hovered ? (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)') : 'transparent',
        transition: 'background 120ms',
        cursor: 'pointer',
      }}
    >
      <LogoAvatar name={lead.company_name} logoUrl={lead.logo_url} size={36} />

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
        <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>
          {[lead.city, lead.industry].filter(Boolean).join(' · ')}
        </div>
      </div>

      {score > 0 && <ScoreRing score={score} />}

      {lead.tier && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '3px 9px',
            borderRadius: 99,
            background: tc.bg,
            color: tc.text,
            flexShrink: 0,
          }}
        >
          {lead.tier}
        </span>
      )}

      <span style={{ fontSize: 11, color: c.textMuted, flexShrink: 0, minWidth: 70, textAlign: 'right' }}>
        {relativeTime(lead.created_at)}
      </span>
    </Link>
  );
}

// ─── Quick Action Button ──────────────────────────────────────────────────────

function QuickAction({
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
        padding: '12px 16px',
        borderRadius: 10,
        background: hovered
          ? isDark
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(0,0,0,0.04)'
          : isDark
            ? 'rgba(255,255,255,0.03)'
            : 'rgba(0,0,0,0.02)',
        border: `1px solid ${c.border}`,
        textDecoration: 'none',
        transition: 'background 120ms',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
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
      <span style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{label}</span>
      <svg style={{ marginLeft: 'auto', color: c.textMuted }} width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M3 11L11 3M11 3H5.5M11 3V8.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}

// ─── Status Distribution ──────────────────────────────────────────────────────

function StatusBar({ leads, c, isDark }: { leads: Lead[]; c: ReturnType<typeof colors>; isDark: boolean }) {
  const hot = leads.filter((l) => l.tier?.toLowerCase().startsWith('hot')).length;
  const warm = leads.filter((l) => l.tier?.toLowerCase() === 'warm').length;
  const cold = leads.filter((l) => l.tier?.toLowerCase() === 'cold' || !l.tier).length;
  const total = leads.length || 1;

  const bars = [
    { label: 'Hot', count: hot, pct: (hot / total) * 100, color: '#EF4444' },
    { label: 'Warm', count: warm, pct: (warm / total) * 100, color: '#F97316' },
    { label: 'Kalt', count: cold, pct: (cold / total) * 100, color: '#94A3B8' },
  ];

  return (
    <GlassCard isDark={isDark} style={{ padding: '18px 20px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 14 }}>Lead-Verteilung</div>

      {/* Stacked bar */}
      <div style={{ display: 'flex', height: 8, borderRadius: 99, overflow: 'hidden', gap: 2, marginBottom: 14 }}>
        {bars.map(
          (b) =>
            b.pct > 0 && (
              <div
                key={b.label}
                style={{ flex: b.pct, background: b.color, borderRadius: 99, transition: 'flex 500ms ease-out' }}
              />
            )
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {bars.map((b) => (
          <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: c.textSub, flex: 1 }}>{b.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{b.count}</span>
            <span style={{ fontSize: 11, color: c.textMuted, width: 36, textAlign: 'right' }}>
              {Math.round(b.pct)}%
            </span>
          </div>
        ))}
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
  const router = useRouter();

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
    .slice(0, 8);

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
        gap: 20,
        fontFamily: 'var(--font-inter), Inter, sans-serif',
        minHeight: '100%',
      }}
    >
      <GlassPageFilters />

      {/* Greeting */}
      <div>
        <div style={{ fontSize: 36, fontWeight: 800, color: c.text, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          {mounted ? (user?.firstName ? `Hey, ${user.firstName}` : 'Hey') : ' '}
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

      {/* Main content */}
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
            <div style={{ padding: '40px 20px', textAlign: 'center', color: c.textMuted, fontSize: 13 }}>Lädt…</div>
          ) : recent.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: c.textMuted, fontSize: 13 }}>
              Noch keine Leads vorhanden.
            </div>
          ) : (
            recent.map((lead, i) => (
              <RecentLeadRow key={lead.id} lead={lead} isLast={i === recent.length - 1} c={c} isDark={isDark} />
            ))
          )}
        </GlassCard>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Quick Actions */}
          <GlassCard isDark={isDark} style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 12 }}>Schnellaktionen</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <QuickAction
                icon={<Search size={14} />}
                label="Leads suchen"
                href="/intelligence/generate"
                accent="#4F46E5"
                isDark={isDark}
                c={c}
              />
              <QuickAction
                icon={<Plus size={14} />}
                label="Alle Leads"
                href="/intelligence/leads"
                accent="#10B981"
                isDark={isDark}
                c={c}
              />
              <QuickAction
                icon={<Download size={14} />}
                label="Leads exportieren"
                href="/intelligence/leads"
                accent="#F97316"
                isDark={isDark}
                c={c}
              />
            </div>
          </GlassCard>

          {/* Status Distribution */}
          {!loading && leads.length > 0 && <StatusBar leads={leads} c={c} isDark={isDark} />}
        </div>
      </div>
    </div>
  );
}
