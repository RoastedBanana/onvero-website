'use client';

import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

const labels = ['KW 1', 'KW 2', 'KW 3', 'KW 4', 'KW 5', 'KW 6', 'KW 7', 'KW 8'];
const dataPoints = [8, 12, 9, 15, 11, 18, 22, 29];

export default function LeadEntwicklungChart() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const chartData = {
    labels,
    datasets: [
      {
        data: dataPoints,
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
        tension: 0.45,
        borderWidth: 2,
        pointRadius: 3,
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
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: 'rgba(255,255,255,0.25)', font: { size: 10 } },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        suggestedMax: 35,
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: 'rgba(255,255,255,0.25)', font: { size: 10 } },
        border: { display: false },
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
        transition: 'opacity 500ms ease, transform 500ms ease',
      }}
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="text-[13px] font-semibold text-white">Lead-Entwicklung</div>
          <div className="mt-0.5 text-[11px] text-white/30">Neue Leads pro Woche</div>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E' }}
        >
          ↑ +18%
        </span>
      </div>
      <div style={{ height: 130 }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
