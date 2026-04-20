'use client';

import { TOKENS } from '../_tokens';
import { fmt } from '../_lib/formatters';
import type { Company } from '../_types';

function Bar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(value / max, 1) * 100;
  const color = pct >= 80 ? TOKENS.color.indigo : pct >= 50 ? 'rgba(107,122,255,0.5)' : TOKENS.color.borderDefault;

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11.5, color: TOKENS.color.textSecondary }}>{label}</span>
        <span style={{ fontSize: 11, fontFamily: TOKENS.font.mono, color: TOKENS.color.textTertiary }}>{value}</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: TOKENS.color.bgSubtle, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: 2,
            background: color,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
    </div>
  );
}

export default function ScoreBreakdownCard({ company }: { company: Company }) {
  const s = fmt.score(company.fit_score);

  // Derive rough breakdown from available data
  const fitRaw = company.fit_score ?? 0;
  const hasContacts = company.linkedin_url || company.website ? 1 : 0;
  const growthCount = company.growth_signals?.length ?? 0;
  const hasDigitalPresence = [company.primary_domain, company.website, company.linkedin_url].filter(Boolean).length;

  const bars = [
    { label: 'Unternehmensfit', value: fitRaw },
    { label: 'Digitale Präsenz', value: Math.min(hasDigitalPresence * 33, 100) },
    { label: 'Kaufsignale', value: Math.min(growthCount * 20, 100) },
    { label: 'Erreichbarkeit', value: hasContacts * 70 },
  ];

  // Large score ring
  const size = 100;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - s.value / 100);
  const ringColor =
    s.value >= 60 ? TOKENS.color.indigo : s.value >= 30 ? 'rgba(107,122,255,0.4)' : TOKENS.color.borderSubtle;

  return (
    <div
      style={{
        background: TOKENS.color.bgCard,
        border: `1px solid ${TOKENS.color.borderSubtle}`,
        borderRadius: TOKENS.radius.card,
        padding: '22px 24px',
        fontFamily: TOKENS.font.family,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.06em',
          color: TOKENS.color.textMuted,
          textTransform: 'uppercase' as const,
          display: 'block',
          marginBottom: 16,
        }}
      >
        SCORE-BREAKDOWN
      </span>

      {/* Score ring centered */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <div style={{ position: 'relative', width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={TOKENS.color.borderSubtle}
              strokeWidth={stroke}
            />
            {s.value > 0 && (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={ringColor}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            )}
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
                fontSize: 28,
                fontWeight: 600,
                fontFamily: TOKENS.font.mono,
                color: s.value > 0 ? TOKENS.color.textPrimary : TOKENS.color.textMuted,
                lineHeight: 1,
              }}
            >
              {s.display}
            </span>
            <span style={{ fontSize: 9, color: TOKENS.color.textMuted, letterSpacing: '0.06em', marginTop: 3 }}>
              FIT-SCORE
            </span>
          </div>
        </div>
      </div>

      {/* Bars */}
      {bars.map((b) => (
        <Bar key={b.label} label={b.label} value={b.value} />
      ))}

      <div style={{ fontSize: 10, color: TOKENS.color.textMuted, marginTop: 4, textAlign: 'center' }}>
        Basierend auf KI-Analyse
      </div>
    </div>
  );
}
