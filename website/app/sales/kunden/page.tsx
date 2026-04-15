'use client';

import { C, PageHeader, Breadcrumbs, EmptyState, ICONS } from '../_shared';

export default function KundenPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: 'Onvero Sales', href: '/sales' }, { label: 'Kunden' }]} />
      <PageHeader title="Kunden" subtitle="Bestehende Kunden & aktive Accounts" />
      <div
        style={{
          borderRadius: 12,
          border: `1px solid ${C.border}`,
          background: C.surface,
          padding: 40,
        }}
      >
        <EmptyState
          title="Noch keine Kunden"
          description="Qualifizierte Leads, die zu Kunden werden, erscheinen hier automatisch."
          icon={ICONS.users}
        />
      </div>
    </>
  );
}
