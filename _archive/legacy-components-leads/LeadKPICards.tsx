'use client';

import { useState, useEffect } from 'react';

interface LeadKPICardsProps {
  total: number;
  scored: number;
  avgScore: number;
  premium: number;
  withEmail: number;
  contacted: number;
  qualified: number;
}

export default function LeadKPICards({
  total,
  scored,
  avgScore,
  premium,
  withEmail,
  contacted,
  qualified,
}: LeadKPICardsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const scoreColor = '#6B7AFF';

  const cards = [
    {
      value: total,
      label: 'Leads gesamt',
      sub: `${scored} gescored`,
      accent: '#ffffff',
      barPct: 100,
    },
    {
      value: avgScore,
      label: 'Ø Score',
      sub: '',
      accent: scoreColor,
      barPct: avgScore,
    },
    {
      value: premium,
      label: 'Premium',
      sub: 'Score 70+',
      accent: '#F59E0B',
      barPct: total > 0 ? (premium / total) * 100 : 0,
    },
    {
      value: withEmail,
      label: 'E-Mail bereit',
      sub: `${total > 0 ? Math.round((withEmail / total) * 100) : 0}%`,
      accent: '#22C55E',
      barPct: total > 0 ? (withEmail / total) * 100 : 0,
    },
    {
      value: contacted,
      label: 'Kontaktiert',
      sub: `${qualified} qualifiziert`,
      accent: 'rgba(255,255,255,0.55)',
      barPct: total > 0 ? (contacted / total) * 100 : 0,
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-3">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className="relative overflow-hidden rounded-[10px] border border-white/[0.07] bg-[#111111] p-4 px-5 transition-all duration-500 ease-out"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(8px)',
            transitionDelay: `${i * 50}ms`,
          }}
        >
          <div className="text-[32px] font-bold leading-none" style={{ fontFamily: 'var(--font-dm-mono)' }}>
            <span style={{ color: card.accent }}>{card.value}</span>
          </div>
          <div className="mt-1.5 text-[13px] text-white/55">{card.label}</div>
          {card.sub && <div className="mt-0.5 text-[11px] text-white/30">{card.sub}</div>}
          <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: mounted ? `${card.barPct}%` : '0%',
                backgroundColor: card.accent,
                transitionDelay: `${i * 50 + 200}ms`,
              }}
            />
          </div>
          <div className="absolute bottom-0 left-0 h-[2px] w-full" style={{ backgroundColor: card.accent }} />
        </div>
      ))}
    </div>
  );
}
