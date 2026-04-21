'use client';

import { TOKENS } from '../_tokens';

export default function NextActionBanner({
  nextAction,
  onDraftClick,
}: {
  nextAction: string | null;
  onDraftClick: () => void;
}) {
  if (!nextAction) return null;

  return (
    <>
      <style>{`
      @keyframes bannerPulse {
        0%, 100% { border-color: rgba(107,122,255,0.25); }
        50% { border-color: rgba(107,122,255,0.4); }
      }
    `}</style>
      <div
        style={{
          background: `linear-gradient(135deg, ${TOKENS.color.indigoBgSubtle}, transparent)`,
          border: `0.5px solid ${TOKENS.color.indigoBorderSoft}`,
          borderRadius: TOKENS.radius.card,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
          fontFamily: TOKENS.font.family,
          animation: 'bannerPulse 3s ease-in-out infinite',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: TOKENS.radius.button,
            background: TOKENS.color.indigoBgSoft,
            border: `1px solid ${TOKENS.color.indigoBorderSoft}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke={TOKENS.color.indigo}
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.06em',
              color: TOKENS.color.indigoLight,
              marginBottom: 4,
            }}
          >
            NÄCHSTER SCHRITT (KI-EMPFEHLUNG)
          </div>
          <div style={{ fontSize: 14.5, color: TOKENS.color.textSecondary, lineHeight: 1.55 }}>{nextAction}</div>
        </div>

        {/* CTA */}
        <button
          onClick={onDraftClick}
          style={{
            padding: '7px 14px',
            borderRadius: TOKENS.radius.button,
            background: TOKENS.color.indigoBgSoft,
            border: `1px solid ${TOKENS.color.indigoBorderSoft}`,
            color: TOKENS.color.indigoLight,
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: TOKENS.font.family,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Draft erstellen &rarr;
        </button>
      </div>
    </>
  );
}
