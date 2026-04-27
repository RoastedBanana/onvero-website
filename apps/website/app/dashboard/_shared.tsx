'use client';

import { useEffect, useRef } from 'react';

// ─── DESIGN TOKENS — Sales-style indigo-black ────────────────────────────────

export const C = {
  bg: '#08091A',
  surface: '#0E1025',
  surface2: '#141630',
  topbar: '#0A0B1E',

  border: 'rgba(255,255,255,0.06)',
  borderLight: 'rgba(255,255,255,0.08)',
  borderAccent: 'rgba(99,102,241,0.25)',

  accent: '#818CF8',
  accentBright: '#A5B4FC',
  accentDim: '#6366F1',
  accentGhost: 'rgba(99,102,241,0.08)',

  text1: '#EEEEF8',
  text2: '#8B8FA8',
  text3: '#4E5170',

  success: '#34D399',
  danger: '#F87171',
  warning: '#FBBF24',
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
  @keyframes aiShimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  @keyframes skeletonShimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes tabIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .w-ghost { transition: all 0.15s ease; }
  .w-ghost:hover {
    border-color: rgba(99,102,241,0.3) !important;
    color: #EEEEF8 !important;
    background: rgba(99,102,241,0.05) !important;
  }
  .w-primary { transition: all 0.2s ease; }
  .w-primary:hover {
    filter: brightness(1.15);
    box-shadow: 0 0 20px rgba(99,102,241,0.3), 0 0 60px rgba(99,102,241,0.1);
  }
  .w-card { transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1); }
  .w-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 24px rgba(0,0,0,0.3), 0 0 0 0.5px rgba(255,255,255,0.08);
  }
  .w-card:hover .w-card-check {
    opacity: 1 !important;
  }
  .w-card-check:hover {
    background: rgba(99,102,241,0.85) !important;
    border-color: rgba(99,102,241,0.9) !important;
  }
  .w-tab { transition: all 0.15s ease; }
  .w-tab:hover { color: #A5B4FC !important; }

  .w-input:focus {
    border-color: rgba(99,102,241,0.4) !important;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.08) !important;
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

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

// ─── PARALLAX BACKGROUND ─────────────────────────────────────────────────────

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
    <div
      ref={containerRef}
      style={
        {
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          '--px': '0',
          '--py': '0',
        } as React.CSSProperties
      }
    >
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

// ─── BUTTONS ─────────────────────────────────────────────────────────────────

export function GhostButton({
  children,
  onClick,
  type,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  return (
    <button
      type={type ?? 'button'}
      onClick={onClick}
      disabled={disabled}
      className="w-ghost"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${C.border}`,
        color: C.text2,
        borderRadius: 8,
        padding: '8px 16px',
        fontSize: 12,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        fontWeight: 400,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

export function PrimaryButton({
  children,
  onClick,
  type,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  return (
    <button
      type={type ?? 'button'}
      onClick={onClick}
      disabled={disabled}
      className="w-primary"
      style={{
        background: 'linear-gradient(135deg, #6366F1, #818CF8)',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        padding: '8px 18px',
        fontSize: 12,
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontFamily: 'inherit',
        boxShadow: '0 2px 16px rgba(99,102,241,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {children}
    </button>
  );
}

// ─── PAGE HEADER ─────────────────────────────────────────────────────────────

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
        position: 'relative',
        zIndex: 5,
        animation: 'fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}
    >
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: C.text1, margin: 0, letterSpacing: '-0.025em' }}>{title}</h1>
        <p style={{ fontSize: 12, color: C.text3, margin: '6px 0 0', fontWeight: 400 }}>{subtitle}</p>
      </div>
      {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
    </div>
  );
}
