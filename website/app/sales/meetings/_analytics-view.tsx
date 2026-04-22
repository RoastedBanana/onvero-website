'use client';

import { useState, useEffect } from 'react';
import { C, SvgIcon, ICONS } from '../_shared';
import type { Meeting } from './_meeting-store';

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface AnalyticsData {
  totalMeetings: number;
  completed: number;
  planned: number;
  totalDuration: number;
  avgDuration: number;
  analysisCount: number;
  coachingAvg: Record<string, number>;
  sentiments: { positive: number; neutral: number; negative: number };
  talkRatioUser: number | null;
  byType: Record<string, { count: number; won: number; lost: number }>;
  patterns: { word: string; count: number }[];
  recentInsights: string[];
  winLoss: { won: number; lost: number; pending: number };
}

// ─── COACHING LABELS ────────────────────────────────────────────────────────

const COACHING_META: Record<string, { label: string; color: string; tip: string; badTip: string }> = {
  gespraechsanteil: {
    label: 'Gesprächsanteil',
    color: '#FBBF24',
    tip: 'Gut balanciert — Kunde kommt zu Wort.',
    badTip: 'Du redest zu viel. Mehr Fragen stellen, mehr zuhören.',
  },
  fragetechnik: {
    label: 'Fragetechnik',
    color: '#34D399',
    tip: 'Starke offene Fragen — weiter so.',
    badTip: 'Zu wenig offene Fragen. Starte mit "Was", "Wie", "Warum".',
  },
  einwandbehandlung: {
    label: 'Einwandbehandlung',
    color: '#F87171',
    tip: 'Einwände werden souverän behandelt.',
    badTip: 'Einwände werden umgangen statt adressiert. ROI und Referenzen nutzen.',
  },
  closing: {
    label: 'Closing',
    color: '#818CF8',
    tip: 'Klare nächste Schritte am Ende.',
    badTip: 'Gespräche enden ohne klaren nächsten Schritt. Immer konkreten Follow-Up vereinbaren.',
  },
  bedarfsanalyse: {
    label: 'Bedarfsanalyse',
    color: '#38BDF8',
    tip: 'Pain Points werden schnell erkannt.',
    badTip: 'Zu schnell zum Pitch gesprungen. Erst Problem verstehen, dann Lösung präsentieren.',
  },
  follow_up: {
    label: 'Follow-Up',
    color: '#22D3EE',
    tip: 'Schnelles, relevantes Follow-Up.',
    badTip: 'Follow-Ups dauern zu lang oder sind zu generisch. Innerhalb von 24h senden.',
  },
};

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

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export default function AnalyticsView({ meetings }: { meetings: Meeting[] }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/meetings/analytics')
      .then((r) => r.json())
      .then((d) => {
        if (d.analytics) setData(d.analytics);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fallback to local data if API fails
  const total = data?.totalMeetings ?? meetings.length;
  const completed = data?.completed ?? meetings.filter((m) => m.status === 'Abgeschlossen').length;
  const planned = data?.planned ?? meetings.filter((m) => m.status === 'Geplant').length;
  const avgDuration = data?.avgDuration ?? 0;
  const talkUser = data?.talkRatioUser ?? null;
  const talkCustomer = talkUser ? 100 - talkUser : null;
  const coaching = data?.coachingAvg ?? {};
  const overallScore =
    Object.values(coaching).length > 0
      ? Math.round(Object.values(coaching).reduce((s, v) => s + v, 0) / Object.values(coaching).length)
      : 0;

  // Find weak spots (score < 65)
  const weakSpots = Object.entries(coaching)
    .filter(([, v]) => v > 0 && v < 65)
    .sort((a, b) => a[1] - b[1]);

  // Find strengths (score >= 75)
  const strengths = Object.entries(coaching)
    .filter(([, v]) => v >= 75)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeInUp 0.3s ease both' }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard
          label="MEETINGS GESAMT"
          value={String(total)}
          subtext={`${completed} abgeschlossen · ${planned} geplant`}
          color="#818CF8"
          gradient="radial-gradient(ellipse at 20% 0%, rgba(99,102,241,0.15) 0%, transparent 60%)"
          delay={0}
        />
        <StatCard
          label="DURCHSCHN. DAUER"
          value={avgDuration > 0 ? `${avgDuration}m` : '—'}
          subtext="pro Meeting"
          color="#38BDF8"
          gradient="radial-gradient(ellipse at 50% 0%, rgba(56,189,248,0.12) 0%, transparent 60%)"
          delay={0.06}
        />
        <StatCard
          label="ANALYSEN"
          value={String(data?.analysisCount ?? 0)}
          subtext="Gespräche analysiert"
          color="#A78BFA"
          gradient="radial-gradient(ellipse at 80% 0%, rgba(167,139,250,0.12) 0%, transparent 60%)"
          delay={0.12}
        />
        <StatCard
          label="GESAMTSCORE"
          value={overallScore > 0 ? String(overallScore) : '—'}
          subtext={
            overallScore >= 75
              ? 'Stark'
              : overallScore >= 60
                ? 'Solide'
                : overallScore > 0
                  ? 'Ausbaufähig'
                  : 'Noch keine Daten'
          }
          color={overallScore >= 75 ? '#34D399' : overallScore >= 60 ? '#FBBF24' : '#F87171'}
          gradient={`radial-gradient(ellipse at 30% 0%, ${overallScore >= 75 ? 'rgba(52,211,153,0.12)' : 'rgba(251,191,36,0.12)'} 0%, transparent 60%)`}
          delay={0.18}
        />
      </div>

      {/* Two columns: Coaching + Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Coaching Dashboard */}
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: '20px 22px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <SvgIcon d={ICONS.spark} size={13} color={C.accent} />
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>Persönliches Coaching</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(COACHING_META).map(([key, meta]) => {
              const score = coaching[key] ?? 0;
              const isWeak = score > 0 && score < 65;
              return (
                <div
                  key={key}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 9,
                    background: isWeak ? 'rgba(248,113,113,0.04)' : 'transparent',
                    border: `1px solid ${isWeak ? 'rgba(248,113,113,0.12)' : C.border}`,
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 500, color: C.text1 }}>{meta.label}</span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                        color: score >= 75 ? '#34D399' : score >= 60 ? '#FBBF24' : score > 0 ? '#F87171' : C.text3,
                      }}
                    >
                      {score > 0 ? score : '—'}
                    </span>
                  </div>
                  {score > 0 && (
                    <>
                      <div
                        style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.04)', marginBottom: 6 }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${score}%`,
                            borderRadius: 2,
                            background: `linear-gradient(90deg, ${meta.color}80, ${meta.color})`,
                            transition: 'width 1s ease',
                          }}
                        />
                      </div>
                      <div style={{ fontSize: 11, color: isWeak ? '#F87171' : C.text3, lineHeight: 1.5 }}>
                        {isWeak ? meta.badTip : meta.tip}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* What went wrong + What went right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Weak Spots */}
          {weakSpots.length > 0 && (
            <div
              style={{
                background: C.surface,
                border: '1px solid rgba(248,113,113,0.12)',
                borderRadius: 12,
                padding: '18px 20px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <SvgIcon d={ICONS.trending} size={13} color="#F87171" />
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>Daran arbeiten</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {weakSpots.map(([key, score]) => {
                  const meta = COACHING_META[key];
                  return (
                    <div
                      key={key}
                      style={{
                        display: 'flex',
                        gap: 10,
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: 'rgba(248,113,113,0.04)',
                        border: '1px solid rgba(248,113,113,0.08)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                          color: '#F87171',
                          minWidth: 30,
                        }}
                      >
                        {score}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: C.text1 }}>{meta?.label ?? key}</div>
                        <div style={{ fontSize: 11, color: C.text3, marginTop: 2, lineHeight: 1.5 }}>
                          {meta?.badTip}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Strengths */}
          {strengths.length > 0 && (
            <div
              style={{
                background: C.surface,
                border: '1px solid rgba(52,211,153,0.12)',
                borderRadius: 12,
                padding: '18px 20px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <SvgIcon d={ICONS.check} size={13} color="#34D399" />
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>Deine Stärken</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {strengths.map(([key, score]) => {
                  const meta = COACHING_META[key];
                  return (
                    <div
                      key={key}
                      style={{
                        display: 'flex',
                        gap: 10,
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: 'rgba(52,211,153,0.04)',
                        border: '1px solid rgba(52,211,153,0.08)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                          color: '#34D399',
                          minWidth: 30,
                        }}
                      >
                        {score}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500, color: C.text1 }}>{meta?.label ?? key}</div>
                        <div style={{ fontSize: 11, color: C.text3, marginTop: 2, lineHeight: 1.5 }}>{meta?.tip}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Talk Ratio */}
          {talkUser !== null && talkCustomer !== null && (
            <div
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: '18px 20px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 600, color: C.text3, letterSpacing: '0.08em', marginBottom: 12 }}>
                TALK RATIO
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ flex: 1, height: 20, borderRadius: 5, overflow: 'hidden', display: 'flex' }}>
                  <div
                    style={{
                      width: `${talkUser}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${C.accentDim}, ${C.accent})`,
                    }}
                  />
                  <div
                    style={{
                      width: `${talkCustomer}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #34D39980, #34D399)',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                        color: C.accent,
                      }}
                    >
                      {talkUser}%
                    </div>
                    <div style={{ fontSize: 9, color: C.text3 }}>DU</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                        color: '#34D399',
                      }}
                    >
                      {talkCustomer}%
                    </div>
                    <div style={{ fontSize: 9, color: C.text3 }}>KUNDE</div>
                  </div>
                </div>
              </div>
              <div
                style={{ fontSize: 11, color: talkUser > 60 ? '#FBBF24' : C.text3, marginTop: 8, fontStyle: 'italic' }}
              >
                {talkUser > 60
                  ? 'Du redest zu viel — Ziel ist 40-50%. Mehr zuhören, mehr Fragen stellen.'
                  : talkUser > 50
                    ? 'Fast perfekt — etwas weniger reden wäre ideal.'
                    : 'Perfekte Balance!'}
              </div>
            </div>
          )}

          {/* Sentiment */}
          {data?.sentiments && data.sentiments.positive + data.sentiments.neutral + data.sentiments.negative > 0 && (
            <div
              style={{
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: '18px 20px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 600, color: C.text3, letterSpacing: '0.08em', marginBottom: 12 }}>
                GESPRÄCHSSTIMMUNG
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { label: 'Positiv', value: data.sentiments.positive, color: '#34D399' },
                  { label: 'Neutral', value: data.sentiments.neutral, color: '#FBBF24' },
                  { label: 'Negativ', value: data.sentiments.negative, color: '#F87171' },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '10px 8px',
                      borderRadius: 8,
                      background: `${s.color}06`,
                      border: `1px solid ${s.color}12`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                        color: s.color,
                      }}
                    >
                      {s.value}
                    </div>
                    <div style={{ fontSize: 10, color: C.text3, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Erkenntnisse aus allen Gesprächen */}
      {data?.recentInsights && data.recentInsights.length > 0 && (
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: '20px 22px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <SvgIcon d={ICONS.spark} size={13} color={C.accent} />
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>Erkenntnisse aus deinen Gesprächen</span>
            <span style={{ fontSize: 11, color: C.text3, marginLeft: 'auto' }}>
              {data.recentInsights.length} Insights
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {data.recentInsights.slice(0, 12).map((insight, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 7,
                  background: 'rgba(99,102,241,0.05)',
                  border: '1px solid rgba(99,102,241,0.1)',
                  maxWidth: 400,
                }}
              >
                <SvgIcon d={ICONS.spark} size={10} color={C.accent} />
                <span style={{ fontSize: 11, color: C.accentBright, lineHeight: 1.4 }}>{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recurring Patterns */}
      {data?.patterns && data.patterns.length > 0 && (
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: '20px 22px',
            boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <SvgIcon d={ICONS.target} size={13} color="#FBBF24" />
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text1 }}>Häufige Themen in deinen Gesprächen</span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {data.patterns.map((p) => (
              <div
                key={p.word}
                style={{
                  padding: '5px 12px',
                  borderRadius: 7,
                  background: 'rgba(251,191,36,0.06)',
                  border: '1px solid rgba(251,191,36,0.12)',
                }}
              >
                <span style={{ fontSize: 12, color: '#FBBF24', fontWeight: 500 }}>{p.word}</span>
                <span style={{ fontSize: 10, color: C.text3, marginLeft: 6 }}>×{p.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && (!data || data.analysisCount === 0) && (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            borderRadius: 12,
            background: C.surface,
            border: `1px solid ${C.border}`,
          }}
        >
          <SvgIcon d={ICONS.chart} size={28} color={C.text3} />
          <p style={{ fontSize: 13, color: C.text3, marginTop: 12, lineHeight: 1.6 }}>
            Noch keine analysierten Meetings. Führe ein paar Gespräche mit Aufnahme und die Analytics füllen sich
            automatisch.
          </p>
        </div>
      )}
    </div>
  );
}
