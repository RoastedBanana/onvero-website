'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ─── DESIGN TOKENS ── Raycast-inspired deep indigo-black ─────────────────────

export const C = {
  // Backgrounds — layered depth
  bg: '#08091A',
  surface: '#0E1025',
  surface2: '#141630',
  surface3: '#1A1D3A',
  sidebar: '#0A0B1E',
  topbar: '#0A0B1E',

  // Borders
  border: 'rgba(255,255,255,0.06)',
  borderLight: 'rgba(255,255,255,0.08)',
  borderAccent: 'rgba(99,102,241,0.25)',

  // Accent — indigo/violet
  accent: '#818CF8',
  accentBright: '#A5B4FC',
  accentDim: '#6366F1',
  accentGhost: 'rgba(99,102,241,0.08)',
  accentGlow: 'rgba(99,102,241,0.15)',

  // Text hierarchy
  text1: '#EEEEF8',
  text2: '#8B8FA8',
  text3: '#4E5170',

  // Semantic
  success: '#34D399',
  successBg: 'rgba(52,211,153,0.08)',
  successBorder: 'rgba(52,211,153,0.15)',
  danger: '#F87171',
  dangerBg: 'rgba(248,113,113,0.08)',
  dangerBorder: 'rgba(248,113,113,0.15)',
  warning: '#FBBF24',
  warningBg: 'rgba(251,191,36,0.08)',
  warningBorder: 'rgba(251,191,36,0.15)',
  info: '#38BDF8',
  infoBg: 'rgba(56,189,248,0.08)',
  infoBorder: 'rgba(56,189,248,0.15)',
  cyan: '#22D3EE',
  purple: '#A78BFA',
} as const;

// ─── GLOBAL STYLES ───────────────────────────────────────────────────────────

export const GLOBAL_STYLES = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.96); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes pulse-live {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.3); }
  }
  @keyframes shimmer-line {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
  @keyframes countUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes gradient-spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes toast-in {
    from { opacity: 0; transform: translateX(40px) scale(0.95); }
    to { opacity: 1; transform: translateX(0) scale(1); }
  }
  @keyframes toast-out {
    from { opacity: 1; transform: translateX(0) scale(1); }
    to { opacity: 0; transform: translateX(40px) scale(0.95); }
  }
  @keyframes tab-content-in {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes draw-sparkline {
    from { stroke-dashoffset: 200; }
    to { stroke-dashoffset: 0; }
  }
  @keyframes ring-fill {
    from { stroke-dashoffset: var(--ring-circumference); }
    to { stroke-dashoffset: var(--ring-offset); }
  }
  @keyframes heatmap-pop {
    from { opacity: 0; transform: scale(0); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(100%); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes breadcrumb-in {
    from { opacity: 0; transform: translateX(-6px); }
    to { opacity: 1; transform: translateX(0); }
  }

  /* Animated gradient border for primary buttons */
  .s-primary-glow {
    position: relative;
    z-index: 0;
    transition: all 0.2s ease;
  }
  .s-primary-glow::before {
    content: '';
    position: absolute;
    inset: -1.5px;
    border-radius: 10px;
    background: conic-gradient(from var(--angle, 0deg), #6366F1, #818CF8, #A5B4FC, #38BDF8, #818CF8, #6366F1);
    z-index: -1;
    opacity: 0;
    transition: opacity 0.3s ease;
    animation: gradient-spin 3s linear infinite;
  }
  .s-primary-glow:hover::before { opacity: 1; }
  .s-primary-glow:hover {
    filter: brightness(1.1);
    box-shadow: 0 0 24px rgba(99,102,241,0.35), 0 0 80px rgba(99,102,241,0.1);
  }
  @property --angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }
  @keyframes gradient-spin {
    to { --angle: 360deg; }
  }

  /* Tab content transition */
  .tab-content-enter {
    animation: tab-content-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  /* Career card hover */
  .career-card {
    transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  }
  .career-card:hover {
    background: rgba(99,102,241,0.06) !important;
    border-color: rgba(99,102,241,0.18) !important;
    box-shadow: 0 2px 12px rgba(99,102,241,0.08);
  }
  .career-card-current {
    transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  }
  .career-card-current:hover {
    background: rgba(99,102,241,0.1) !important;
    border-color: rgba(99,102,241,0.3) !important;
    box-shadow: 0 4px 20px rgba(99,102,241,0.12);
  }

  /* Career dot pulse animation — runs once on mount */
  @keyframes dotPulseUp {
    0% { opacity: 0.3; transform: scale(0.5); }
    60% { opacity: 1; transform: scale(1.3); }
    100% { opacity: 1; transform: scale(1); }
  }

  .s-row { transition: background 0.2s ease, box-shadow 0.2s ease; }
  .s-row:hover {
    background: rgba(99,102,241,0.03) !important;
    box-shadow: inset 0 0 0 0.5px rgba(99,102,241,0.08);
  }
  .s-nav:hover { background: rgba(255,255,255,0.03) !important; }
  .s-chip { transition: all 0.15s ease; }
  .s-chip:hover {
    border-color: rgba(99,102,241,0.3) !important;
    color: #A5B4FC !important;
    background: rgba(99,102,241,0.05) !important;
  }
  .s-ghost { transition: all 0.15s ease; }
  .s-ghost:hover {
    border-color: rgba(99,102,241,0.3) !important;
    color: #EEEEF8 !important;
    background: rgba(99,102,241,0.05) !important;
  }
  .s-primary { transition: all 0.2s ease; }
  .s-primary:hover {
    filter: brightness(1.15);
    box-shadow: 0 0 20px rgba(99,102,241,0.3), 0 0 60px rgba(99,102,241,0.1);
  }
  .s-sub:hover {
    color: #A5B4FC !important;
    background: rgba(99,102,241,0.04) !important;
  }
  .s-card { transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1); }
  .s-card:hover {
    transform: translateY(-1px);
    box-shadow:
      0 4px 24px rgba(0,0,0,0.3),
      0 0 0 0.5px rgba(255,255,255,0.08),
      inset 0 1px 0 rgba(255,255,255,0.04);
  }
  .s-bento { transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
  .s-bento:hover {
    transform: translateY(-2px);
    border-color: rgba(99,102,241,0.15) !important;
    box-shadow:
      0 8px 32px rgba(0,0,0,0.3),
      0 0 0 0.5px rgba(255,255,255,0.06),
      inset 0 1px 0 rgba(255,255,255,0.04);
  }
  .s-tab { transition: all 0.15s ease; }
  .s-tab:hover { color: #A5B4FC !important; }

  .noise::before {
    content: '';
    position: fixed;
    inset: 0;
    opacity: 0.015;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 999;
  }
`;

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────

export function SvgIcon({ d, size = 14, color = 'currentColor' }: { d: string; size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

export function AmbientBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      <div
        style={{
          position: 'absolute',
          top: -200,
          left: -100,
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 65%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -300,
          right: -150,
          width: 800,
          height: 800,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56,189,248,0.03) 0%, transparent 65%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: '55%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(129,140,248,0.025) 0%, transparent 60%)',
          filter: 'blur(50px)',
        }}
      />
    </div>
  );
}

// Page header with title, subtitle, and optional actions
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        animation: 'fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}
    >
      <div>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: C.text1,
            margin: 0,
            letterSpacing: '-0.025em',
          }}
        >
          {title}
        </h1>
        <p style={{ fontSize: 12, color: C.text3, margin: '6px 0 0', fontWeight: 400 }}>{subtitle}</p>
      </div>
      {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
    </div>
  );
}

// Ghost button
export function GhostButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      className="s-ghost"
      onClick={onClick}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${C.border}`,
        color: C.text2,
        borderRadius: 8,
        padding: '8px 16px',
        fontSize: 12,
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontWeight: 400,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
      }}
    >
      {children}
    </button>
  );
}

// Primary accent button
export function PrimaryButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      className="s-primary"
      onClick={onClick}
      style={{
        background: 'linear-gradient(135deg, #6366F1, #818CF8)',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        padding: '8px 18px',
        fontSize: 12,
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: 'inherit',
        boxShadow: '0 2px 16px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
      }}
    >
      {children}
    </button>
  );
}

// Metric card with radial gradient wash
export function MetricCard({
  label,
  value,
  delta,
  deltaType,
  gradient,
  accentColor,
  glowColor,
  index = 0,
}: {
  label: string;
  value: string;
  delta?: string | null;
  deltaType?: 'up' | 'down' | null;
  gradient: string;
  accentColor: string;
  glowColor: string;
  index?: number;
}) {
  return (
    <div
      className="s-card"
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: '18px 20px',
        position: 'relative',
        overflow: 'hidden',
        animation: 'scaleIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        animationDelay: `${index * 0.08}s`,
        boxShadow: `0 2px 16px rgba(0,0,0,0.25), 0 0 0 0.5px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.03)`,
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: gradient, pointerEvents: 'none' }} />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)`,
        }}
      />
      <div style={{ position: 'relative' }}>
        <div
          style={{
            fontSize: 10,
            letterSpacing: '0.08em',
            color: C.text3,
            marginBottom: 10,
            fontWeight: 500,
          }}
        >
          {label}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span
            style={{
              fontSize: 26,
              fontWeight: 600,
              color: C.text1,
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              letterSpacing: '-0.03em',
              textShadow: `0 0 30px ${glowColor}`,
            }}
          >
            {value}
          </span>
          {delta && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: deltaType === 'up' ? C.success : C.danger,
                display: 'flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <span style={{ fontSize: 13 }}>{deltaType === 'up' ? '↑' : '↓'}</span>
              {delta}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Status badge
export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    Qualifiziert: { bg: 'rgba(52,211,153,0.06)', color: '#34D399', border: 'rgba(52,211,153,0.15)' },
    'In Kontakt': { bg: 'rgba(99,102,241,0.06)', color: '#A5B4FC', border: 'rgba(99,102,241,0.15)' },
    Neu: { bg: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.3)', border: 'rgba(255,255,255,0.06)' },
    Verloren: { bg: 'rgba(248,113,113,0.06)', color: '#F87171', border: 'rgba(248,113,113,0.15)' },
    Aktiv: { bg: 'rgba(52,211,153,0.06)', color: '#34D399', border: 'rgba(52,211,153,0.15)' },
    Hoch: { bg: 'rgba(248,113,113,0.06)', color: '#F87171', border: 'rgba(248,113,113,0.15)' },
    Mittel: { bg: 'rgba(251,191,36,0.06)', color: '#FBBF24', border: 'rgba(251,191,36,0.15)' },
    Geplant: { bg: 'rgba(56,189,248,0.06)', color: '#38BDF8', border: 'rgba(56,189,248,0.15)' },
  };
  const s = styles[status] ?? styles.Neu;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 500,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
      }}
    >
      {status}
    </span>
  );
}

// Score bar visualization
export function ScoreBar({ score }: { score: number }) {
  const isHigh = score >= 85;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div
        style={{
          width: 56,
          height: 4,
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${score}%`,
            height: '100%',
            background: isHigh ? 'linear-gradient(90deg, #6366F1, #818CF8)' : score >= 70 ? '#4E5170' : '#3A3D55',
            borderRadius: 2,
            boxShadow: isHigh ? '0 0 8px rgba(99,102,241,0.4)' : 'none',
          }}
        />
      </div>
      <span
        style={{
          fontSize: 11,
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          color: isHigh ? C.accent : C.text3,
          fontWeight: 500,
          minWidth: 20,
          textAlign: 'right',
        }}
      >
        {score}
      </span>
    </div>
  );
}

// ─── ICON PATHS ──────────────────────────────────────────────────────────────

export const ICONS = {
  home: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1',
  list: 'M3 7h18M3 12h18M3 17h18',
  zap: 'M13 10V3L4 14h7v7l9-11h-7z',
  chat: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
  eye: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  chart:
    'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  settings:
    'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  users:
    'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  mail: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  target:
    'M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0-6C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z',
  trending: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  spark: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
  mic: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z',
  play: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  folder: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
  globe:
    'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9',
  inbox:
    'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4',
  check: 'M5 13l4 4L19 7',
  x: 'M6 18L18 6M6 6l12 12',
  chevRight: 'M9 5l7 7-7 7',
  network:
    'M18 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zm12 7a3 3 0 100-6 3 3 0 000 6zM8.59 13.51l6.83 3.98m-.01-10.98l-6.82 3.98',
} as const;

// ─── ANIMATED COUNTER ────────────────────────────────────────────────────────

export function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
}: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 800;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [value]);

  return (
    <span style={{ animation: 'countUp 0.5s ease both' }}>
      {prefix}
      {display.toLocaleString('de-DE')}
      {suffix}
    </span>
  );
}

// ─── SPARKLINE ───────────────────────────────────────────────────────────────

export function Sparkline({
  data,
  width = 64,
  height = 20,
  color = C.accent,
  filled = true,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  filled?: boolean;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pad = 2;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (v - min) / range) * (height - pad * 2);
    return `${x},${y}`;
  });
  const linePath = `M${points.join(' L')}`;
  const fillPath = `${linePath} L${width - pad},${height} L${pad},${height} Z`;
  const gradId = `spark-fill-${color.replace('#', '')}`;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      {filled && <path d={fillPath} fill={`url(#${gradId})`} opacity={0.3} />}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ strokeDasharray: 200, animation: 'draw-sparkline 1s ease both' }}
      />
      <circle
        cx={parseFloat(points[points.length - 1].split(',')[0])}
        cy={parseFloat(points[points.length - 1].split(',')[1])}
        r={2}
        fill={color}
        style={{ filter: `drop-shadow(0 0 3px ${color})` }}
      />
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── PROGRESS RING ───────────────────────────────────────────────────────────

export function ProgressRing({
  value,
  max = 100,
  size = 40,
  strokeWidth = 3,
  color = C.accent,
  label,
}: {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / max) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1s cubic-bezier(0.22, 1, 0.36, 1)',
            filter: `drop-shadow(0 0 4px ${color}60)`,
          }}
        />
      </svg>
      {label && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size * 0.26,
            fontWeight: 600,
            color,
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

// ─── ANIMATED GRADIENT PRIMARY BUTTON ────────────────────────────────────────

export function GlowButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      className="s-primary-glow"
      onClick={onClick}
      style={{
        background: 'linear-gradient(135deg, #6366F1, #818CF8)',
        color: '#fff',
        border: 'none',
        borderRadius: 9,
        padding: '8px 20px',
        fontSize: 12,
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: 'inherit',
        boxShadow: '0 2px 16px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
      }}
    >
      {children}
    </button>
  );
}

// ─── TOAST NOTIFICATION SYSTEM ───────────────────────────────────────────────

type Toast = {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  icon?: string;
};

let toastIdCounter = 0;
let addToastGlobal: ((t: Omit<Toast, 'id'>) => void) | null = null;

export function showToast(message: string, type: Toast['type'] = 'info', icon?: string) {
  addToastGlobal?.({ message, type, icon });
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4000);
  }, []);

  useEffect(() => {
    addToastGlobal = addToast;
    return () => {
      addToastGlobal = null;
    };
  }, [addToast]);

  const typeStyles: Record<string, { color: string; bg: string; border: string; defaultIcon: string }> = {
    info: { color: C.accent, bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.15)', defaultIcon: ICONS.spark },
    success: { color: C.success, bg: C.successBg, border: C.successBorder, defaultIcon: ICONS.check },
    warning: { color: C.warning, bg: C.warningBg, border: C.warningBorder, defaultIcon: ICONS.zap },
    error: { color: C.danger, bg: C.dangerBg, border: C.dangerBorder, defaultIcon: ICONS.x },
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 68,
        right: 20,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => {
        const s = typeStyles[t.type];
        return (
          <div
            key={t.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 16px',
              borderRadius: 10,
              background: C.surface,
              border: `1px solid ${s.border}`,
              boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.04), 0 0 20px ${s.color}15`,
              backdropFilter: 'blur(16px)',
              animation: 'toast-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
              pointerEvents: 'auto',
              maxWidth: 360,
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: s.bg,
                border: `1px solid ${s.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <SvgIcon d={t.icon ?? s.defaultIcon} size={12} color={s.color} />
            </div>
            <span style={{ fontSize: 12, color: C.text1, fontWeight: 400, lineHeight: 1.4 }}>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── BOTTOM STATUS BAR ───────────────────────────────────────────────────────

export function StatusBar() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        height: 26,
        background: C.topbar,
        borderTop: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: C.success,
              boxShadow: `0 0 4px ${C.success}60`,
            }}
          />
          <span style={{ fontSize: 10, color: C.text3 }}>Verbunden</span>
        </div>
        <div style={{ width: 1, height: 12, background: C.border }} />
        <span style={{ fontSize: 10, color: C.text3 }}>Synchronisiert vor 2 min</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 10, color: C.text3 }}>
          <kbd
            style={{
              fontSize: 9,
              padding: '0 4px',
              borderRadius: 3,
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${C.border}`,
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              color: C.text3,
            }}
          >
            ⌘K
          </kbd>{' '}
          Suche
        </span>
        <div style={{ width: 1, height: 12, background: C.border }} />
        <span style={{ fontSize: 10, color: C.text3, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
          {time}
        </span>
      </div>
    </div>
  );
}

// ─── BREADCRUMBS ─────────────────────────────────────────────────────────────

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        animation: 'breadcrumb-in 0.3s ease both',
        marginBottom: -8,
      }}
    >
      {items.map((item, i) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {i > 0 && <SvgIcon d={ICONS.chevRight} size={10} color={C.text3} />}
          {item.href ? (
            <a
              href={item.href}
              style={{
                fontSize: 11,
                color: i === items.length - 1 ? C.text2 : C.text3,
                textDecoration: 'none',
                fontWeight: i === items.length - 1 ? 500 : 400,
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = C.accentBright;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = i === items.length - 1 ? C.text2 : C.text3;
              }}
            >
              {item.label}
            </a>
          ) : (
            <span style={{ fontSize: 11, fontWeight: 500, color: C.text2 }}>{item.label}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── HOVER CARD ──────────────────────────────────────────────────────────────

export function HoverCard({ children, content }: { children: React.ReactNode; content: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0, above: false });
  const timeout = useRef<ReturnType<typeof setTimeout>>(null);
  const cardHeight = 160; // approximate height of hover card

  function handleEnter(e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const above = spaceBelow < cardHeight + 20;

    setPos({
      x: rect.left,
      y: above ? rect.top - 6 : rect.bottom + 6,
      above,
    });
    timeout.current = setTimeout(() => setShow(true), 400);
  }
  function handleLeave() {
    if (timeout.current) clearTimeout(timeout.current);
    setShow(false);
  }

  return (
    <>
      <div onMouseEnter={handleEnter} onMouseLeave={handleLeave} style={{ display: 'inline-block' }}>
        {children}
      </div>
      {show && (
        <div
          onMouseEnter={() => setShow(true)}
          onMouseLeave={handleLeave}
          style={{
            position: 'fixed',
            left: pos.x,
            ...(pos.above ? { bottom: window.innerHeight - pos.y } : { top: pos.y }),
            zIndex: 1000,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: '14px 16px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.04)',
            backdropFilter: 'blur(16px)',
            animation: 'scaleIn 0.2s cubic-bezier(0.22, 1, 0.36, 1) both',
            maxWidth: 280,
          }}
        >
          {content}
        </div>
      )}
    </>
  );
}

// ─── ACTIVITY HEATMAP ────────────────────────────────────────────────────────

export function ActivityHeatmap({ data, weeks = 12 }: { data?: number[]; weeks?: number }) {
  const cells =
    data ??
    Array.from({ length: weeks * 7 }, (_, i) => {
      const x = Math.sin(i * 9301 + 49297) * 49979;
      return x - Math.floor(x);
    });

  function getColor(v: number) {
    if (v > 0.8) return C.accent;
    if (v > 0.6) return C.accentDim;
    if (v > 0.35) return 'rgba(99,102,241,0.25)';
    if (v > 0.1) return 'rgba(99,102,241,0.1)';
    return 'rgba(255,255,255,0.03)';
  }

  const days = ['Mo', '', 'Mi', '', 'Fr', '', ''];

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 2 }}>
        {days.map((d, i) => (
          <div
            key={i}
            style={{ width: 16, height: 11, fontSize: 9, color: C.text3, display: 'flex', alignItems: 'center' }}
          >
            {d}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 2 }}>
        {Array.from({ length: weeks }, (_, w) => (
          <div key={w} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {Array.from({ length: 7 }, (_, d) => {
              const v = cells[w * 7 + d] ?? 0;
              return (
                <div
                  key={d}
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: 2,
                    background: getColor(v),
                    boxShadow: v > 0.8 ? `0 0 4px ${C.accent}40` : 'none',
                    animation: 'heatmap-pop 0.3s ease both',
                    animationDelay: `${(w * 7 + d) * 0.005}s`,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────

export function EmptyState({
  title,
  description,
  icon = ICONS.search,
  action,
}: {
  title: string;
  description: string;
  icon?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: '56px 24px',
        textAlign: 'center',
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 2px 16px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.03)',
        animation: 'scaleIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(99,102,241,0.03))',
            border: '1px solid rgba(99,102,241,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 18px',
          }}
        >
          <SvgIcon d={icon} size={22} color={C.accent} />
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 500, color: C.text1, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
          {title}
        </h3>
        <p
          style={{
            fontSize: 12,
            color: C.text3,
            margin: '0 0 20px',
            maxWidth: 320,
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: 1.6,
          }}
        >
          {description}
        </p>
        {action}
      </div>
    </div>
  );
}

// ─── PARALLAX AMBIENT BACKGROUND ─────────────────────────────────────────────

export function ParallaxBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function handleMove(e: MouseEvent) {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      el!.style.setProperty('--px', `${x}`);
      el!.style.setProperty('--py', `${y}`);
    }
    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, '--px': '0', '--py': '0' } as React.CSSProperties}>
      <div
        style={{
          position: 'absolute',
          top: -200,
          left: -100,
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 65%)',
          filter: 'blur(40px)',
          transform: 'translate(calc(var(--px) * 20px), calc(var(--py) * 15px))',
          transition: 'transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: 'transform',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -300,
          right: -150,
          width: 800,
          height: 800,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56,189,248,0.03) 0%, transparent 65%)',
          filter: 'blur(60px)',
          transform: 'translate(calc(var(--px) * -15px), calc(var(--py) * -10px))',
          transition: 'transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: 'transform',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: '55%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(129,140,248,0.025) 0%, transparent 60%)',
          filter: 'blur(50px)',
          transform: 'translate(calc(var(--px) * 10px), calc(var(--py) * 12px))',
          transition: 'transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: 'transform',
        }}
      />
    </div>
  );
}
