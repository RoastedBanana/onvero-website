'use client';

import { useState } from 'react';
import {
  C,
  SvgIcon,
  PageHeader,
  GhostButton,
  MetricCard,
  ICONS,
  Breadcrumbs,
  ActivityHeatmap,
  ProgressRing,
  Sparkline,
} from '../_shared';

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'leads' | 'pipeline' | 'activity';

// ─── MOCK DATA ───────────────────────────────────────────────────────────────

const OVERVIEW_METRICS = [
  {
    label: 'REVENUE PIPELINE',
    value: '€128.4k',
    delta: '+12% MoM',
    deltaType: 'up' as const,
    gradient: 'radial-gradient(ellipse at 20% 0%, rgba(52,211,153,0.15) 0%, transparent 60%)',
    accentColor: '#34D399',
    glowColor: 'rgba(52,211,153,0.25)',
  },
  {
    label: 'WIN RATE',
    value: '24.6%',
    delta: '+3.2%',
    deltaType: 'up' as const,
    gradient: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 60%)',
    accentColor: '#818CF8',
    glowColor: 'rgba(99,102,241,0.25)',
  },
  {
    label: 'AVG DEAL SIZE',
    value: '€8.4k',
    delta: null,
    deltaType: null,
    gradient: 'radial-gradient(ellipse at 80% 0%, rgba(56,189,248,0.12) 0%, transparent 60%)',
    accentColor: '#38BDF8',
    glowColor: 'rgba(56,189,248,0.2)',
  },
  {
    label: 'SALES CYCLE',
    value: '18 Tage',
    delta: '-3 Tage',
    deltaType: 'up' as const,
    gradient: 'radial-gradient(ellipse at 30% 0%, rgba(251,191,36,0.10) 0%, transparent 60%)',
    accentColor: '#FBBF24',
    glowColor: 'rgba(251,191,36,0.15)',
  },
];

const PIPELINE_MONTHS = [
  { m: 'Okt', v: 62 },
  { m: 'Nov', v: 78 },
  { m: 'Dez', v: 95 },
  { m: 'Jan', v: 88 },
  { m: 'Feb', v: 112 },
  { m: 'Mär', v: 148 },
  { m: 'Apr', v: 128 },
];

const WEEKLY_DATA = [
  { d: 'Mo', leads: 42, score: 82 },
  { d: 'Di', leads: 58, score: 85 },
  { d: 'Mi', leads: 35, score: 79 },
  { d: 'Do', leads: 68, score: 88 },
  { d: 'Fr', leads: 52, score: 84 },
  { d: 'Sa', leads: 18, score: 76 },
  { d: 'So', leads: 8, score: 71 },
];

const SCORE_DIST = [
  { range: '90–100', count: 4, pct: 11 },
  { range: '80–89', count: 8, pct: 23 },
  { range: '70–79', count: 12, pct: 34 },
  { range: '60–69', count: 6, pct: 17 },
  { range: '50–59', count: 3, pct: 9 },
  { range: '<50', count: 2, pct: 6 },
];

const SOURCES = [
  { name: 'Google Maps', pct: 32, count: 842, color: '#818CF8' },
  { name: 'LinkedIn Intent', pct: 24, count: 634, color: '#34D399' },
  { name: 'Website', pct: 20, count: 528, color: '#38BDF8' },
  { name: 'Referral', pct: 14, count: 371, color: '#FBBF24' },
  { name: 'Outreach', pct: 10, count: 264, color: '#A78BFA' },
];

const FUNNEL = [
  { stage: 'Generiert', count: 2847, color: '#4E5170' },
  { stage: 'KI-qualifiziert', count: 1248, color: '#818CF8' },
  { stage: 'Kontaktiert', count: 486, color: '#38BDF8' },
  { stage: 'Meeting', count: 142, color: '#FBBF24' },
  { stage: 'Abschluss', count: 34, color: '#34D399' },
];

const DEALS = [
  { stage: 'Discovery', count: 12, value: 42000, color: '#818CF8' },
  { stage: 'Demo', count: 8, value: 38400, color: '#38BDF8' },
  { stage: 'Verhandlung', count: 5, value: 31000, color: '#FBBF24' },
  { stage: 'Abschluss nah', count: 3, value: 17000, color: '#34D399' },
];

const ACTIVITY = [
  { action: 'Lead Marcus Weber → Qualifiziert', time: 'vor 2h', color: '#34D399' },
  { action: 'KI-Score Batch: 23 Leads bewertet', time: 'vor 6h', color: '#818CF8' },
  { action: 'Pipeline +€18.000 (Axflow AG)', time: 'vor 8h', color: '#34D399' },
  { action: 'Outreach: 12 E-Mails versendet', time: 'vor 12h', color: '#38BDF8' },
  { action: 'Meeting transkribiert: Silo Labs', time: 'vor 1 Tag', color: '#A78BFA' },
  { action: 'Neuer Intent-Signal: Nexlayer GmbH', time: 'vor 1 Tag', color: '#FBBF24' },
  { action: '3 Leads verloren markiert', time: 'vor 2 Tagen', color: '#F87171' },
];

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
  const W = 400;
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
  const W = 400;
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

function SankeyFlow() {
  const max = FUNNEL[0].count;
  const W = 440;
  const H = 160;
  const barW = 36;
  const gap = (W - barW * FUNNEL.length) / (FUNNEL.length - 1);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }}>
        <defs>
          {FUNNEL.map((s) => (
            <linearGradient key={s.stage} id={`sankey-${s.color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.5" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0.15" />
            </linearGradient>
          ))}
        </defs>

        {/* Flow connections */}
        {FUNNEL.slice(0, -1).map((s, i) => {
          const next = FUNNEL[i + 1];
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
        {FUNNEL.map((s, i) => {
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
                  {Math.round((s.count / FUNNEL[i - 1].count) * 100)}%
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── FORECAST CHART ──────────────────────────────────────────────────────────

function ForecastChart() {
  const months = ['Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt'];
  const forecast = [128, 142, 158, 170, 185, 198];
  const low = [128, 130, 138, 145, 152, 160];
  const high = [128, 155, 178, 198, 218, 240];
  const maxV = 260;
  const W = 400;
  const H = 160;
  const padL = 40;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const cW = W - padL - padR;
  const cH = H - padT - padB;

  function toP(v: number, i: number): [number, number] {
    return [padL + (i / (months.length - 1)) * cW, padT + (1 - v / maxV) * cH];
  }

  const fPts = forecast.map((v, i) => toP(v, i));
  const lPts = low.map((v, i) => toP(v, i));
  const hPts = high.map((v, i) => toP(v, i));

  const fLine = smoothPath(fPts);
  const lLine = smoothPath(lPts);
  const hLine = smoothPath(hPts);

  // Band: low path forward + high path reversed
  const lFwd = lPts.map((p) => `${p[0]},${p[1]}`).join(' L');
  const hRev = [...hPts]
    .reverse()
    .map((p) => `${p[0]},${p[1]}`)
    .join(' L');
  const band = `M${lFwd} L${hRev} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H }}>
      <defs>
        <linearGradient id="fc-band" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34D399" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#34D399" stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {/* Grid */}
      {[0.25, 0.5, 0.75].map((f) => {
        const y = padT + cH * (1 - f);
        return <line key={f} x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />;
      })}
      <line x1={padL} y1={padT + cH} x2={W - padR} y2={padT + cH} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

      {/* Confidence band */}
      <path d={band} fill="url(#fc-band)" />

      {/* Low / high dashed */}
      <path d={lLine} fill="none" stroke="rgba(52,211,153,0.15)" strokeWidth="1" strokeDasharray="4,4" />
      <path d={hLine} fill="none" stroke="rgba(52,211,153,0.15)" strokeWidth="1" strokeDasharray="4,4" />

      {/* Forecast line */}
      <path
        d={fLine}
        fill="none"
        stroke="#34D399"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="6,4"
        style={{ filter: 'drop-shadow(0 0 4px rgba(52,211,153,0.3))' }}
      />

      {/* Actual point (first) */}
      <circle
        cx={fPts[0][0]}
        cy={fPts[0][1]}
        r="4"
        fill="#34D399"
        style={{ filter: 'drop-shadow(0 0 8px rgba(52,211,153,0.6))' }}
      />
      <text
        x={fPts[0][0]}
        y={fPts[0][1] - 10}
        textAnchor="middle"
        fill="#34D399"
        fontSize="10"
        fontWeight="600"
        fontFamily="ui-monospace, monospace"
      >
        €128k
      </text>

      {/* End projection */}
      <circle
        cx={fPts[5][0]}
        cy={fPts[5][1]}
        r="3"
        fill="none"
        stroke="#34D399"
        strokeWidth="1.5"
        strokeDasharray="3,2"
      />
      <text
        x={fPts[5][0]}
        y={fPts[5][1] - 10}
        textAnchor="middle"
        fill="rgba(52,211,153,0.6)"
        fontSize="10"
        fontWeight="600"
        fontFamily="ui-monospace, monospace"
      >
        €198k
      </text>

      {/* X labels */}
      {months.map((m, i) => (
        <text
          key={m}
          x={padL + (i / (months.length - 1)) * cW}
          y={H - 4}
          textAnchor="middle"
          fill={C.text3}
          fontSize="9"
          fontFamily="system-ui"
        >
          {m}
        </text>
      ))}
    </svg>
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

// ─── TAB VIEWS ───────────────────────────────────────────────────────────────

function OverviewTab() {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {OVERVIEW_METRICS.map((m, i) => (
          <MetricCard key={m.label} {...m} index={i} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        {/* Pipeline trend — area chart */}
        <Panel title="Pipeline-Entwicklung" icon={ICONS.trending} color="#34D399" delay={0.15}>
          <AreaChart
            data={PIPELINE_MONTHS.map((d) => ({ x: d.m, y: d.v }))}
            color="#34D399"
            height={180}
            label="Pipeline"
            formatY={(v) => `€${Math.round(v)}k`}
          />
        </Panel>

        {/* Conversion funnel — sankey */}
        <Panel title="Conversion Funnel" icon={ICONS.chart} color="#818CF8" delay={0.2}>
          <SankeyFlow />
        </Panel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {/* Weekly leads — bar chart */}
        <Panel title="Leads diese Woche" icon={ICONS.list} color="#38BDF8" delay={0.25}>
          <ModernBarChart data={WEEKLY_DATA.map((d) => ({ x: d.d, y: d.leads }))} color="#38BDF8" height={140} />
        </Panel>

        {/* Lead Sources — donut */}
        <Panel title="Lead-Quellen" icon={ICONS.globe} color="#A78BFA" delay={0.3}>
          <DonutChart
            segments={SOURCES.map((s) => ({ value: s.pct, color: s.color, label: s.name }))}
            size={120}
            strokeWidth={16}
            label="2.8k"
            sublabel="Leads gesamt"
          />
        </Panel>

        {/* Activity Heatmap */}
        <Panel title="Aktivität (12 Wochen)" icon={ICONS.clock} color="#A78BFA" delay={0.35}>
          <ActivityHeatmap weeks={12} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
            <span style={{ fontSize: 10, color: C.text3 }}>Wenig</span>
            <div style={{ display: 'flex', gap: 3 }}>
              {['rgba(255,255,255,0.03)', 'rgba(99,102,241,0.1)', 'rgba(99,102,241,0.25)', C.accentDim, C.accent].map(
                (c, i) => (
                  <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
                )
              )}
            </div>
            <span style={{ fontSize: 10, color: C.text3 }}>Viel</span>
          </div>
        </Panel>
      </div>

      {/* Bottom row — progress rings */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <Panel title="Win Rate" icon={ICONS.trending} color="#34D399" delay={0.4}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <ProgressRing value={24.6} max={100} size={64} strokeWidth={4} color="#34D399" label="25%" />
            <div>
              <div style={{ fontSize: 11, color: C.text3, marginBottom: 4 }}>Ziel: 30%</div>
              <div style={{ fontSize: 11, color: C.success }}>↑ +3.2% vs. letzter Monat</div>
              <Sparkline data={[18, 19, 21, 22, 21, 23, 25]} width={80} height={18} color="#34D399" />
            </div>
          </div>
        </Panel>

        <Panel title="Avg. Deal Size" icon={ICONS.chart} color="#38BDF8" delay={0.45}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <ProgressRing value={56} max={100} size={64} strokeWidth={4} color="#38BDF8" label="€8.4k" />
            <div>
              <div style={{ fontSize: 11, color: C.text3, marginBottom: 4 }}>Ziel: €15k</div>
              <div style={{ fontSize: 11, color: C.text2 }}>56% vom Ziel</div>
              <Sparkline data={[5.2, 6.1, 6.8, 7.2, 7.8, 8.1, 8.4]} width={80} height={18} color="#38BDF8" />
            </div>
          </div>
        </Panel>

        <Panel title="Sales Cycle" icon={ICONS.clock} color="#FBBF24" delay={0.5}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <ProgressRing value={60} max={100} size={64} strokeWidth={4} color="#FBBF24" label="18d" />
            <div>
              <div style={{ fontSize: 11, color: C.text3, marginBottom: 4 }}>Ziel: 14 Tage</div>
              <div style={{ fontSize: 11, color: C.success }}>↓ -3 Tage vs. Q3</div>
              <Sparkline data={[28, 25, 24, 22, 21, 19, 18]} width={80} height={18} color="#FBBF24" />
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}

function LeadsTab() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
      {/* Score Distribution — horizontal bar chart */}
      <Panel title="Score-Verteilung" icon={ICONS.chart} color="#818CF8" delay={0.1}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SCORE_DIST.map((d, i) => {
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
                    height: 20,
                    borderRadius: 4,
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

      {/* Lead Sources — donut */}
      <Panel title="Lead-Quellen" icon={ICONS.globe} color="#34D399" delay={0.15}>
        <DonutChart
          segments={SOURCES.map((s) => ({ value: s.pct, color: s.color, label: s.name }))}
          size={140}
          strokeWidth={20}
          label="2.8k"
          sublabel="Leads gesamt"
        />
      </Panel>

      {/* Weekly Score Trend — area chart */}
      <Panel title="KI-Score Trend (Woche)" icon={ICONS.spark} color="#818CF8" span={2} delay={0.2}>
        <AreaChart
          data={WEEKLY_DATA.map((d) => ({ x: d.d, y: d.score }))}
          color="#818CF8"
          height={160}
          label="Score"
          formatY={(v) => `${Math.round(v)}`}
        />
      </Panel>
    </div>
  );
}

function PipelineTab() {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        <Panel title="Pipeline-Entwicklung (7 Monate)" icon={ICONS.trending} color="#34D399" delay={0.1}>
          <ModernBarChart
            data={PIPELINE_MONTHS.map((d) => ({ x: d.m, y: d.v }))}
            color="#34D399"
            height={180}
            formatY={(v) => `€${Math.round(v)}k`}
          />
        </Panel>

        <Panel title="Deals nach Phase" icon={ICONS.folder} color="#FBBF24" delay={0.15}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {DEALS.map((d, i) => {
              const maxVal = DEALS[0].value;
              return (
                <div
                  key={d.stage}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.015)',
                    border: `1px solid ${C.border}`,
                    animation: 'fadeIn 0.3s ease both',
                    animationDelay: `${0.2 + i * 0.06}s`,
                  }}
                >
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 2,
                          background: d.color,
                          boxShadow: `0 0 6px ${d.color}40`,
                        }}
                      />
                      <span style={{ fontSize: 12.5, color: C.text1 }}>{d.stage}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 10, color: C.text3, fontFamily: 'ui-monospace, monospace' }}>
                        {d.count} Deals
                      </span>
                      <span
                        style={{ fontSize: 13, fontWeight: 600, color: d.color, fontFamily: 'ui-monospace, monospace' }}
                      >
                        €{(d.value / 1000).toFixed(1)}k
                      </span>
                    </div>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.04)' }}>
                    <div
                      style={{
                        width: `${(d.value / maxVal) * 100}%`,
                        height: '100%',
                        borderRadius: 2,
                        background: `linear-gradient(90deg, ${d.color}60, ${d.color})`,
                        boxShadow: `0 0 6px ${d.color}20`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        <Panel title="Revenue Forecast (6 Monate)" icon={ICONS.trending} color="#34D399" delay={0.2}>
          <ForecastChart />
          <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
            {[
              { color: '#34D399', style: 'solid', label: 'Prognose' },
              { color: 'rgba(52,211,153,0.15)', style: 'dashed', label: 'Konfidenz' },
            ].map((l) => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div
                  style={{
                    width: 16,
                    height: 2,
                    background: l.color,
                    borderRadius: 1,
                    borderStyle: l.style === 'dashed' ? 'dashed' : 'solid',
                  }}
                />
                <span style={{ fontSize: 10, color: C.text3 }}>{l.label}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Lead-Flow (Sankey)" icon={ICONS.chart} color="#818CF8" delay={0.25}>
          <SankeyFlow />
        </Panel>
      </div>
    </>
  );
}

function ActivityTab() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14 }}>
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
          {ACTIVITY.concat([
            { action: 'Kampagne "SaaS DACH Q2" gestartet', time: 'vor 3 Tagen', color: '#818CF8' },
            { action: '48 Leads aus Google Maps importiert', time: 'vor 4 Tagen', color: '#38BDF8' },
            { action: 'Monatsreport generiert', time: 'vor 5 Tagen', color: '#FBBF24' },
          ]).map((a, i) => (
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
          ))}
        </div>
      </Panel>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Panel title="Heatmap" icon={ICONS.chart} color="#818CF8" delay={0.15}>
          <ActivityHeatmap weeks={8} />
        </Panel>
        <Panel title="Tagesverteilung" icon={ICONS.clock} color="#38BDF8" delay={0.2}>
          <ModernBarChart data={WEEKLY_DATA.map((d) => ({ x: d.d, y: d.leads }))} color="#38BDF8" height={120} />
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
    { id: 'pipeline', label: 'Pipeline', icon: ICONS.trending },
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

// ─── PAGE ────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <>
      <Breadcrumbs items={[{ label: 'Onvero Sales', href: '/sales-v2' }, { label: 'Analytics' }]} />
      <PageHeader
        title="Analytics"
        subtitle="Deine Sales-Performance auf einen Blick"
        actions={
          <>
            <GhostButton>Zeitraum: 30 Tage</GhostButton>
            <GhostButton>Export</GhostButton>
          </>
        }
      />
      <TabBar active={tab} onChange={setTab} />
      <div key={tab} className="tab-content-enter">
        {tab === 'overview' && <OverviewTab />}
        {tab === 'leads' && <LeadsTab />}
        {tab === 'pipeline' && <PipelineTab />}
        {tab === 'activity' && <ActivityTab />}
      </div>
    </>
  );
}
