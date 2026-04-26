'use client';

import { TOKENS } from '../_tokens';

function SkeletonCard({ delay }: { delay: number }) {
  return (
    <div
      style={{
        background: TOKENS.color.bgCard,
        border: `1px solid ${TOKENS.color.borderSubtle}`,
        borderRadius: TOKENS.radius.card,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        animation: `skeleton-pulse 1.6s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: TOKENS.radius.button, background: TOKENS.color.bgSubtle }} />
        <div style={{ flex: 1 }}>
          <div
            style={{ height: 14, width: '65%', borderRadius: 4, background: TOKENS.color.bgSubtle, marginBottom: 6 }}
          />
          <div style={{ height: 10, width: '40%', borderRadius: 4, background: TOKENS.color.bgSubtle }} />
        </div>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: TOKENS.color.bgSubtle }} />
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', gap: 6 }}>
        <div style={{ height: 20, width: 48, borderRadius: TOKENS.radius.chip, background: TOKENS.color.bgSubtle }} />
        <div style={{ height: 20, width: 80, borderRadius: TOKENS.radius.chip, background: TOKENS.color.bgSubtle }} />
      </div>

      {/* Summary */}
      <div>
        <div
          style={{ height: 11, width: '95%', borderRadius: 3, background: TOKENS.color.bgSubtle, marginBottom: 5 }}
        />
        <div style={{ height: 11, width: '70%', borderRadius: 3, background: TOKENS.color.bgSubtle }} />
      </div>

      {/* Footer */}
      <div style={{ height: 0, borderTop: `0.5px solid ${TOKENS.color.borderSubtle}` }} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ height: 10, width: 100, borderRadius: 3, background: TOKENS.color.bgSubtle }} />
        <div style={{ height: 20, width: 60, borderRadius: TOKENS.radius.chip, background: TOKENS.color.bgSubtle }} />
      </div>
    </div>
  );
}

export default function SkeletonGrid() {
  return (
    <>
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 12,
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} delay={i * 0.1} />
        ))}
      </div>
    </>
  );
}
