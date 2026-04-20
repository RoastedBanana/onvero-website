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
        maxWidth: 420,
        margin: '60px auto',
        background: TOKENS.color.bgCard,
        border: `0.5px dashed rgba(107,122,255,0.25)`,
        borderRadius: TOKENS.radius.hero,
        padding: '40px 32px',
        textAlign: 'center',
        fontFamily: TOKENS.font.family,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: TOKENS.radius.cardLarge,
          background: TOKENS.color.indigoBgSubtle,
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
          stroke={TOKENS.color.indigo}
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
          fontWeight: 500,
          color: TOKENS.color.textPrimary,
          margin: '0 0 6px',
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
            padding: '10px 20px',
            borderRadius: TOKENS.radius.button,
            background: `linear-gradient(135deg, ${TOKENS.color.indigo} 0%, #7A89FF 100%)`,
            border: 'none',
            color: '#0a0a0a',
            fontSize: 12.5,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: TOKENS.font.family,
            boxShadow: '0 2px 8px rgba(107,122,255,0.2)',
            transition: 'all 0.15s ease',
          }}
        >
          {cta.label}
        </button>
      )}
    </div>
  );
}
