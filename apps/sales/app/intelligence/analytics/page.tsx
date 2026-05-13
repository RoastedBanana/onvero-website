'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Pie, PieChart, Cell } from 'recharts';
import { GlobeAnalytics } from '@/components/ui/cobe-globe-analytics';
import { FunnelChart } from '@/components/ui/funnel-chart';
import { useTheme, colors } from '../layout';

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(0);
  const frame = useRef<number>(0);
  const start = useRef<number | null>(null);
  useEffect(() => {
    start.current = null;
    function step(ts: number) {
      if (start.current === null) start.current = ts;
      const elapsed = ts - start.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) frame.current = requestAnimationFrame(step);
    }
    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration]);
  return value;
}

function AnimatedNum({ v }: { v: number }) {
  const c = useCountUp(v);
  return <>{c >= 1000 ? c.toLocaleString('de-DE') : c}</>;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const KPI_DATA = [
  {
    label: 'Leads identifiziert',
    value: 1247,
    suffix: '',
    sub: '834 angereichert',
    color: '#4F46E5',
    bg: '#EEF0FF',
    trend: '▲ +12% diese Woche',
  },
  {
    label: 'Neu diese Woche',
    value: 84,
    suffix: '',
    sub: 'Höchster Wert bisher',
    color: '#059669',
    bg: '#ECFDF5',
    trend: '▲ KW 29 Rekord',
  },
  {
    label: 'Hot Leads',
    value: 89,
    suffix: '',
    sub: '7,1% der Pipeline',
    color: '#DC2626',
    bg: '#FEF2F2',
    trend: '▲ +23 neue heute',
  },
  {
    label: 'Ø Score',
    value: 73,
    suffix: '',
    sub: 'von 100 Punkten',
    color: '#D97706',
    bg: '#FFFBEB',
    trend: '▲ +4 vs. Vormonat',
  },
];

const WEEKLY = [
  { week: 'KW 18', leads: 34, hot: 4, qualified: 11, converted: 3 },
  { week: 'KW 19', leads: 52, hot: 7, qualified: 17, converted: 4 },
  { week: 'KW 20', leads: 41, hot: 5, qualified: 14, converted: 3 },
  { week: 'KW 21', leads: 78, hot: 11, qualified: 26, converted: 7 },
  { week: 'KW 22', leads: 65, hot: 9, qualified: 22, converted: 5 },
  { week: 'KW 23', leads: 44, hot: 5, qualified: 15, converted: 4 },
  { week: 'KW 24', leads: 91, hot: 13, qualified: 30, converted: 8 },
  { week: 'KW 25', leads: 68, hot: 10, qualified: 23, converted: 6 },
  { week: 'KW 26', leads: 55, hot: 7, qualified: 19, converted: 4 },
  { week: 'KW 27', leads: 82, hot: 11, qualified: 28, converted: 7 },
  { week: 'KW 28', leads: 73, hot: 9, qualified: 25, converted: 6 },
  { week: 'KW 29', leads: 84, hot: 12, qualified: 29, converted: 8 },
];

type WeeklyKey = 'leads' | 'hot' | 'qualified' | 'converted';

const WEEKLY_METRICS: { key: WeeklyKey; label: string; color: string; current: number; previous: number }[] = [
  { key: 'leads', label: 'Leads gesamt', color: '#4F46E5', current: 84, previous: 73 },
  { key: 'hot', label: 'Hot Leads', color: '#DC2626', current: 12, previous: 9 },
  { key: 'qualified', label: 'Qualifiziert', color: '#7C3AED', current: 29, previous: 25 },
  { key: 'converted', label: 'Abschlüsse', color: '#059669', current: 8, previous: 6 },
];

const DACH_CITIES = [
  { name: 'München', x: 197, y: 315, leads: 201, hot: 31 },
  { name: 'Berlin', x: 258, y: 123, leads: 187, hot: 22 },
  { name: 'Frankfurt', x: 98, y: 228, leads: 178, hot: 24 },
  { name: 'Hamburg', x: 142, y: 79, leads: 143, hot: 17 },
  { name: 'Köln', x: 38, y: 194, leads: 134, hot: 15 },
  { name: 'Stuttgart', x: 116, y: 284, leads: 98, hot: 12 },
  { name: 'Düsseldorf', x: 34, y: 181, leads: 89, hot: 10 },
  { name: 'Nürnberg', x: 179, y: 255, leads: 88, hot: 9 },
  { name: 'Leipzig', x: 222, y: 176, leads: 67, hot: 7 },
  { name: 'Dresden', x: 266, y: 189, leads: 67, hot: 8 },
  { name: 'Wien', x: 358, y: 310, leads: 76, hot: 11 },
  { name: 'Zürich', x: 93, y: 347, leads: 45, hot: 6 },
];

type CityPeriod = { leads: number; trend: number };
type Period = 'week' | 'month' | 'year';

const CITY_PERIOD_DATA: Record<string, Record<Period, CityPeriod>> = {
  München: { week: { leads: 48, trend: 12 }, month: { leads: 201, trend: 31 }, year: { leads: 2340, trend: 18 } },
  Berlin: { week: { leads: 41, trend: 8 }, month: { leads: 187, trend: 22 }, year: { leads: 2180, trend: 14 } },
  Frankfurt: { week: { leads: 38, trend: 9 }, month: { leads: 178, trend: -8 }, year: { leads: 1920, trend: 21 } },
  Hamburg: { week: { leads: 31, trend: -5 }, month: { leads: 143, trend: 17 }, year: { leads: 1680, trend: -4 } },
  Köln: { week: { leads: 28, trend: 6 }, month: { leads: 134, trend: -12 }, year: { leads: 1540, trend: 9 } },
  Stuttgart: { week: { leads: 18, trend: -4 }, month: { leads: 98, trend: -6 }, year: { leads: 1120, trend: 8 } },
  Düsseldorf: { week: { leads: 14, trend: -7 }, month: { leads: 89, trend: 10 }, year: { leads: 980, trend: -9 } },
  Wien: { week: { leads: 19, trend: 3 }, month: { leads: 76, trend: 11 }, year: { leads: 890, trend: 7 } },
  Zürich: { week: { leads: 11, trend: -3 }, month: { leads: 45, trend: -5 }, year: { leads: 520, trend: 4 } },
};

const GLOBE_LOC: Record<string, [number, number]> = {
  München: [48.14, 11.58],
  Berlin: [52.52, 13.41],
  Frankfurt: [50.11, 8.68],
  Hamburg: [53.55, 10.0],
  Köln: [50.94, 6.96],
  Wien: [48.21, 16.37],
  Zürich: [47.38, 8.54],
};

const INTENT_SIGNALS = [
  {
    company: 'Fashion House GmbH',
    signal: 'Sucht "Head of Logistics" auf LinkedIn',
    detail:
      'Stellenausschreibung seit 3 Tagen aktiv. Anforderungen: Erfahrung mit Paketversand-Dienstleistern, Kenntnisse in TMS-Systemen. Deutet auf Neuaufstellung der Versandstrategie hin.',
    type: 'job' as const,
    source: 'LinkedIn Jobs',
    sourceUrl: 'linkedin.com/jobs',
    time: 'vor 2h',
    score: 91,
    fresh: true,
  },
  {
    company: 'SportGear Online',
    signal: '2 negative Carrier-Reviews in 48h veröffentlicht',
    detail:
      'Kunden berichten über Lieferverzögerungen von 5–8 Tagen und fehlende Sendungsverfolgung. Bewertungen: 1★ und 2★. Aktueller NPS-Schnitt fällt auf 3,1.',
    type: 'churn' as const,
    source: 'Trustpilot',
    sourceUrl: 'trustpilot.com',
    time: 'vor 5h',
    score: 85,
    fresh: true,
  },
  {
    company: 'TechDirect GmbH',
    signal: 'Series A Funding abgeschlossen — 4,2 Mio. €',
    detail:
      'Lead-Investor: Bayern Kapital. Verwendungszweck laut Pressemitteilung: Lagerausbau und Internationalisierung in DACH. Gründer kommentiert "Fulfillment ist unser nächster Fokus".',
    type: 'funding' as const,
    source: 'Crunchbase',
    sourceUrl: 'crunchbase.com',
    time: 'gestern',
    score: 79,
    fresh: false,
  },
  {
    company: 'BikeShop Nord',
    signal: 'Neues Lager in Hamburg-Billbrook eröffnet',
    detail:
      '1.200 qm neue Fläche laut Gewerbeanmeldung. Aktuell kein Logistikdienstleister gelistet. Expansion aus Berlin nach Hamburg deutet auf Wachstum im Norddeutschland-Geschäft hin.',
    type: 'expansion' as const,
    source: 'Handelsregister',
    sourceUrl: 'handelsregister.de',
    time: 'gestern',
    score: 61,
    fresh: false,
  },
  {
    company: 'PetStore24',
    signal: 'Organischer Traffic +180% im Vergleich zum Vormonat',
    detail:
      'Laut Similarweb-Daten stieg der monatliche Traffic von 42k auf 118k Besucher. Gleichzeitig wurde ein neues Produktsortiment (Tiernahrung Großgebinde) gelauncht — Versandvolumen dürfte stark steigen.',
    type: 'growth' as const,
    source: 'Similarweb',
    sourceUrl: 'similarweb.com',
    time: 'vor 3 Tagen',
    score: 58,
    fresh: false,
  },
];

const INTENT_META = {
  job: { label: 'Job', color: '#7C3AED', bg: '#F5F3FF' },
  funding: { label: 'Funding', color: '#059669', bg: '#ECFDF5' },
  expansion: { label: 'Expansion', color: '#0891B2', bg: '#ECFEFF' },
  churn: { label: 'Abwanderung', color: '#DC2626', bg: '#FEF2F2' },
  growth: { label: 'Wachstum', color: '#D97706', bg: '#FFFBEB' },
};

const LAYER_BARS = [
  { id: 1, label: 'Identifikation', pct: 98, filled: 1221, color: '#4F46E5', bg: '#EEF0FF' },
  { id: 2, label: 'Firmendaten', pct: 67, filled: 835, color: '#0891B2', bg: '#ECFEFF' },
  { id: 3, label: 'Technologie', pct: 41, filled: 511, color: '#7C3AED', bg: '#F5F3FF' },
  { id: 4, label: 'Kaufsignale', pct: 18, filled: 224, color: '#DB2777', bg: '#FDF2F8' },
];

const HOT_LEADS_DATA = [
  {
    id: '1',
    name: 'Fashion House GmbH',
    initials: 'FH',
    color: '#4F46E5',
    system: 'Shopware',
    score: 91,
    status: 'hot' as const,
  },
  {
    id: '2',
    name: 'SportGear Online',
    initials: 'SO',
    color: '#0891B2',
    system: 'Shopify',
    score: 85,
    status: 'hot' as const,
  },
  {
    id: '3',
    name: 'TechDirect GmbH',
    initials: 'TD',
    color: '#7C3AED',
    system: 'WooCommerce',
    score: 79,
    status: 'warm' as const,
  },
  { id: '4', name: 'HomeStyle24', initials: 'HS', color: '#059669', system: 'JTL', score: 74, status: 'warm' as const },
  {
    id: '5',
    name: 'BabyWorld Store',
    initials: 'BW',
    color: '#D97706',
    system: 'Shopware',
    score: 68,
    status: 'warm' as const,
  },
];

const PIPELINE = [
  { label: 'Entdeckt', value: 2847, color: '#E0E7FF' },
  { label: 'Importiert', value: 1247, color: '#C7D2FE' },
  { label: 'Angereichert', value: 834, color: '#818CF8' },
  { label: 'Gescored', value: 421, color: '#6366F1' },
  { label: 'Hot', value: 89, color: '#4F46E5' },
];

const STATUS_META = {
  hot: { label: 'Hot', bg: '#FEF2F2', color: '#DC2626' },
  warm: { label: 'Warm', bg: '#FFFBEB', color: '#D97706' },
};

// ─── Color token type ─────────────────────────────────────────────────────────

type ColorTokens = ReturnType<typeof colors>;

// ─── Sub-components ───────────────────────────────────────────────────────────

interface WeeklyTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  metric: (typeof WEEKLY_METRICS)[number];
  c: ColorTokens;
}

function WeeklyTooltip({ active, payload, label, metric, c }: WeeklyTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: c.bgCard,
        border: `1px solid ${c.border}`,
        borderRadius: 8,
        padding: '7px 11px',
        boxShadow: '0 4px 16px rgba(10,37,64,0.10)',
        fontFamily: 'var(--font-inter),sans-serif',
        pointerEvents: 'none',
      }}
    >
      <div style={{ fontSize: 10, color: c.textMuted, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: metric.color }}>
        {payload[0].value} {metric.label}
      </div>
    </div>
  );
}

function ScoreRing({ value, color, label, c }: { value: number; color: string; label: string; c: ColorTokens }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - value / 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: 68, height: 68 }}>
        <svg width="68" height="68" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="34" cy="34" r={r} fill="none" stroke={c.border} strokeWidth="5" />
          <circle
            cx="34"
            cy="34"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div
          style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <span style={{ fontSize: 16, fontWeight: 800, color: c.text }}>{value}</span>
        </div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: c.textMuted }}>{label}</div>
    </div>
  );
}

// ─── Widget content renderers ─────────────────────────────────────────────────

function KpiContent({ c }: { c: ColorTokens }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      {KPI_DATA.map((card) => (
        <div
          key={card.label}
          style={{ background: c.bgPage, border: `1px solid ${c.border}`, borderRadius: 10, padding: '14px 16px' }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: c.textMuted,
              marginBottom: 4,
            }}
          >
            {card.label}
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: c.text, lineHeight: 1.1 }}>
            <AnimatedNum v={card.value} />
          </div>
          <div style={{ fontSize: 11, color: c.textSub, marginTop: 2 }}>{card.sub}</div>
          <div
            style={{
              marginTop: 6,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: card.bg,
              color: card.color,
              borderRadius: 5,
              padding: '2px 7px',
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            {card.trend}
          </div>
        </div>
      ))}
    </div>
  );
}

function DachMapContent({ c }: { c: ColorTokens }) {
  const [period, setPeriod] = useState<Period>('month');
  const [expanded, setExpanded] = useState(false);
  const cities = Object.entries(CITY_PERIOD_DATA)
    .map(([name, data]) => ({ name, ...data[period] }))
    .sort((a, b) => b.leads - a.leads);

  const maxLeads = cities[0]?.leads ?? 1;
  const totalLeads = cities.reduce((s, c) => s + c.leads, 0);

  const globeMarkers = Object.entries(CITY_PERIOD_DATA)
    .filter(([name]) => GLOBE_LOC[name])
    .map(([name, data]) => ({
      id: name.toLowerCase(),
      label: name,
      location: GLOBE_LOC[name],
      visitors: data[period].leads,
      trend: data[period].trend,
    }));

  const PERIOD_LABELS: Record<Period, string> = { week: '1W', month: '1M', year: '1J' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Period selector + globe */}
      <div style={{ position: 'relative' }}>
        {/* Period tabs — top-left */}
        <div
          style={{
            display: 'flex',
            gap: 2,
            background: c.bgPage,
            borderRadius: 8,
            padding: 3,
            width: 'fit-content',
            marginBottom: 10,
          }}
        >
          {(['week', 'month', 'year'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                padding: '4px 11px',
                fontSize: 11,
                fontWeight: 700,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                background: period === p ? c.bgCard : 'transparent',
                color: period === p ? c.text : c.textMuted,
                boxShadow: period === p ? '0 1px 3px rgba(10,37,64,0.10)' : 'none',
                fontFamily: 'var(--font-inter),sans-serif',
                transition: 'all 0.12s',
              }}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Globe — centered, full width, gradient bg like original */}
        <div
          style={{
            background: 'linear-gradient(145deg,#F5F7FF 0%,#EEF0FF 100%)',
            borderRadius: 12,
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <GlobeAnalytics markers={globeMarkers} className="w-full max-w-[260px]" speed={0.004} />
        </div>
      </div>

      {/* Lead table */}
      <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${c.border}` }}>
        {/* Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 110px 72px',
            padding: '8px 14px',
            background: c.bgPage,
            borderBottom: `1px solid ${c.border}`,
            gap: 8,
            alignItems: 'flex-end',
          }}
        >
          {[
            { label: 'Stadt', align: 'left' as const },
            { label: 'Leads', align: 'right' as const },
            { label: 'Veränd.', align: 'right' as const },
          ].map((col) => (
            <div key={col.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: c.textMuted,
                  fontFamily: 'var(--font-inter),sans-serif',
                  textAlign: col.align,
                  display: 'block',
                }}
              >
                {col.label}
              </span>
              <div style={{ height: 2, background: c.border, borderRadius: 99 }}>
                <div style={{ height: '100%', width: '100%', background: '#4F46E5', borderRadius: 99, opacity: 0.2 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Rows */}
        {(expanded ? cities : cities.slice(0, 4)).map((city) => {
          const pct = Math.round((city.leads / maxLeads) * 100);
          const up = city.trend >= 0;
          return (
            <div
              key={city.name}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 110px 72px',
                padding: '8px 14px',
                gap: 8,
                borderBottom: `1px solid ${c.bgPage}`,
                alignItems: 'center',
                background: c.bgCard,
              }}
            >
              {/* Stadt */}
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: c.text,
                  fontFamily: 'var(--font-inter),sans-serif',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {city.name}
              </span>

              {/* Leads + inline bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: '#4F46E5',
                    fontFamily: 'var(--font-inter),sans-serif',
                    flexShrink: 0,
                  }}
                >
                  {city.leads}
                </span>
                <div style={{ width: 48, height: 3, background: c.bgPage, borderRadius: 99, flexShrink: 0 }}>
                  <div
                    style={{ height: '100%', width: `${pct}%`, background: '#4F46E5', borderRadius: 99, opacity: 0.45 }}
                  />
                </div>
              </div>

              {/* Trend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                {up ? <TrendingUp size={11} color="#059669" /> : <TrendingDown size={11} color="#DC2626" />}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: up ? '#059669' : '#DC2626',
                    fontFamily: 'var(--font-inter),sans-serif',
                  }}
                >
                  {up ? '+' : ''}
                  {city.trend}%
                </span>
              </div>
            </div>
          );
        })}

        {/* Expand / collapse */}
        {cities.length > 4 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              width: '100%',
              padding: '7px 14px',
              background: c.bgPage,
              border: 'none',
              borderTop: `1px solid ${c.border}`,
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 700,
              color: c.accent,
              fontFamily: 'var(--font-inter),sans-serif',
              textAlign: 'center',
            }}
          >
            {expanded ? 'Weniger anzeigen' : `+${cities.length - 4} weitere Städte`}
          </button>
        )}

        {/* Footer */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 110px 72px',
            padding: '8px 14px',
            background: c.bgPage,
            borderTop: `1px solid ${c.border}`,
            gap: 8,
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: c.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontFamily: 'var(--font-inter),sans-serif',
            }}
          >
            Gesamt
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: c.text,
              fontFamily: 'var(--font-inter),sans-serif',
              textAlign: 'right',
              paddingRight: 56,
            }}
          >
            {totalLeads}
          </span>
          <div />
        </div>
      </div>
    </div>
  );
}

function WeeklyChartContent({ c }: { c: ColorTokens }) {
  const [selected, setSelected] = useState<WeeklyKey>('leads');
  const metric = WEEKLY_METRICS.find((m) => m.key === selected)!;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 2×2 metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {WEEKLY_METRICS.map((m) => {
          const pct = ((m.current - m.previous) / m.previous) * 100;
          const up = pct >= 0;
          const active = selected === m.key;
          return (
            <button
              key={m.key}
              onClick={() => setSelected(m.key)}
              style={{
                background: active ? c.bgPage : c.bgCard,
                border: `1px solid ${active ? c.borderStrong : c.border}`,
                borderRadius: 10,
                padding: '10px 11px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.12s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: c.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontFamily: 'var(--font-inter),sans-serif',
                  }}
                >
                  {m.label}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: up ? '#059669' : '#DC2626',
                    background: up ? '#ECFDF5' : '#FEF2F2',
                    padding: '2px 5px',
                    borderRadius: 99,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    fontFamily: 'var(--font-inter),sans-serif',
                  }}
                >
                  {up ? <ArrowUp size={8} strokeWidth={3} /> : <ArrowDown size={8} strokeWidth={3} />}
                  {Math.abs(pct).toFixed(0)}%
                </span>
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: active ? m.color : c.text,
                  lineHeight: 1,
                  fontFamily: 'var(--font-inter),sans-serif',
                }}
              >
                {m.current}
              </div>
              <div
                style={{ fontSize: 10, color: c.textMuted, marginTop: 3, fontFamily: 'var(--font-inter),sans-serif' }}
              >
                Vorwoche: {m.previous}
              </div>
            </button>
          );
        })}
      </div>

      {/* Line chart */}
      <div style={{ height: 130 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={WEEKLY} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
            <XAxis
              dataKey="week"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: c.textMuted, fontFamily: 'var(--font-inter),sans-serif' }}
              tickMargin={6}
              interval={2}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: c.textMuted, fontFamily: 'var(--font-inter),sans-serif' }}
              tickCount={4}
            />
            <Tooltip
              content={(props) => <WeeklyTooltip {...(props as unknown as WeeklyTooltipProps)} metric={metric} c={c} />}
              cursor={{ strokeDasharray: '3 3', stroke: '#E0E7FF' }}
            />
            <Line
              type="monotone"
              dataKey={selected}
              stroke={metric.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: metric.color, stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function IntentFeedContent({ c }: { c: ColorTokens }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {INTENT_SIGNALS.slice(0, 3).map((sig) => {
        const meta = INTENT_META[sig.type];
        const initials = sig.company
          .split(' ')
          .slice(0, 2)
          .map((w) => w[0])
          .join('');
        const scoreColor = sig.score >= 85 ? '#DC2626' : sig.score >= 70 ? '#D97706' : c.textMuted;

        return (
          <div
            key={sig.company}
            style={{
              display: 'flex',
              gap: 0,
              borderRadius: 10,
              border: `1px solid ${c.border}`,
              overflow: 'hidden',
              background: c.bgCard,
            }}
          >
            {/* Left accent bar */}
            <div style={{ width: 3, background: meta.color, flexShrink: 0 }} />

            <div style={{ flex: 1, padding: '12px 14px', minWidth: 0 }}>
              {/* Top row: avatar + company + score */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
                {/* Avatar */}
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: c.bgPage,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 10,
                    fontWeight: 800,
                    color: c.textMuted,
                    fontFamily: 'var(--font-inter),sans-serif',
                  }}
                >
                  {initials}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: c.text,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontFamily: 'var(--font-inter),sans-serif',
                      }}
                    >
                      {sig.company}
                    </span>
                    {sig.fresh && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: '#059669',
                            display: 'inline-block',
                          }}
                        />
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: '#059669',
                            fontFamily: 'var(--font-inter),sans-serif',
                          }}
                        >
                          Neu
                        </span>
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: c.textMuted,
                      marginTop: 1,
                      fontFamily: 'var(--font-inter),sans-serif',
                    }}
                  >
                    {sig.time}
                  </div>
                </div>

                {/* Score badge */}
                <div
                  style={{
                    flexShrink: 0,
                    fontSize: 17,
                    fontWeight: 800,
                    color: scoreColor,
                    fontFamily: 'var(--font-inter),sans-serif',
                    lineHeight: 1,
                  }}
                >
                  {sig.score}
                </div>
              </div>

              {/* Signal headline */}
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: c.text,
                  marginBottom: 5,
                  fontFamily: 'var(--font-inter),sans-serif',
                }}
              >
                {sig.signal}
              </div>

              {/* Detail text */}
              <div
                style={{
                  fontSize: 11,
                  color: c.textSub,
                  lineHeight: 1.55,
                  marginBottom: 9,
                  fontFamily: 'var(--font-inter),sans-serif',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {sig.detail}
              </div>

              {/* Footer: type pill + source */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    padding: '2px 8px',
                    background: meta.bg,
                    color: meta.color,
                    borderRadius: 5,
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: 'var(--font-inter),sans-serif',
                  }}
                >
                  {meta.label}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: c.textMuted,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    fontFamily: 'var(--font-inter),sans-serif',
                  }}
                >
                  Quelle:&nbsp;
                  <span style={{ fontWeight: 700, color: c.textMuted }}>{sig.source}</span>
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{ opacity: 0.5 }}>
                    <path
                      d="M1.5 7.5L7.5 1.5M7.5 1.5H3.5M7.5 1.5V5.5"
                      stroke={c.textMuted}
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Bottom link */}
      <a
        href="/intelligence/intent"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '9px 14px',
          background: c.bgPage,
          border: `1px solid ${c.border}`,
          borderRadius: 9,
          textDecoration: 'none',
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: c.accent,
            fontFamily: 'var(--font-inter),sans-serif',
          }}
        >
          Alle Signale anzeigen
        </span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M3 7h8M7 3l4 4-4 4"
            stroke={c.accent}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>
    </div>
  );
}

function LayerCoverageContent({ c }: { c: ColorTokens }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {LAYER_BARS.map((layer) => (
        <div key={layer.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: c.text }}>{layer.label}</span>
            </div>
            <span style={{ fontSize: 17, fontWeight: 800, color: layer.color }}>{layer.pct}%</span>
          </div>
          <div style={{ height: 6, background: c.bgPage, borderRadius: 99, marginBottom: 4 }}>
            <div style={{ height: '100%', width: `${layer.pct}%`, background: layer.color, borderRadius: 99 }} />
          </div>
          <div style={{ fontSize: 11, color: c.textMuted }}>{layer.filled.toLocaleString('de-DE')} von 1.247 Leads</div>
        </div>
      ))}
    </div>
  );
}

function HotLeadsContent({ c }: { c: ColorTokens }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {HOT_LEADS_DATA.map((lead, i) => {
        const sm = STATUS_META[lead.status];
        return (
          <Link
            key={lead.id}
            href={`/intelligence/leads/${lead.id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 8px',
              borderRadius: 9,
              borderBottom: i < HOT_LEADS_DATA.length - 1 ? `1px solid ${c.bgPage}` : 'none',
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = c.bgHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            {/* Rank */}
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: c.textMuted,
                width: 14,
                textAlign: 'right',
                flexShrink: 0,
              }}
            >
              {i + 1}
            </span>

            {/* Avatar */}
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: lead.color + '18',
                border: `1.5px solid ${lead.color}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: 11,
                fontWeight: 800,
                color: lead.color,
                fontFamily: 'var(--font-inter),sans-serif',
                letterSpacing: '0.02em',
              }}
            >
              {lead.initials}
            </div>

            {/* Name + system */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: c.text,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {lead.name}
              </div>
              <div style={{ fontSize: 11, color: c.textMuted, marginTop: 1 }}>{lead.system}</div>
            </div>

            {/* Status pill */}
            <span
              style={{
                padding: '2px 8px',
                background: sm.bg,
                color: sm.color,
                borderRadius: 5,
                fontSize: 10,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {sm.label}
            </span>

            {/* Score */}
            <span
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: lead.score >= 80 ? '#DC2626' : '#D97706',
                minWidth: 30,
                textAlign: 'right',
                flexShrink: 0,
              }}
            >
              {lead.score}
            </span>

            {/* Chevron */}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, opacity: 0.3 }}>
              <path d="M4 2l4 4-4 4" stroke={c.text} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        );
      })}
    </div>
  );
}

const FUNNEL_DATA = [
  {
    label: 'Entdeckt',
    value: 2847,
    displayValue: '2.847',
    detail: 'Unternehmen im DACH-Markt identifiziert',
    convLabel: 'Ausgangspunkt',
    color: '#4F46E5',
    gradient: [
      { offset: '0%', color: '#E0E7FF' },
      { offset: '100%', color: '#C7D2FE' },
    ],
  },
  {
    label: 'Importiert',
    value: 1247,
    displayValue: '1.247',
    detail: 'In die Lead-Datenbank übernommen und dedupliziert',
    convLabel: 'von Entdeckt',
    color: '#6366F1',
    gradient: [
      { offset: '0%', color: '#C7D2FE' },
      { offset: '100%', color: '#A5B4FC' },
    ],
  },
  {
    label: 'Angereichert',
    value: 834,
    displayValue: '834',
    detail: 'Mit Firmendaten & Technologie-Infos angereichert',
    convLabel: 'von Importiert',
    color: '#818CF8',
    gradient: [
      { offset: '0%', color: '#A5B4FC' },
      { offset: '100%', color: '#818CF8' },
    ],
  },
  {
    label: 'Gescored',
    value: 421,
    displayValue: '421',
    detail: 'KI-Score berechnet — Fit, Volumen & Timing bewertet',
    convLabel: 'von Angereichert',
    color: '#4F46E5',
    gradient: [
      { offset: '0%', color: '#818CF8' },
      { offset: '100%', color: '#6366F1' },
    ],
  },
  {
    label: 'Hot',
    value: 89,
    displayValue: '89',
    detail: 'Score ≥ 75 — bereit für direkten Vertriebskontakt',
    convLabel: 'von Gescored',
    color: '#4F46E5',
    gradient: [
      { offset: '0%', color: '#6366F1' },
      { offset: '100%', color: '#4F46E5' },
    ],
  },
];

function PipelineContent({ c }: { c: ColorTokens }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);

  const stage = hoveredIndex !== null ? FUNNEL_DATA[hoveredIndex] : null;
  const prevValue = hoveredIndex !== null && hoveredIndex > 0 ? FUNNEL_DATA[hoveredIndex - 1].value : null;
  const convPct = stage && prevValue ? Math.round((stage.value / prevValue) * 100) : null;
  const totalPct = stage ? Math.round((stage.value / FUNNEL_DATA[0].value) * 100) : null;

  return (
    <div
      ref={wrapperRef}
      style={{ position: 'relative' }}
      onMouseMove={(e) => {
        const rect = wrapperRef.current?.getBoundingClientRect();
        if (rect) setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
    >
      <FunnelChart
        data={FUNNEL_DATA}
        orientation="horizontal"
        layers={3}
        edges="curved"
        showValues={true}
        showPercentage={true}
        showLabels={true}
        staggerDelay={0.1}
        gap={6}
        hoveredIndex={hoveredIndex}
        onHoverChange={setHoveredIndex}
        formatPercentage={(p) => `${Math.round(p)}%`}
        formatValue={(v) => v.toLocaleString('de-DE')}
      />

      {stage && (
        <div
          style={{
            position: 'absolute',
            left: mousePos.x + 14,
            top: mousePos.y - 10,
            pointerEvents: 'none',
            zIndex: 50,
            background: c.bgCard,
            border: `1px solid ${c.border}`,
            borderRadius: 11,
            padding: '11px 14px',
            boxShadow: '0 6px 24px rgba(10,37,64,0.12)',
            minWidth: 210,
            fontFamily: 'var(--font-inter),sans-serif',
          }}
        >
          {/* Stage label + color dot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: c.text }}>{stage.label}</span>
          </div>

          {/* Main count */}
          <div style={{ fontSize: 26, fontWeight: 800, color: stage.color, lineHeight: 1, marginBottom: 4 }}>
            {stage.value.toLocaleString('de-DE')}
            <span style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, marginLeft: 5 }}>Leads</span>
          </div>

          {/* Description */}
          <div style={{ fontSize: 11, color: c.textSub, lineHeight: 1.45, marginBottom: 10 }}>{stage.detail}</div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: `1px solid ${c.border}` }}>
            <div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: c.textMuted,
                  marginBottom: 2,
                }}
              >
                Gesamt
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: c.text }}>{totalPct}%</div>
            </div>
            {convPct !== null && (
              <div>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: c.textMuted,
                    marginBottom: 2,
                  }}
                >
                  {stage.convLabel}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: convPct >= 50 ? '#059669' : convPct >= 30 ? '#D97706' : '#DC2626',
                  }}
                >
                  {convPct}%
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const SCORE_DATA = [
  {
    key: 'fit',
    label: 'Fit',
    value: 71,
    color: '#4F46E5',
    detail: 'Branche, Unternehmensgröße und Versandvolumen passen zum Zielprofil.',
  },
  {
    key: 'volume',
    label: 'Volumen',
    value: 58,
    color: '#818CF8',
    detail: 'Geschätztes monatliches Paketvolumen liegt im relevanten Bereich für unsere Preisstufen.',
  },
  {
    key: 'timing',
    label: 'Timing',
    value: 43,
    color: '#C7D2FE',
    detail: 'Aktuelle Signale deuten auf mittelfristigen Wechselzeitpunkt hin — noch kein akuter Handlungsdruck.',
  },
];

const OVERALL_SCORE = 73;

function ScoreRingsContent({ c }: { c: ColorTokens }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);

  const hovered = hoveredIndex !== null ? SCORE_DATA[hoveredIndex] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Donut chart */}
      <div
        ref={wrapperRef}
        style={{ position: 'relative' }}
        onMouseMove={(e) => {
          const rect = wrapperRef.current?.getBoundingClientRect();
          if (rect) setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }}
      >
        <div style={{ width: '100%', maxWidth: 200, aspectRatio: '1', margin: '0 auto' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={SCORE_DATA}
                dataKey="value"
                nameKey="key"
                innerRadius={58}
                outerRadius={90}
                cornerRadius={6}
                paddingAngle={3}
                startAngle={90}
                endAngle={-270}
                onMouseEnter={(_, index) => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {SCORE_DATA.map((entry, i) => (
                  <Cell
                    key={entry.key}
                    fill={entry.color}
                    opacity={hoveredIndex === null || hoveredIndex === i ? 1 : 0.35}
                    style={{ transition: 'opacity 0.15s', cursor: 'pointer' }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Center label */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: c.text,
              lineHeight: 1,
              fontFamily: 'var(--font-inter),sans-serif',
            }}
          >
            {hovered ? hovered.value : OVERALL_SCORE}
          </div>
          <div
            style={{
              fontSize: 11,
              color: hovered ? hovered.color : c.textMuted,
              fontWeight: 700,
              fontFamily: 'var(--font-inter),sans-serif',
              transition: 'color 0.15s',
            }}
          >
            {hovered ? hovered.label : '/ 100'}
          </div>
        </div>

        {/* Custom tooltip */}
        {hovered && (
          <div
            style={{
              position: 'absolute',
              left: mousePos.x + 14,
              top: mousePos.y - 10,
              pointerEvents: 'none',
              zIndex: 50,
              background: c.bgCard,
              border: `1px solid ${c.border}`,
              borderRadius: 11,
              padding: '11px 14px',
              boxShadow: '0 6px 24px rgba(10,37,64,0.12)',
              minWidth: 200,
              maxWidth: 230,
              fontFamily: 'var(--font-inter),sans-serif',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: hovered.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: c.text }}>{hovered.label}</span>
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: hovered.color === '#C7D2FE' ? '#4F46E5' : hovered.color,
                lineHeight: 1,
                marginBottom: 4,
              }}
            >
              {hovered.value}
              <span style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, marginLeft: 5 }}>/ 100</span>
            </div>
            <div style={{ fontSize: 11, color: c.textSub, lineHeight: 1.5, marginBottom: 10 }}>{hovered.detail}</div>
            <div style={{ paddingTop: 8, borderTop: `1px solid ${c.border}` }}>
              <div style={{ height: 4, background: c.bgPage, borderRadius: 99 }}>
                <div
                  style={{ height: '100%', width: `${hovered.value}%`, background: hovered.color, borderRadius: 99 }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {SCORE_DATA.map((s, i) => (
          <div
            key={s.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              opacity: hoveredIndex === null || hoveredIndex === i ? 1 : 0.4,
              transition: 'opacity 0.15s',
            }}
          >
            <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 12, color: c.textSub, fontFamily: 'var(--font-inter),sans-serif' }}>
              {s.label}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 64, height: 4, background: c.bgPage, borderRadius: 99 }}>
                <div style={{ height: '100%', width: `${s.value}%`, background: s.color, borderRadius: 99 }} />
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: c.text,
                  width: 22,
                  textAlign: 'right',
                  fontFamily: 'var(--font-inter),sans-serif',
                }}
              >
                {s.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Overall bar */}
      <div style={{ padding: '10px 12px', background: c.bgPage, borderRadius: 10, marginTop: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: c.textMuted, fontFamily: 'var(--font-inter),sans-serif' }}>
            Gesamtscore Ø
          </span>
          <span style={{ fontSize: 18, fontWeight: 800, color: c.text, fontFamily: 'var(--font-inter),sans-serif' }}>
            {OVERALL_SCORE}
            <span style={{ fontSize: 11, fontWeight: 600, color: c.textMuted }}> / 100</span>
          </span>
        </div>
        <div style={{ height: 4, background: c.border, borderRadius: 99 }}>
          <div
            style={{
              height: '100%',
              width: `${OVERALL_SCORE}%`,
              background: 'linear-gradient(90deg,#4F46E5,#DB2777)',
              borderRadius: 99,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Widget registry ──────────────────────────────────────────────────────────

type WidgetId =
  | 'kpi-row'
  | 'weekly-chart'
  | 'dach-map'
  | 'intent-feed'
  | 'layer-coverage'
  | 'hot-leads'
  | 'pipeline'
  | 'score-rings';

interface WidgetMeta {
  id: WidgetId;
  label: string;
  description: string;
  source: string;
  sourceColor: string;
  sourceBg: string;
  span: 1 | 2;
}

const WIDGET_REGISTRY: WidgetMeta[] = [
  {
    id: 'kpi-row',
    label: 'KPI Übersicht',
    description: 'Identifiziert, Neu, Hot, Ø Score',
    source: 'Gesamt',
    sourceColor: '#4F46E5',
    sourceBg: '#EEF0FF',
    span: 2,
  },
  {
    id: 'weekly-chart',
    label: 'Leads pro Woche',
    description: 'Wöchentliche Entdeckungsrate',
    source: 'Identifikation',
    sourceColor: '#4F46E5',
    sourceBg: '#EEF0FF',
    span: 1,
  },
  {
    id: 'dach-map',
    label: 'Lead-Weltkarte',
    description: 'Interaktiver Globus — Lead-Herkunft',
    source: 'Identifikation',
    sourceColor: '#4F46E5',
    sourceBg: '#EEF0FF',
    span: 1,
  },
  {
    id: 'intent-feed',
    label: 'Kaufsignale',
    description: 'Live-Wechselsignale & Trigger',
    source: 'Signale',
    sourceColor: '#DB2777',
    sourceBg: '#FDF2F8',
    span: 1,
  },
  {
    id: 'layer-coverage',
    label: 'Datenanreicherung',
    description: 'Anreicherungsgrad je Datenkategorie',
    source: 'Daten',
    sourceColor: '#697386',
    sourceBg: '#F1F5F9',
    span: 1,
  },
  {
    id: 'hot-leads',
    label: 'Top Leads',
    description: 'Höchst gescorte Leads',
    source: 'Scoring',
    sourceColor: '#7C3AED',
    sourceBg: '#F5F3FF',
    span: 1,
  },
  {
    id: 'pipeline',
    label: 'Lead Pipeline',
    description: 'Trichter von Entdeckung bis Hot',
    source: 'Gesamt',
    sourceColor: '#4F46E5',
    sourceBg: '#EEF0FF',
    span: 1,
  },
  {
    id: 'score-rings',
    label: '3D Score Ø',
    description: 'Fit, Volumen und Timing im Schnitt',
    source: 'Scoring',
    sourceColor: '#7C3AED',
    sourceBg: '#F5F3FF',
    span: 1,
  },
];

const DEFAULT_WIDGETS: WidgetId[] = ['kpi-row', 'weekly-chart', 'dach-map', 'intent-feed', 'layer-coverage'];

function renderWidgetContent(id: WidgetId, c: ColorTokens): React.ReactNode {
  switch (id) {
    case 'kpi-row':
      return <KpiContent c={c} />;
    case 'weekly-chart':
      return <WeeklyChartContent c={c} />;
    case 'dach-map':
      return <DachMapContent c={c} />;
    case 'intent-feed':
      return <IntentFeedContent c={c} />;
    case 'layer-coverage':
      return <LayerCoverageContent c={c} />;
    case 'hot-leads':
      return <HotLeadsContent c={c} />;
    case 'pipeline':
      return <PipelineContent c={c} />;
    case 'score-rings':
      return <ScoreRingsContent c={c} />;
  }
}

// ─── Widget card wrapper ──────────────────────────────────────────────────────

function WidgetCard({
  isDragging,
  isDropTarget,
  meta,
  children,
  c,
}: {
  meta: WidgetMeta;
  isDragging?: boolean;
  isDropTarget?: boolean;
  children: React.ReactNode;
  c: ColorTokens;
}) {
  return (
    <div
      style={{
        background: isDropTarget ? c.bgPage : c.bgCard,
        border: isDropTarget ? `2px solid ${c.accent}` : `1px solid ${c.border}`,
        borderRadius: 14,
        padding: isDropTarget ? '19px 21px' : '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        height: '100%',
        opacity: isDragging ? 0.4 : 1,
        transition: 'opacity 0.15s, border-color 0.15s, background 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Grip handle */}
        <div
          title="Verschieben"
          style={{ cursor: 'grab', display: 'flex', alignItems: 'center', flexShrink: 0, padding: '2px 1px' }}
        >
          <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
            <circle cx="3" cy="2.5" r="1.2" fill={c.textMuted} />
            <circle cx="7" cy="2.5" r="1.2" fill={c.textMuted} />
            <circle cx="3" cy="7" r="1.2" fill={c.textMuted} />
            <circle cx="7" cy="7" r="1.2" fill={c.textMuted} />
            <circle cx="3" cy="11.5" r="1.2" fill={c.textMuted} />
            <circle cx="7" cy="11.5" r="1.2" fill={c.textMuted} />
          </svg>
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color: c.text }}>{meta.label}</span>
        <span
          style={{
            padding: '2px 7px',
            background: meta.sourceBg,
            color: meta.sourceColor,
            borderRadius: 5,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.04em',
          }}
        >
          {meta.source}
        </span>
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

// ─── Add widget flyout ────────────────────────────────────────────────────────

function AddWidgetFlyout({
  active,
  onToggle,
  onClose,
  onReset,
  c,
}: {
  active: WidgetId[];
  onToggle: (id: WidgetId) => void;
  onClose: () => void;
  onReset: () => void;
  c: ColorTokens;
}) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
      <div
        style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          zIndex: 11,
          background: c.bgCard,
          border: `1px solid ${c.border}`,
          borderRadius: 14,
          padding: '16px',
          width: 300,
          boxShadow: '0 8px 32px rgba(10,37,64,0.10)',
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 800, color: c.text, marginBottom: 12 }}>Widgets konfigurieren</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {WIDGET_REGISTRY.map((widget) => {
            const isActive = active.includes(widget.id);
            return (
              <button
                key={widget.id}
                onClick={() => onToggle(widget.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  background: isActive ? c.bgPage : c.bgCard,
                  border: '1px solid',
                  borderColor: isActive ? c.borderStrong : c.border,
                  borderRadius: 9,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 5,
                    background: isActive ? c.accent : c.bgPage,
                    border: isActive ? 'none' : `1.5px solid ${c.borderStrong}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {isActive && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path
                        d="M1 4l3 3 5-6"
                        stroke="#fff"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: c.text }}>{widget.label}</div>
                  <div style={{ fontSize: 11, color: c.textMuted, marginTop: 1 }}>{widget.description}</div>
                </div>
                <span
                  style={{
                    padding: '2px 7px',
                    background: widget.sourceBg,
                    color: widget.sourceColor,
                    borderRadius: 5,
                    fontSize: 9,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {widget.source}
                </span>
              </button>
            );
          })}
        </div>
        <button
          onClick={onReset}
          style={{
            marginTop: 12,
            width: '100%',
            padding: '7px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 11,
            color: c.textMuted,
            textDecoration: 'underline',
          }}
        >
          Standardlayout wiederherstellen
        </button>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntelligencePage() {
  const { theme } = useTheme();
  const c = colors(theme);
  const isDark = theme === 'dark';

  const [widgets, setWidgets] = useState<WidgetId[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_WIDGETS;
    const saved = localStorage.getItem('dashboard-widgets');
    if (!saved) return DEFAULT_WIDGETS;
    try {
      return JSON.parse(saved) as WidgetId[];
    } catch {
      return DEFAULT_WIDGETS;
    }
  });
  const [showAdd, setShowAdd] = useState(false);
  const [dragId, setDragId] = useState<WidgetId | null>(null);
  const [dropId, setDropId] = useState<WidgetId | null>(null);

  function persist(next: WidgetId[]) {
    setWidgets(next);
    localStorage.setItem('dashboard-widgets', JSON.stringify(next));
  }

  function toggleWidget(id: WidgetId) {
    persist(widgets.includes(id) ? widgets.filter((w) => w !== id) : [...widgets, id]);
  }

  function removeWidget(id: WidgetId) {
    persist(widgets.filter((w) => w !== id));
  }

  function resetWidgets() {
    persist(DEFAULT_WIDGETS);
    setShowAdd(false);
  }

  function handleDrop(targetId: WidgetId) {
    if (!dragId || dragId === targetId) return;
    const next = [...widgets];
    const fromIdx = next.indexOf(dragId);
    const toIdx = next.indexOf(targetId);
    next.splice(fromIdx, 1);
    next.splice(toIdx, 0, dragId);
    persist(next);
    setDragId(null);
    setDropId(null);
  }

  return (
    <div
      style={{
        minHeight: '100%',
        background: c.bgPage,
        fontFamily: 'var(--font-inter), sans-serif',
        color: c.text,
      }}
    >
      {/* Hero header */}
      <div
        style={{
          background: isDark
            ? `linear-gradient(135deg, ${c.bgCard} 0%, ${c.bg} 60%, ${c.bgPage} 100%)`
            : 'linear-gradient(135deg, #EEF0FF 0%, #F0F4FF 60%, #F7F8FC 100%)',
          borderBottom: `1px solid ${c.border}`,
          padding: '24px 32px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: c.bgCard,
              border: `1px solid ${c.border}`,
              color: c.accent,
              borderRadius: 99,
              padding: '3px 10px',
              fontSize: 11,
              fontWeight: 700,
              marginBottom: 10,
              letterSpacing: '0.04em',
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.accent }} />
            Smart Parcel
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 5px', color: c.text, lineHeight: 1 }}>Leads</h1>
          <p style={{ fontSize: 13, color: c.textSub, margin: 0 }}>
            1.247 Leads identifiziert · 89 Hot · zuletzt vor 3 Min.
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: c.bgCard,
            border: `1px solid ${c.border}`,
            borderRadius: 99,
            padding: '5px 12px',
            flexShrink: 0,
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: c.textMuted }}>Sync vor 3 Min.</span>
        </div>
      </div>

      <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Dashboard toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: c.text }}>Mein Dashboard</div>
            <div style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>
              {widgets.length} von {WIDGET_REGISTRY.length} Widgets aktiv
            </div>
          </div>
          <button
            onClick={() => setShowAdd((s) => !s)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '8px 16px',
              background: showAdd ? c.accent : c.bgCard,
              color: showAdd ? '#fff' : c.accent,
              border: '1px solid',
              borderColor: showAdd ? c.accent : c.border,
              borderRadius: 9,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke={showAdd ? '#fff' : c.accent} strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Widget hinzufügen
          </button>
          {showAdd && (
            <AddWidgetFlyout
              active={widgets}
              onToggle={toggleWidget}
              onClose={() => setShowAdd(false)}
              onReset={resetWidgets}
              c={c}
            />
          )}
        </div>

        {/* Widget grid */}
        {widgets.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: '60px 32px',
              background: c.bgCard,
              border: `2px dashed ${c.border}`,
              borderRadius: 14,
              color: c.textMuted,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700 }}>Keine Widgets aktiv</div>
            <div style={{ fontSize: 12 }}>
              Klicke auf &ldquo;Widget hinzufügen&rdquo; um dein Dashboard zu gestalten.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Full-width (span 2) widgets */}
            {widgets
              .filter((id) => WIDGET_REGISTRY.find((w) => w.id === id)?.span === 2)
              .map((id) => {
                const meta = WIDGET_REGISTRY.find((w) => w.id === id)!;
                return (
                  <div
                    key={id}
                    draggable
                    onDragStart={() => setDragId(id)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (id !== dragId) setDropId(id);
                    }}
                    onDragLeave={() => setDropId(null)}
                    onDrop={() => handleDrop(id)}
                    onDragEnd={() => {
                      setDragId(null);
                      setDropId(null);
                    }}
                  >
                    <WidgetCard meta={meta} isDragging={dragId === id} isDropTarget={dropId === id} c={c}>
                      {renderWidgetContent(id, c)}
                    </WidgetCard>
                  </div>
                );
              })}

            {/* Two masonry columns for span-1 widgets */}
            {(() => {
              const colWidgets = widgets.filter((id) => WIDGET_REGISTRY.find((w) => w.id === id)?.span !== 2);
              const left = colWidgets.filter((_, i) => i % 2 === 0);
              const right = colWidgets.filter((_, i) => i % 2 === 1);

              const renderCol = (ids: WidgetId[]) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
                  {ids.map((id) => {
                    const meta = WIDGET_REGISTRY.find((w) => w.id === id)!;
                    return (
                      <div
                        key={id}
                        draggable
                        onDragStart={() => setDragId(id)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (id !== dragId) setDropId(id);
                        }}
                        onDragLeave={() => setDropId(null)}
                        onDrop={() => handleDrop(id)}
                        onDragEnd={() => {
                          setDragId(null);
                          setDropId(null);
                        }}
                      >
                        <WidgetCard meta={meta} isDragging={dragId === id} isDropTarget={dropId === id} c={c}>
                          {renderWidgetContent(id, c)}
                        </WidgetCard>
                      </div>
                    );
                  })}
                </div>
              );

              return (
                colWidgets.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
                    {renderCol(left)}
                    {renderCol(right)}
                  </div>
                )
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
