'use client';

import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip);

interface ScoreDonutProps {
  premium: number;
  warm: number;
  cold: number;
  avgScore: number;
}

export default function ScoreDonut({ premium, warm, cold, avgScore }: ScoreDonutProps) {
  const chartData = {
    labels: ['Premium', 'Warm', 'Cold'],
    datasets: [
      {
        data: [premium, warm, cold],
        backgroundColor: ['#F59E0B', '#6B7AFF', 'rgba(107,122,255,0.25)'],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    animation: {
      duration: 1000,
    },
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
    <div className="rounded-[12px] border border-white/[0.06] bg-[#111111] p-5 px-6">
      <div className="mb-4 text-[13px] font-semibold text-white">Score-Verteilung</div>
      <div className="flex items-center gap-6">
        <div className="relative h-[120px] w-[120px] flex-shrink-0">
          <Doughnut data={chartData} options={options} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[20px] font-bold text-white" style={{ fontFamily: 'var(--font-dm-mono)' }}>
              {avgScore}
            </span>
            <span className="text-[9px] text-white/30">score</span>
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
            <span className="text-[11px] text-white/50">Premium (Score 70+): {premium}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#6B7AFF]" />
            <span className="text-[11px] text-white/50">Warm (Score 45-69): {warm}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#6B7AFF]/30" />
            <span className="text-[11px] text-white/50">Cold (Score &lt;45): {cold}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
