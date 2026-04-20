'use client';

import { TOKENS } from '../_tokens';

interface StatsGridProps {
  total: number;
  hot: number;
  warm: number;
  cold: number;
}

export default function StatsGrid(props: StatsGridProps) {
  const tiles = [
    {
      label: 'GESAMT',
      value: props.total,
      dotColor: TOKENS.color.textTertiary,
      dotGlow: false,
      dotBorder: false,
      bg: TOKENS.color.bgCard,
      border: TOKENS.color.borderSubtle,
      valueColor: TOKENS.color.textPrimary,
      labelColor: TOKENS.color.textMuted,
    },
    {
      label: 'HOT',
      value: props.hot,
      dotColor: TOKENS.color.indigo,
      dotGlow: true,
      dotBorder: false,
      bg: `linear-gradient(135deg, ${TOKENS.color.bgCard} 0%, #151a2e 100%)`,
      border: 'rgba(107,122,255,0.25)',
      valueColor: TOKENS.color.textPrimary,
      labelColor: TOKENS.color.indigoLight,
    },
    {
      label: 'WARM',
      value: props.warm,
      dotColor: TOKENS.color.warm,
      dotGlow: false,
      dotBorder: false,
      bg: TOKENS.color.bgCard,
      border: TOKENS.color.borderSubtle,
      valueColor: TOKENS.color.textPrimary,
      labelColor: TOKENS.color.textMuted,
    },
    {
      label: 'COLD',
      value: props.cold,
      dotColor: 'transparent',
      dotGlow: false,
      dotBorder: true,
      bg: TOKENS.color.bgCard,
      border: TOKENS.color.borderSubtle,
      valueColor: TOKENS.color.textPrimary,
      labelColor: TOKENS.color.textMuted,
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
      {tiles.map((t) => (
        <div
          key={t.label}
          style={{
            background: t.bg,
            border: `0.5px solid ${t.border}`,
            borderRadius: TOKENS.radius.card,
            padding: '18px 20px',
            fontFamily: TOKENS.font.family,
            transition: 'border-color 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: t.dotColor,
                flexShrink: 0,
                border: t.dotBorder ? `1.5px solid ${TOKENS.color.textMuted}` : 'none',
                boxShadow: t.dotGlow ? `0 0 8px ${TOKENS.color.indigo}` : 'none',
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.06em',
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
