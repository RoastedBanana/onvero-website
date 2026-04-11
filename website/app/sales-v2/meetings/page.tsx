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
} from '../_shared';

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Meeting = {
  title: string;
  company: string;
  contact: string;
  date: string;
  time: string;
  type: 'Video' | 'Vor Ort' | 'Telefon';
  status: 'Geplant' | 'Aktiv' | 'Abgeschlossen';
  duration?: string;
  summary?: string;
  aiInsights?: string[];
};

type Tab = 'upcoming' | 'record' | 'archive';

// ─── MOCK DATA ───────────────────────────────────────────────────────────────

const UPCOMING: Meeting[] = [
  {
    title: 'Discovery Call',
    company: 'Stackbase GmbH',
    contact: 'Marcus Weber',
    date: 'Heute',
    time: '14:00',
    type: 'Video',
    status: 'Geplant',
  },
  {
    title: 'Demo Präsentation',
    company: 'Axflow AG',
    contact: 'Tom Schreiber',
    date: 'Morgen',
    time: '10:30',
    type: 'Vor Ort',
    status: 'Geplant',
  },
  {
    title: 'Follow-Up Gespräch',
    company: 'Vaulted GmbH',
    contact: 'Anna Bergmann',
    date: 'Mi, 11. Apr',
    time: '16:00',
    type: 'Telefon',
    status: 'Geplant',
  },
  {
    title: 'Vertragsverhandlung',
    company: 'Fenris Labs',
    contact: 'Sophie Richter',
    date: 'Do, 12. Apr',
    time: '09:00',
    type: 'Video',
    status: 'Geplant',
  },
];

const ARCHIVE: Meeting[] = [
  {
    title: 'Erstgespräch',
    company: 'Silo Labs',
    contact: 'Clara Wolff',
    date: '7. Apr',
    time: '11:00',
    type: 'Video',
    status: 'Abgeschlossen',
    duration: '32 min',
    summary:
      'Clara sucht eine Lösung für Lead-Qualifizierung. Aktuell nutzen sie nur Excel. Budget vorhanden, Entscheidung Q2.',
    aiInsights: ['Hohe Kaufbereitschaft erkannt', 'Budget-Signal: Q2 Entscheidung', 'Nächster Schritt: Demo anbieten'],
  },
  {
    title: 'Produktdemo',
    company: 'Deepmark',
    contact: 'Jonas Braun',
    date: '5. Apr',
    time: '14:30',
    type: 'Video',
    status: 'Abgeschlossen',
    duration: '48 min',
    summary:
      'Jonas war beeindruckt von der KI-Scoring-Funktion. Bedenken: Datenschutz und DSGVO-Konformität. Will intern abstimmen.',
    aiInsights: ['Bedenken: DSGVO-Konformität', 'Champion identifiziert: Jonas', 'Blocker: Interne Abstimmung nötig'],
  },
  {
    title: 'Quarterly Review',
    company: 'Kairon Medical',
    contact: 'Elena Hartmann',
    date: '2. Apr',
    time: '10:00',
    type: 'Vor Ort',
    status: 'Abgeschlossen',
    duration: '55 min',
    summary: 'Bestandskunde. Zufrieden mit der Plattform, möchte Outreach-Modul testen. Upsell-Potenzial €3.000/Monat.',
    aiInsights: ['Upsell-Potenzial: €3.000/Mo', 'Stimmung: Sehr positiv', 'Action: Outreach-Modul Demo planen'],
  },
];

// ─── MEETING TYPE STYLES ─────────────────────────────────────────────────────

const TYPE_STYLES: Record<string, { color: string; icon: string }> = {
  Video: { color: '#818CF8', icon: ICONS.play },
  'Vor Ort': { color: '#34D399', icon: ICONS.globe },
  Telefon: { color: '#FBBF24', icon: ICONS.mic },
};

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function MeetingStats() {
  const stats = [
    {
      label: 'DIESE WOCHE',
      value: '4',
      color: '#818CF8',
      gradient: 'radial-gradient(ellipse at 20% 0%, rgba(99,102,241,0.15) 0%, transparent 60%)',
    },
    {
      label: 'DURCHSCHN. DAUER',
      value: '38m',
      color: '#38BDF8',
      gradient: 'radial-gradient(ellipse at 50% 0%, rgba(56,189,248,0.12) 0%, transparent 60%)',
    },
    {
      label: 'TRANSKRIBIERT',
      value: '12',
      color: '#A78BFA',
      gradient: 'radial-gradient(ellipse at 80% 0%, rgba(167,139,250,0.12) 0%, transparent 60%)',
    },
    {
      label: 'KI-INSIGHTS',
      value: '34',
      color: '#34D399',
      gradient: 'radial-gradient(ellipse at 30% 0%, rgba(52,211,153,0.10) 0%, transparent 60%)',
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
                textShadow: `0 0 25px ${s.color}40`,
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

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'upcoming', label: 'Anstehend', icon: ICONS.calendar },
    { id: 'record', label: 'Aufnehmen', icon: ICONS.mic },
    { id: 'archive', label: 'Archiv', icon: ICONS.folder },
  ];

  return (
    <div
      style={{
        display: 'flex',
        gap: 2,
        padding: 3,
        borderRadius: 10,
        background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${C.border}`,
        width: 'fit-content',
        animation: 'fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both',
      }}
    >
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            className="s-tab"
            onClick={() => onChange(t.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: isActive ? C.accentGhost : 'transparent',
              color: isActive ? C.accentBright : C.text3,
              fontSize: 12,
              fontWeight: isActive ? 500 : 400,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s ease',
              boxShadow: isActive ? 'inset 0 0 0 0.5px rgba(99,102,241,0.2)' : 'none',
            }}
          >
            <SvgIcon d={t.icon} size={13} color={isActive ? C.accent : C.text3} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function UpcomingMeetings() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {UPCOMING.map((m, i) => {
        const ts = TYPE_STYLES[m.type];
        const isToday = m.date === 'Heute';
        return (
          <div
            key={m.title + m.company}
            className="s-bento"
            style={{
              background: C.surface,
              border: `1px solid ${isToday ? `${ts.color}20` : C.border}`,
              borderRadius: 12,
              padding: '20px 22px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 2px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
              animation: 'fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
              animationDelay: `${0.15 + i * 0.06}s`,
            }}
          >
            {isToday && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  background: `linear-gradient(90deg, transparent, ${ts.color}40, transparent)`,
                }}
              />
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
              {/* Time block */}
              <div
                style={{
                  minWidth: 64,
                  textAlign: 'center',
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: isToday ? `${ts.color}08` : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isToday ? `${ts.color}15` : C.border}`,
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: isToday ? ts.color : C.text1,
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    letterSpacing: '-0.02em',
                    textShadow: isToday ? `0 0 20px ${ts.color}40` : 'none',
                  }}
                >
                  {m.time}
                </div>
                <div style={{ fontSize: 10, color: C.text3, marginTop: 2, fontWeight: 500 }}>{m.date}</div>
              </div>

              {/* Divider */}
              <div style={{ width: 1, height: 40, background: C.border }} />

              {/* Meeting info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: C.text1, letterSpacing: '-0.01em' }}>{m.title}</div>
                <div
                  style={{
                    fontSize: 12,
                    color: C.text2,
                    marginTop: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <span>{m.contact}</span>
                  <span style={{ opacity: 0.25, fontSize: 8 }}>●</span>
                  <span>{m.company}</span>
                </div>
              </div>

              {/* Type badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  borderRadius: 7,
                  background: `${ts.color}08`,
                  border: `1px solid ${ts.color}15`,
                }}
              >
                <SvgIcon d={ts.icon} size={12} color={ts.color} />
                <span style={{ fontSize: 11, fontWeight: 500, color: ts.color }}>{m.type}</span>
              </div>

              {/* Action */}
              {isToday && <PrimaryButton>Beitreten</PrimaryButton>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RecordView() {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: '40px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
        animation: 'scaleIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both',
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative' }}>
        {/* Mic icon */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(99,102,241,0.05))',
            border: '1px solid rgba(99,102,241,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <SvgIcon d={ICONS.mic} size={28} color={C.accent} />
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 600, color: C.text1, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          Meeting aufnehmen
        </h2>
        <p
          style={{
            fontSize: 13,
            color: C.text3,
            margin: '0 0 28px',
            maxWidth: 400,
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: 1.6,
          }}
        >
          Starte eine Aufnahme und Onvero transkribiert, analysiert und fasst dein Meeting automatisch zusammen.
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <PrimaryButton>Aufnahme starten</PrimaryButton>
          <GhostButton>Audio importieren</GhostButton>
        </div>

        {/* Features */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 14,
            marginTop: 36,
            paddingTop: 28,
            borderTop: `1px solid ${C.border}`,
          }}
        >
          {[
            {
              icon: ICONS.chat,
              label: 'Live-Transkription',
              desc: 'Echtzeit-Text während des Gesprächs',
              color: '#818CF8',
            },
            {
              icon: ICONS.spark,
              label: 'KI-Zusammenfassung',
              desc: 'Automatische Zusammenfassung + Action Items',
              color: '#34D399',
            },
            {
              icon: ICONS.trending,
              label: 'Stimmungsanalyse',
              desc: 'Erkennt Kaufsignale und Bedenken',
              color: '#FBBF24',
            },
          ].map((f) => (
            <div key={f.label} style={{ textAlign: 'center', padding: '16px 12px' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  background: `${f.color}08`,
                  border: `1px solid ${f.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                }}
              >
                <SvgIcon d={f.icon} size={15} color={f.color} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: C.text1, marginBottom: 4 }}>{f.label}</div>
              <div style={{ fontSize: 11, color: C.text3, lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ArchiveView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {ARCHIVE.map((m, i) => {
        const ts = TYPE_STYLES[m.type];
        return (
          <div
            key={m.title + m.company}
            className="s-bento"
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: '22px 24px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 2px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
              animation: 'fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
              animationDelay: `${0.1 + i * 0.06}s`,
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: `${ts.color}08`,
                    border: `1px solid ${ts.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SvgIcon d={ts.icon} size={16} color={ts.color} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: C.text1 }}>{m.title}</div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: C.text3,
                      marginTop: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <span>{m.contact}</span>
                    <span style={{ opacity: 0.25, fontSize: 8 }}>●</span>
                    <span>{m.company}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    fontSize: 11,
                    color: C.text3,
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  }}
                >
                  {m.duration}
                </span>
                <span style={{ fontSize: 11, color: C.text3 }}>{m.date}</span>
                <StatusBadge status="Aktiv" />
              </div>
            </div>

            {/* Summary */}
            {m.summary && (
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 9,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  marginBottom: 14,
                }}
              >
                <div
                  style={{ fontSize: 10, fontWeight: 500, color: C.text3, letterSpacing: '0.06em', marginBottom: 6 }}
                >
                  ZUSAMMENFASSUNG
                </div>
                <div style={{ fontSize: 12.5, color: C.text2, lineHeight: 1.65 }}>{m.summary}</div>
              </div>
            )}

            {/* AI Insights */}
            {m.aiInsights && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {m.aiInsights.map((insight) => (
                  <div
                    key={insight}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 12px',
                      borderRadius: 7,
                      background: 'rgba(99,102,241,0.05)',
                      border: '1px solid rgba(99,102,241,0.1)',
                    }}
                  >
                    <SvgIcon d={ICONS.spark} size={10} color={C.accent} />
                    <span style={{ fontSize: 11, color: C.accentBright }}>{insight}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── PAGE ────────────────────────────────────────────────────────────────────

export default function MeetingsPage() {
  const [tab, setTab] = useState<Tab>('upcoming');

  return (
    <>
      <Breadcrumbs items={[{ label: 'Onvero Sales', href: '/sales-v2' }, { label: 'Meetings' }]} />
      <PageHeader
        title="Meetings"
        subtitle="Aufnehmen, analysieren und nachbereiten — alles an einem Ort"
        actions={<GlowButton>+ Meeting planen</GlowButton>}
      />

      <MeetingStats />
      <TabBar active={tab} onChange={setTab} />

      <div key={tab} className="tab-content-enter">
        {tab === 'upcoming' && <UpcomingMeetings />}
        {tab === 'record' && <RecordView />}
        {tab === 'archive' && <ArchiveView />}
      </div>
    </>
  );
}
