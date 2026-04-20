'use client';

import { TOKENS } from '../_tokens';

interface StatsGridProps {
  total: number;
  hot: number;
  warm: number;
  cold: number;
}

const stats = (p: StatsGridProps) => [
  {
    label: 'GESAMT',
    value: p.total,
    dotColor: TOKENS.color.textTertiary,
    border: TOKENS.color.borderSubtle,
  },
  {
    label: 'HOT',
    value: p.hot,
    dotColor: TOKENS.color.indigo,
    border: TOKENS.color.indigoBorderSoft,
  },
  {
    label: 'WARM',
    value: p.warm,
    dotColor: 'rgba(107,122,255,0.4)',
    border: TOKENS.color.borderSubtle,
  },
  {
    label: 'COLD',
    value: p.cold,
    dotColor: 'transparent',
    dotBorder: TOKENS.color.textMuted,
    border: TOKENS.color.borderSubtle,
  },
];

export default function StatsGrid(props: StatsGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 10,
        marginBottom: 20,
      }}
    >
      {stats(props).map((s) => (
        <div
          key={s.label}
          style={{
            background: TOKENS.color.bgCard,
            border: `1px solid ${s.border}`,
            borderRadius: TOKENS.radius.card,
            padding: '16px 18px',
            fontFamily: TOKENS.font.family,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: s.dotColor,
                border: s.dotBorder ? `1.5px solid ${s.dotBorder}` : 'none',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.06em',
                color: TOKENS.color.textMuted,
                textTransform: 'uppercase' as const,
              }}
            >
              {s.label}
            </span>
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 500,
              color: TOKENS.color.textPrimary,
              fontFamily: TOKENS.font.mono,
              letterSpacing: '-0.02em',
            }}
          >
            {s.value}
          </div>
        </div>
      ))}

      <style>{`
        @media (max-width: 640px) {
          div[style*="grid-template-columns: repeat(4"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
