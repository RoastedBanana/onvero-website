'use client';

import React from 'react';

const S = {
  card: {
    background: '#111', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 10, padding: 20, height: '100%',
  } as React.CSSProperties,
  chartTitle: { fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 2 } as React.CSSProperties,
  chartSub: { fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 12 } as React.CSSProperties,
  sectionLabel: {
    fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.08em',
    color: 'rgba(255,255,255,0.25)', marginBottom: 12, marginTop: 4,
    paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)',
  } as React.CSSProperties,
};

// ── Data ─────────────────────────────────────────────────────────────────────

const TOPICS = [
  { label: 'Budgetplanung Q3', count: 5, unresolved: true },
  { label: 'Onboarding-Prozess', count: 4, unresolved: true },
  { label: 'Website-Relaunch', count: 3, unresolved: true },
  { label: 'Teamstruktur', count: 2, unresolved: false },
  { label: 'Kundenfeedback System', count: 2, unresolved: false },
];

const SENTIMENT_DATA = [55, 62, 48, 70, 75, 65, 80, 78];
const SENTIMENT_DATES = ['3.3', '7.3', '10.3', '14.3', '17.3', '21.3', '24.3', '28.3'];

const DISTRIBUTION = [
  { label: 'Strategie', pct: 28, color: '#8B5CF6' },
  { label: 'Operatives', pct: 35, color: '#6B7AFF' },
  { label: 'Probleme', pct: 18, color: '#FF5C2E' },
  { label: 'Updates', pct: 12, color: '#F59E0B' },
  { label: 'Sonstiges', pct: 7, color: 'rgba(255,255,255,0.25)' },
];

// ── Sentiment SVG Chart ──────────────────────────────────────────────────────

function SentimentChart({ data, dates }: { data: number[]; dates: string[] }) {
  const w = 320;
  const h = 120;
  const padL = 0;
  const padR = 0;
  const padT = 8;
  const padB = 20;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  const points = data.map((v, i) => ({
    x: padL + (i / (data.length - 1)) * chartW,
    y: padT + chartH - (v / 100) * chartH,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }}>
      {/* Grid lines */}
      {[0, 50, 100].map((v) => {
        const y = padT + chartH - (v / 100) * chartH;
        return (
          <line key={v} x1={padL} x2={w - padR} y1={y} y2={y}
            stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
        );
      })}

      {/* Y-axis labels */}
      {[
        { v: 100, label: 'Positiv' },
        { v: 50, label: 'Neutral' },
        { v: 0, label: 'Angespannt' },
      ].map(({ v, label }) => {
        const y = padT + chartH - (v / 100) * chartH;
        return (
          <text key={v} x={w - 2} y={y + 3} textAnchor="end"
            style={{ fontSize: 8, fill: 'rgba(255,255,255,0.25)' }}>
            {label}
          </text>
        );
      })}

      {/* Line */}
      <path d={pathD} fill="none" stroke="#6B7AFF" strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#6B7AFF" stroke="#111" strokeWidth={2} />
      ))}

      {/* X-axis labels */}
      {points.map((p, i) => (
        <text key={i} x={p.x} y={h - 4} textAnchor="middle"
          style={{ fontSize: 8, fill: 'rgba(255,255,255,0.25)' }}>
          {dates[i]}
        </text>
      ))}
    </svg>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function TopicsContentSection() {
  const avgSentiment = Math.round(SENTIMENT_DATA.reduce((a, b) => a + b, 0) / SENTIMENT_DATA.length);
  const trend = SENTIMENT_DATA[SENTIMENT_DATA.length - 1] - SENTIMENT_DATA[0];

  return (
    <div style={{ marginTop: 28 }}>
      <div style={S.sectionLabel}>Themen & Inhalte</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {/* ── Card 1: Wiederkehrende Themen ── */}
        <div style={S.card}>
          <div style={S.chartTitle}>Wiederkehrende Themen</div>
          <div style={S.chartSub}>Häufig besprochene Themen ohne Beschluss</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {TOPICS.map((t) => (
              <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 12, color: 'rgba(255,255,255,0.8)',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 20, padding: '3px 10px', whiteSpace: 'nowrap',
                }}>
                  {t.label}
                </span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-dm-mono)' }}>
                  {t.count}×
                </span>
                {t.unresolved && (
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%', background: '#FF5C2E', flexShrink: 0,
                  }} />
                )}
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)',
            fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5,
          }}>
            3 Themen tauchen wiederholt auf ohne Beschluss — mögliche Dauerbrenner.
          </div>
        </div>

        {/* ── Card 2: Stimmungs-Verlauf ── */}
        <div style={S.card}>
          <div style={S.chartTitle}>Stimmungs-Verlauf</div>
          <div style={S.chartSub}>Ø Sentiment der letzten 8 Meetings</div>

          <div style={{ marginTop: 8 }}>
            <SentimentChart data={SENTIMENT_DATA} dates={SENTIMENT_DATES} />
          </div>

          <div style={{
            display: 'flex', gap: 8, marginTop: 12,
          }}>
            <span style={{
              fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6, padding: '3px 10px',
            }}>
              Ø Stimmung: {avgSentiment >= 65 ? 'Positiv' : avgSentiment >= 40 ? 'Neutral' : 'Angespannt'}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: trend > 0 ? 'rgba(255,255,255,0.7)' : '#FF5C2E',
              background: trend > 0 ? 'rgba(255,255,255,0.06)' : 'rgba(255,92,46,0.1)',
              border: `1px solid ${trend > 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,92,46,0.2)'}`,
              borderRadius: 6, padding: '3px 10px',
            }}>
              Trend: {trend > 0 ? '↑' : '↓'} {Math.abs(trend)} Punkte
            </span>
          </div>
        </div>

        {/* ── Card 3: Themen-Verteilung ── */}
        <div style={S.card}>
          <div style={S.chartTitle}>Themen-Verteilung</div>
          <div style={S.chartSub}>Worum geht es in euren Meetings?</div>

          {/* Stacked bar */}
          <div style={{
            display: 'flex', height: 24, borderRadius: 12, overflow: 'hidden', marginTop: 8,
          }}>
            {DISTRIBUTION.map((d) => (
              <div key={d.label} style={{
                width: `${d.pct}%`, background: d.color,
                transition: 'all 0.3s ease',
              }} />
            ))}
          </div>

          {/* Legend */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 14,
          }}>
            {DISTRIBUTION.map((d) => (
              <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{d.label}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-dm-mono)' }}>{d.pct}%</span>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)',
            fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5,
          }}>
            35 % Operatives — prüfe ob mehr Strategie-Zeit sinnvoll wäre.
          </div>
        </div>
      </div>
    </div>
  );
}
