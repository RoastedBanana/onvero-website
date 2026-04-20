'use client';

import { Breadcrumbs, PageHeader } from '../_shared';
import { TOKENS } from './_tokens';

export default function UnternehmenV2Page() {
  return (
    <>
      <Breadcrumbs items={[{ label: 'Onvero Sales', href: '/sales' }, { label: 'Unternehmen' }]} />
      <PageHeader title="Unternehmen" subtitle="Alle Unternehmen im Blick" />

      <div
        style={{
          background: TOKENS.color.bgCard,
          border: `1px solid ${TOKENS.color.borderSubtle}`,
          borderRadius: TOKENS.radius.card,
          padding: '48px 32px',
          textAlign: 'center',
          fontFamily: TOKENS.font.family,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: TOKENS.radius.card,
            background: TOKENS.color.indigoBgSubtle,
            border: `1px solid ${TOKENS.color.indigoBorderSoft}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: 20,
          }}
        >
          <span style={{ color: TOKENS.color.indigo }}>v2</span>
        </div>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: TOKENS.color.textPrimary,
            margin: '0 0 8px',
            letterSpacing: '-0.02em',
          }}
        >
          Neue Unternehmen-Seite
        </h2>
        <p style={{ fontSize: 13, color: TOKENS.color.textTertiary, margin: 0, lineHeight: 1.6 }}>
          Phase 1 abgeschlossen. Phase 2 baut die Liste.
        </p>
      </div>
    </>
  );
}
