'use client';

import React from 'react';

export function GlassPageFilters() {
  return (
    <svg
      aria-hidden="true"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}
    >
      <defs>
        <filter id="glass-distort" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.004 0.008" numOctaves="1" result="turbulence" />
          <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="80" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}

export interface GlassCardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  isDark?: boolean;
  borderRadius?: number | string;
}

export function GlassCard({ children, style, isDark = false, borderRadius = 16 }: GlassCardProps) {
  const br = typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius;
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        ...style,
        background: isDark ? 'rgba(10, 12, 24, 0.46)' : 'rgba(255, 255, 255, 0.22)',
        backdropFilter: 'blur(22px)',
        WebkitBackdropFilter: 'blur(22px)',
        borderRadius: br,
        border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.55)',
        boxShadow: isDark
          ? 'inset 1px 1px 2px rgba(255,255,255,0.08), inset -1px -1px 2px rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.32)'
          : 'inset 2px 2px 3px rgba(255,255,255,0.50), inset -1px -1px 2px rgba(255,255,255,0.30), 0 4px 20px rgba(0,0,0,0.06)',
      }}
    >
      {/* Liquid bend layer — turbulence distortion on what shows through the glass */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: br,
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          filter: 'url(#glass-distort)',
          zIndex: 0,
        }}
      />
      {/* Content — above visual layers */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        {children}
      </div>
    </div>
  );
}
