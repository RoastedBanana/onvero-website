'use client';

import { useState } from 'react';
import {
  C,
  SvgIcon,
  PageHeader,
  PrimaryButton,
  GhostButton,
  StatusBadge,
  ICONS,
  Breadcrumbs,
  GlowButton,
  showToast,
} from '../_shared';

// ─── TYPES ───────────────────────────────────────────────────────────────────

type IntentSignal = {
  company: string;
  city: string;
  industry: string;
  signal: string;
  signalType: 'hiring' | 'tech' | 'funding' | 'content' | 'review';
  confidence: 'Hoch' | 'Mittel' | 'Niedrig';
  detectedAt: string;
  details: string;
  website: string;
  employees: string;
};

// ─── MOCK DATA ───────────────────────────────────────────────────────────────

const SIGNALS: IntentSignal[] = [
  {
    company: 'Nexlayer GmbH',
    city: 'Berlin',
    industry: 'SaaS',
    signal: 'Sucht aktiv CRM-Lösung',
    signalType: 'content',
    confidence: 'Hoch',
    detectedAt: 'vor 2h',
    details:
      'CEO hat auf LinkedIn einen Post über CRM-Evaluation geteilt. Website zeigt neue "Sales" Unterseite in Entwicklung.',
    website: 'nexlayer.de',
    employees: '30–80',
  },
  {
    company: 'Greenfield AG',
    city: 'Hamburg',
    industry: 'CleanTech',
    signal: 'Sales-Team wächst stark',
    signalType: 'hiring',
    confidence: 'Hoch',
    detectedAt: 'vor 5h',
    details: '4 offene Sales-Stellen auf LinkedIn. Headcount im Sales hat sich in 3 Monaten verdoppelt.',
    website: 'greenfield-ag.de',
    employees: '100–250',
  },
  {
    company: 'Dataweave',
    city: 'München',
    industry: 'Data Analytics',
    signal: 'Series B abgeschlossen',
    signalType: 'funding',
    confidence: 'Hoch',
    detectedAt: 'vor 1 Tag',
    details: '€12M Series B von Point Nine Capital. Expansion nach DACH angekündigt.',
    website: 'dataweave.io',
    employees: '50–120',
  },
  {
    company: 'Cloudbridge',
    city: 'Frankfurt',
    industry: 'Cloud Infra',
    signal: 'Evaluiert Sales-Tools',
    signalType: 'review',
    confidence: 'Mittel',
    detectedAt: 'vor 1 Tag',
    details: 'G2 Review-Aktivität für Sales-Intelligence Tools. Vergleicht 3 Anbieter.',
    website: 'cloudbridge.io',
    employees: '80–150',
  },
  {
    company: 'Motionlab',
    city: 'Berlin',
    industry: 'Robotik',
    signal: 'Neuer VP Sales eingestellt',
    signalType: 'hiring',
    confidence: 'Mittel',
    detectedAt: 'vor 2 Tagen',
    details: 'VP Sales von Salesforce gewechselt. Signalisiert Aufbau eines Enterprise-Vertriebsteams.',
    website: 'motionlab.de',
    employees: '40–80',
  },
  {
    company: 'Finova',
    city: 'Zürich',
    industry: 'FinTech',
    signal: 'Tech-Stack Migration',
    signalType: 'tech',
    confidence: 'Mittel',
    detectedAt: 'vor 3 Tagen',
    details: 'Job-Posts zeigen Migration von Pipedrive zu Enterprise-Lösung. Budget-Indikator positiv.',
    website: 'finova.ch',
    employees: '60–100',
  },
  {
    company: 'Arctis Health',
    city: 'Hamburg',
    industry: 'HealthTech',
    signal: 'Content über Sales-Effizienz',
    signalType: 'content',
    confidence: 'Niedrig',
    detectedAt: 'vor 4 Tagen',
    details: 'Blogpost über "Wie wir unseren B2B-Vertrieb skalieren" veröffentlicht.',
    website: 'arctis-health.de',
    employees: '20–50',
  },
];

const SIGNAL_TYPES: Record<string, { label: string; color: string; icon: string }> = {
  hiring: { label: 'Hiring', color: '#34D399', icon: ICONS.users },
  tech: { label: 'Tech-Stack', color: '#818CF8', icon: ICONS.settings },
  funding: { label: 'Funding', color: '#FBBF24', icon: ICONS.trending },
  content: { label: 'Content', color: '#38BDF8', icon: ICONS.chat },
  review: { label: 'Review', color: '#A78BFA', icon: ICONS.eye },
};

const TYPE_FILTERS = ['Alle', 'hiring', 'tech', 'funding', 'content', 'review'];

// ─── SIGNAL CARD ─────────────────────────────────────────────────────────────

function SignalCard({ signal, index }: { signal: IntentSignal; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const st = SIGNAL_TYPES[signal.signalType];

  return (
    <div
      className="s-bento"
      onClick={() => setExpanded(!expanded)}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: '20px 22px',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 2px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
        animation: 'fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        animationDelay: `${0.1 + index * 0.06}s`,
      }}
    >
      {/* Top gradient wash based on confidence */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            signal.confidence === 'Hoch'
              ? `radial-gradient(ellipse at 0% 0%, ${st.color}08 0%, transparent 50%)`
              : 'none',
          pointerEvents: 'none',
        }}
      />

      {/* Top edge for high confidence */}
      {signal.confidence === 'Hoch' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${st.color}30, transparent)`,
          }}
        />
      )}

      <div style={{ position: 'relative' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Signal type icon */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: `${st.color}10`,
                border: `1px solid ${st.color}18`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <SvgIcon d={st.icon} size={15} color={st.color} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: C.text1, letterSpacing: '-0.01em' }}>
                {signal.company}
              </div>
              <div
                style={{ fontSize: 11, color: C.text3, marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <span>{signal.city}</span>
                <span style={{ opacity: 0.25, fontSize: 8 }}>●</span>
                <span>{signal.industry}</span>
                <span style={{ opacity: 0.25, fontSize: 8 }}>●</span>
                <span>{signal.employees} MA</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusBadge status={signal.confidence} />
            <span style={{ fontSize: 10, color: C.text3 }}>{signal.detectedAt}</span>
          </div>
        </div>

        {/* Signal description */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.02)',
            border: `1px solid rgba(255,255,255,0.04)`,
            marginBottom: expanded ? 14 : 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <SvgIcon d={ICONS.zap} size={11} color={st.color} />
            <span style={{ fontSize: 10, fontWeight: 500, color: st.color, letterSpacing: '0.04em' }}>
              {st.label.toUpperCase()} SIGNAL
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: C.text2, lineHeight: 1.6 }}>{signal.signal}</div>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div style={{ animation: 'fadeInUp 0.25s ease both' }}>
            <div
              style={{
                fontSize: 12,
                color: C.text2,
                lineHeight: 1.7,
                padding: '12px 14px',
                borderRadius: 8,
                background: 'rgba(99,102,241,0.03)',
                border: `1px solid rgba(99,102,241,0.06)`,
                marginBottom: 14,
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 500, color: C.text3, letterSpacing: '0.06em', marginBottom: 6 }}>
                ANALYSE
              </div>
              {signal.details}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <PrimaryButton>Als Lead anlegen</PrimaryButton>
              <GhostButton>Outreach generieren</GhostButton>
              <GhostButton>{signal.website}</GhostButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── STATS BAR ───────────────────────────────────────────────────────────────

function IntentStats() {
  const stats = [
    {
      label: 'NEUE SIGNALE',
      value: '18',
      color: '#818CF8',
      glow: 'rgba(99,102,241,0.25)',
      gradient: 'radial-gradient(ellipse at 20% 0%, rgba(99,102,241,0.15) 0%, transparent 60%)',
    },
    {
      label: 'HOHE KONFIDENZ',
      value: '3',
      color: '#34D399',
      glow: 'rgba(52,211,153,0.2)',
      gradient: 'radial-gradient(ellipse at 50% 0%, rgba(52,211,153,0.12) 0%, transparent 60%)',
    },
    {
      label: 'DIESE WOCHE',
      value: '7',
      color: '#38BDF8',
      glow: 'rgba(56,189,248,0.2)',
      gradient: 'radial-gradient(ellipse at 80% 0%, rgba(56,189,248,0.12) 0%, transparent 60%)',
    },
    {
      label: 'KONVERTIERT',
      value: '24%',
      color: '#FBBF24',
      glow: 'rgba(251,191,36,0.15)',
      gradient: 'radial-gradient(ellipse at 30% 0%, rgba(251,191,36,0.10) 0%, transparent 60%)',
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      {stats.map((s, i) => (
        <div
          key={s.label}
          className="s-card"
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: '16px 18px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 2px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.03)',
            animation: 'scaleIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
            animationDelay: `${i * 0.06}s`,
          }}
        >
          <div style={{ position: 'absolute', inset: 0, background: s.gradient, pointerEvents: 'none' }} />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 1,
              background: `linear-gradient(90deg, transparent, ${s.color}40, transparent)`,
            }}
          />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 10, letterSpacing: '0.08em', color: C.text3, marginBottom: 8, fontWeight: 500 }}>
              {s.label}
            </div>
            <span
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: s.color,
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                letterSpacing: '-0.03em',
                textShadow: `0 0 25px ${s.glow}`,
              }}
            >
              {s.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── PAGE ────────────────────────────────────────────────────────────────────

export default function ProspectsPage() {
  const [typeFilter, setTypeFilter] = useState('Alle');

  const filtered = typeFilter === 'Alle' ? SIGNALS : SIGNALS.filter((s) => s.signalType === typeFilter);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Onvero Sales', href: '/sales' },
          { label: 'Prospects', href: '/sales/prospects' },
          { label: 'Market Intent' },
        ]}
      />
      <PageHeader
        title="Market Intent"
        subtitle="Erkannte Kaufsignale aus dem deutschsprachigen Markt"
        actions={
          <>
            <GhostButton>Signal-Quellen</GhostButton>
            <GlowButton onClick={() => showToast('Intent-Scan wird gestartet...', 'info')}>Scan starten</GlowButton>
          </>
        }
      />

      <IntentStats />

      {/* Type filter */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
          animation: 'fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both',
        }}
      >
        {TYPE_FILTERS.map((f) => {
          const isActive = typeFilter === f;
          const st = f !== 'Alle' ? SIGNAL_TYPES[f] : null;
          return (
            <button
              key={f}
              className="s-chip"
              onClick={() => setTypeFilter(f)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                border: `1px solid ${isActive ? C.borderAccent : C.border}`,
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 11,
                fontWeight: isActive ? 500 : 400,
                background: isActive ? C.accentGhost : 'transparent',
                color: isActive ? C.accentBright : C.text3,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {st && <SvgIcon d={st.icon} size={11} color={isActive ? st.color : C.text3} />}
              {f === 'Alle' ? 'Alle Signale' : st?.label}
            </button>
          );
        })}
      </div>

      {/* Signal cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((signal, i) => (
          <SignalCard key={signal.company} signal={signal} index={i} />
        ))}
      </div>
    </>
  );
}
