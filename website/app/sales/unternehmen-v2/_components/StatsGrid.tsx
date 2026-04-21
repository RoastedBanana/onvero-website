'use client';

import { TOKENS } from '../_tokens';

interface StatsGridProps {
  total: number;
  hot: number;
  warm: number;
  cold: number;
}

const tiles = (props: StatsGridProps) => [
  {
    label: 'GESAMT',
    value: props.total,
    dot: { color: TOKENS.color.textMuted, glow: false, border: false },
    bg: TOKENS.color.bgCard,
    border: TOKENS.color.borderSubtle,
    valueColor: TOKENS.color.textPrimary,
    labelColor: TOKENS.color.textMuted,
    accent: false,
  },
  {
    label: 'HOT',
    value: props.hot,
    dot: { color: TOKENS.color.indigo, glow: true, border: false },
    bg: `linear-gradient(145deg, ${TOKENS.color.bgCard} 0%, rgba(107,122,255,0.08) 100%)`,
    border: 'rgba(107,122,255,0.28)',
    valueColor: TOKENS.color.indigoLight,
    labelColor: TOKENS.color.indigo,
    accent: true,
    accentColor: TOKENS.color.indigo,
  },
  {
    label: 'WARM',
    value: props.warm,
    dot: { color: TOKENS.color.warm, glow: false, border: false },
    bg: `linear-gradient(145deg, ${TOKENS.color.bgCard} 0%, rgba(245,169,127,0.05) 100%)`,
    border: 'rgba(245,169,127,0.22)',
    valueColor: TOKENS.color.warm,
    labelColor: TOKENS.color.warm,
    accent: true,
    accentColor: TOKENS.color.warm,
  },
  {
    label: 'COLD',
    value: props.cold,
    dot: { color: 'rgba(147,197,253,0.55)', glow: false, border: false },
    bg: `linear-gradient(145deg, ${TOKENS.color.bgCard} 0%, rgba(147,197,253,0.03) 100%)`,
    border: 'rgba(147,197,253,0.16)',
    valueColor: 'rgba(147,197,253,0.75)',
    labelColor: 'rgba(147,197,253,0.55)',
    accent: true,
    accentColor: 'rgba(147,197,253,0.55)',
  },
];

export default function StatsGrid(props: StatsGridProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
      {tiles(props).map((t) => (
        <div
          key={t.label}
          style={{
            background: t.bg,
            border: `0.5px solid ${t.border}`,
            borderRadius: TOKENS.radius.card,
            padding: '18px 20px',
            fontFamily: TOKENS.font.family,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle accent bar at top */}
          {t.accent && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: `linear-gradient(90deg, transparent, ${t.accentColor}, transparent)`,
                opacity: 0.6,
              }}
            />
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: t.dot.color,
                flexShrink: 0,
                boxShadow: t.dot.glow ? `0 0 10px ${TOKENS.color.indigo}, 0 0 20px rgba(107,122,255,0.4)` : 'none',
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.07em',
                color: t.labelColor,
                textTransform: 'uppercase' as const,
              }}
            >
              {t.label}
            </span>
          </div>

          <div
            style={{
              fontSize: 32,
              fontWeight: 500,
              color: t.valueColor,
              fontFamily: TOKENS.font.mono,
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}
          >
            {t.value}
          </div>
        </div>
      ))}
    </div>
  );
}
