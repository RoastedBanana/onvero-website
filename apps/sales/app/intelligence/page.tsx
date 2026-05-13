'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTheme, colors, useUser } from './layout';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { FunnelChart } from '@/components/ui/funnel-chart';
import { ChartContainer } from '@/components/ui/area-charts-2';
import { GlassCard, GlassPageFilters } from '@/components/ui/liquid-glass-card';
import { GlassButton } from '@/components/ui/glass-button';

// ─── Static data ──────────────────────────────────────────────────────────────

const KPI = [
  {
    label: 'Aktive Leads',
    value: 1247,
    fmt: (v: number) => v.toLocaleString('de-DE'),
    trend: '+84',
    sub: 'vs. letzte Woche',
    trendColor: '#059669' as const,
    trendBg: 'rgba(16,185,129,0.10)' as const,
  },
  {
    label: 'Hot Leads',
    value: 89,
    fmt: (v: number) => String(v),
    trend: '+12',
    sub: 'vs. Vorwoche',
    trendColor: '#EF4444' as const,
    trendBg: 'rgba(239,68,68,0.10)' as const,
  },
  {
    label: 'Conversion Rate',
    value: 22,
    fmt: (v: number) => v + '%',
    trend: '+3%',
    sub: 'Ø Score → Deal',
    trendColor: '#059669' as const,
    trendBg: 'rgba(16,185,129,0.10)' as const,
  },
  {
    label: 'Neue Signale',
    value: 34,
    fmt: (v: number) => String(v),
    trend: '+8',
    sub: 'heute erkannt',
    trendColor: '#F97316' as const,
    trendBg: 'rgba(249,115,22,0.10)' as const,
  },
];

const CHART_DATA = {
  '12M': {
    label: 'Letzten 12 Monate',
    points: [
      { month: 'Jun', cur: 42, prev: 38 },
      { month: 'Jul', cur: 55, prev: 41 },
      { month: 'Aug', cur: 48, prev: 50 },
      { month: 'Sep', cur: 63, prev: 44 },
      { month: 'Okt', cur: 71, prev: 52 },
      { month: 'Nov', cur: 58, prev: 47 },
      { month: 'Dez', cur: 80, prev: 60 },
      { month: 'Jan', cur: 74, prev: 63 },
      { month: 'Feb', cur: 89, prev: 68 },
      { month: 'Mär', cur: 95, prev: 72 },
      { month: 'Apr', cur: 88, prev: 70 },
      { month: 'Mai', cur: 102, prev: 75 },
    ],
    peak: 102,
    avg: 72,
    growth: '+24%',
    growthColor: '#10B981',
  },
  '30T': {
    label: 'Letzten 30 Tage',
    points: [
      { month: '1. Apr', cur: 74, prev: 63 },
      { month: '5. Apr', cur: 79, prev: 66 },
      { month: '9. Apr', cur: 76, prev: 68 },
      { month: '13. Apr', cur: 84, prev: 70 },
      { month: '17. Apr', cur: 89, prev: 72 },
      { month: '21. Apr', cur: 85, prev: 69 },
      { month: '25. Apr', cur: 92, prev: 71 },
      { month: '30. Apr', cur: 95, prev: 72 },
    ],
    peak: 95,
    avg: 84,
    growth: '+18%',
    growthColor: '#F97316',
  },
  '7T': {
    label: 'Letzte 7 Tage',
    points: [
      { month: 'Mo', cur: 12, prev: 9 },
      { month: 'Di', cur: 18, prev: 11 },
      { month: 'Mi', cur: 15, prev: 13 },
      { month: 'Do', cur: 22, prev: 16 },
      { month: 'Fr', cur: 28, prev: 18 },
      { month: 'Sa', cur: 8, prev: 6 },
      { month: 'So', cur: 5, prev: 4 },
    ],
    peak: 28,
    avg: 15,
    growth: '+32%',
    growthColor: '#10B981',
  },
} as const;
type ChartPeriod = keyof typeof CHART_DATA;

const SOURCES = [
  { label: 'LinkedIn', pct: 56, color: '#10B981' },
  { label: 'Web', pct: 26, color: '#F97316' },
  { label: 'Google Maps', pct: 18, color: '#EF4444' },
];

const INDUSTRIES = [
  { label: 'Mode', value: 28 },
  { label: 'Möbel', value: 22 },
  { label: 'Elektronik', value: 18 },
  { label: 'Sport', value: 14 },
  { label: 'Küche', value: 11 },
  { label: 'Sonstige', value: 7 },
];

const TOP_LEADS = [
  {
    id: 'demo',
    name: 'Nordvik Home & Living GmbH',
    city: 'Hamburg',
    industry: 'Möbel & Einrichtung',
    score: 95,
    status: 'hot' as const,
    signal: 'Jobausschreibung',
    assignee: 'HL',
  },
  {
    id: '1',
    name: 'Fashion House GmbH',
    city: 'München',
    industry: 'Mode',
    score: 91,
    status: 'hot' as const,
    signal: 'Kaufsignal',
    assignee: 'SK',
  },
  {
    id: 'luxurybags',
    name: 'LuxuryBags Store',
    city: 'Düsseldorf',
    industry: 'Luxus',
    score: 82,
    status: 'warm' as const,
    signal: 'Bewertungsanstieg',
    assignee: 'TB',
  },
  {
    id: 'velora',
    name: 'Velora Sports GmbH',
    city: 'Frankfurt',
    industry: 'Sport',
    score: 74,
    status: 'warm' as const,
    signal: 'Teamwachstum',
    assignee: 'HL',
  },
  {
    id: 'techdirect',
    name: 'TechDirect GmbH',
    city: 'Berlin',
    industry: 'Elektronik',
    score: 68,
    status: 'warm' as const,
    signal: 'Messeteilnahme',
    assignee: 'SK',
  },
];

const ASSIGNEE_COLORS: Record<string, string> = {
  HL: '#374151',
  SK: '#6B7280',
  TB: '#111111',
};

const ACTIVITIES = [
  { dot: '#10B981', title: 'Neuer Hot Lead', body: 'Nordvik Home & Living GmbH — Score 95', time: 'vor 12 Min.' },
  {
    dot: '#F97316',
    title: 'Kaufsignal erkannt',
    body: 'Fashion House — 4 negative DHL-Bewertungen',
    time: 'vor 1 Std.',
  },
  { dot: '#10B981', title: 'Lead qualifiziert', body: 'LuxuryBags Store → Warm', time: 'vor 2 Std.' },
  { dot: '#F97316', title: 'Neue Leads', body: '84 Leads aus LinkedIn importiert', time: 'heute, 09:14' },
  { dot: '#EF4444', title: 'Red Flag erkannt', body: 'TechDirect GmbH — hohe Retouren-Quote', time: 'gestern' },
  { dot: '#10B981', title: 'Deal gewonnen', body: 'Velora Sports → Onvero Kunde', time: 'vor 2 Tagen' },
];

const STATUS_COLORS = {
  hot: { bg: '#FEF2F2', text: '#EF4444', label: 'Hot' },
  warm: { bg: '#FFF7ED', text: '#F97316', label: 'Warm' },
  cold: { bg: '#F3F4F6', text: '#9CA3AF', label: 'Cold' },
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1200): number {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = null;
    function step(ts: number) {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    }
    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return value;
}

function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

// ─── Shared card style ───────────────────────────────────────────────────────

function card(isDark: boolean, c: ReturnType<typeof colors>, extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: isDark ? 'rgba(10, 12, 24, 0.46)' : 'rgba(255, 255, 255, 0.54)',
    backdropFilter: 'blur(22px)',
    WebkitBackdropFilter: 'blur(22px)',
    borderRadius: 16,
    border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.72)',
    boxShadow: isDark
      ? 'inset 1px 1px 2px rgba(255,255,255,0.08), inset -1px -1px 2px rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.32)'
      : 'inset 3px 3px 4px rgba(255,255,255,0.65), inset -2px -2px 3px rgba(255,255,255,0.42), 0 4px 24px rgba(0,0,0,0.07)',
    ...extra,
  };
}

// Card header — consistent title + subtitle block
function CardHeader({
  title,
  subtitle,
  right,
  c,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  c: ReturnType<typeof colors>;
}) {
  return (
    <div
      style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '14px 20px 8px' }}
    >
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: c.text, lineHeight: 1.2 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: c.textMuted, marginTop: 3 }}>{subtitle}</div>}
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </div>
  );
}

// ─── KPI Item — individual card with subtle grey bubble ──────────────────────

function KpiItem({
  label,
  value,
  fmt,
  trend,
  sub,
  trendColor,
  trendBg,
}: {
  label: string;
  value: number;
  fmt: (v: number) => string;
  trend: string;
  sub: string;
  trendColor: string;
  trendBg: string;
  index: number;
  total: number;
}) {
  const { theme } = useTheme();
  const c = colors(theme);
  const animated = useCountUp(value);

  return (
    <GlassCard
      isDark={theme === 'dark'}
      borderRadius={14}
      style={{
        flex: 1,
        padding: '20px 20px 18px',
        minHeight: 140,
      }}
    >
      {/* Label — top */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: c.textMuted,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Bottom row — number left, trend right */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
        {/* Main number — small, bottom left */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: c.text,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            fontFamily: 'var(--font-inter), Inter, sans-serif',
          }}
        >
          {fmt(animated)}
        </div>

        {/* Trend — bottom right */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
          <span
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: trendColor,
              background: trendBg,
              padding: '3px 10px',
              borderRadius: 99,
              whiteSpace: 'nowrap',
              letterSpacing: '-0.02em',
            }}
          >
            {trend}
          </span>
          <span style={{ fontSize: 11, color: c.textMuted, whiteSpace: 'nowrap' }}>{sub}</span>
        </div>
      </div>
    </GlassCard>
  );
}

// ─── Period Button ────────────────────────────────────────────────────────────

function PeriodButton({
  label,
  active,
  onClick,
  c,
  isDark,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  c: ReturnType<typeof colors>;
  isDark: boolean;
}) {
  return (
    <GlassButton
      size="sm"
      isDark={isDark}
      onClick={onClick}
      style={{
        fontSize: 11,
        fontWeight: 700,
        background: active ? c.accent : undefined,
        color: active ? '#fff' : c.textMuted,
        fontFamily: 'var(--font-inter), Inter, sans-serif',
      }}
    >
      {label}
    </GlassButton>
  );
}

// ─── Sales Funnel Card ────────────────────────────────────────────────────────

const FUNNEL_DATA = [
  { label: 'Generiert', value: 1247, displayValue: '1.247' },
  { label: 'Qualifiziert', value: 680, displayValue: '680' },
  { label: 'Kontaktiert', value: 312, displayValue: '312' },
  { label: 'Angebote', value: 134, displayValue: '134' },
  { label: 'Gewonnen', value: 47, displayValue: '47' },
];

function SalesFunnelCard() {
  const { theme } = useTheme();
  const c = colors(theme);
  const isDark = theme === 'dark';
  const [hoveredStage, setHoveredStage] = useState<number | null>(null);
  const n = FUNNEL_DATA.length;

  return (
    <GlassCard
      isDark={isDark}
      style={{
        height: '100%',
        boxSizing: 'border-box' as const,
        overflow: 'hidden',
      }}
    >
      <div style={{ borderBottom: `1px solid ${c.border}` }}>
        <CardHeader title="Lead Funnel" subtitle="Von generiert bis gewonnen" c={c} />
      </div>

      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <FunnelChart
          data={FUNNEL_DATA}
          orientation="horizontal"
          color="#10B981"
          layers={4}
          edges="curved"
          showPercentage={false}
          showValues={false}
          showLabels={false}
          gap={6}
          staggerDelay={0.1}
          onHoverChange={setHoveredStage}
          style={{ aspectRatio: 'unset', height: '100%' }}
        />
        {/* Hover tooltip */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: hoveredStage !== null ? `${((hoveredStage + 0.5) / n) * 100}%` : '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
            textAlign: 'center',
            transition: 'left 180ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 140ms ease-out',
            opacity: hoveredStage !== null ? 1 : 0,
            paddingTop: 6,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#10B981',
              opacity: 0.75,
              whiteSpace: 'nowrap',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {hoveredStage !== null ? FUNNEL_DATA[hoveredStage]?.label : ''}
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: '#10B981',
              lineHeight: 1.1,
              whiteSpace: 'nowrap',
              letterSpacing: '-0.03em',
            }}
          >
            {hoveredStage !== null ? FUNNEL_DATA[hoveredStage]?.displayValue : ''}
          </div>
        </div>
      </div>

      {/* Conversion stats strip */}
      <div
        style={{
          display: 'flex',
          borderTop: `1px solid ${c.border}`,
          marginTop: 'auto',
          padding: '12px 20px',
          height: 57,
          boxSizing: 'border-box',
          gap: 0,
        }}
      >
        {FUNNEL_DATA.slice(0, -1).map((stage, i) => {
          const next = FUNNEL_DATA[i + 1];
          const rate = next ? Math.round((next.value / stage.value) * 100) : 0;
          return (
            <div
              key={stage.label}
              style={{
                flex: 1,
                paddingLeft: i > 0 ? 16 : 0,
                paddingRight: i < FUNNEL_DATA.length - 2 ? 16 : 0,
                borderRight: i < FUNNEL_DATA.length - 2 ? `1px solid ${c.border}` : 'none',
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: c.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 4,
                }}
              >
                {stage.label} → {next?.label}
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: rate >= 50 ? '#10B981' : rate >= 30 ? '#F97316' : '#EF4444',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                }}
              >
                {rate}%
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

const PERIOD_LABELS: Record<ChartPeriod, { cur: string; prev: string }> = {
  '12M': { cur: 'Dieses Jahr', prev: 'Letztes Jahr' },
  '30T': { cur: 'Dieser Monat', prev: 'Letzter Monat' },
  '7T': { cur: 'Diese Woche', prev: 'Letzte Woche' },
};

function ChartTooltip({
  active,
  payload,
  label,
  c,
  isDark,
  accentColor,
  curLabel,
  prevLabel,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string }>;
  label?: string;
  c: ReturnType<typeof colors>;
  isDark: boolean;
  accentColor: string;
  curLabel: string;
  prevLabel: string;
}) {
  if (!active || !payload?.length) return null;
  const cur = payload.find((p) => p.dataKey === 'cur');
  const prev = payload.find((p) => p.dataKey === 'prev');
  return (
    <div
      style={{
        background: isDark ? '#1E2028' : '#ffffff',
        border: `1px solid ${c.border}`,
        borderRadius: 8,
        padding: '8px 12px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
        fontFamily: 'var(--font-inter), Inter, sans-serif',
      }}
    >
      <div style={{ fontSize: 10, color: c.textMuted, fontWeight: 600, marginBottom: 6, letterSpacing: '0.05em' }}>
        {label}
      </div>
      {cur && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: accentColor, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: c.textMuted }}>{curLabel}</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: accentColor, marginLeft: 4 }}>{cur.value}</span>
        </div>
      )}
      {prev && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D1D5DB', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: c.textMuted }}>{prevLabel}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: c.textSub, marginLeft: 4 }}>{prev.value}</span>
        </div>
      )}
    </div>
  );
}

// ─── Area Chart ───────────────────────────────────────────────────────────────

function LeadsChart() {
  const { theme } = useTheme();
  const c = colors(theme);
  const isDark = theme === 'dark';

  const [period, setPeriod] = useState<ChartPeriod>('12M');
  const [visible, setVisible] = useState(true);

  const data = CHART_DATA[period];
  const pts = data.points as readonly { month: string; cur: number; prev: number }[];
  const chartData = pts.map((p) => ({ ...p }));

  function switchPeriod(p: ChartPeriod) {
    if (p === period) return;
    setVisible(false);
    setTimeout(() => {
      setPeriod(p);
      setVisible(true);
    }, 160);
  }

  const PERIODS: ChartPeriod[] = ['7T', '30T', '12M'];
  const gridColor = isDark ? '#242630' : '#F0F0F0';
  const gradientId = `grad-${period}`;

  return (
    <GlassCard
      isDark={isDark}
      style={{
        overflow: 'hidden',
        height: '100%',
        boxSizing: 'border-box' as const,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '14px 20px 8px',
          borderBottom: `1px solid ${c.border}`,
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 2 }}>Leads Entwicklung</div>
          <div style={{ fontSize: 11, color: c.textMuted }}>{data.label}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {PERIODS.map((p) => (
            <PeriodButton
              key={p}
              label={p}
              active={period === p}
              onClick={() => switchPeriod(p)}
              c={c}
              isDark={isDark}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: 8, padding: '10px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 3, background: data.growthColor, borderRadius: 2 }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: c.textSub }}>{PERIOD_LABELS[period].cur}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 12, height: 0, borderTop: '2px dashed #D1D5DB' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: c.textSub }}>{PERIOD_LABELS[period].prev}</span>
        </div>
      </div>

      {/* Chart */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0px)' : 'translateY(10px)',
          transition: 'opacity 180ms ease-out, transform 180ms ease-out',
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={data.growthColor} stopOpacity={0.12} />
                <stop offset="95%" stopColor={data.growthColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="4 8"
              stroke={gridColor}
              strokeOpacity={1}
              horizontal={true}
              vertical={false}
            />
            <YAxis hide />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: c.textMuted, fontFamily: 'var(--font-inter), Inter, sans-serif' }}
              tickMargin={10}
            />
            <Tooltip
              content={(props) => (
                <ChartTooltip
                  active={props.active}
                  payload={props.payload as unknown as Array<{ dataKey: string; value: number; color: string }>}
                  label={String(props.label ?? '')}
                  c={c}
                  isDark={isDark}
                  accentColor={data.growthColor}
                  curLabel={PERIOD_LABELS[period].cur}
                  prevLabel={PERIOD_LABELS[period].prev}
                />
              )}
              cursor={{ strokeDasharray: '3 3', stroke: gridColor }}
            />
            <Area
              dataKey="prev"
              type="monotone"
              stroke="#D1D5DB"
              strokeWidth={1.5}
              strokeDasharray="5 3"
              fill="none"
              dot={false}
              activeDot={{ r: 4, fill: '#D1D5DB', stroke: c.bgCard, strokeWidth: 2 }}
            />
            <Area
              dataKey="cur"
              type="monotone"
              stroke={data.growthColor}
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 5, fill: data.growthColor, stroke: c.bgCard, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom metrics strip */}
      <div
        style={{
          display: 'flex',
          padding: '12px 20px',
          borderTop: `1px solid ${c.border}`,
          marginTop: 'auto',
          height: 57,
          boxSizing: 'border-box',
        }}
      >
        {[
          { label: 'Peak', value: String(data.peak), color: data.growthColor },
          { label: 'Durchschn.', value: String(data.avg), color: c.text },
          { label: 'Wachstum', value: data.growth, color: data.growthColor },
        ].map((m, i) => (
          <div
            key={m.label}
            style={{
              flex: 1,
              paddingLeft: i > 0 ? 20 : 0,
              paddingRight: i < 2 ? 20 : 0,
              borderRight: i < 2 ? `1px solid ${c.border}` : 'none',
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: c.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: 4,
              }}
            >
              {m.label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: m.color, letterSpacing: '-0.03em', lineHeight: 1 }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ─── Sources Bar Chart ────────────────────────────────────────────────────────

const SOURCES_MONTHLY = [
  { month: 'Jun', linkedin: 24, web: 11, maps: 7 },
  { month: 'Jul', linkedin: 31, web: 14, maps: 10 },
  { month: 'Aug', linkedin: 27, web: 12, maps: 9 },
  { month: 'Sep', linkedin: 35, web: 18, maps: 10 },
  { month: 'Okt', linkedin: 40, web: 20, maps: 11 },
  { month: 'Nov', linkedin: 33, web: 15, maps: 10 },
  { month: 'Dez', linkedin: 45, web: 22, maps: 13 },
  { month: 'Jan', linkedin: 42, web: 20, maps: 12 },
  { month: 'Feb', linkedin: 50, web: 25, maps: 14 },
  { month: 'Mär', linkedin: 54, web: 27, maps: 14 },
  { month: 'Apr', linkedin: 50, web: 24, maps: 14 },
  { month: 'Mai', linkedin: 57, web: 27, maps: 18 },
];

type SourceKey = 'linkedin' | 'web' | 'maps';

const SOURCE_KEYS: { key: SourceKey; label: string; color: string }[] = [
  { key: 'linkedin', label: 'LinkedIn', color: '#10B981' },
  { key: 'web', label: 'Web', color: '#F97316' },
  { key: 'maps', label: 'Google Maps', color: '#EF4444' },
];

function CustomGradientBar(
  props: React.SVGProps<SVGRectElement> & {
    dataKey?: string;
    activeSources?: Set<string>;
    fill?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  }
) {
  const { fill, x, y, width, height, dataKey, activeSources } = props;
  const isActive = activeSources ? activeSources.has(dataKey ?? '') : true;
  const hasFilter = activeSources !== undefined && activeSources.size < 3;
  const filterId = `glow-src-${dataKey}`;
  return (
    <>
      <rect
        x={x}
        y={y}
        rx={4}
        width={width}
        height={height}
        stroke="none"
        fill={fill}
        opacity={isActive ? 1 : 0.1}
        filter={isActive && hasFilter ? `url(#${filterId})` : undefined}
      />
      <defs>
        <filter id={filterId} x="-200%" y="-200%" width="600%" height="600%">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
    </>
  );
}

function SourcesTooltip({
  active,
  payload,
  label,
  c,
  isDark,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string }>;
  label?: string;
  c: ReturnType<typeof colors>;
  isDark: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: isDark ? '#1E2028' : '#ffffff',
        border: `1px solid ${c.border}`,
        borderRadius: 8,
        padding: '8px 12px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
        fontFamily: 'var(--font-inter), Inter, sans-serif',
        whiteSpace: 'nowrap',
      }}
    >
      <div style={{ fontSize: 10, color: c.textMuted, fontWeight: 600, marginBottom: 5 }}>{label}</div>
      {payload.map((p) => {
        const src = SOURCE_KEYS.find((s) => s.key === p.dataKey);
        return (
          <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: c.textMuted, flex: 1 }}>{src?.label ?? p.dataKey}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: c.text }}>{p.value}</span>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart() {
  const { theme } = useTheme();
  const c = colors(theme);
  const isDark = theme === 'dark';
  const [activeSources, setActiveSources] = useState<Set<SourceKey>>(new Set(['linkedin', 'web', 'maps']));

  function toggleSource(key: SourceKey) {
    setActiveSources((prev) => {
      const next = new Set(prev);
      if (next.has(key) && next.size > 1) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const bgColor = isDark ? '#1C1E27' : '#E4E4E7';

  return (
    <GlassCard
      isDark={isDark}
      style={{
        overflow: 'hidden',
        height: '100%',
        boxSizing: 'border-box' as const,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '14px 20px 8px',
          borderBottom: `1px solid ${c.border}`,
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 2 }}>Lead Quellen</div>
          <div style={{ fontSize: 11, color: c.textMuted }}>nach Herkunft</div>
        </div>
        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {SOURCE_KEYS.map((s) => {
            const label = s.label === 'Google Maps' ? 'Maps' : s.label;
            const isActive = activeSources.has(s.key);
            return (
              <GlassButton
                key={s.key}
                size="sm"
                isDark={isDark}
                onClick={() => toggleSource(s.key)}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  background: isActive ? c.accent : undefined,
                  color: isActive ? '#fff' : c.textMuted,
                  fontFamily: 'var(--font-inter), Inter, sans-serif',
                }}
              >
                {label}
              </GlassButton>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={SOURCES_MONTHLY} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={8}
              axisLine={false}
              tick={{ fontSize: 10, fill: c.textMuted, fontFamily: 'var(--font-inter), Inter, sans-serif' }}
              tickFormatter={(v: string) => v.slice(0, 3)}
            />
            <Tooltip
              cursor={false}
              content={(props) => (
                <SourcesTooltip
                  active={props.active}
                  payload={props.payload as unknown as Array<{ dataKey: string; value: number; color: string }>}
                  label={String(props.label ?? '')}
                  c={c}
                  isDark={isDark}
                />
              )}
            />
            {/* Bottom bar — maps — gets the background rect */}
            <Bar
              stackId="a"
              dataKey="maps"
              barSize={8}
              fill="#EF4444"
              radius={4}
              overflow="visible"
              background={{ fill: bgColor, radius: 4 }}
              shape={(p: object) => (
                <CustomGradientBar
                  {...(p as Parameters<typeof CustomGradientBar>[0])}
                  dataKey="maps"
                  activeSources={activeSources}
                />
              )}
            />
            <Bar
              stackId="a"
              dataKey="web"
              barSize={8}
              fill="#F97316"
              radius={4}
              overflow="visible"
              shape={(p: object) => (
                <CustomGradientBar
                  {...(p as Parameters<typeof CustomGradientBar>[0])}
                  dataKey="web"
                  activeSources={activeSources}
                />
              )}
            />
            <Bar
              stackId="a"
              dataKey="linkedin"
              barSize={8}
              fill="#10B981"
              radius={4}
              overflow="visible"
              shape={(p: object) => (
                <CustomGradientBar
                  {...(p as Parameters<typeof CustomGradientBar>[0])}
                  dataKey="linkedin"
                  activeSources={activeSources}
                />
              )}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 16,
          padding: '12px 20px',
          borderTop: `1px solid ${c.border}`,
          marginTop: 'auto',
          height: 57,
          boxSizing: 'border-box',
        }}
      >
        {SOURCE_KEYS.map((s) => (
          <button
            key={s.key}
            onClick={() => toggleSource(s.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              opacity: activeSources.has(s.key) ? 1 : 0.35,
              transition: 'opacity 120ms ease-out',
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: c.text,
                fontFamily: 'var(--font-inter), Nunity, sans-serif',
              }}
            >
              {s.label}
            </span>
          </button>
        ))}
      </div>
    </GlassCard>
  );
}

// ─── Industry Chart ───────────────────────────────────────────────────────────

function IndustrieTooltip({ isDark, c }: { isDark: boolean; c: ReturnType<typeof colors> }) {
  return function TooltipContent({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ dataKey: string; value: number }>;
    label?: string;
  }) {
    if (!active || !payload?.length) return null;
    return (
      <div
        style={{
          background: isDark ? '#1E2028' : '#fff',
          border: `1px solid ${c.border}`,
          borderRadius: 8,
          padding: '8px 12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
          fontFamily: 'var(--font-inter), Inter, sans-serif',
        }}
      >
        <div style={{ fontSize: 10, color: c.textMuted, fontWeight: 600, marginBottom: 6 }}>{label}</div>
        {payload.map((p) => {
          const cfg = INDUSTRIE_CONFIG[p.dataKey as keyof typeof INDUSTRIE_CONFIG];
          return (
            <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: cfg?.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: c.textMuted }}>{cfg?.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: c.text, marginLeft: 'auto', paddingLeft: 8 }}>
                {p.value}
              </span>
            </div>
          );
        })}
      </div>
    );
  };
}

const INDUSTRIE_DATA = {
  '12M': [
    { period: 'Jun', mode: 22, moebel: 18, elektronik: 14, sport: 10, kueche: 8 },
    { period: 'Jul', mode: 25, moebel: 20, elektronik: 15, sport: 11, kueche: 7 },
    { period: 'Aug', mode: 20, moebel: 22, elektronik: 13, sport: 12, kueche: 9 },
    { period: 'Sep', mode: 28, moebel: 19, elektronik: 16, sport: 10, kueche: 8 },
    { period: 'Okt', mode: 30, moebel: 24, elektronik: 18, sport: 13, kueche: 10 },
    { period: 'Nov', mode: 27, moebel: 21, elektronik: 17, sport: 11, kueche: 9 },
    { period: 'Dez', mode: 35, moebel: 28, elektronik: 20, sport: 14, kueche: 11 },
    { period: 'Jan', mode: 32, moebel: 26, elektronik: 19, sport: 13, kueche: 10 },
    { period: 'Feb', mode: 38, moebel: 30, elektronik: 22, sport: 15, kueche: 12 },
    { period: 'Mär', mode: 40, moebel: 32, elektronik: 24, sport: 16, kueche: 13 },
    { period: 'Apr', mode: 37, moebel: 29, elektronik: 21, sport: 14, kueche: 11 },
    { period: 'Mai', mode: 44, moebel: 35, elektronik: 26, sport: 18, kueche: 14 },
  ],
  '30T': [
    { period: 'KW 1', mode: 10, moebel: 8, elektronik: 6, sport: 4, kueche: 3 },
    { period: 'KW 2', mode: 12, moebel: 9, elektronik: 7, sport: 5, kueche: 4 },
    { period: 'KW 3', mode: 11, moebel: 10, elektronik: 6, sport: 4, kueche: 3 },
    { period: 'KW 4', mode: 14, moebel: 11, elektronik: 8, sport: 6, kueche: 4 },
  ],
  '7T': [
    { period: 'Mo', mode: 4, moebel: 3, elektronik: 2, sport: 2, kueche: 1 },
    { period: 'Di', mode: 5, moebel: 4, elektronik: 3, sport: 2, kueche: 1 },
    { period: 'Mi', mode: 3, moebel: 3, elektronik: 2, sport: 1, kueche: 1 },
    { period: 'Do', mode: 6, moebel: 4, elektronik: 3, sport: 2, kueche: 2 },
    { period: 'Fr', mode: 7, moebel: 5, elektronik: 4, sport: 3, kueche: 2 },
    { period: 'Sa', mode: 2, moebel: 2, elektronik: 1, sport: 1, kueche: 1 },
    { period: 'So', mode: 1, moebel: 1, elektronik: 1, sport: 1, kueche: 0 },
  ],
} as const;
type IndustriePeriod = keyof typeof INDUSTRIE_DATA;

const INDUSTRIE_CONFIG = {
  mode: { label: 'Mode', color: '#10B981' },
  moebel: { label: 'Möbel', color: '#F97316' },
  elektronik: { label: 'Elektronik', color: '#EF4444' },
  sport: { label: 'Sport', color: '#6366F1' },
  kueche: { label: 'Küche', color: '#F59E0B' },
};

function IndustrieChart() {
  const { theme } = useTheme();
  const c = colors(theme);
  const isDark = theme === 'dark';
  const [period, setPeriod] = useState<IndustriePeriod>('12M');
  const [visible, setVisible] = useState(true);
  const PERIODS: IndustriePeriod[] = ['7T', '30T', '12M'];

  function switchPeriod(p: IndustriePeriod) {
    if (p === period) return;
    setVisible(false);
    setTimeout(() => {
      setPeriod(p);
      setVisible(true);
    }, 160);
  }

  const gridColor = isDark ? '#242630' : '#F0F0F0';

  return (
    <GlassCard
      isDark={isDark}
      style={{
        overflow: 'hidden',
        height: '100%',
        boxSizing: 'border-box' as const,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '14px 20px 8px',
          borderBottom: `1px solid ${c.border}`,
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 2 }}>Top Industrien</div>
          <div style={{ fontSize: 11, color: c.textMuted }}>Leads nach Branche</div>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {PERIODS.map((p) => (
            <PeriodButton
              key={p}
              label={p}
              active={period === p}
              onClick={() => switchPeriod(p)}
              c={c}
              isDark={isDark}
            />
          ))}
        </div>
      </div>

      {/* Chart */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 180ms ease-out, transform 180ms ease-out',
        }}
      >
        <ChartContainer config={INDUSTRIE_CONFIG} className="h-full w-full">
          <AreaChart data={[...INDUSTRIE_DATA[period]]} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
            <defs>
              {Object.entries(INDUSTRIE_CONFIG).map(([key, cfg]) => (
                <linearGradient key={key} id={`ig-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={cfg.color} stopOpacity={0.5} />
                  <stop offset="95%" stopColor={cfg.color} stopOpacity={0.05} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="4 8" stroke={gridColor} horizontal vertical={false} />
            <XAxis
              dataKey="period"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: c.textMuted, fontFamily: 'var(--font-inter), Inter, sans-serif' }}
              tickMargin={8}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: gridColor }}
              content={IndustrieTooltip({ isDark, c }) as any}
            />
            {Object.entries(INDUSTRIE_CONFIG).map(([key, cfg]) => (
              <Area
                key={key}
                dataKey={key}
                type="natural"
                stackId="a"
                stroke={cfg.color}
                strokeWidth={1.5}
                fill={`url(#ig-${key})`}
                fillOpacity={1}
                dot={false}
                activeDot={{ r: 4, fill: cfg.color, stroke: c.bgCard, strokeWidth: 2 }}
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignContent: 'center',
          gap: '6px 16px',
          padding: '12px 20px',
          borderTop: `1px solid ${c.border}`,
          marginTop: 'auto',
          height: 57,
          boxSizing: 'border-box',
        }}
      >
        {Object.entries(INDUSTRIE_CONFIG).map(([, cfg]) => (
          <div key={cfg.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: cfg.color, flexShrink: 0 }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: c.text }}>{cfg.label}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const size = 42;
  const r = 17;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#F97316' : '#EF4444';

  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={3} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeDasharray={`${fill} ${circ - fill}`}
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

// ─── Lead Row — Emil Kowalski press scale ─────────────────────────────────────

function LeadRow({
  lead,
  isLast,
  c,
  isDark,
}: {
  lead: (typeof TOP_LEADS)[0];
  isLast: boolean;
  c: ReturnType<typeof colors>;
  isDark: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const sc = STATUS_COLORS[lead.status] ?? STATUS_COLORS.cold;

  return (
    <Link
      href={`/intelligence/leads/${lead.id}`}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '15px 0',
        borderBottom: !isLast ? `1px solid ${c.border}` : 'none',
        textDecoration: 'none',
        transition: 'transform 80ms ease-out, opacity 120ms ease-out',
        transform: pressed ? 'scale(0.985)' : 'scale(1)',
        opacity: hovered && !pressed ? 0.78 : 1,
        cursor: 'pointer',
      }}
    >
      <ScoreRing score={lead.score} />

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
          {lead.name}
        </div>
        <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>
          {lead.city} · {lead.industry}
        </div>
      </div>

      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          padding: '3px 10px',
          borderRadius: 99,
          flexShrink: 0,
          background: isDark
            ? lead.status === 'hot'
              ? 'rgba(239,68,68,0.12)'
              : lead.status === 'warm'
                ? 'rgba(249,115,22,0.12)'
                : 'rgba(255,255,255,0.06)'
            : sc.bg,
          color: isDark
            ? lead.status === 'hot'
              ? '#FCA5A5'
              : lead.status === 'warm'
                ? '#FDBA74'
                : '#9CA3AF'
            : sc.text,
        }}
      >
        {sc.label}
      </span>

      <div
        style={{
          fontSize: 11,
          color: c.textSub,
          fontWeight: 600,
          width: 120,
          flexShrink: 0,
          textAlign: 'right',
        }}
      >
        {lead.signal}
      </div>

      <div
        title={lead.assignee}
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: ASSIGNEE_COLORS[lead.assignee] ?? '#059669',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 9,
          fontWeight: 800,
          color: '#fff',
          flexShrink: 0,
        }}
      >
        {lead.assignee}
      </div>
    </Link>
  );
}

// ─── Top Leads — open section, no card background ─────────────────────────────

function TopLeadsTable() {
  const { theme } = useTheme();
  const c = colors(theme);
  const isDark = theme === 'dark';

  return (
    <GlassCard isDark={isDark} style={{ overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '14px 20px 8px',
          borderBottom: `1px solid ${c.border}`,
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: c.text }}>Top Leads</div>
          <div style={{ fontSize: 11, color: c.textMuted, marginTop: 3 }}>Nach Score sortiert</div>
        </div>
        <Link
          href="/intelligence/leads"
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.5')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
          style={{ color: c.textMuted, transition: 'opacity 100ms ease-out', lineHeight: 1 }}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path
              d="M3 12L12 3M12 3H6M12 3V9"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
      <div style={{ padding: '0 20px' }}>
        {TOP_LEADS.map((lead, i) => (
          <LeadRow key={lead.id} lead={lead} isLast={i === TOP_LEADS.length - 1} c={c} isDark={isDark} />
        ))}
      </div>
    </GlassCard>
  );
}

// ─── Activity Feed — open section, no card background ────────────────────────

function ActivityFeed() {
  const { theme } = useTheme();
  const c = colors(theme);

  return (
    <GlassCard isDark={theme === 'dark'} style={{ overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '14px 20px 8px',
          borderBottom: `1px solid ${c.border}`,
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: c.text }}>Letzte Aktivitäten</div>
          <div style={{ fontSize: 11, color: c.textMuted, marginTop: 3 }}>Echtzeit-Signal-Feed</div>
        </div>
        <a
          href="/intelligence/aktivitaeten"
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.5')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
          style={{ color: c.textMuted, transition: 'opacity 100ms ease-out', lineHeight: 1 }}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path
              d="M3 12L12 3M12 3H6M12 3V9"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>
      <div style={{ padding: '0 20px' }}>
        {ACTIVITIES.slice(0, 5).map((a, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              minHeight: 72,
              boxSizing: 'border-box',
              padding: '15px 0',
              borderBottom: i < 4 ? `1px solid ${c.border}` : 'none',
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: a.dot,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{a.title}</div>
              <div style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>{a.body}</div>
            </div>
            <div style={{ fontSize: 11, color: c.textMuted, flexShrink: 0, marginTop: 1 }}>{a.time}</div>
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
  const user = useUser();
  const mounted = useMounted();

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
        fontFamily: 'var(--font-inter), Inter, sans-serif',
        minHeight: '100%',
      }}
    >
      <GlassPageFilters />
      {/* Greeting */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 40,
            fontWeight: 800,
            color: c.text,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
          }}
        >
          {mounted ? (user?.firstName ? `Hey, ${user.firstName}` : 'Hey') : ' '}
        </div>
        {mounted && (
          <div style={{ fontSize: 14, color: c.textMuted, marginTop: 8 }}>{today} · 84 neue Leads diese Woche</div>
        )}
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 16,
        }}
      >
        {KPI.map((k, i) => (
          <KpiItem key={k.label} {...k} index={i} total={KPI.length} />
        ))}
      </div>

      {/* Charts — 2×2 equal grid, fixed row height so FunnelChart can measure itself */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '320px 320px',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <SalesFunnelCard />
        <IndustrieChart />
        <LeadsChart />
        <DonutChart />
      </div>

      {/* Bottom — table + feed */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <TopLeadsTable />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
