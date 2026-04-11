'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  C,
  SvgIcon,
  ICONS,
  PageHeader,
  StatusBadge,
  Sparkline,
  Breadcrumbs,
  GlowButton,
  showToast,
  ProgressRing,
} from './_shared';

// ─── SPARKLINE DATA PER METRIC ───────────────────────────────────────────────

const METRIC_CARDS = [
  {
    label: 'LEADS GESAMT',
    value: '2.847',
    delta: '+124 diese Woche',
    deltaType: 'up' as const,
    gradient: 'radial-gradient(ellipse at 20% 0%, rgba(99,102,241,0.15) 0%, transparent 60%)',
    accentColor: '#818CF8',
    glowColor: 'rgba(99,102,241,0.25)',
    sparkline: [18, 24, 22, 31, 28, 35, 42],
  },
  {
    label: 'KI-SCORE Ø',
    value: '84.2',
    delta: '+2.1',
    deltaType: 'up' as const,
    gradient: 'radial-gradient(ellipse at 80% 0%, rgba(56,189,248,0.12) 0%, transparent 60%)',
    accentColor: '#38BDF8',
    glowColor: 'rgba(56,189,248,0.2)',
    sparkline: [76, 78, 79, 81, 80, 83, 84],
  },
  {
    label: 'PIPELINE',
    value: '€128.4k',
    delta: '+12% MoM',
    deltaType: 'up' as const,
    gradient: 'radial-gradient(ellipse at 50% 0%, rgba(52,211,153,0.12) 0%, transparent 60%)',
    accentColor: '#34D399',
    glowColor: 'rgba(52,211,153,0.2)',
    sparkline: [62, 78, 95, 88, 112, 118, 128],
  },
  {
    label: 'CONVERSION',
    value: '8.4%',
    delta: null,
    deltaType: null,
    gradient: 'radial-gradient(ellipse at 30% 0%, rgba(251,191,36,0.10) 0%, transparent 60%)',
    accentColor: '#FBBF24',
    glowColor: 'rgba(251,191,36,0.15)',
    sparkline: [6.2, 7.1, 6.8, 7.5, 8.0, 7.9, 8.4],
  },
];

const ACTIVITIES = [
  { text: 'Marcus Weber auf Qualifiziert gesetzt', time: 'vor 2h', color: '#34D399' },
  { text: 'Neuer Lead: Sophie Richter, Fenris Labs', time: 'vor 4h', color: '#818CF8' },
  { text: 'KI-Score Update: 23 Leads neu bewertet', time: 'vor 6h', color: '#38BDF8' },
  { text: 'Meeting mit Axflow AG transkribiert', time: 'vor 8h', color: '#A78BFA' },
  { text: 'Pipeline +€18.000 durch Tom Schreiber', time: 'vor 12h', color: '#34D399' },
];

const TOP_LEADS = [
  { name: 'Marcus Weber', company: 'Stackbase GmbH', score: 94, status: 'Qualifiziert' },
  { name: 'Tom Schreiber', company: 'Axflow AG', score: 92, status: 'In Kontakt' },
  { name: 'Clara Wolff', company: 'Silo Labs', score: 91, status: 'Qualifiziert' },
  { name: 'Sophie Richter', company: 'Fenris Labs', score: 88, status: 'In Kontakt' },
];

const UPCOMING_MEETINGS = [
  { title: 'Discovery Call', company: 'Stackbase GmbH', time: 'Heute, 14:00', type: 'Video' },
  { title: 'Demo Präsentation', company: 'Axflow AG', time: 'Morgen, 10:30', type: 'Vor Ort' },
  { title: 'Follow-Up', company: 'Vaulted GmbH', time: 'Mi, 16:00', type: 'Telefon' },
];

// ─── ENHANCED METRIC CARD WITH SPARKLINE ─────────────────────────────────────

function MetricCardWithSparkline({ m, index }: { m: (typeof METRIC_CARDS)[number]; index: number }) {
  return (
    <div
      className="s-card"
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: '18px 20px',
        position: 'relative',
        overflow: 'hidden',
        animation: 'scaleIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        animationDelay: `${index * 0.08}s`,
        boxShadow:
          '0 2px 16px rgba(0,0,0,0.25), 0 0 0 0.5px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: m.gradient, pointerEvents: 'none' }} />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${m.accentColor}40, transparent)`,
        }}
      />
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.08em', color: C.text3, fontWeight: 500 }}>{m.label}</div>
          {/* Sparkline in top-right */}
          <Sparkline data={m.sparkline} width={56} height={18} color={m.accentColor} />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span
            style={{
              fontSize: 26,
              fontWeight: 600,
              color: C.text1,
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
              letterSpacing: '-0.03em',
              textShadow: `0 0 30px ${m.glowColor}`,
            }}
          >
            {m.value}
          </span>
          {m.delta && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: m.deltaType === 'up' ? C.success : C.danger,
                display: 'flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <span style={{ fontSize: 13 }}>{m.deltaType === 'up' ? '↑' : '↓'}</span>
              {m.delta}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── BENTO COMPONENTS ────────────────────────────────────────────────────────

function BentoCard({
  children,
  span = 1,
  gradient,
  delay = 0,
  href,
}: {
  children: React.ReactNode;
  span?: number;
  gradient?: string;
  delay?: number;
  href?: string;
}) {
  const card = (
    <div
      className="s-bento"
      style={{
        gridColumn: `span ${span}`,
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: '22px 24px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 2px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
        animation: 'scaleIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        animationDelay: `${delay}s`,
        cursor: href ? 'pointer' : 'default',
      }}
    >
      {gradient && <div style={{ position: 'absolute', inset: 0, background: gradient, pointerEvents: 'none' }} />}
      <div style={{ position: 'relative' }}>{children}</div>
    </div>
  );
  if (href)
    return (
      <Link href={href} style={{ textDecoration: 'none', color: 'inherit', gridColumn: `span ${span}` }}>
        {card}
      </Link>
    );
  return card;
}

function SectionLabel({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          background: `${color}12`,
          border: `1px solid ${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <SvgIcon d={icon} size={13} color={color} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 500, color: C.text2, letterSpacing: '-0.01em' }}>{label}</span>
    </div>
  );
}

// ─── QUICK ACTIONS WITH GLOW BUTTON ──────────────────────────────────────────

function QuickActions() {
  const actions = [
    { label: 'Lead generieren', icon: ICONS.zap, color: '#818CF8', href: '/sales-v2/leads' },
    { label: 'Meeting planen', icon: ICONS.calendar, color: '#38BDF8', href: '/sales-v2/meetings' },
    { label: 'Prospects checken', icon: ICONS.target, color: '#34D399', href: '/sales-v2/prospects' },
    { label: 'Analytics', icon: ICONS.chart, color: '#FBBF24', href: '/sales-v2/analytics' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
      {actions.map((a, i) => (
        <Link
          key={a.label}
          href={a.href}
          className="s-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            padding: '18px 12px',
            borderRadius: 10,
            background: C.surface,
            border: `1px solid ${C.border}`,
            textDecoration: 'none',
            color: 'inherit',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.03)',
            animation: 'scaleIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
            animationDelay: `${0.1 + i * 0.05}s`,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: `${a.color}10`,
              border: `1px solid ${a.color}18`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SvgIcon d={a.icon} size={16} color={a.color} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 500, color: C.text2 }}>{a.label}</span>
        </Link>
      ))}
    </div>
  );
}

// ─── PAGE ────────────────────────────────────────────────────────────────────

export default function SalesV2HomePage() {
  // Smart notifications — contextual, not generic
  useEffect(() => {
    const timers = [
      setTimeout(
        () => showToast('Nexlayer CEO hat deinen LinkedIn-Post geliked → Outreach jetzt senden?', 'info'),
        4000
      ),
      setTimeout(() => showToast('Marcus Weber wartet seit 3 Tagen auf Follow-up', 'warning'), 8000),
      setTimeout(() => showToast('KI-Score für 23 Leads aktualisiert — 3 neue Hot Leads', 'success'), 12000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <>
      <Breadcrumbs items={[{ label: 'Onvero Sales', href: '/sales-v2' }, { label: 'Home' }]} />

      <PageHeader
        title="Willkommen zurück"
        subtitle="Dein Sales-Überblick für heute — Mittwoch, 9. April 2026"
        actions={
          <GlowButton onClick={() => showToast('Lead-Generator wird gestartet...', 'info')}>
            + Lead generieren
          </GlowButton>
        }
      />

      {/* KPI Metric Cards with Sparklines */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {METRIC_CARDS.map((m, i) => (
          <MetricCardWithSparkline key={m.label} m={m} index={i} />
        ))}
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Bento Grid — 3 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {/* ── Top Leads with Progress Rings — 2 cols ── */}
        <BentoCard
          span={2}
          delay={0.15}
          href="/sales-v2/leads"
          gradient="radial-gradient(ellipse at 10% 0%, rgba(99,102,241,0.06) 0%, transparent 50%)"
        >
          <SectionLabel icon={ICONS.users} label="Top Leads" color="#818CF8" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {TOP_LEADS.map((lead, i) => (
              <div
                key={lead.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: i === 0 ? 'rgba(99,102,241,0.04)' : 'transparent',
                  border: i === 0 ? '1px solid rgba(99,102,241,0.08)' : '1px solid transparent',
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    color: i === 0 ? C.accent : C.text3,
                    fontWeight: 600,
                    width: 18,
                    textAlign: 'center',
                  }}
                >
                  {i + 1}
                </span>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: `linear-gradient(135deg, ${C.surface2}, ${C.surface3})`,
                    border: `1px solid ${C.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 500,
                    color: C.text2,
                  }}
                >
                  {lead.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: C.text1 }}>{lead.name}</div>
                  <div style={{ fontSize: 11, color: C.text3, marginTop: 1 }}>{lead.company}</div>
                </div>
                {/* Progress Ring instead of just number */}
                <ProgressRing
                  value={lead.score}
                  max={100}
                  size={36}
                  strokeWidth={3}
                  color={lead.score >= 92 ? '#818CF8' : '#6366F1'}
                  label={`${lead.score}`}
                />
                <StatusBadge status={lead.status} />
              </div>
            ))}
          </div>
        </BentoCard>

        {/* ── Activity Feed — 1 col ─── */}
        <BentoCard
          span={1}
          delay={0.2}
          gradient="radial-gradient(ellipse at 90% 0%, rgba(167,139,250,0.05) 0%, transparent 50%)"
        >
          <SectionLabel icon={ICONS.clock} label="Aktivität" color="#A78BFA" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {ACTIVITIES.map((a, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '10px 0',
                  borderBottom: i < ACTIVITIES.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                  animation: 'fadeIn 0.3s ease both',
                  animationDelay: `${0.3 + i * 0.06}s`,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: a.color,
                    marginTop: 6,
                    flexShrink: 0,
                    boxShadow: `0 0 6px ${a.color}60`,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11.5, color: C.text2, lineHeight: 1.5 }}>{a.text}</div>
                  <div style={{ fontSize: 10, color: C.text3, marginTop: 3 }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </BentoCard>

        {/* ── Meetings — 1 col ─── */}
        <BentoCard
          span={1}
          delay={0.25}
          href="/sales-v2/meetings"
          gradient="radial-gradient(ellipse at 0% 100%, rgba(56,189,248,0.05) 0%, transparent 50%)"
        >
          <SectionLabel icon={ICONS.calendar} label="Nächste Meetings" color="#38BDF8" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {UPCOMING_MEETINGS.map((m, i) => (
              <div
                key={m.title}
                style={{
                  padding: '12px 14px',
                  borderRadius: 9,
                  background: i === 0 ? 'rgba(56,189,248,0.04)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${i === 0 ? 'rgba(56,189,248,0.1)' : C.border}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 500, color: C.text1 }}>{m.title}</span>
                  <span
                    style={{
                      fontSize: 9,
                      color: C.text3,
                      padding: '2px 7px',
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${C.border}`,
                      letterSpacing: '0.04em',
                      fontWeight: 500,
                    }}
                  >
                    {m.type.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>
                  {m.company} · {m.time}
                </div>
              </div>
            ))}
          </div>
        </BentoCard>

        {/* ── Market Intent — 2 cols ─── */}
        <BentoCard
          span={2}
          delay={0.3}
          href="/sales-v2/prospects"
          gradient="radial-gradient(ellipse at 80% 100%, rgba(52,211,153,0.05) 0%, transparent 50%)"
        >
          <SectionLabel icon={ICONS.zap} label="Market Intent — Neue Signale" color="#34D399" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { company: 'Nexlayer GmbH', signal: 'Sucht CRM-Lösung', score: 'Hoch', city: 'Berlin' },
              { company: 'Greenfield AG', signal: 'Sales-Team wächst', score: 'Mittel', city: 'Hamburg' },
              { company: 'Dataweave', signal: 'Budget genehmigt', score: 'Hoch', city: 'München' },
            ].map((p) => (
              <div
                key={p.company}
                style={{
                  padding: '14px 16px',
                  borderRadius: 9,
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${C.border}`,
                }}
              >
                <div style={{ fontSize: 12.5, fontWeight: 500, color: C.text1 }}>{p.company}</div>
                <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>{p.city}</div>
                <div
                  style={{
                    fontSize: 11,
                    color: C.text2,
                    marginTop: 8,
                    padding: '4px 0',
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  {p.signal}
                </div>
                <div style={{ marginTop: 8 }}>
                  <StatusBadge status={p.score} />
                </div>
              </div>
            ))}
          </div>
        </BentoCard>
      </div>

      {/* AI Suggested Actions */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          animation: 'fadeInUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.35s both',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: 'rgba(167,139,250,0.12)',
              border: '1px solid rgba(167,139,250,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SvgIcon d={ICONS.spark} size={13} color="#A78BFA" />
          </div>
          <span style={{ fontSize: 12, fontWeight: 500, color: C.text2 }}>KI-Empfehlungen</span>
        </div>
        {[
          {
            text: 'Marcus Weber wartet seit 3 Tagen auf Follow-up',
            action: 'Outreach senden',
            color: '#F87171',
            icon: ICONS.mail,
          },
          {
            text: 'Nexlayer GmbH hat ein starkes Intent-Signal — jetzt kontaktieren',
            action: 'Lead anlegen',
            color: '#34D399',
            icon: ICONS.zap,
          },
          {
            text: 'Dein Meeting mit Axflow morgen — Vorbereitung starten?',
            action: 'Vorbereiten',
            color: '#38BDF8',
            icon: ICONS.calendar,
          },
        ].map((s, i) => (
          <div
            key={i}
            className="s-bento"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 18px',
              borderRadius: 11,
              background: C.surface,
              border: `1px solid ${C.border}`,
              boxShadow: '0 2px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.03)',
              animation: 'fadeInUp 0.35s ease both',
              animationDelay: `${0.4 + i * 0.06}s`,
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: `${s.color}08`,
                border: `1px solid ${s.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <SvgIcon d={s.icon} size={14} color={s.color} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, color: C.text1 }}>{s.text}</div>
            </div>
            <button
              onClick={() => showToast(`${s.action}...`, 'info')}
              className="s-primary-glow"
              style={{
                background: `${s.color}12`,
                border: `1px solid ${s.color}20`,
                color: s.color,
                borderRadius: 7,
                padding: '6px 14px',
                fontSize: 11,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {s.action}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
