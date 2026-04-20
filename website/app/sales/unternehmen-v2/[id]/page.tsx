'use client';

import { use, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TOKENS } from '../_tokens';
import { fmt } from '../_lib/formatters';
import { useCompany } from '../_hooks/useCompany';
import { useContacts } from '../_hooks/useContacts';
import Breadcrumbs from '../_components/Breadcrumbs';
import HeroCard from '../_components/HeroCard';
import TabBar from '../_components/TabBar';
import type { TabKey } from '../_components/TabBar';
import UebersichtTab from '../_components/UebersichtTab';
import ContactsTab from '../_components/ContactsTab';
import PlaceholderTab from '../_components/PlaceholderTab';

const VALID_TABS: TabKey[] = ['uebersicht', 'analyse', 'kontakte', 'outreach', 'aktivitaet'];

// ─── SKELETON ───────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div style={{ fontFamily: TOKENS.font.family }}>
      <style>{`
        @keyframes skeleton-pulse-detail {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        .sk-d { animation: skeleton-pulse-detail 1.6s ease-in-out infinite; }
      `}</style>

      {/* Breadcrumb skeleton */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
        <div className="sk-d" style={{ width: 80, height: 12, borderRadius: 4, background: TOKENS.color.bgSubtle }} />
        <div className="sk-d" style={{ width: 10, height: 12, borderRadius: 4, background: TOKENS.color.bgSubtle }} />
        <div className="sk-d" style={{ width: 90, height: 12, borderRadius: 4, background: TOKENS.color.bgSubtle }} />
      </div>

      {/* Hero skeleton */}
      <div
        style={{
          background: TOKENS.color.bgCard,
          border: `1px solid ${TOKENS.color.borderSubtle}`,
          borderRadius: TOKENS.radius.hero,
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 18,
          marginTop: 12,
        }}
      >
        <div
          className="sk-d"
          style={{ width: 64, height: 64, borderRadius: TOKENS.radius.card, background: TOKENS.color.bgSubtle }}
        />
        <div style={{ flex: 1 }}>
          <div
            className="sk-d"
            style={{ width: '50%', height: 22, borderRadius: 5, background: TOKENS.color.bgSubtle, marginBottom: 8 }}
          />
          <div
            className="sk-d"
            style={{ width: '35%', height: 13, borderRadius: 4, background: TOKENS.color.bgSubtle }}
          />
        </div>
        <div
          className="sk-d"
          style={{ width: 64, height: 64, borderRadius: '50%', background: TOKENS.color.bgSubtle }}
        />
      </div>

      {/* Tab bar skeleton */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          borderBottom: `0.5px solid ${TOKENS.color.borderSubtle}`,
          marginTop: 16,
          paddingBottom: 10,
        }}
      >
        {[80, 70, 110, 60, 65].map((w, i) => (
          <div
            key={i}
            className="sk-d"
            style={{
              width: w,
              height: 14,
              borderRadius: 4,
              background: TOKENS.color.bgSubtle,
              animationDelay: `${i * 0.08}s`,
            }}
          />
        ))}
      </div>

      {/* Content skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginTop: 20 }}>
        <div
          className="sk-d"
          style={{
            height: 240,
            borderRadius: TOKENS.radius.card,
            background: TOKENS.color.bgCard,
            border: `1px solid ${TOKENS.color.borderSubtle}`,
          }}
        />
        <div
          className="sk-d"
          style={{
            height: 240,
            borderRadius: TOKENS.radius.card,
            background: TOKENS.color.bgCard,
            border: `1px solid ${TOKENS.color.borderSubtle}`,
          }}
        />
      </div>
    </div>
  );
}

// ─── ERROR STATE ────────────────────────────────────────────────────────────

function ErrorCard({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div
      style={{
        background: TOKENS.color.bgCard,
        border: `1px solid ${TOKENS.color.amberBorder}`,
        borderRadius: TOKENS.radius.card,
        padding: '48px 32px',
        textAlign: 'center',
        fontFamily: TOKENS.font.family,
        marginTop: 20,
      }}
    >
      <h3 style={{ fontSize: 15, fontWeight: 600, color: TOKENS.color.amber, margin: '0 0 8px' }}>{message}</h3>
      <button
        onClick={onBack}
        style={{
          marginTop: 16,
          padding: '8px 18px',
          borderRadius: TOKENS.radius.button,
          background: TOKENS.color.bgSubtle,
          border: `1px solid ${TOKENS.color.borderSubtle}`,
          color: TOKENS.color.textSecondary,
          fontSize: 12,
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: TOKENS.font.family,
        }}
      >
        Zurück zur Liste
      </button>
    </div>
  );
}

// ─── INNER (needs useSearchParams inside Suspense) ──────────────────────────

function DetailInner({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { company, loading, error } = useCompany(id);
  const { contacts } = useContacts(id);

  const tabParam = searchParams.get('tab') ?? 'uebersicht';
  const activeTab: TabKey = VALID_TABS.includes(tabParam as TabKey) ? (tabParam as TabKey) : 'uebersicht';

  function setTab(tab: TabKey) {
    router.replace(`/sales/unternehmen-v2/${id}?tab=${tab}`);
  }

  if (loading) return <DetailSkeleton />;

  if (error) {
    return (
      <>
        <Breadcrumbs
          segments={[
            { label: 'Onvero Sales', href: '/sales' },
            { label: 'Unternehmen', href: '/sales/unternehmen-v2' },
            { label: 'Fehler' },
          ]}
        />
        <ErrorCard message={error} onBack={() => router.push('/sales/unternehmen-v2')} />
      </>
    );
  }

  if (!company) {
    return (
      <>
        <Breadcrumbs
          segments={[
            { label: 'Onvero Sales', href: '/sales' },
            { label: 'Unternehmen', href: '/sales/unternehmen-v2' },
            { label: 'Nicht gefunden' },
          ]}
        />
        <ErrorCard message="Unternehmen nicht gefunden" onBack={() => router.push('/sales/unternehmen-v2')} />
      </>
    );
  }

  return (
    <>
      <Breadcrumbs
        segments={[
          { label: 'Onvero Sales', href: '/sales' },
          { label: 'Unternehmen', href: '/sales/unternehmen-v2' },
          { label: fmt.text(company.company_name, 'Unbenannt') },
        ]}
      />

      <HeroCard company={company} contactsCount={contacts.length} onOutreachClick={() => setTab('outreach')} />

      <TabBar activeTab={activeTab} onTabChange={setTab} contactsCount={contacts.length} />

      {activeTab === 'uebersicht' && <UebersichtTab company={company} onOutreachClick={() => setTab('outreach')} />}
      {activeTab === 'analyse' && <PlaceholderTab title="KI-Analyse" phase="Phase 5" />}
      {activeTab === 'kontakte' && <ContactsTab leadId={company.id} />}
      {activeTab === 'outreach' && <PlaceholderTab title="Outreach" phase="Phase 5" />}
      {activeTab === 'aktivitaet' && <PlaceholderTab title="Aktivität" phase="Phase 5" />}
    </>
  );
}

// ─── PAGE ───────────────────────────────────────────────────────────────────

export default function UnternehmenV2DetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <Suspense fallback={<DetailSkeleton />}>
      <DetailInner id={id} />
    </Suspense>
  );
}
