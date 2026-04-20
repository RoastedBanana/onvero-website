'use client';

import { TOKENS } from '../_tokens';

export default function EmptyInline({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: '10px 12px',
        background: TOKENS.color.bgInset,
        border: `0.5px dashed ${TOKENS.color.indigoBorderSoft}`,
        borderRadius: TOKENS.radius.button,
        fontFamily: TOKENS.font.family,
        fontSize: 12,
        color: TOKENS.color.textTertiary,
        fontStyle: 'italic',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: TOKENS.color.indigo,
          opacity: 0.6,
          flexShrink: 0,
        }}
      />
      {label}
    </div>
  );
}
