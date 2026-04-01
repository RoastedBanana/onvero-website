'use client';

import PageHeader from '@/components/ui/PageHeader';

export default function DashboardPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#f5f5f5' }}>
      <div style={{ padding: '2.5rem 2.75rem' }}>
        <PageHeader title="Home" subtitle="Übersicht & Kennzahlen" />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '50vh',
            textAlign: 'center',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.5rem',
            }}
          >
            <div style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(255,255,255,0.12)' }} />
          </div>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', maxWidth: 320 }}>
            Hier entsteht deine Übersicht mit den wichtigsten Kennzahlen und Aktivitäten.
          </p>
        </div>
      </div>
    </div>
  );
}
