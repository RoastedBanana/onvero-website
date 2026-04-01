'use client';

import { useState, useEffect } from 'react';

const stages = [
  { label: 'Generiert', pct: 100, count: 124, color: 'rgba(107,122,255,0.6)' },
  { label: 'Bewertet', pct: 79, count: 98, color: 'rgba(107,122,255,0.5)' },
  { label: 'Kontaktiert', pct: 49, count: 61, color: 'rgba(245,158,11,0.6)' },
  { label: 'HOT', pct: 23, count: 29, color: 'rgba(255,92,46,0.6)' },
  { label: 'Gewonnen', pct: 9, count: 11, color: 'rgba(34,197,94,0.65)' },
];

export default function SalesFunnel() {
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
        transition: 'opacity 500ms ease 300ms, transform 500ms ease 300ms',
      }}
    >
      <div className="mb-4">
        <div className="text-[13px] font-semibold text-white">Sales Funnel</div>
        <div className="mt-0.5 text-[11px] text-white/30">Conversion-Rate</div>
      </div>

      <div className="flex flex-col gap-3">
        {stages.map((stage, i) => (
          <div key={stage.label}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[11px] text-white/40">{stage.label}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-semibold text-white/70" style={{ fontFamily: 'var(--font-dm-mono)' }}>
                  {stage.count}
                </span>
                <span className="text-[10px] text-white/30">{stage.pct}%</span>
              </div>
            </div>
            <div className="h-[22px] w-full overflow-hidden rounded-[4px] bg-white/[0.04]">
              <div
                className="h-full rounded-[4px]"
                style={{
                  width: mounted ? `${stage.pct}%` : '0%',
                  backgroundColor: stage.color,
                  transition: `width 1.2s cubic-bezier(0.34,1.56,0.64,1) ${600 + i * 100}ms`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-end gap-1.5">
        <span className="text-[11px] text-white/30">Conversion</span>
        <span className="text-[13px] font-semibold" style={{ color: '#22C55E', fontFamily: 'var(--font-dm-mono)' }}>
          8.9%
        </span>
      </div>
    </div>
  );
}
