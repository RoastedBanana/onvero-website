'use client';

import React from 'react';

const S = {
  card: {
    background: '#111', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 10, padding: 20, height: '100%',
  } as React.CSSProperties,
  chartTitle: { fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 2 } as React.CSSProperties,
  chartSub: { fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 12 } as React.CSSProperties,
  insight: {
    marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)',
    fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5,
  } as React.CSSProperties,
};

// ── Data ─────────────────────────────────────────────────────────────────────

interface Person {
  initials: string;
  name: string;
  color: string;
}

const PEOPLE: Record<string, Person> = {
  JF: { initials: 'JF', name: 'Jan F.', color: '#6B7AFF' },
  LM: { initials: 'LM', name: 'Lisa M.', color: '#8B5CF6' },
  TK: { initials: 'TK', name: 'Tom K.', color: '#F59E0B' },
  SB: { initials: 'SB', name: 'Sara B.', color: '#FF5C2E' },
};

const TALK_SHARES = [
  { id: 'JF', pct: 38, status: 'over' as const },
  { id: 'LM', pct: 28, status: 'ok' as const },
  { id: 'TK', pct: 19, status: 'ok' as const },
  { id: 'SB', pct: 15, status: 'under' as const },
];

const COMBOS = [
  { people: ['JF', 'LM', 'TK'], score: 88, meetings: 6 },
  { people: ['JF', 'SB'], score: 79, meetings: 4 },
  { people: ['LM', 'TK', 'SB'], score: 71, meetings: 3 },
  { people: ['JF', 'LM', 'TK', 'SB'], score: 64, meetings: 5 },
];

const FATIGUE_DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr'];
const FATIGUE_SCORE = [82, 78, 71, 65, 74];
const FATIGUE_DENSITY = [20, 40, 80, 100, 30];

// ── Mini Avatar ──────────────────────────────────────────────────────────────

function MiniAvatar({ person, size = 28, style }: { person: Person; size?: number; style?: React.CSSProperties }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `${person.color}20`, border: `1.5px solid ${person.color}40`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 600, color: person.color,
      fontFamily: 'var(--font-dm-mono)', flexShrink: 0,
      ...style,
    }}>
      {person.initials}
    </div>
  );
}

// ── Score Badge ──────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'rgba(255,255,255,0.85)' : score >= 70 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)';
  return (
    <span style={{
      fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-dm-mono)',
      color, minWidth: 28, textAlign: 'right',
    }}>
      {score}
    </span>
  );
}

// ── Card 1: Redeanteil ───────────────────────────────────────────────────────

function TalkShareCard() {
  const barColor = (status: 'over' | 'ok' | 'under') =>
    status === 'over' ? '#FF5C2E' : status === 'under' ? '#F59E0B' : 'rgba(255,255,255,0.7)';

  return (
    <div style={S.card}>
      <div style={S.chartTitle}>Redeanteil-Balance</div>
      <div style={S.chartSub}>Gesprächsanteil pro Teilnehmer (Ø letzte 30 Tage)</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        {TALK_SHARES.map((t) => {
          const person = PEOPLE[t.id];
          return (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 80, flexShrink: 0 }}>
                <MiniAvatar person={person} size={24} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{person.name}</span>
              </div>
              <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{
                  width: `${(t.pct / 50) * 100}%`, height: '100%', borderRadius: 3,
                  background: barColor(t.status), transition: 'all 0.3s ease',
                }} />
              </div>
              <span style={{
                fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-dm-mono)',
                color: t.status === 'ok' ? '#fff' : barColor(t.status),
                minWidth: 32, textAlign: 'right',
              }}>
                {t.pct}%
              </span>
            </div>
          );
        })}
      </div>

      <div style={S.insight}>
        Ziel: alle zwischen 18–35 %. Jan spricht zu viel, Sara zu wenig.
      </div>
    </div>
  );
}

// ── Card 2: Beste Kombos ─────────────────────────────────────────────────────

function BestCombosCard() {
  return (
    <div style={S.card}>
      <div style={S.chartTitle}>Beste Team-Kombos</div>
      <div style={S.chartSub}>Meeting-Score nach Teilnehmer-Zusammensetzung</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
        {COMBOS.map((c, ci) => (
          <div key={ci} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Overlapping avatars */}
              <div style={{ display: 'flex', marginRight: 4 }}>
                {c.people.map((id, i) => (
                  <MiniAvatar
                    key={id}
                    person={PEOPLE[id]}
                    size={26}
                    style={{ marginLeft: i > 0 ? -8 : 0, zIndex: c.people.length - i }}
                  />
                ))}
              </div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                {c.meetings} Meetings
              </span>
            </div>
            <ScoreBadge score={c.score} />
          </div>
        ))}
      </div>

      <div style={S.insight}>
        Kleinere Runden performen besser — Ø +14 Punkte bei max. 3 Personen.
      </div>
    </div>
  );
}

// ── Card 3: Meeting-Müdigkeit ────────────────────────────────────────────────

function FatigueChart() {
  const w = 300;
  const h = 110;
  const padL = 0;
  const padR = 0;
  const padT = 8;
  const padB = 20;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  const toY = (v: number) => padT + chartH - (v / 100) * chartH;
  const toX = (i: number) => padL + (i / (FATIGUE_DAYS.length - 1)) * chartW;

  const scorePts = FATIGUE_SCORE.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
  const densityPts = FATIGUE_DENSITY.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }}>
      {/* Grid */}
      {[0, 50, 100].map((v) => (
        <line key={v} x1={padL} x2={w - padR} y1={toY(v)} y2={toY(v)}
          stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
      ))}

      {/* Density line (dashed) */}
      <polyline points={densityPts} fill="none" stroke="#F59E0B" strokeWidth={1.5}
        strokeDasharray="4 3" strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />

      {/* Score line */}
      <polyline points={scorePts} fill="none" stroke="#6B7AFF" strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" />

      {/* Score dots */}
      {FATIGUE_SCORE.map((v, i) => (
        <circle key={i} cx={toX(i)} cy={toY(v)} r={3} fill="#6B7AFF" stroke="#111" strokeWidth={2} />
      ))}

      {/* X labels */}
      {FATIGUE_DAYS.map((d, i) => (
        <text key={d} x={toX(i)} y={h - 4} textAnchor="middle"
          style={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }}>
          {d}
        </text>
      ))}
    </svg>
  );
}

function FatigueCard() {
  return (
    <div style={S.card}>
      <div style={S.chartTitle}>Meeting-Müdigkeit</div>
      <div style={S.chartSub}>Score-Abfall bei Meeting-Häufung</div>

      <div style={{ marginTop: 8 }}>
        <FatigueChart />
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
          <div style={{ width: 8, height: 3, borderRadius: 2, background: '#6B7AFF' }} />
          Ø Score
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
          <div style={{ width: 8, height: 0, borderTop: '1.5px dashed #F59E0B' }} />
          Meeting-Dichte
        </div>
      </div>

      <div style={S.insight}>
        Donnerstag: höchste Dichte, niedrigster Score. Meeting-freien Donnerstag erwägen.
      </div>
    </div>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

export default function TeamDynamicsCards() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12 }}>
      <TalkShareCard />
      <BestCombosCard />
      <FatigueCard />
    </div>
  );
}
