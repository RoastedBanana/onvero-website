'use client';

import { useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import type { Lead } from '@/lib/leads-client';

ChartJS.register(ArcElement, Tooltip);

type ScoreTier = 'hot' | 'warm' | 'cold';

const TITLES: Record<string, string> = {
  all: 'Score-Verteilung',
  new: 'Score — Neu',
  contacted: 'Score — Kontaktiert',
  qualified: 'Score — Qualifiziert',
  lost: 'Score — Verloren',
};

interface ScoreDonutProps {
  leads: Lead[];
  activeTab: string;
  activeTier?: ScoreTier | null;
  onTierClick?: (tier: ScoreTier | null) => void;
}

export default function ScoreDonut({ leads, activeTab, activeTier, onTierClick }: ScoreDonutProps) {
  const { hot, warm, cold, avgScore } = useMemo(() => {
    const h = leads.filter((l) => l.score >= 75).length;
    const w = leads.filter((l) => l.score >= 45 && l.score < 75).length;
    const c = leads.filter((l) => l.score < 45).length;
    const avg = leads.length > 0 ? Math.round(leads.reduce((s, l) => s + l.score, 0) / leads.length) : 0;
    return { hot: h, warm: w, cold: c, avgScore: avg };
  }, [leads]);

  const chartData = {
    labels: ['HOT', 'WARM', 'COLD'],
    datasets: [
      {
        data: [hot, warm, cold],
        backgroundColor: ['#FF5C2E', '#F59E0B', 'rgba(107,122,255,0.5)'],
        borderColor: '#111',
        borderWidth: 3,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: false,
    cutout: '72%',
    animation: { duration: 800, easing: 'easeInOutQuart' as const },
    plugins: {
      tooltip: {
        backgroundColor: '#111',
        titleColor: 'rgba(255,255,255,0.5)',
        bodyColor: '#fff',
        borderColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        padding: 8,
        cornerRadius: 6,
      },
    },
  };

  const title = TITLES[activeTab] ?? TITLES.all;

  const tiers: { key: ScoreTier; label: string; count: number; color: string; bg: string }[] = [
    { key: 'hot', label: 'HOT', count: hot, color: '#FF5C2E', bg: 'rgba(255,92,46,0.1)' },
    { key: 'warm', label: 'WARM', count: warm, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
    { key: 'cold', label: 'COLD', count: cold, color: '#6B7AFF', bg: 'rgba(107,122,255,0.1)' },
  ];

  return (
    <div className="rounded-[12px] border border-white/[0.06] bg-[#111111] p-4 px-5">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#fff' }}>{title}</div>
        {activeTier && (
          <button
            onClick={() => onTierClick?.(null)}
            style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.35)',
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              borderRadius: 4,
              padding: '2px 6px',
              cursor: 'pointer',
            }}
          >
            ✕ Filter
          </button>
        )}
      </div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>
        {leads.length} Leads bewertet
      </div>

      {/* Donut — zentriert */}
      <div
        key={`${activeTab}-${hot}-${warm}-${cold}`}
        style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 16px' }}
      >
        <Doughnut data={chartData} options={options} width={140} height={140} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-dm-mono)', color: '#fff', lineHeight: 1 }}
          >
            {avgScore}
          </span>
          <span
            style={{
              fontSize: 9,
              color: 'rgba(255,255,255,0.3)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginTop: 3,
            }}
          >
            Ø Score
          </span>
        </div>
      </div>

      {/* 3 Stat Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {tiers.map((t) => {
          const isActive = activeTier === t.key;
          return (
            <div
              key={t.key}
              onClick={() => onTierClick?.(isActive ? null : t.key)}
              style={{
                background: t.bg,
                borderRadius: 8,
                padding: '8px 4px',
                textAlign: 'center',
                border: `1px solid ${t.color}22`,
                cursor: 'pointer',
                opacity: activeTier && !isActive ? 0.4 : 1,
                transition: 'opacity 0.15s',
                boxShadow: isActive ? `0 0 10px ${t.color}33` : 'none',
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: t.color,
                  fontFamily: 'var(--font-dm-mono)',
                  lineHeight: 1,
                }}
              >
                {t.count}
              </div>
              <div style={{ fontSize: 9, color: t.color, opacity: 0.7, marginTop: 3, letterSpacing: '0.08em' }}>
                {t.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
