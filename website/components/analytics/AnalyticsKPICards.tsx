'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface KPICard {
  value: number;
  label: string;
  trend: string;
  trendPositive: boolean;
  accent: string;
}

const cards: KPICard[] = [
  { value: 124, label: 'Leads gesamt', trend: '↑ +18% vs. Vormonat', trendPositive: true, accent: '#ffffff' },
  { value: 29, label: 'HOT Leads', trend: '↑ +5 diese Woche', trendPositive: true, accent: '#FF5C2E' },
  { value: 51, label: 'WARM Leads', trend: '→ Stabil', trendPositive: false, accent: '#F59E0B' },
  { value: 64, label: 'Ø KI Score', trend: '↑ +4.2 Punkte', trendPositive: true, accent: '#6B7AFF' },
];

function useCountUp(target: number, duration: number, start: boolean) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  const animate = useCallback(() => {
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);
  }, [target, duration]);

  useEffect(() => {
    if (start) animate();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [start, animate]);

  return value;
}

function KPICardItem({ card, index, mounted }: { card: KPICard; index: number; mounted: boolean }) {
  const count = useCountUp(card.value, 1200, mounted);

  return (
    <div
      className="relative overflow-hidden rounded-[12px] bg-[#111111] p-4 px-5 transition-all duration-500 ease-out"
      style={{
        border: '1px solid rgba(255,255,255,0.06)',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(8px)',
        transitionDelay: `${index * 50}ms`,
      }}
    >
      <div className="flex items-start justify-between">
        <div
          className="text-[32px] font-bold leading-none"
          style={{ fontFamily: 'var(--font-dm-mono)', color: card.accent }}
        >
          {count}
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{
            background: card.trendPositive ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)',
            color: card.trendPositive ? '#22C55E' : 'rgba(255,255,255,0.35)',
          }}
        >
          {card.trend}
        </span>
      </div>
      <div className="mt-1.5 text-[13px] text-white/55">{card.label}</div>
      <div className="absolute bottom-0 left-0 h-[2px] w-full" style={{ backgroundColor: card.accent }} />
    </div>
  );
}

export default function AnalyticsKPICards() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="grid grid-cols-4 gap-3">
      {cards.map((card, i) => (
        <KPICardItem key={card.label} card={card} index={i} mounted={mounted} />
      ))}
    </div>
  );
}
