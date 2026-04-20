'use client';

import { TOKENS } from '../_tokens';

export default function PlaceholderTab({ title, phase }: { title: string; phase: string }) {
  return (
    <div
      style={{
        background: TOKENS.color.bgCard,
        border: `1px solid ${TOKENS.color.borderSubtle}`,
        borderRadius: TOKENS.radius.card,
        padding: '64px 32px',
        textAlign: 'center',
        fontFamily: TOKENS.font.family,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: TOKENS.radius.card,
          background: TOKENS.color.bgSubtle,
          border: `1px solid ${TOKENS.color.borderSubtle}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke={TOKENS.color.textMuted}
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 12h6M12 9v6" />
        </svg>
      </div>
      <h3
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: TOKENS.color.textPrimary,
          margin: '0 0 6px',
        }}
      >
        {title}
      </h3>
      <p style={{ fontSize: 13, color: TOKENS.color.textMuted, margin: 0 }}>Kommt in {phase}</p>
    </div>
  );
}
