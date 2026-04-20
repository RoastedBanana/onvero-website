'use client';

import { use } from 'react';
import { Breadcrumbs, PageHeader } from '../../_shared';
import { TOKENS } from '../_tokens';

export default function UnternehmenV2DetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Onvero Sales', href: '/sales' },
          { label: 'Unternehmen', href: '/sales/unternehmen-v2' },
          { label: id },
        ]}
      />
      <PageHeader title={id} subtitle="Unternehmens-Detail" />

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
          Detail-Seite
        </h2>
        <p style={{ fontSize: 13, color: TOKENS.color.textTertiary, margin: 0, lineHeight: 1.6 }}>
          Phase 3 baut den Inhalt.
        </p>
      </div>
    </>
  );
}
