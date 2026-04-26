'use client';

import { useState, useEffect } from 'react';

type Tier = 'HOT' | 'WARM' | 'COLD';

interface TopLead {
  firma: string;
  branche: string;
  score: number;
  tier: Tier;
  sparkline: number[];
}

const tierColors: Record<Tier, { color: string; bg: string }> = {
  HOT: { color: '#FF5C2E', bg: 'rgba(255,92,46,0.12)' },
  WARM: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  COLD: { color: '#6B7AFF', bg: 'rgba(107,122,255,0.12)' },
};

const topLeads: TopLead[] = [
  { firma: 'Mayer & Partner', branche: 'Immobilien', score: 91, tier: 'HOT', sparkline: [40, 55, 62, 70, 78, 85, 91] },
  { firma: 'TechBridge GmbH', branche: 'Software', score: 87, tier: 'HOT', sparkline: [60, 70, 72, 80, 82, 85, 87] },
  { firma: 'Nordhaus AG', branche: 'Logistik', score: 68, tier: 'WARM', sparkline: [55, 58, 60, 62, 65, 67, 68] },
  { firma: 'Schneider Bau', branche: 'Baugewerbe', score: 54, tier: 'WARM', sparkline: [48, 50, 50, 52, 54, 53, 54] },
  {
    firma: 'DataFlow Systems',
    branche: 'IT-Services',
    score: 38,
    tier: 'COLD',
    sparkline: [42, 40, 38, 39, 37, 38, 38],
  },
];

function Sparkline({ data, tier }: { data: number[]; tier: Tier }) {
  const max = Math.max(...data);
  const color = tierColors[tier].color;

  return (
    <div className="flex items-end gap-[2px]" style={{ height: 22 }}>
      {data.map((v, i) => (
        <div
          key={i}
          className="rounded-[1px]"
          style={{
            width: 3,
            height: Math.max(2, (v / max) * 22),
            backgroundColor: color,
            opacity: 0.4 + (i / data.length) * 0.6,
          }}
        />
      ))}
    </div>
  );
}

export default function TopLeadsTable() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className="rounded-[12px] bg-[#111111] p-5 px-6"
      style={{
        border: '1px solid rgba(255,255,255,0.06)',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 500ms ease 200ms, transform 500ms ease 200ms',
      }}
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="text-[13px] font-semibold text-white">Top Leads nach Score</div>
          <div className="mt-0.5 text-[11px] text-white/30">Zuletzt generiert</div>
        </div>
        <span
          className="rounded-md px-2 py-0.5 text-[10px]"
          style={{
            background: '#181818',
            color: 'rgba(255,255,255,0.3)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          Letzte 30 Tage
        </span>
      </div>

      {/* Header */}
      <div
        className="grid gap-3 pb-2"
        style={{
          gridTemplateColumns: '1fr 120px 90px 50px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        {['Firma', 'Branche', 'Score', 'Trend'].map((h) => (
          <div
            key={h}
            className="text-[10px] font-semibold uppercase"
            style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em' }}
          >
            {h}
          </div>
        ))}
      </div>

      {/* Rows */}
      {topLeads.map((lead, i) => {
        const tc = tierColors[lead.tier];
        return (
          <div
            key={lead.firma}
            className="grid items-center gap-3 py-2.5"
            style={{
              gridTemplateColumns: '1fr 120px 90px 50px',
              borderBottom: i < topLeads.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}
          >
            <div className="text-[12px] font-medium text-white/80">{lead.firma}</div>
            <div className="text-[11px] text-white/35">{lead.branche}</div>
            <div className="flex items-center gap-1.5">
              <span
                className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold"
                style={{
                  color: tc.color,
                  background: tc.bg,
                  fontFamily: 'var(--font-dm-mono)',
                }}
              >
                {lead.score}
              </span>
              <span className="text-[10px] font-medium" style={{ color: tc.color }}>
                {lead.tier}
              </span>
            </div>
            <Sparkline data={lead.sparkline} tier={lead.tier} />
          </div>
        );
      })}
    </div>
  );
}
