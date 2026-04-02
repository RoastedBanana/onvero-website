'use client';

import { useState } from 'react';
import { MeetingsPage, MeetingsStorage } from '@/components/dashboard/MeetingsPage';
import { MeetingsAnalyse } from '@/components/dashboard/MeetingsAnalyse';
import { MeetingsPrepare } from '@/components/dashboard/MeetingsPrepare';

// Tab styling constants matching analytics page
const S = {
  tabWrap: {
    display: 'flex' as const, gap: 0, marginBottom: 24,
    borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 0,
  },
  tab: (active: boolean) => ({
    position: 'relative' as const,
    padding: '10px 20px', border: 'none', cursor: 'pointer' as const,
    fontSize: 13, fontWeight: active ? 600 : 400,
    background: 'transparent', color: active ? '#fff' : 'rgba(255,255,255,0.4)',
    transition: 'all 0.2s', borderBottom: active ? '2px solid #6B7AFF' : '2px solid transparent',
    marginBottom: -1,
  }),
  header: {
    display: 'flex' as const, justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const, marginBottom: 28,
    paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  accentBar: {
    width: 3, height: 44, borderRadius: 2, flexShrink: 0,
    background: 'linear-gradient(to bottom, #6B7AFF, rgba(107,122,255,0))',
  },
  emptyWrap: {
    display: 'flex' as const, flexDirection: 'column' as const,
    alignItems: 'center' as const, justifyContent: 'center' as const,
    height: '50vh', textAlign: 'center' as const, gap: '0.75rem',
  },
  emptyIcon: {
    width: 52, height: 52, borderRadius: 14,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
    display: 'flex' as const, alignItems: 'center' as const,
    justifyContent: 'center' as const, marginBottom: '0.5rem',
  },
};

const TABS = ['Record', 'Analyse', 'Prepare', 'Storage'] as const;
type Tab = (typeof TABS)[number];

export default function MeetingsRoute() {
  const [tab, setTab] = useState<Tab>('Record');

  return (
    <div style={{ padding: '24px 32px', width: '100%', fontFamily: 'var(--font-dm-sans)' }}>
      {/* ── Header ── */}
      <div style={S.header}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={S.accentBar} />
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', margin: 0 }}>
              Meetings
            </h1>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
              Aufnahme, Transkription & KI-Zusammenfassung
            </p>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={S.tabWrap}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={S.tab(tab === t)}>
            {t}
            {tab === t && (
              <div style={{
                position: 'absolute', bottom: -1, left: '10%', right: '10%', height: 2,
                background: '#6B7AFF',
                boxShadow: '0 0 10px rgba(107,122,255,0.5), 0 0 20px rgba(107,122,255,0.2)',
                borderRadius: 1,
              }} />
            )}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div key={tab} style={{ animation: 'fadeSlideIn 0.3s ease' }}>
        {tab === 'Record' && <MeetingsPage />}
        {tab === 'Storage' && <MeetingsStorage />}
        {tab === 'Analyse' && <MeetingsAnalyse />}
        {tab === 'Prepare' && <MeetingsPrepare />}
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
