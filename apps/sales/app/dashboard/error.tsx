'use client';

import { C, GhostButton, SvgIcon, ICONS } from './_shared';

export default function SalesError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
        gap: 16,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: 'rgba(248,113,113,0.08)',
          border: '1px solid rgba(248,113,113,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <SvgIcon d={ICONS.x} size={20} color="#F87171" />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: C.text1 }}>Etwas ist schiefgelaufen</div>
      <div style={{ fontSize: 12, color: C.text3, maxWidth: 360, lineHeight: 1.6 }}>
        {error.message || 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.'}
      </div>
      <GhostButton onClick={reset}>Erneut versuchen</GhostButton>
    </div>
  );
}
