'use client';

import { TOKENS } from '../_tokens';

interface EmptyStateProps {
  title: string;
  subtitle: string;
  cta?: { label: string; onClick: () => void };
}

export default function EmptyState({ title, subtitle, cta }: EmptyStateProps) {
  return (
    <div
      style={{
        background: TOKENS.color.bgCard,
        border: `1px solid ${TOKENS.color.borderSubtle}`,
        borderRadius: TOKENS.radius.cardLarge,
        padding: '64px 32px',
        textAlign: 'center',
        fontFamily: TOKENS.font.family,
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: TOKENS.radius.card,
          background: TOKENS.color.bgSubtle,
          border: `1px solid ${TOKENS.color.borderSubtle}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={TOKENS.color.textMuted}
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </div>

      <h3
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: TOKENS.color.textPrimary,
          margin: '0 0 6px',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: 13,
          color: TOKENS.color.textTertiary,
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {subtitle}
      </p>

      {cta && (
        <button
          onClick={cta.onClick}
          style={{
            marginTop: 20,
            padding: '8px 20px',
            borderRadius: TOKENS.radius.button,
            background: TOKENS.color.indigoBgSoft,
            border: `1px solid ${TOKENS.color.indigoBorderSoft}`,
            color: TOKENS.color.indigoLight,
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: TOKENS.font.family,
            transition: 'background 0.15s',
          }}
        >
          {cta.label}
        </button>
      )}
    </div>
  );
}
