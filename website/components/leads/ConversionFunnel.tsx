'use client';

import { useState, useEffect } from 'react';

interface ConversionFunnelProps {
  total: number;
  scored: number;
  withEmail: number;
  contacted: number;
  qualified: number;
}

export default function ConversionFunnel({ total, scored, withEmail, contacted, qualified }: ConversionFunnelProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const rows = [
    { label: 'Generiert', value: total, pct: 100 },
    { label: 'Gescored', value: scored, pct: total > 0 ? (scored / total) * 100 : 0 },
    { label: 'Mit E-Mail', value: withEmail, pct: total > 0 ? (withEmail / total) * 100 : 0 },
    { label: 'Kontaktiert', value: contacted, pct: total > 0 ? (contacted / total) * 100 : 0 },
    { label: 'Qualifiziert', value: qualified, pct: total > 0 ? (qualified / total) * 100 : 0 },
  ];

  const getFillColor = (i: number) => {
    if (i < 2) return 'rgba(255,255,255,0.15)';
    if (i === 2) return 'rgba(107,122,255,0.6)';
    if (i === 3) return 'rgba(107,122,255,0.8)';
    return '#6B7AFF';
  };

  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#111111] p-5 px-6">
      <div className="mb-4 text-[13px] font-semibold text-white">Conversion Funnel</div>
      <div className="flex flex-col gap-3">
        {rows.map((row, i) => (
          <div key={row.label} className="flex items-center gap-3">
            <span className="w-[80px] flex-shrink-0 text-[11px] text-white/30">{row.label}</span>
            <div className="h-[6px] flex-1 overflow-hidden rounded-[3px] bg-white/[0.06]">
              <div
                className="h-full rounded-[3px]"
                style={{
                  width: mounted ? `${row.pct}%` : '0%',
                  backgroundColor: getFillColor(i),
                  transition: `width 800ms ease-out ${i * 100}ms`,
                }}
              />
            </div>
            <div className="flex w-[70px] flex-shrink-0 items-center justify-end gap-1.5">
              <span className="text-[12px] font-semibold text-white/70" style={{ fontFamily: 'var(--font-dm-mono)' }}>
                {row.value}
              </span>
              <span className="text-[10px] text-white/30">{Math.round(row.pct)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
