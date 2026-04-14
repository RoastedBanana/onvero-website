'use client';

import { useState, useEffect, useRef } from 'react';
import MeetingsAnalyticsComponent from '../meetings/_analytics-view';
import {
  C,
  SvgIcon,
  PageHeader,
  GhostButton,
  MetricCard,
  ICONS,
  Breadcrumbs,
  ProgressRing,
  Sparkline,
  showToast,
} from '../_shared';

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'leads' | 'meetings' | 'activity';

interface LeadsData {
  total: number;
  hot: number;
  warm: number;
  cold: number;
  avgScore: number;
  withEmail: number;
  scored: number;
  avgDataQuality: number;
  contacted?: number;
  scoreRanges: Record<string, number>;
  industries: { name: string; count: number; avgScore: number }[];
  topCities: { name: string; count: number }[];
  hotLeads: { id: string; name: string; company: string; score: number; status: string; city: string }[];
  weeklyLeads: { week: string; total: number; hot: number; warm: number; cold: number }[];
}

interface TrendItem {
  date: string;
  label: string;
  total: number;
  hot: number;
  warm: number;
  cold: number;
}

interface TrendData {
  trend: TrendItem[];
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  created_at: string;
  lead_name: string;
  company: string;
  score: number;
}

interface ActivityData {
  activities: ActivityItem[];
  typeCounts: Record<string, number>;
  total: number;
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

const INDUSTRY_COLORS = ['#818CF8', '#34D399', '#38BDF8', '#FBBF24', '#A78BFA'];

function formatTimeAgo(isoDate: string): string {
  const now = new Date();
  const date = new Date(isoDate);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'gerade eben';
  if (diffMin < 60) return `vor ${diffMin}min`;
  if (diffH < 24) return `vor ${diffH}h`;
  if (diffD === 1) return 'vor 1 Tag';
  if (diffD < 7) return `vor ${diffD} Tagen`;
  if (diffD < 30) return `vor ${Math.floor(diffD / 7)} Wochen`;
  return `vor ${Math.floor(diffD / 30)} Monaten`;
}

function getActivityColor(type: string): string {
  const map: Record<string, string> = {
    score: '#818CF8',
    email: '#38BDF8',
    status_change: '#34D399',
    import: '#38BDF8',
    meeting: '#A78BFA',
    intent: '#FBBF24',
    lost: '#F87171',
    campaign: '#818CF8',
    report: '#FBBF24',
    enrichment: '#34D399',
    note: '#A78BFA',
  };
  return map[type] || '#818CF8';
}

// ─── SVG CHART HELPERS ───────────────────────────────────────────────────────

// Catmull-Rom to cubic bezier smooth path
function smoothPath(points: [number, number][]): string {
  if (points.length < 2) return '';
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

// ─── MODERN AREA CHART ───────────────────────────────────────────────────────

function AreaChart({
  data,
  color,
  height = 160,
  label,
  formatY,
}: {
  data: { x: string; y: number }[];
  color: string;
  height?: number;
  label: string;
  formatY?: (v: number) => string;
}) {
  const maxY = Math.max(...data.map((d) => d.y)) * 1.15;
  const W = 900;
  const H = height;
  const padL = 40;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const cW = W - padL - padR;
  const cH = H - padT - padB;

  const pts: [number, number][] = data.map((d, i) => [
    padL + (i / (data.length - 1)) * cW,
    padT + (1 - d.y / maxY) * cH,
  ]);

  const line = smoothPath(pts);
  const area = `${line} L${pts[pts.length - 1][0]},${padT + cH} L${pts[0][0]},${padT + cH} Z`;

  // Y grid lines
  const gridLines = 4;
  const gridYs = Array.from({ length: gridLines }, (_, i) => {
    const val = (maxY / gridLines) * (i + 1);
    const y = padT + (1 - val / maxY) * cH;
    return { y, val };
  });

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height }}>
        <defs>
          <linearGradient id={`area-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <filter id={`glow-${color.replace('#', '')}`}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines */}
        {gridYs.map((g, i) => (
          <g key={i}>
            <line x1={padL} y1={g.y} x2={W - padR} y2={g.y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            <text
              x={padL - 6}
              y={g.y + 3}
              textAnchor="end"
              fill={C.text3}
              fontSize="9"
              fontFamily="ui-monospace, SFMono-Regular, monospace"
            >
              {formatY ? formatY(g.val) : Math.round(g.val)}
            </text>
          </g>
        ))}
        {/* Base line */}
        <line x1={padL} y1={padT + cH} x2={W - padR} y2={padT + cH} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

        {/* Area fill */}
        <path d={area} fill={`url(#area-${color.replace('#', '')})`} />

        {/* Line */}
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          filter={`url(#glow-${color.replace('#', '')})`}
          style={{ animation: 'draw-sparkline 1.2s ease both' }}
        />

        {/* Data points */}
        {pts.map((p, i) => (
          <g key={i}>
            {i === pts.length - 1 && (
              <>
                <circle cx={p[0]} cy={p[1]} r="6" fill={`${color}20`} />
                <circle cx={p[0]} cy={p[1]} r="3.5" fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
              </>
            )}
            {i !== pts.length - 1 && <circle cx={p[0]} cy={p[1]} r="2" fill={`${color}60`} />}
          </g>
        ))}

        {/* X labels */}
        {data.map((d, i) => (
          <text
            key={d.x}
            x={padL + (i / (data.length - 1)) * cW}
            y={H - 4}
            textAnchor="middle"
            fill={C.text3}
            fontSize="9"
            fontFamily="system-ui"
          >
            {d.x}
          </text>
        ))}

        {/* Last value label */}
        <text
          x={pts[pts.length - 1][0]}
          y={pts[pts.length - 1][1] - 10}
          textAnchor="middle"
          fill={color}
          fontSize="10"
          fontWeight="600"
          fontFamily="ui-monospace, SFMono-Regular, monospace"
        >
          {formatY ? formatY(data[data.length - 1].y) : data[data.length - 1].y}
        </text>
      </svg>
    </div>
  );
}

// ─── DONUT CHART ─────────────────────────────────────────────────────────────

function DonutChart({
  segments,
  size = 140,
  strokeWidth = 18,
  label,
  sublabel,
}: {
  segments: { value: number; color: string; label: string }[];
  size?: number;
  strokeWidth?: number;
  label: string;
  sublabel: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let offset = 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth={strokeWidth}
          />
          {/* Segments */}
          {segments.map((seg) => {
            const segLen = (seg.value / total) * circumference;
            const segOffset = circumference - offset;
            offset += segLen;
            return (
              <circle
                key={seg.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${segLen} ${circumference - segLen}`}
                strokeDashoffset={segOffset}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dashoffset 1s cubic-bezier(0.22, 1, 0.36, 1)',
                  filter: `drop-shadow(0 0 3px ${seg.color}40)`,
                }}
              />
            );
          })}
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: C.text1,
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              letterSpacing: '-0.02em',
            }}
          >
            {label}
          </span>
          <span style={{ fontSize: 10, color: C.text3 }}>{sublabel}</span>
        </div>
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        {segments.map((seg) => (
          <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: seg.color,
                boxShadow: `0 0 4px ${seg.color}40`,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 11, color: C.text2, flex: 1 }}>{seg.label}</span>
            <span style={{ fontSize: 11, color: C.text3, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
              {seg.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MODERN BAR CHART ────────────────────────────────────────────────────────

function ModernBarChart({
  data,
  color,
  height = 160,
  formatY,
}: {
  data: { x: string; y: number }[];
  color: string;
  height?: number;
  formatY?: (v: number) => string;
}) {
  const maxY = Math.max(...data.map((d) => d.y)) * 1.15;
  const W = 900;
  const H = height;
  const padL = 40;
  const padR = 16;
  const padT = 20;
  const padB = 28;
  const cW = W - padL - padR;
  const cH = H - padT - padB;
  const barGap = 8;
  const barW = (cW - barGap * (data.length - 1)) / data.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height }}>
      <defs>
        <linearGradient id={`bar-g-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {/* Grid */}
      {[0.25, 0.5, 0.75, 1].map((f) => {
        const y = padT + cH * (1 - f);
        return (
          <g key={f}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            <text
              x={padL - 6}
              y={y + 3}
              textAnchor="end"
              fill={C.text3}
              fontSize="9"
              fontFamily="ui-monospace, SFMono-Regular, monospace"
            >
              {formatY ? formatY(maxY * f) : Math.round(maxY * f)}
            </text>
          </g>
        );
      })}
      <line x1={padL} y1={padT + cH} x2={W - padR} y2={padT + cH} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

      {data.map((d, i) => {
        const x = padL + i * (barW + barGap);
        const barH = (d.y / maxY) * cH;
        const y = padT + cH - barH;
        const isLast = i === data.length - 1;
        const isMax = d.y === Math.max(...data.map((dd) => dd.y));
        return (
          <g
            key={d.x}
            style={{
              animation: 'fadeInUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
              animationDelay: `${0.15 + i * 0.05}s`,
            }}
          >
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={4}
              fill={isLast || isMax ? `url(#bar-g-${color.replace('#', '')})` : 'rgba(255,255,255,0.05)'}
              style={{ filter: isLast || isMax ? `drop-shadow(0 0 8px ${color}25)` : 'none' }}
            />
            {(isLast || isMax) && (
              <text
                x={x + barW / 2}
                y={y - 6}
                textAnchor="middle"
                fill={color}
                fontSize="9"
                fontWeight="600"
                fontFamily="ui-monospace, SFMono-Regular, monospace"
              >
                {formatY ? formatY(d.y) : d.y}
              </text>
            )}
            <text x={x + barW / 2} y={H - 4} textAnchor="middle" fill={C.text3} fontSize="9" fontFamily="system-ui">
              {d.x}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── SANKEY FLOW ─────────────────────────────────────────────────────────────

function SankeyFlow({ funnel }: { funnel: { stage: string; count: number; color: string }[] }) {
  const max = funnel[0]?.count || 1;
  const W = 900;
  const H = 200;
  const barW = 36;
  const gap = (W - barW * funnel.length) / (funnel.length - 1);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }}>
        <defs>
          {funnel.map((s) => (
            <linearGradient key={s.stage} id={`sankey-${s.color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.5" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0.15" />
            </linearGradient>
          ))}
        </defs>

        {/* Flow connections */}
        {funnel.slice(0, -1).map((s, i) => {
          const next = funnel[i + 1];
          const x1 = i * (barW + gap) + barW;
          const x2 = (i + 1) * (barW + gap);
          const h1 = Math.max((s.count / max) * 100, 6);
          const h2 = Math.max((next.count / max) * 100, 6);
          const cy = 80;
          const y1t = cy - h1 / 2;
          const y2t = cy - h2 / 2;
          return (
            <path
              key={i}
              d={`M${x1},${y1t} C${(x1 + x2) / 2},${y1t} ${(x1 + x2) / 2},${y2t} ${x2},${y2t} L${x2},${y2t + h2} C${(x1 + x2) / 2},${y2t + h2} ${(x1 + x2) / 2},${y1t + h1} ${x1},${y1t + h1} Z`}
              fill={`${next.color}10`}
              stroke={`${next.color}20`}
              strokeWidth="0.5"
            />
          );
        })}

        {/* Stage bars */}
        {funnel.map((s, i) => {
          const h = Math.max((s.count / max) * 100, 6);
          const x = i * (barW + gap);
          const y = 80 - h / 2;
          return (
            <g key={s.stage}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx={5}
                fill={`url(#sankey-${s.color.replace('#', '')})`}
                stroke={s.color}
                strokeWidth="1"
                style={{ filter: `drop-shadow(0 0 6px ${s.color}20)` }}
              />
              <text
                x={x + barW / 2}
                y={y - 10}
                textAnchor="middle"
                fill={s.color}
                fontSize="10"
                fontWeight="600"
                fontFamily="ui-monospace, SFMono-Regular, monospace"
              >
                {s.count >= 1000 ? `${(s.count / 1000).toFixed(1)}k` : s.count}
              </text>
              <text x={x + barW / 2} y={H - 4} textAnchor="middle" fill={C.text3} fontSize="8" fontFamily="system-ui">
                {s.stage}
              </text>
              {i > 0 && (
                <text
                  x={x + barW / 2}
                  y={y - 22}
                  textAnchor="middle"
                  fill={C.text3}
                  fontSize="8"
                  fontFamily="system-ui"
                >
                  {Math.round((s.count / funnel[i - 1].count) * 100)}%
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── PANEL ───────────────────────────────────────────────────────────────────

function Panel({
  title,
  icon,
  color,
  children,
  span = 1,
  delay = 0,
}: {
  title: string;
  icon: string;
  color: string;
  children: React.ReactNode;
  span?: number;
  delay?: number;
}) {
  return (
    <div
      className="s-bento"
      style={{
        gridColumn: `span ${span}`,
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: '22px 24px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 2px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
        animation: 'scaleIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        animationDelay: `${delay}s`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: `${color}12`,
            border: `1px solid ${color}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SvgIcon d={icon} size={13} color={color} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 500, color: C.text2, letterSpacing: '-0.01em' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

// ─── LOADING SPINNER ────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          border: `2px solid ${C.border}`,
          borderTopColor: C.accent,
          animation: 'gradient-spin 0.8s linear infinite',
        }}
      />
    </div>
  );
}

// ─── TAB CONTENT COMPONENTS ─────────────────────────────────────────────────

function OverviewTab({ leadsData, trendData }: { leadsData: LeadsData; trendData: TrendData }) {
  const overviewMetrics = [
    {
      label: 'LEADS GESAMT',
      value: String(leadsData.total),
      delta: null,
      deltaType: null,
      gradient: 'radial-gradient(ellipse at 20% 0%, rgba(52,211,153,0.15) 0%, transparent 60%)',
      accentColor: '#34D399',
      glowColor: 'rgba(52,211,153,0.25)',
    },
    {
      label: 'KI-SCORE Ø',
      value: String(Math.round(leadsData.avgScore)),
      delta: null,
      deltaType: null,
      gradient: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 60%)',
      accentColor: '#818CF8',
      glowColor: 'rgba(99,102,241,0.25)',
    },
    {
      label: 'HOT LEADS',
      value: String(leadsData.hot),
      delta: null,
      deltaType: null,
      gradient: 'radial-gradient(ellipse at 80% 0%, rgba(56,189,248,0.12) 0%, transparent 60%)',
      accentColor: '#38BDF8',
      glowColor: 'rgba(56,189,248,0.2)',
    },
    {
      label: 'MIT E-MAIL',
      value: String(leadsData.withEmail),
      delta: null,
      deltaType: null,
      gradient: 'radial-gradient(ellipse at 30% 0%, rgba(251,191,36,0.10) 0%, transparent 60%)',
      accentColor: '#FBBF24',
      glowColor: 'rgba(251,191,36,0.15)',
    },
  ];

  // Build funnel from real data
  const funnel = [
    { stage: 'Generiert', count: leadsData.total, color: '#4E5170' },
    { stage: 'KI-bewertet', count: leadsData.scored, color: '#818CF8' },
    { stage: 'Hot Leads', count: leadsData.hot, color: '#38BDF8' },
    { stage: 'Mit E-Mail', count: leadsData.withEmail, color: '#FBBF24' },
    { stage: 'Kontaktiert', count: leadsData.contacted ?? 0, color: '#34D399' },
  ];

  // Weekly bar chart: last 7 entries from trend
  const last7 = trendData.trend.slice(-7);
  const weeklyBarData = last7.map((item) => ({ x: item.label, y: item.total }));

  // Lead sources from industries (top 5)
  const topIndustries = leadsData.industries.slice(0, 5);
  const industryTotal = topIndustries.reduce((sum, ind) => sum + ind.count, 0) || 1;
  const sourceSegments = topIndustries.map((ind, i) => ({
    value: Math.round((ind.count / industryTotal) * 100),
    color: INDUSTRY_COLORS[i],
    label: ind.name,
  }));

  const totalLabel = leadsData.total >= 1000 ? `${(leadsData.total / 1000).toFixed(1)}k` : String(leadsData.total);

  // Progress ring data
  const dataQuality = Math.round(leadsData.avgDataQuality);
  const hotRate = leadsData.total > 0 ? Math.round((leadsData.hot / leadsData.total) * 100) : 0;
  const scoredRate = leadsData.total > 0 ? Math.round((leadsData.scored / leadsData.total) * 100) : 0;

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {overviewMetrics.map((m, i) => (
          <MetricCard key={m.label} {...m} index={i} />
        ))}
      </div>

      {/* Leads trend -- full width */}
      <Panel title="Leads-Entwicklung" icon={ICONS.trending} color="#34D399" delay={0.15}>
        {trendData.trend.length > 1 ? (
          <AreaChart
            data={trendData.trend.map((d) => ({ x: d.label, y: d.total }))}
            color="#34D399"
            height={220}
            label="Leads"
            formatY={(v) => `${Math.round(v)}`}
          />
        ) : (
          <div style={{ color: C.text3, fontSize: 12, textAlign: 'center', padding: 40 }}>Keine Trenddaten</div>
        )}
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {/* Conversion funnel */}
        <Panel title="Conversion Funnel" icon={ICONS.chart} color="#818CF8" delay={0.3}>
          <SankeyFlow funnel={funnel} />
        </Panel>

        {/* Weekly leads -- bar chart */}
        <Panel title="Leads diese Woche" icon={ICONS.list} color="#38BDF8" delay={0.25}>
          {weeklyBarData.length > 0 ? (
            <ModernBarChart data={weeklyBarData} color="#38BDF8" height={200} />
          ) : (
            <div style={{ color: C.text3, fontSize: 12, textAlign: 'center', padding: 40 }}>Keine Daten</div>
          )}
        </Panel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Lead Sources -- donut */}
        <Panel title="Lead-Quellen" icon={ICONS.globe} color="#A78BFA" delay={0.3}>
          {sourceSegments.length > 0 ? (
            <DonutChart
              segments={sourceSegments}
              size={160}
              strokeWidth={20}
              label={totalLabel}
              sublabel="Leads gesamt"
            />
          ) : (
            <div style={{ color: C.text3, fontSize: 12, textAlign: 'center', padding: 40 }}>Keine Quellen</div>
          )}
        </Panel>

        {/* Weekly Activity — clearer than heatmap */}
        <Panel title="Wöchentliche Aktivität" icon={ICONS.clock} color="#A78BFA" delay={0.35}>
          {trendData.trend.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
              {trendData.trend.slice(-12).map((week, i) => {
                const max = Math.max(...trendData.trend.map((w) => w.total), 1);
                const pct = (week.total / max) * 100;
                return (
                  <div
                    key={i}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
                  >
                    <span
                      style={{ fontSize: 9, fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: C.text3 }}
                    >
                      {week.total}
                    </span>
                    <div
                      style={{
                        width: '100%',
                        height: `${Math.max(pct, 4)}%`,
                        borderRadius: 3,
                        background: `linear-gradient(180deg, ${C.accent}, ${C.accentDim})`,
                        transition: 'height 0.5s ease',
                      }}
                    />
                    <span style={{ fontSize: 8, color: C.text3 }}>{week.label?.slice(0, 5) ?? `W${i + 1}`}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 0', color: C.text3, fontSize: 11 }}>Noch keine Daten</div>
          )}
        </Panel>
      </div>

      {/* Bottom row -- progress rings */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <Panel title="Datenqualität" icon={ICONS.trending} color="#34D399" delay={0.4}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '12px 0' }}>
            <ProgressRing
              value={dataQuality}
              max={100}
              size={110}
              strokeWidth={6}
              color="#34D399"
              label={`${dataQuality}%`}
            />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: C.text1, fontWeight: 500, marginBottom: 4 }}>
                Durchschnittliche Qualität
              </div>
              <div style={{ fontSize: 12, color: dataQuality >= 70 ? C.success : C.warning }}>
                {dataQuality >= 70 ? 'Gut' : 'Verbesserungspotenzial'}
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="Hot Rate" icon={ICONS.chart} color="#38BDF8" delay={0.45}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '12px 0' }}>
            <ProgressRing value={hotRate} max={100} size={110} strokeWidth={6} color="#38BDF8" label={`${hotRate}%`} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: C.text1, fontWeight: 500, marginBottom: 4 }}>
                {leadsData.hot} von {leadsData.total} Leads
              </div>
              <div style={{ fontSize: 12, color: C.text2 }}>Score &ge; 70</div>
            </div>
          </div>
        </Panel>

        <Panel title="KI-bewertet" icon={ICONS.clock} color="#FBBF24" delay={0.5}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '12px 0' }}>
            <ProgressRing
              value={scoredRate}
              max={100}
              size={110}
              strokeWidth={6}
              color="#FBBF24"
              label={`${scoredRate}%`}
            />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: C.text1, fontWeight: 500, marginBottom: 4 }}>
                {leadsData.scored} von {leadsData.total} Leads
              </div>
              <div style={{ fontSize: 12, color: scoredRate >= 80 ? C.success : C.text2 }}>mit KI-Score bewertet</div>
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}

function LeadsTab({ leadsData, trendData }: { leadsData: LeadsData; trendData: TrendData }) {
  // Score distribution from scoreRanges
  const ranges = leadsData.scoreRanges || {};
  const below50 =
    (ranges['0-9'] || 0) +
    (ranges['10-19'] || 0) +
    (ranges['20-29'] || 0) +
    (ranges['30-39'] || 0) +
    (ranges['40-49'] || 0);

  const scoreDist = [
    { range: '90\u2013100', count: ranges['90-99'] || 0 },
    { range: '80\u201389', count: ranges['80-89'] || 0 },
    { range: '70\u201379', count: ranges['70-79'] || 0 },
    { range: '60\u201369', count: ranges['60-69'] || 0 },
    { range: '50\u201359', count: ranges['50-59'] || 0 },
    { range: '<50', count: below50 },
  ];

  const scoreTotal = scoreDist.reduce((s, d) => s + d.count, 0) || 1;
  const scoreDistWithPct = scoreDist.map((d) => ({
    ...d,
    pct: Math.round((d.count / scoreTotal) * 100),
  }));

  // Lead sources from industries (top 5)
  const topIndustries = leadsData.industries.slice(0, 5);
  const industryTotal = topIndustries.reduce((sum, ind) => sum + ind.count, 0) || 1;
  const sourceSegments = topIndustries.map((ind, i) => ({
    value: Math.round((ind.count / industryTotal) * 100),
    color: INDUSTRY_COLORS[i],
    label: ind.name,
  }));

  const totalLabel = leadsData.total >= 1000 ? `${(leadsData.total / 1000).toFixed(1)}k` : String(leadsData.total);

  // KI-Score Trend from trend data (hot leads over time)
  const scoreTrendData = trendData.trend.map((item) => ({ x: item.label, y: item.hot }));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
      {/* Score Distribution -- horizontal bar chart */}
      <Panel title="Score-Verteilung" icon={ICONS.chart} color="#818CF8" delay={0.1}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {scoreDistWithPct.map((d, i) => {
            const colors = ['#818CF8', '#6366F1', '#38BDF8', '#FBBF24', '#F87171', '#4E5170'];
            return (
              <div
                key={d.range}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  animation: 'fadeIn 0.3s ease both',
                  animationDelay: `${0.15 + i * 0.05}s`,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: C.text3,
                    width: 50,
                    textAlign: 'right',
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  }}
                >
                  {d.range}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 28,
                    borderRadius: 6,
                    background: 'rgba(255,255,255,0.03)',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      width: `${d.pct}%`,
                      height: '100%',
                      borderRadius: 4,
                      background: `linear-gradient(90deg, ${colors[i]}60, ${colors[i]})`,
                      boxShadow: `0 0 8px ${colors[i]}20`,
                      transition: 'width 1s cubic-bezier(0.22, 1, 0.36, 1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: 6,
                    }}
                  >
                    {d.pct > 15 && (
                      <span
                        style={{ fontSize: 9, color: '#fff', fontWeight: 600, fontFamily: 'ui-monospace, monospace' }}
                      >
                        {d.count}
                      </span>
                    )}
                  </div>
                </div>
                {d.pct <= 15 && (
                  <span style={{ fontSize: 10, color: C.text3, fontFamily: 'ui-monospace, monospace', width: 16 }}>
                    {d.count}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Lead Sources -- donut */}
      <Panel title="Lead-Quellen" icon={ICONS.globe} color="#34D399" delay={0.15}>
        {sourceSegments.length > 0 ? (
          <DonutChart
            segments={sourceSegments}
            size={170}
            strokeWidth={22}
            label={totalLabel}
            sublabel="Leads gesamt"
          />
        ) : (
          <div style={{ color: C.text3, fontSize: 12, textAlign: 'center', padding: 40 }}>Keine Quellen</div>
        )}
      </Panel>

      {/* KI-Score Trend -- full width area chart */}
      <Panel title="KI-Score Trend (Woche)" icon={ICONS.spark} color="#818CF8" span={2} delay={0.2}>
        {scoreTrendData.length > 1 ? (
          <AreaChart
            data={scoreTrendData}
            color="#818CF8"
            height={200}
            label="Score"
            formatY={(v) => `${Math.round(v)}`}
          />
        ) : (
          <div style={{ color: C.text3, fontSize: 12, textAlign: 'center', padding: 40 }}>Keine Trenddaten</div>
        )}
      </Panel>
    </div>
  );
}

function ActivityTab({ activityData, trendData }: { activityData: ActivityData; trendData: TrendData }) {
  const timelineItems = activityData.activities.map((a) => ({
    action: a.title,
    time: formatTimeAgo(a.created_at),
    color: getActivityColor(a.type),
  }));

  // Daily bar chart from last 7 trend entries
  const last7 = trendData.trend.slice(-7);
  const dailyBarData = last7.map((item) => ({ x: item.label, y: item.total }));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <Panel title="Aktivitäts-Timeline" icon={ICONS.clock} color="#A78BFA" delay={0.1}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              left: 10,
              top: 12,
              bottom: 12,
              width: 1,
              background: `linear-gradient(180deg, ${C.border}, transparent)`,
            }}
          />
          {timelineItems.length > 0 ? (
            timelineItems.map((a, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 16,
                  padding: '12px 0',
                  paddingLeft: 4,
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  animation: 'fadeIn 0.3s ease both',
                  animationDelay: `${0.15 + i * 0.04}s`,
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: C.surface,
                    border: `2px solid ${a.color}`,
                    boxShadow: `0 0 8px ${a.color}40`,
                    flexShrink: 0,
                    marginTop: 2,
                    zIndex: 1,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, color: C.text1, lineHeight: 1.4 }}>{a.action}</div>
                  <div style={{ fontSize: 10, color: C.text3, marginTop: 3 }}>{a.time}</div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: C.text3, fontSize: 12, textAlign: 'center', padding: 40 }}>Keine Aktivitäten</div>
          )}
        </div>
      </Panel>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Panel title="Aktivitäts-Typen" icon={ICONS.chart} color="#818CF8" delay={0.15}>
          {activityData && Object.entries(activityData.typeCounts).length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(activityData.typeCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => {
                  const max = Math.max(...Object.values(activityData.typeCounts));
                  return (
                    <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: getActivityColor(type),
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: 11, color: C.text2, minWidth: 90 }}>{type}</span>
                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.04)' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${(count / max) * 100}%`,
                            borderRadius: 3,
                            background: getActivityColor(type),
                          }}
                        />
                      </div>
                      <span
                        style={{ fontSize: 11, fontFamily: 'ui-monospace, SFMono-Regular, monospace', color: C.text2 }}
                      >
                        {count}
                      </span>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 0', color: C.text3, fontSize: 11 }}>
              Noch keine Aktivitäten
            </div>
          )}
        </Panel>
        <Panel title="Tagesverteilung" icon={ICONS.clock} color="#38BDF8" delay={0.2}>
          {dailyBarData.length > 0 ? (
            <ModernBarChart data={dailyBarData} color="#38BDF8" height={200} />
          ) : (
            <div style={{ color: C.text3, fontSize: 12, textAlign: 'center', padding: 40 }}>Keine Daten</div>
          )}
        </Panel>
      </div>
    </div>
  );
}

// ─── TAB BAR ─────────────────────────────────────────────────────────────────

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Übersicht', icon: ICONS.home },
    { id: 'leads', label: 'Leads', icon: ICONS.users },
    { id: 'meetings', label: 'Meetings', icon: ICONS.mic },
    { id: 'activity', label: 'Aktivität', icon: ICONS.clock },
  ];

  return (
    <div
      style={{
        display: 'flex',
        gap: 2,
        padding: 3,
        borderRadius: 10,
        background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${C.border}`,
        width: 'fit-content',
        animation: 'fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both',
      }}
    >
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            className="s-tab"
            onClick={() => onChange(t.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: isActive ? C.accentGhost : 'transparent',
              color: isActive ? C.accentBright : C.text3,
              fontSize: 12,
              fontWeight: isActive ? 500 : 400,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s ease',
              boxShadow: isActive ? 'inset 0 0 0 0.5px rgba(99,102,241,0.2)' : 'none',
            }}
          >
            <SvgIcon d={t.icon} size={13} color={isActive ? C.accent : C.text3} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── PERIOD DROPDOWN ────────────────────────────────────────────────────────

function PeriodDropdown({ period, onChange }: { period: string; onChange: (v: Period) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = PERIODS.find((p) => p.value === period);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', zIndex: 100 }}>
      <button
        onClick={() => setOpen(!open)}
        className="s-ghost"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '7px 14px',
          borderRadius: 8,
          border: `1px solid ${C.border}`,
          background: 'rgba(255,255,255,0.02)',
          color: C.text1,
          fontSize: 12,
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <SvgIcon d={ICONS.calendar} size={13} color={C.accent} />
        {current?.label ?? 'Zeitraum'}
        <svg
          width={10}
          height={10}
          viewBox="0 0 24 24"
          fill="none"
          stroke={C.text3}
          strokeWidth={2}
          strokeLinecap="round"
          style={{ transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            background: C.surface,
            border: `1px solid ${C.borderLight}`,
            borderRadius: 10,
            padding: 4,
            minWidth: 160,
            zIndex: 9999,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            animation: 'scaleIn 0.15s cubic-bezier(0.22, 1, 0.36, 1) both',
          }}
        >
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => {
                onChange(p.value);
                setOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '8px 12px',
                borderRadius: 6,
                border: 'none',
                background: period === p.value ? C.accentGhost : 'transparent',
                color: period === p.value ? C.accentBright : C.text2,
                fontSize: 12,
                fontWeight: period === p.value ? 500 : 400,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
                transition: 'all 0.1s ease',
              }}
              onMouseEnter={(e) => {
                if (period !== p.value) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              }}
              onMouseLeave={(e) => {
                if (period !== p.value) e.currentTarget.style.background = 'transparent';
              }}
            >
              {period === p.value && (
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.accent, flexShrink: 0 }} />
              )}
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PAGE ────────────────────────────────────────────────────────────────────

const PERIODS = [
  { value: '7d', label: '1 Woche' },
  { value: '14d', label: '2 Wochen' },
  { value: '30d', label: '4 Wochen' },
  { value: '3mo', label: '3 Monate' },
  { value: '6mo', label: '6 Monate' },
  { value: '1y', label: '1 Jahr' },
] as const;

type Period = (typeof PERIODS)[number]['value'];

// ─── MEETINGS ANALYTICS TAB — reuses the polished component from meetings ───

function MeetingsAnalyticsTab() {
  return <MeetingsAnalyticsComponent meetings={[]} />;
}

export default function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [period, setPeriod] = useState<Period>('30d');
  const [loading, setLoading] = useState(true);
  const [leadsData, setLeadsData] = useState<LeadsData | null>(null);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [activityData, setActivityData] = useState<ActivityData | null>(null);

  useEffect(() => {
    setLoading(true);

    const emptyLeads: LeadsData = {
      total: 0,
      hot: 0,
      warm: 0,
      cold: 0,
      avgScore: 0,
      withEmail: 0,
      scored: 0,
      avgDataQuality: 0,
      scoreRanges: {},
      industries: [],
      topCities: [],
      hotLeads: [],
      weeklyLeads: [],
    };
    const emptyTrend: TrendData = { trend: [] };
    const emptyActivity: ActivityData = { activities: [], typeCounts: {}, total: 0 };

    Promise.all([
      fetch(`/api/analytics/leads?period=${period}`)
        .then((r) => (r.ok ? r.json() : emptyLeads))
        .catch(() => emptyLeads),
      fetch('/api/analytics/trend')
        .then((r) => (r.ok ? r.json() : emptyTrend))
        .catch(() => emptyTrend),
      fetch('/api/analytics/activity')
        .then((r) => (r.ok ? r.json() : emptyActivity))
        .catch(() => emptyActivity),
    ])
      .then(([leads, trend, activity]) => {
        setLeadsData(leads);
        setTrendData(trend);
        setActivityData(activity);
        setLoading(false);
      })
      .catch(() => {
        setLeadsData(emptyLeads);
        setTrendData(emptyTrend);
        setActivityData(emptyActivity);
        setLoading(false);
        showToast('Daten konnten nicht geladen werden', 'error');
      });
  }, [period]);

  return (
    <>
      <Breadcrumbs items={[{ label: 'Onvero Sales', href: '/sales-v2' }, { label: 'Analytics' }]} />
      <PageHeader
        title="Analytics"
        subtitle="Deine Sales-Performance auf einen Blick"
        actions={<PeriodDropdown period={period} onChange={setPeriod} />}
      />
      <TabBar active={tab} onChange={setTab} />

      {loading || !leadsData || !trendData || !activityData ? (
        <LoadingSpinner />
      ) : (
        <div key={tab} className="tab-content-enter">
          {tab === 'overview' && <OverviewTab leadsData={leadsData} trendData={trendData} />}
          {tab === 'leads' && <LeadsTab leadsData={leadsData} trendData={trendData} />}
          {tab === 'meetings' && <MeetingsAnalyticsTab />}
          {tab === 'activity' && <ActivityTab activityData={activityData} trendData={trendData} />}
        </div>
      )}
    </>
  );
}
