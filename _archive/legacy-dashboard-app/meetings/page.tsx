'use client';

import { useState } from 'react';
import { MeetingsPage, MeetingsStorage } from '@/components/dashboard/MeetingsPage';
import { MeetingsAnalyse } from '@/components/dashboard/MeetingsAnalyse';
import { MeetingsPrepare } from '@/components/dashboard/MeetingsPrepare';

const TABS = [
  { key: 'record', label: 'Aufnehmen' },
  { key: 'prepare', label: 'Vorbereiten' },
  { key: 'analyse', label: 'Analyse' },
  { key: 'storage', label: 'Archiv' },
] as const;

type Tab = (typeof TABS)[number]['key'];

const ease = 'cubic-bezier(0.32,0.72,0,1)';

const S = {
  page: {
    padding: '32px 32px 24px',
    width: '100%',
    fontFamily: 'var(--font-dm-sans)',
  } as React.CSSProperties,

  /* ── Header ── */
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#e8e8e8',
    letterSpacing: '-0.03em',
    margin: 0,
    lineHeight: 1.2,
  } as React.CSSProperties,
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.25)',
    margin: '6px 0 0',
    fontWeight: 400,
  } as React.CSSProperties,

  /* ── Segmented Control ── */
  tabContainer: {
    display: 'inline-flex',
    gap: 2,
    padding: 4,
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.05)',
    marginTop: 24,
  } as React.CSSProperties,
  tab: (active: boolean): React.CSSProperties => ({
    position: 'relative',
    padding: '8px 18px',
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: active ? 500 : 400,
    fontFamily: 'inherit',
    background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
    color: active ? '#e8e8e8' : 'rgba(255,255,255,0.35)',
    borderRadius: 10,
    transition: `all 300ms ${ease}`,
    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.3), inset 0 0.5px 0 rgba(255,255,255,0.06)' : 'none',
    outline: 'none',
  }),

  /* ── Content ── */
  content: {
    marginTop: 28,
    animation: 'meetingsFadeUp 0.3s ease both',
  } as React.CSSProperties,

  /* ── Analyse placeholder ── */
  analyseCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '50vh',
    textAlign: 'center',
    gap: 14,
  } as React.CSSProperties,
  analyseCircle: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.25)',
  } as React.CSSProperties,
  analyseTitle: {
    fontSize: 16,
    fontWeight: 500,
    color: '#e8e8e8',
    margin: 0,
  } as React.CSSProperties,
  analyseDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    margin: 0,
    maxWidth: 280,
    lineHeight: 1.5,
  } as React.CSSProperties,
};

function AnalysePlaceholder() {
  return (
    <div style={S.analyseCard}>
      <div style={S.analyseCircle}>A</div>
      <p style={S.analyseTitle}>Meeting-Analyse</p>
      <p style={S.analyseDesc}>KI-gestuetzte Auswertung deiner Meetings — in Entwicklung</p>
    </div>
  );
}

export default function MeetingsRoute() {
  const [tab, setTab] = useState<Tab>('record');

  return (
    <div style={S.page}>
      {/* ── Header ── */}
      <div>
        <h1 style={S.title}>Meetings</h1>
        <p style={S.subtitle}>Aufnahme, Transkription und KI-Zusammenfassung</p>
      </div>

      {/* ── Segmented Control ── */}
      <div style={S.tabContainer}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={S.tab(tab === t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div key={tab} style={S.content}>
        {tab === 'record' && <MeetingsPage />}
        {tab === 'prepare' && <MeetingsPrepare onGoToRecord={() => setTab('record')} />}
        {tab === 'analyse' && <AnalysePlaceholder />}
        {tab === 'storage' && <MeetingsStorage />}
      </div>

      <style>{`
        @keyframes meetingsFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
