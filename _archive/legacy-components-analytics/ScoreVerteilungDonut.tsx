'use client';

import { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip);

const segments = [
  { label: 'HOT', value: 29, pct: 23, color: '#FF5C2E' },
  { label: 'WARM', value: 51, pct: 41, color: '#F59E0B' },
  { label: 'COLD', value: 44, pct: 36, color: '#6B7AFF' },
];

export default function ScoreVerteilungDonut() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = {
    labels: segments.map((s) => s.label),
    datasets: [
      {
        data: segments.map((s) => s.value),
        backgroundColor: segments.map((s) => s.color),
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    animation: { duration: 1000 },
    plugins: {
      tooltip: {
        backgroundColor: '#222222',
        titleColor: '#ffffff',
        bodyColor: 'rgba(255,255,255,0.55)',
        borderColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        padding: 8,
        cornerRadius: 6,
      },
    },
  };

  return (
    <div
      className="rounded-[12px] bg-[#111111] p-5 px-6"
      style={{
        border: '1px solid rgba(255,255,255,0.06)',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 500ms ease 100ms, transform 500ms ease 100ms',
      }}
    >
      <div className="mb-4">
        <div className="text-[13px] font-semibold text-white">Score-Verteilung</div>
        <div className="mt-0.5 text-[11px] text-white/30">HOT / WARM / COLD</div>
      </div>
      <div className="flex items-center gap-6" style={{ alignItems: 'center' }}>
        <div className="relative flex-shrink-0" style={{ width: 100, height: 100 }}>
          <Doughnut data={chartData} options={options} />
        </div>
        <div className="flex flex-col gap-2.5">
          {segments.map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-[11px] text-white/50">{s.label}</span>
              <span className="text-[11px] text-white/30">{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
