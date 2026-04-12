'use client';

import { useEffect, useState } from 'react';
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
import { getLeadStats, ACCOUNT } from './_lead-data';
import { useActivities, formatActivityTime, getActivityStyle } from './_activities';
import { useLeads } from './_use-leads';

// ─── HELPER: build metric cards from live data ──────────────────────────────

function buildMetrics(leads: import('./_lead-data').Lead[]) {
  const stats = getLeadStats(leads);
  const scoredLeads = leads.filter((l) => l.score !== null).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return [
    {
      label: 'LEADS GESAMT',
      value: `${stats.total}`,
      delta: `${stats.scored} gescored`,
      deltaType: 'up' as const,
      gradient: 'radial-gradient(ellipse at 20% 0%, rgba(99,102,241,0.15) 0%, transparent 60%)',
      accentColor: '#818CF8',
      glowColor: 'rgba(99,102,241,0.25)',
      sparkline: scoredLeads.slice(0, 7).map((l) => l.score ?? 0),
    },
    {
      label: 'KI-SCORE Ø',
      value: `${stats.avgScore}`,
      delta: `${stats.hot} Hot Leads`,
      deltaType: 'up' as const,
      gradient: 'radial-gradient(ellipse at 80% 0%, rgba(56,189,248,0.12) 0%, transparent 60%)',
      accentColor: '#38BDF8',
      glowColor: 'rgba(56,189,248,0.2)',
      sparkline: scoredLeads
        .slice(0, 7)
        .map((l) => l.score ?? 0)
        .reverse(),
    },
    {
      label: 'HOT LEADS',
      value: `${stats.hot}`,
      delta: `${stats.warm} warm, ${stats.cold} cold`,
      deltaType: null,
      gradient: 'radial-gradient(ellipse at 50% 0%, rgba(52,211,153,0.12) 0%, transparent 60%)',
      accentColor: '#34D399',
      glowColor: 'rgba(52,211,153,0.2)',
      sparkline: [stats.cold, stats.cold, stats.warm, stats.warm, stats.hot, stats.hot, stats.hot],
    },
    {
      label: 'MIT E-MAIL',
      value: `${leads.filter((l) => l.email).length}`,
      delta: `${leads.filter((l) => l.emailStatus === 'verified').length} verifiziert`,
      deltaType: 'up' as const,
      gradient: 'radial-gradient(ellipse at 30% 0%, rgba(251,191,36,0.10) 0%, transparent 60%)',
      accentColor: '#FBBF24',
      glowColor: 'rgba(251,191,36,0.15)',
      sparkline: leads.slice(0, 7).map((l) => (l.email ? 1 : 0)),
    },
  ];
}

// (all derived data is computed inside the component via useLeads)

// ─── ENHANCED METRIC CARD WITH SPARKLINE ─────────────────────────────────────

function MetricCardWithSparkline({ m, index }: { m: ReturnType<typeof buildMetrics>[number]; index: number }) {
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
                color: m.deltaType === 'up' ? C.success : C.text3,
                display: 'flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              {m.deltaType === 'up' && <span style={{ fontSize: 13 }}>↑</span>}
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
        flex: 1,
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
      <Link
        href={href}
        style={{ textDecoration: 'none', color: 'inherit', gridColumn: `span ${span}`, display: 'flex' }}
      >
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

// ─── QUICK ACTIONS ───────────────────────────────────────────────────────────

// ─── LIVE ACTIVITY FEED (Supabase Realtime) ──────────────────────────────────

function LiveActivityFeed() {
  const { activities, loading } = useActivities();

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '8px 0' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  height: 12,
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.04)',
                  width: '80%',
                  marginBottom: 6,
                }}
              />
              <div style={{ height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.03)', width: '40%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div style={{ padding: '16px 0', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: C.text3 }}>Noch keine Aktivität</div>
        <div style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>Aktionen werden hier live angezeigt</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {activities.slice(0, 6).map((a, i) => {
        const style = getActivityStyle(a.type);
        return (
          <div
            key={a.id}
            style={{
              display: 'flex',
              gap: 12,
              padding: '10px 0',
              borderBottom: i < Math.min(activities.length, 6) - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
              animation: 'fadeIn 0.3s ease both',
              animationDelay: `${0.1 + i * 0.05}s`,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: style.color,
                marginTop: 6,
                flexShrink: 0,
                boxShadow: `0 0 6px ${style.color}60`,
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11.5, color: C.text2, lineHeight: 1.5 }}>
                {a.title}
                {a.company_name && <span style={{ color: C.text3 }}> — {a.company_name}</span>}
              </div>
              <div style={{ fontSize: 10, color: C.text3, marginTop: 3 }}>{formatActivityTime(a.created_at)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── QUICK ACTIONS ───────────────────────────────────────────────────────────

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
  const { leads: liveLeads, loading } = useLeads();

  // Derive all data from live leads
  const stats = getLeadStats(liveLeads);
  const scoredLeads = liveLeads.filter((l) => l.score !== null).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const topLeads = scoredLeads.slice(0, 5);
  const METRIC_CARDS = buildMetrics(liveLeads);
  const topUnanswered = liveLeads
    .filter((l) => (l.score ?? 0) >= 60 && l.status === 'Neu' && l.emailDraftBody)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 3);

  // Smart notifications based on real data
  useEffect(() => {
    if (loading || liveLeads.length === 0) return;
    const top = topLeads[0];
    const timers = [
      ...(top
        ? [setTimeout(() => showToast(`Top Lead: ${top.name} (${top.company}) — Score ${top.score}`, 'info'), 3000)]
        : []),
      setTimeout(() => showToast(`${stats.hot} Hot Leads warten auf Outreach`, 'warning'), 7000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [loading]);

  const [dateStr, setDateStr] = useState('');
  useEffect(() => {
    const d = new Date();
    const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const months = [
      'Januar',
      'Februar',
      'März',
      'April',
      'Mai',
      'Juni',
      'Juli',
      'August',
      'September',
      'Oktober',
      'November',
      'Dezember',
    ];
    setDateStr(`${days[d.getDay()]}, ${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}`);
  }, []);

  return (
    <>
      <Breadcrumbs items={[{ label: 'Onvero Sales', href: '/sales-v2' }, { label: 'Home' }]} />

      <PageHeader
        title={`Willkommen zurück, ${ACCOUNT.senderName.split(' ')[0]}`}
        subtitle={dateStr ? `${ACCOUNT.companyName} · ${dateStr}` : ACCOUNT.companyName}
      />

      {/* KPI Metric Cards — real data */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: '18px 20px',
                height: 90,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                animation: 'fadeIn 0.3s ease both',
                animationDelay: `${i * 0.08}s`,
              }}
            >
              <div style={{ height: 10, width: '50%', borderRadius: 4, background: 'rgba(255,255,255,0.04)' }} />
              <div style={{ height: 20, width: '60%', borderRadius: 4, background: 'rgba(255,255,255,0.06)' }} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {METRIC_CARDS.map((m, i) => (
            <MetricCardWithSparkline key={m.label} m={m} index={i} />
          ))}
        </div>
      )}

      <QuickActions />

      {/* Bento Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {/* ── Top Leads — real data, 2 cols ── */}
        <BentoCard
          span={2}
          delay={0.15}
          gradient="radial-gradient(ellipse at 10% 0%, rgba(99,102,241,0.06) 0%, transparent 50%)"
        >
          <SectionLabel icon={ICONS.users} label={`Top ${topLeads.length} Leads`} color="#818CF8" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {topLeads.map((lead, i) => (
              <Link
                key={lead.id}
                href={`/sales-v2/leads/${lead.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: i === 0 ? 'rgba(99,102,241,0.04)' : 'transparent',
                  border: i === 0 ? '1px solid rgba(99,102,241,0.08)' : '1px solid transparent',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(99,102,241,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = i === 0 ? 'rgba(99,102,241,0.04)' : 'transparent';
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
                  <div style={{ fontSize: 11, color: C.text3, marginTop: 1 }}>
                    {lead.company} {lead.jobTitle ? `· ${lead.jobTitle}` : ''}
                  </div>
                </div>
                <ProgressRing
                  value={lead.score ?? 0}
                  max={100}
                  size={36}
                  strokeWidth={3}
                  color={(lead.score ?? 0) >= 70 ? '#818CF8' : '#FBBF24'}
                  label={lead.score ? `${lead.score}` : '—'}
                />
                <StatusBadge status={lead.status} />
              </Link>
            ))}
          </div>
        </BentoCard>

        {/* ── Activity Feed — LIVE from Supabase Realtime ── */}
        <BentoCard
          span={1}
          delay={0.2}
          gradient="radial-gradient(ellipse at 90% 0%, rgba(167,139,250,0.05) 0%, transparent 50%)"
        >
          <SectionLabel icon={ICONS.clock} label="Letzte Aktivität" color="#A78BFA" />
          <LiveActivityFeed />
        </BentoCard>
      </div>

      {/* Score + Contact — equal width, equal height */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, alignItems: 'stretch' }}>
        <BentoCard
          span={1}
          delay={0.25}
          gradient="radial-gradient(ellipse at 0% 100%, rgba(56,189,248,0.05) 0%, transparent 50%)"
        >
          <SectionLabel icon={ICONS.chart} label="Score-Verteilung" color="#38BDF8" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Hot (70+)', count: stats.hot, color: '#818CF8', pct: (stats.hot / stats.total) * 100 },
              { label: 'Warm (50–69)', count: stats.warm, color: '#FBBF24', pct: (stats.warm / stats.total) * 100 },
              { label: 'Cold (<50)', count: stats.cold, color: '#4E5170', pct: (stats.cold / stats.total) * 100 },
            ].map((d) => (
              <div key={d.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: C.text2 }}>{d.label}</span>
                  <span
                    style={{
                      fontSize: 11,
                      color: d.color,
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      fontWeight: 600,
                    }}
                  >
                    {d.count}
                  </span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${d.pct}%`,
                      height: '100%',
                      borderRadius: 3,
                      background: `linear-gradient(90deg, ${d.color}80, ${d.color})`,
                      boxShadow: `0 0 6px ${d.color}20`,
                    }}
                  />
                </div>
              </div>
            ))}
            <div style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>
              Ø Score:{' '}
              <span style={{ color: C.text2, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
                {stats.avgScore}
              </span>{' '}
              · {stats.total} Leads gesamt
            </div>
          </div>
        </BentoCard>

        <BentoCard
          span={1}
          delay={0.3}
          href="/sales-v2/leads"
          gradient="radial-gradient(ellipse at 80% 100%, rgba(248,113,113,0.04) 0%, transparent 50%)"
        >
          <SectionLabel icon={ICONS.mail} label="Kontaktdaten-Übersicht" color="#FBBF24" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              {
                label: 'Mit E-Mail',
                value: liveLeads.filter((l) => l.email).length,
                total: stats.total,
                color: '#34D399',
              },
              {
                label: 'Verifiziert',
                value: liveLeads.filter((l) => l.emailStatus === 'verified').length,
                total: stats.total,
                color: '#818CF8',
              },
              {
                label: 'Mit LinkedIn',
                value: liveLeads.filter((l) => l.linkedinUrl).length,
                total: stats.total,
                color: '#38BDF8',
              },
              {
                label: 'Mit Telefon',
                value: liveLeads.filter((l) => l.phone).length,
                total: stats.total,
                color: '#FBBF24',
              },
            ].map((d) => (
              <div
                key={d.label}
                style={{
                  padding: '12px 14px',
                  borderRadius: 9,
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid ${C.border}`,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: d.color,
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    textShadow: `0 0 20px ${d.color}30`,
                  }}
                >
                  {d.value}
                </div>
                <div style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>{d.label}</div>
                <div style={{ fontSize: 9, color: C.text3, marginTop: 2 }}>von {d.total}</div>
              </div>
            ))}
          </div>
        </BentoCard>
      </div>

      {/* AI Suggested Actions — from real lead data */}
      {topUnanswered.length > 0 && (
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
          {topUnanswered.map((lead, i) => (
            <Link
              key={lead.id}
              href={`/sales-v2/leads/${lead.id}`}
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
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'rgba(99,102,241,0.08)',
                  border: '1px solid rgba(99,102,241,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <SvgIcon d={ICONS.mail} size={14} color={C.accent} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, color: C.text1 }}>
                  {lead.name} ({lead.company}) — Score {lead.score}, E-Mail bereit
                </div>
                <div style={{ fontSize: 10.5, color: C.text3, marginTop: 2 }}>{lead.emailDraftSubject}</div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: C.accent,
                  padding: '5px 12px',
                  borderRadius: 6,
                  background: 'rgba(99,102,241,0.08)',
                  border: '1px solid rgba(99,102,241,0.12)',
                  fontWeight: 500,
                  flexShrink: 0,
                }}
              >
                Outreach senden →
              </span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
