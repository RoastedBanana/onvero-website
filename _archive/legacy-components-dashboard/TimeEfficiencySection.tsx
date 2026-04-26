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

function barColor(score: number): string {
  if (score >= 75) return 'rgba(255,255,255,0.85)';
  if (score >= 60) return 'rgba(255,255,255,0.5)';
  return 'rgba(255,255,255,0.25)';
}

// ── Data ─────────────────────────────────────────────────────────────────────

const TIME_BLOCKS = [
  { label: '08–10 Uhr', score: 81 },
  { label: '10–12 Uhr', score: 74 },
  { label: '12–14 Uhr', score: 58 },
  { label: '14–16 Uhr', score: 71 },
  { label: '16–18 Uhr', score: 63 },
];

const DURATION_BLOCKS = [
  { label: '< 15 min', score: 62 },
  { label: '15–30 min', score: 79 },
  { label: '30–45 min', score: 84 },
  { label: '45–60 min', score: 71 },
  { label: '60–90 min', score: 55 },
  { label: '> 90 min', score: 41 },
];

// 4 weeks × 7 days heatmap
const HEATMAP: number[][] = [
  [1, 2, 3, 2, 0, 0, 0], // Week 1: Mo–So
  [2, 1, 3, 3, 1, 1, 0], // Week 2
  [1, 2, 2, 3, 0, 0, 1], // Week 3
  [0, 3, 3, 2, 1, 0, 0], // Week 4
];

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function heatColor(count: number): string {
  if (count === 0) return 'rgba(255,255,255,0.04)';
  if (count === 1) return 'rgba(107,122,255,0.2)';
  if (count === 2) return 'rgba(107,122,255,0.4)';
  return 'rgba(107,122,255,0.7)';
}

// ── BarRow ────────────────────────────────────────────────────────────────────

function BarRow({ label, score, best }: { label: string; score: number; best?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 12, color: best ? '#22C55E' : 'rgba(255,255,255,0.5)', width: 72, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{
          width: `${score}%`, height: '100%', borderRadius: 3,
          background: best ? '#22C55E' : barColor(score), transition: 'all 0.3s ease',
        }} />
      </div>
      <span style={{
        fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-dm-mono)',
        color: best ? '#22C55E' : '#fff', minWidth: 24, textAlign: 'right',
      }}>
        {score}
      </span>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function TimeEfficiencySection() {
  const bestTimeIdx = TIME_BLOCKS.reduce((best, curr, i) => curr.score > TIME_BLOCKS[best].score ? i : best, 0);
  const bestDurationIdx = DURATION_BLOCKS.reduce((best, curr, i) => curr.score > DURATION_BLOCKS[best].score ? i : best, 0);

  return (
    <div style={{ marginTop: 28 }}>
      <div style={S.sectionLabel}>Zeit & Effizienz</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {/* ── Card 1: Beste Tageszeit ── */}
        <div style={S.card}>
          <div style={S.chartTitle}>Beste Tageszeit</div>
          <div style={S.chartSub}>Ø Score nach Uhrzeit</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            {TIME_BLOCKS.map((block, i) => (
              <BarRow key={block.label} label={block.label} score={block.score} best={i === bestTimeIdx} />
            ))}
          </div>
        </div>

        {/* ── Card 2: Optimale Dauer ── */}
        <div style={S.card}>
          <div style={S.chartTitle}>Optimale Dauer</div>
          <div style={S.chartSub}>Score nach Meeting-Länge</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            {DURATION_BLOCKS.map((block, i) => (
              <BarRow key={block.label} label={block.label} score={block.score} best={i === bestDurationIdx} />
            ))}
          </div>
          <div style={{
            marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)',
            fontSize: 11, color: 'rgba(255,255,255,0.4)',
          }}>
            Sweet Spot: <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>30–45 Minuten</span>
          </div>
        </div>

        {/* ── Card 3: Meeting-Dichte ── */}
        <div style={S.card}>
          <div style={S.chartTitle}>Meeting-Dichte</div>
          <div style={S.chartSub}>Meetings pro Wochentag (letzte 30 Tage)</div>

          {/* Day labels */}
          <div style={{ display: 'grid', gridTemplateColumns: '32px repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
            <span />
            {DAYS.map((d) => (
              <div key={d} style={{
                textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 500,
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {HEATMAP.map((week, wi) => (
              <div key={wi} style={{ display: 'grid', gridTemplateColumns: '32px repeat(7, 1fr)', gap: 4, alignItems: 'center' }}>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', textAlign: 'right', flexShrink: 0 }}>
                  KW {wi + 1}
                </span>
                {week.map((count, di) => (
                  <div
                    key={di}
                    title={`${DAYS[di]}, KW ${wi + 1}: ${count} Meeting${count !== 1 ? 's' : ''}`}
                    style={{
                      height: 28, borderRadius: 4,
                      background: heatColor(count),
                      transition: 'all 0.3s ease',
                      cursor: 'default',
                    }}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 6, marginTop: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>Weniger</span>
            {[0, 1, 2, 3].map((n) => (
              <div key={n} style={{ width: 10, height: 10, borderRadius: 2, background: heatColor(n) }} />
            ))}
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>Mehr</span>
          </div>

          {/* Stats */}
          <div style={{
            marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', flexDirection: 'column', gap: 5,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(107,122,255,0.7)', flexShrink: 0 }} />
              Aktivster Tag: <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Mittwoch (Ø 3,1 Meetings)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
              Ruhigster Tag: <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Freitag (Ø 0,8 Meetings)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
