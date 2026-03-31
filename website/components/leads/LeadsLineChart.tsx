'use client';

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

interface LeadsLineChartProps {
  data: { date: string; count: number }[];
  total: number;
}

export default function LeadsLineChart({ data, total }: LeadsLineChartProps) {
  const labels = data.map((d) => {
    const parts = d.date.split('-');
    return parts[2] ? String(parseInt(parts[2], 10)) : d.date;
  });

  const counts = data.map((d) => d.count);
  const maxCount = Math.max(...counts, 0);

  const chartData = {
    labels,
    datasets: [
      {
        data: counts,
        borderColor: '#6B7AFF',
        backgroundColor: (ctx: any) => {
          const chart = ctx.chart;
          const { ctx: canvasCtx, chartArea } = chart;
          if (!chartArea) return 'transparent';
          const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(107,122,255,0.25)');
          gradient.addColorStop(1, 'transparent');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: (ctx: any) => (ctx.parsed.y > 0 ? 3 : 0),
        pointBackgroundColor: '#6B7AFF',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1400,
      easing: 'easeOutQuart' as const,
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
    scales: {
      x: {
        grid: {
          color: 'rgba(255,255,255,0.04)',
        },
        ticks: {
          color: 'rgba(255,255,255,0.25)',
          font: { size: 10 },
        },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        suggestedMax: maxCount + 5,
        grid: {
          color: 'rgba(255,255,255,0.04)',
        },
        ticks: {
          color: 'rgba(255,255,255,0.25)',
          font: { size: 10 },
        },
        border: { display: false },
      },
    },
  };

  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#111111] p-5 px-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="text-[13px] font-semibold text-white">Neue Leads</div>
          <div className="mt-0.5 text-[11px] text-white/30">Letzte 14 Tage</div>
        </div>
        <div
          className="text-[28px] font-bold leading-none text-[#6B7AFF]"
          style={{ fontFamily: 'var(--font-dm-mono)' }}
        >
          {total}
        </div>
      </div>
      <div className="h-[180px]">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
