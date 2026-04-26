'use client';

import { useState, useEffect } from 'react';

interface PageHeaderProps {
  title: string;
  badge?: { label: string; variant: 'live' | 'default' };
  subtitle?: string;
  showTime?: boolean;
}

export default function PageHeader({ title, badge, subtitle, showTime = true }: PageHeaderProps) {
  const [clock, setClock] = useState<Date | null>(null);

  useEffect(() => {
    setClock(new Date());
    if (!showTime) return;
    const tick = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(tick);
  }, [showTime]);

  const timeStr = clock
    ? clock.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';
  const sub = subtitle
    ? showTime
      ? `${subtitle} · ${timeStr}`
      : subtitle
    : showTime
      ? `Onvero BusinessOS · ${timeStr}`
      : 'Onvero BusinessOS';

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
      <style>{`@keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.7;transform:scale(0.85)}}@keyframes liveRing{0%{opacity:0.6;transform:scale(1)}100%{opacity:0;transform:scale(2.5)}}`}</style>
      <div
        style={{
          width: 3,
          height: 44,
          borderRadius: 2,
          background: 'linear-gradient(to bottom, #6B7AFF, rgba(107,122,255,0))',
          flexShrink: 0,
          marginTop: 4,
        }}
      />
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: '#fff',
              margin: 0,
              letterSpacing: '-0.02em',
              fontFamily: 'var(--font-dm-sans)',
            }}
          >
            {title}
          </h1>
          {badge && badge.variant === 'live' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 8px',
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: 20,
              }}
            >
              <div style={{ position: 'relative', width: 8, height: 8 }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    background: '#22C55E',
                    animation: 'livePulse 2s ease-in-out infinite',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: -3,
                    borderRadius: '50%',
                    border: '2px solid #22C55E',
                    opacity: 0,
                    animation: 'liveRing 2s ease-in-out infinite',
                  }}
                />
              </div>
              <span style={{ fontSize: 10, color: '#22C55E', fontWeight: 600 }}>{badge.label}</span>
            </div>
          )}
          {badge && badge.variant === 'default' && (
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.4)',
                padding: '3px 8px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 20,
              }}
            >
              {badge.label}
            </div>
          )}
        </div>
        <p
          style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.25)',
            margin: 0,
            fontFamily: 'var(--font-dm-sans)',
          }}
        >
          {sub}
        </p>
      </div>
    </div>
  );
}
