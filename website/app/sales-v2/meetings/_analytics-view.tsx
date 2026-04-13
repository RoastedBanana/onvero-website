'use client';

import { useMemo } from 'react';
import { C, SvgIcon, ICONS } from '../_shared';
import type { Meeting } from './_meeting-store';

// ─── MOCK ANALYTICS DATA ────────────────────────────────────────────────────
// In production these come from the DB. For now we generate from meetings + static mocks.

interface CoachingInsight {
  category: string;
  score: number;
  label: string;
  tip: string;
  color: string;
}

const COACHING: CoachingInsight[] = [
  {
    category: 'Gesprächsanteil',
    score: 62,
    label: 'Du redest 62% der Zeit',
    tip: 'Ideal ist 40-50%. Versuche mehr Fragen zu stellen.',
    color: '#FBBF24',
  },
  {
    category: 'Fragetechnik',
    score: 78,
    label: 'Gute offene Fragen',
    tip: 'Weiter so — offene Fragen öffnen Gespräche.',
    color: '#34D399',
  },
  {
    category: 'Einwandbehandlung',
    score: 55,
    label: 'Ausbaufähig',
    tip: 'Bei Preiseinwänden häufiger den ROI betonen.',
    color: '#F87171',
  },
  {
    category: 'Closing',
    score: 71,
    label: 'Solide',
    tip: 'Am Ende konkreter werden: "Sollen wir nächste Woche starten?"',
    color: '#818CF8',
  },
  {
    category: 'Bedarfsanalyse',
    score: 83,
    label: 'Stark',
    tip: 'Du erkennst Pain Points schnell und präzise.',
    color: '#34D399',
  },
  {
    category: 'Follow-Up',
    score: 68,
    label: 'Gut',
    tip: 'Follow-Ups innerhalb von 24h senden für höhere Conversion.',
    color: '#38BDF8',
  },
];

// ─── STAT CARD ──────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  subtext,
  color,
  gradient,
  delay,
}: {
  label: string;
  value: string;
  subtext: string;
  color: string;
  gradient: string;
  delay: number;
}) {
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
        boxShadow: '0 2px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.03)',
        animation: 'scaleIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        animationDelay: `${delay}s`,
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: gradient, pointerEvents: 'none' }} />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${color}40, transparent)`,
        }}
      />
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.08em', color: C.text3, marginBottom: 8, fontWeight: 500 }}>
          {label}
        </div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 600,
            color,
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            letterSpacing: '-0.03em',
            textShadow: `0 0 25px ${color}40`,
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>{subtext}</div>
      </div>
    </div>
  );
}

// ─── BAR CHART (simple) ─────────────────────────────────────────────────────

function SimpleBarChart({ data, label }: { data: { name: string; value: number; color: string }[]; label: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: '18px 20px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 600, color: C.text3, letterSpacing: '0.08em', marginBottom: 16 }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.map((d) => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 11, color: C.text2, minWidth: 70, textAlign: 'right' }}>{d.name}</span>
            <div
              style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${(d.value / max) * 100}%`,
                  borderRadius: 4,
                  background: `linear-gradient(90deg, ${d.color}90, ${d.color})`,
                  transition: 'width 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              />
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                color: d.color,
                minWidth: 30,
              }}
            >
              {d.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── COACHING CARD ──────────────────────────────────────────────────────────

function CoachingCard({ insight, delay }: { insight: CoachingInsight; delay: number }) {
  return (
    <div
      style={{
        padding: '16px 18px',
        borderRadius: 10,
        background: C.surface,
        border: `1px solid ${C.border}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        animation: 'fadeInUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
        animationDelay: `${delay}s`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: C.text1 }}>{insight.category}</span>
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            color: insight.color,
          }}
        >
          {insight.score}
        </span>
      </div>
      {/* Score bar */}
      <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.04)', marginBottom: 10 }}>
        <div
          style={{
            height: '100%',
            width: `${insight.score}%`,
            borderRadius: 2,
            background: `linear-gradient(90deg, ${insight.color}80, ${insight.color})`,
            transition: 'width 1s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
      </div>
      <div style={{ fontSize: 11, color: C.text2, marginBottom: 6 }}>{insight.label}</div>
      <div style={{ fontSize: 11, color: C.text3, lineHeight: 1.5, fontStyle: 'italic' }}>{insight.tip}</div>
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function AnalyticsView({ meetings }: { meetings: Meeting[] }) {
  const stats = useMemo(() => {
    const completed = meetings.filter((m) => m.status === 'Abgeschlossen');
    const planned = meetings.filter((m) => m.status === 'Geplant');
    const totalDuration = completed.reduce((s, m) => s + m.duration, 0);
    const avgDuration = completed.length > 0 ? Math.round(totalDuration / completed.length) : 0;

    const byType = { Video: 0, Telefon: 0, 'Vor Ort': 0 };
    meetings.forEach((m) => {
      if (m.type in byType) byType[m.type as keyof typeof byType]++;
    });

    return { completed: completed.length, planned: planned.length, totalDuration, avgDuration, byType };
  }, [meetings]);

  // For mock data enrichment
  const displayCompleted = Math.max(stats.completed, 12);
  const displayAvg = stats.avgDuration || 38;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeInUp 0.3s ease both' }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard
          label="MEETINGS GESAMT"
          value={String(displayCompleted + stats.planned)}
          subtext={`${displayCompleted} abgeschlossen · ${stats.planned} geplant`}
          color="#818CF8"
          gradient="radial-gradient(ellipse at 20% 0%, rgba(99,102,241,0.15) 0%, transparent 60%)"
          delay={0}
        />
        <StatCard
          label="DURCHSCHN. DAUER"
          value={`${displayAvg}m`}
          subtext="pro Meeting"
          color="#38BDF8"
          gradient="radial-gradient(ellipse at 50% 0%, rgba(56,189,248,0.12) 0%, transparent 60%)"
          delay={0.06}
        />
        <StatCard
          label="CONVERSION RATE"
          value="34%"
          subtext="Meeting → Deal"
          color="#34D399"
          gradient="radial-gradient(ellipse at 80% 0%, rgba(52,211,153,0.12) 0%, transparent 60%)"
          delay={0.12}
        />
        <StatCard
          label="GESPRÄCHSZEIT"
          value={`${Math.round((stats.totalDuration || 456) / 60)}h`}
          subtext="insgesamt aufgenommen"
          color="#A78BFA"
          gradient="radial-gradient(ellipse at 30% 0%, rgba(167,139,250,0.12) 0%, transparent 60%)"
          delay={0.18}
        />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <SimpleBarChart
          label="MEETINGS NACH TYP"
          data={[
            { name: 'Video', value: Math.max(stats.byType.Video, 8), color: '#818CF8' },
            { name: 'Telefon', value: Math.max(stats.byType.Telefon, 5), color: '#FBBF24' },
            { name: 'Vor Ort', value: Math.max(stats.byType['Vor Ort'], 3), color: '#34D399' },
          ]}
        />
        <SimpleBarChart
          label="CONVERSION NACH TYP"
          data={[
            { name: 'Video', value: 42, color: '#818CF8' },
            { name: 'Telefon', value: 28, color: '#FBBF24' },
            { name: 'Vor Ort', value: 67, color: '#34D399' },
          ]}
        />
      </div>

      {/* Talk Ratio & Deal Velocity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Talk Ratio */}
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: '18px 20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 600, color: C.text3, letterSpacing: '0.08em', marginBottom: 16 }}>
            GESPRÄCHSANTEIL (TALK RATIO)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* Visual ratio bar */}
            <div style={{ flex: 1, height: 24, borderRadius: 6, overflow: 'hidden', display: 'flex' }}>
              <div
                style={{
                  width: '62%',
                  height: '100%',
                  background: `linear-gradient(90deg, ${C.accentDim}, ${C.accent})`,
                }}
              />
              <div style={{ width: '38%', height: '100%', background: `linear-gradient(90deg, #34D39980, #34D399)` }} />
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    color: C.accent,
                  }}
                >
                  62%
                </div>
                <div style={{ fontSize: 9, color: C.text3, marginTop: 2 }}>DU</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    color: '#34D399',
                  }}
                >
                  38%
                </div>
                <div style={{ fontSize: 9, color: C.text3, marginTop: 2 }}>KUNDE</div>
              </div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: C.text3, marginTop: 10, fontStyle: 'italic' }}>
            Ideal: 40-50% du, 50-60% Kunde. Versuche mehr zuzuhören.
          </div>
        </div>

        {/* Deal Velocity */}
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: '18px 20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 600, color: C.text3, letterSpacing: '0.08em', marginBottom: 16 }}>
            DEAL VELOCITY
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Ø Meetings bis Abschluss', value: '2.4', color: C.accent },
              { label: 'Ø Tage bis Abschluss', value: '18', color: '#38BDF8' },
              { label: 'Schnellster Deal', value: '3 Tage', color: '#34D399' },
              { label: 'Längster Deal', value: '42 Tage', color: '#FBBF24' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: C.text2 }}>{item.label}</span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    color: item.color,
                  }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Coaching Dashboard */}
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: '20px 22px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: `${C.accent}10`,
              border: `1px solid ${C.accent}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SvgIcon d={ICONS.spark} size={13} color={C.accent} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text1, letterSpacing: '-0.01em' }}>
              Persönliches Coaching
            </div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>
              KI-Analyse deiner Gesprächsqualität über alle Meetings
            </div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: C.text3 }}>GESAMTSCORE</div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                color: '#34D399',
                textShadow: '0 0 20px rgba(52,211,153,0.3)',
              }}
            >
              {Math.round(COACHING.reduce((s, c) => s + c.score, 0) / COACHING.length)}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {COACHING.map((insight, i) => (
            <CoachingCard key={insight.category} insight={insight} delay={0.05 + i * 0.04} />
          ))}
        </div>
      </div>
    </div>
  );
}
