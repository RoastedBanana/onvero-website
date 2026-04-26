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

type MonitoredCompany = {
  company: string;
  city: string;
  industry: string;
  website: string;
  addedAt: string;
  status: 'Aktiv' | 'Pausiert';
  alerts: Alert[];
  lastCheck: string;
  trackingPoints: string[];
};

type Alert = {
  type: 'hiring' | 'funding' | 'tech' | 'news' | 'social' | 'leadership';
  title: string;
  detail: string;
  time: string;
  severity: 'high' | 'medium' | 'low';
};

// ─── MOCK DATA ───────────────────────────────────────────────────────────────

const COMPANIES: MonitoredCompany[] = [
  {
    company: 'Stackbase GmbH',
    city: 'Hamburg',
    industry: 'SaaS',
    website: 'stackbase.io',
    addedAt: 'vor 14 Tagen',
    status: 'Aktiv',
    lastCheck: 'vor 12 min',
    trackingPoints: ['Hiring', 'Funding', 'Tech-Stack', 'News'],
    alerts: [
      {
        type: 'news',
        title: 'ProductHunt Launch',
        detail: 'Neues Developer-Tool auf ProductHunt gelauncht — #3 Product of the Day',
        time: 'vor 2h',
        severity: 'high',
      },
      {
        type: 'hiring',
        title: '2 neue Sales-Stellen',
        detail: 'Account Executive + SDR auf LinkedIn gepostet',
        time: 'vor 1 Tag',
        severity: 'medium',
      },
    ],
  },
  {
    company: 'Nexlayer GmbH',
    city: 'Berlin',
    industry: 'SaaS',
    website: 'nexlayer.de',
    addedAt: 'vor 7 Tagen',
    status: 'Aktiv',
    lastCheck: 'vor 8 min',
    trackingPoints: ['Hiring', 'Social', 'News'],
    alerts: [
      {
        type: 'social',
        title: 'CEO postet über CRM-Suche',
        detail: 'LinkedIn-Post: "Welches CRM nutzt ihr für B2B?" — 124 Kommentare',
        time: 'vor 5h',
        severity: 'high',
      },
      {
        type: 'tech',
        title: 'Website-Änderung erkannt',
        detail: 'Neue /sales Unterseite in Entwicklung (HTTP 200, vorher 404)',
        time: 'vor 1 Tag',
        severity: 'medium',
      },
    ],
  },
  {
    company: 'Greenfield AG',
    city: 'Hamburg',
    industry: 'CleanTech',
    website: 'greenfield-ag.de',
    addedAt: 'vor 21 Tagen',
    status: 'Aktiv',
    lastCheck: 'vor 15 min',
    trackingPoints: ['Hiring', 'Funding', 'Leadership'],
    alerts: [
      {
        type: 'hiring',
        title: 'Sales-Team verdoppelt sich',
        detail: '4 offene Sales-Positionen. Headcount-Wachstum signalisiert Expansion.',
        time: 'vor 8h',
        severity: 'high',
      },
      {
        type: 'leadership',
        title: 'Neuer CRO eingestellt',
        detail: 'Ex-HubSpot CRO Thomas Krämer wechselt zu Greenfield',
        time: 'vor 3 Tagen',
        severity: 'medium',
      },
      {
        type: 'news',
        title: 'Pressemitteilung: DACH-Expansion',
        detail: 'Greenfield expandiert nach Österreich und Schweiz ab Q3 2026',
        time: 'vor 5 Tagen',
        severity: 'low',
      },
    ],
  },
  {
    company: 'Dataweave',
    city: 'München',
    industry: 'Data Analytics',
    website: 'dataweave.io',
    addedAt: 'vor 10 Tagen',
    status: 'Aktiv',
    lastCheck: 'vor 22 min',
    trackingPoints: ['Funding', 'Hiring', 'Tech-Stack'],
    alerts: [
      {
        type: 'funding',
        title: 'Series B: €12M',
        detail: 'Point Nine Capital führt Series B an. DACH-Expansion angekündigt.',
        time: 'vor 1 Tag',
        severity: 'high',
      },
    ],
  },
  {
    company: 'Motionlab',
    city: 'Berlin',
    industry: 'Robotik',
    website: 'motionlab.de',
    addedAt: 'vor 30 Tagen',
    status: 'Aktiv',
    lastCheck: 'vor 45 min',
    trackingPoints: ['Hiring', 'Leadership', 'News'],
    alerts: [
      {
        type: 'leadership',
        title: 'Neuer VP Sales',
        detail: 'Felix Drescher (ex-Salesforce) als VP Sales eingestellt',
        time: 'vor 2 Tagen',
        severity: 'medium',
      },
    ],
  },
  {
    company: 'Cloudbridge',
    city: 'Frankfurt',
    industry: 'Cloud Infra',
    website: 'cloudbridge.io',
    addedAt: 'vor 18 Tagen',
    status: 'Pausiert',
    lastCheck: 'vor 3 Tagen',
    trackingPoints: ['Tech-Stack', 'News'],
    alerts: [],
  },
];

const ALERT_STYLES: Record<string, { label: string; color: string; icon: string }> = {
  hiring: { label: 'Hiring', color: '#34D399', icon: ICONS.users },
  funding: { label: 'Funding', color: '#FBBF24', icon: ICONS.trending },
  tech: { label: 'Tech-Stack', color: '#818CF8', icon: ICONS.settings },
  news: { label: 'News', color: '#38BDF8', icon: ICONS.inbox },
  social: { label: 'Social', color: '#A78BFA', icon: ICONS.chat },
  leadership: { label: 'Leadership', color: '#22D3EE', icon: ICONS.users },
};

const SEVERITY_STYLES: Record<string, { color: string; bg: string; border: string; label: string }> = {
  high: { color: '#F87171', bg: 'rgba(248,113,113,0.06)', border: 'rgba(248,113,113,0.15)', label: 'Wichtig' },
  medium: { color: '#FBBF24', bg: 'rgba(251,191,36,0.06)', border: 'rgba(251,191,36,0.15)', label: 'Mittel' },
  low: { color: '#4E5170', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.06)', label: 'Info' },
};

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function MonitoringStats() {
  const totalAlerts = COMPANIES.reduce((sum, c) => sum + c.alerts.length, 0);
  const highAlerts = COMPANIES.reduce((sum, c) => sum + c.alerts.filter((a) => a.severity === 'high').length, 0);
  const active = COMPANIES.filter((c) => c.status === 'Aktiv').length;

  const stats = [
    {
      label: 'BEOBACHTET',
      value: `${COMPANIES.length}`,
      sub: `${active} aktiv`,
      color: '#818CF8',
      gradient: 'radial-gradient(ellipse at 20% 0%, rgba(99,102,241,0.15) 0%, transparent 60%)',
    },
    {
      label: 'ALERTS GESAMT',
      value: `${totalAlerts}`,
      sub: 'letzte 7 Tage',
      color: '#38BDF8',
      gradient: 'radial-gradient(ellipse at 50% 0%, rgba(56,189,248,0.12) 0%, transparent 60%)',
    },
    {
      label: 'WICHTIG',
      value: `${highAlerts}`,
      sub: 'Aktion nötig',
      color: '#F87171',
      gradient: 'radial-gradient(ellipse at 80% 0%, rgba(248,113,113,0.12) 0%, transparent 60%)',
    },
    {
      label: 'LETZTER SCAN',
      value: '8m',
      sub: 'automatisch alle 30 min',
      color: '#34D399',
      gradient: 'radial-gradient(ellipse at 30% 0%, rgba(52,211,153,0.12) 0%, transparent 60%)',
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
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  color: s.color,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  letterSpacing: '-0.03em',
                  textShadow: `0 0 25px ${s.color}40`,
                }}
              >
                {s.value}
              </span>
              <span style={{ fontSize: 11, color: C.text3 }}>{s.sub}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AlertRow({ alert, index }: { alert: Alert; index: number }) {
  const as = ALERT_STYLES[alert.type];
  const sv = SEVERITY_STYLES[alert.severity];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '12px 14px',
        borderRadius: 9,
        background: alert.severity === 'high' ? `${sv.bg}` : 'rgba(255,255,255,0.01)',
        border: `1px solid ${alert.severity === 'high' ? sv.border : 'rgba(255,255,255,0.03)'}`,
        animation: 'fadeIn 0.25s ease both',
        animationDelay: `${0.2 + index * 0.04}s`,
      }}
    >
      {/* Type icon */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          background: `${as.color}10`,
          border: `1px solid ${as.color}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        <SvgIcon d={as.icon} size={12} color={as.color} />
      </div>
      {/* Content */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 12.5, fontWeight: 500, color: C.text1 }}>{alert.title}</span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: sv.color,
              padding: '1px 6px',
              borderRadius: 3,
              background: sv.bg,
              border: `1px solid ${sv.border}`,
            }}
          >
            {sv.label.toUpperCase()}
          </span>
        </div>
        <div style={{ fontSize: 11.5, color: C.text2, lineHeight: 1.5 }}>{alert.detail}</div>
        <div style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>{alert.time}</div>
      </div>
    </div>
  );
}

function CompanyCard({ company, index }: { company: MonitoredCompany; index: number }) {
  const [expanded, setExpanded] = useState(company.alerts.some((a) => a.severity === 'high'));
  const hasHighAlert = company.alerts.some((a) => a.severity === 'high');
  const isPaused = company.status === 'Pausiert';

  return (
    <div
      className="s-bento"
      style={{
        background: C.surface,
        border: `1px solid ${hasHighAlert ? 'rgba(248,113,113,0.12)' : C.border}`,
        borderRadius: 12,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 2px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
        animation: 'fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        animationDelay: `${0.1 + index * 0.06}s`,
        opacity: isPaused ? 0.5 : 1,
      }}
    >
      {/* Top edge glow for high alerts */}
      {hasHighAlert && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(248,113,113,0.3), transparent)',
          }}
        />
      )}

      {/* Header — always visible */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '20px 22px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Company avatar */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${C.surface2}, ${C.surface3})`,
              border: `1px solid ${C.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 600,
              color: C.text2,
              flexShrink: 0,
            }}
          >
            {company.company.charAt(0)}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: C.text1, letterSpacing: '-0.01em' }}>
                {company.company}
              </span>
              {isPaused && (
                <span
                  style={{
                    fontSize: 9,
                    color: C.text3,
                    padding: '1px 6px',
                    borderRadius: 3,
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${C.border}`,
                    letterSpacing: '0.04em',
                    fontWeight: 500,
                  }}
                >
                  PAUSIERT
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span>{company.city}</span>
              <span style={{ opacity: 0.25, fontSize: 8 }}>●</span>
              <span>{company.industry}</span>
              <span style={{ opacity: 0.25, fontSize: 8 }}>●</span>
              <span>{company.website}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Alert count */}
          {company.alerts.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 8,
                background: hasHighAlert ? 'rgba(248,113,113,0.08)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${hasHighAlert ? 'rgba(248,113,113,0.15)' : C.border}`,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: hasHighAlert ? '#F87171' : C.text3,
                  boxShadow: hasHighAlert ? '0 0 6px rgba(248,113,113,0.5)' : 'none',
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  color: hasHighAlert ? '#F87171' : C.text3,
                }}
              >
                {company.alerts.length} {company.alerts.length === 1 ? 'Alert' : 'Alerts'}
              </span>
            </div>
          )}

          {/* Tracking points */}
          <div style={{ display: 'flex', gap: 4 }}>
            {company.trackingPoints.map((tp) => (
              <span
                key={tp}
                style={{
                  fontSize: 9,
                  color: C.text3,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${C.border}`,
                  letterSpacing: '0.02em',
                }}
              >
                {tp}
              </span>
            ))}
          </div>

          {/* Expand indicator */}
          <span
            style={{
              fontSize: 14,
              color: C.text3,
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            ▾
          </span>
        </div>
      </div>

      {/* Expanded: alerts + actions */}
      {expanded && (
        <div
          style={{
            padding: '0 22px 20px',
            borderTop: `1px solid ${C.border}`,
            marginTop: -1,
            paddingTop: 16,
            animation: 'fadeInUp 0.25s ease both',
          }}
        >
          {company.alerts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {company.alerts.map((alert, i) => (
                <AlertRow key={alert.title} alert={alert} index={i} />
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                borderRadius: 9,
                background: 'rgba(255,255,255,0.01)',
                border: '1px solid rgba(255,255,255,0.03)',
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 12, color: C.text3 }}>Keine neuen Alerts</div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <PrimaryButton>Outreach generieren</PrimaryButton>
              <GhostButton>Als Lead anlegen</GhostButton>
              <GhostButton>Website öffnen</GhostButton>
            </div>
            <span style={{ fontSize: 10, color: C.text3 }}>
              Letzter Check: {company.lastCheck} · Beobachtet seit {company.addedAt}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PAGE ────────────────────────────────────────────────────────────────────

export default function MonitoringPage() {
  const [filter, setFilter] = useState<'alle' | 'alerts' | 'aktiv' | 'pausiert'>('alle');

  const filtered = COMPANIES.filter((c) => {
    if (filter === 'alerts') return c.alerts.length > 0;
    if (filter === 'aktiv') return c.status === 'Aktiv';
    if (filter === 'pausiert') return c.status === 'Pausiert';
    return true;
  });

  return (
    <>
      <Breadcrumbs
        items={[{ label: 'Onvero Sales', href: '/dashboard' }, { label: 'Prospects' }, { label: 'Monitoring' }]}
      />
      <PageHeader
        title="Monitoring"
        subtitle="Firmen beobachten und automatisch über Veränderungen informiert werden"
        actions={
          <>
            <GhostButton>Scan-Intervall</GhostButton>
            <GlowButton onClick={() => showToast('Firma wird zur Beobachtung hinzugefügt...', 'info')}>
              + Firma beobachten
            </GlowButton>
          </>
        }
      />

      <MonitoringStats />

      {/* Filter */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          animation: 'fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both',
        }}
      >
        {(
          [
            { id: 'alle', label: 'Alle Firmen' },
            { id: 'alerts', label: 'Mit Alerts' },
            { id: 'aktiv', label: 'Aktiv' },
            { id: 'pausiert', label: 'Pausiert' },
          ] as const
        ).map((f) => {
          const isActive = filter === f.id;
          return (
            <button
              key={f.id}
              className="s-chip"
              onClick={() => setFilter(f.id)}
              style={{
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
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Company cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((company, i) => (
          <CompanyCard key={company.company} company={company} index={i} />
        ))}
      </div>
    </>
  );
}
