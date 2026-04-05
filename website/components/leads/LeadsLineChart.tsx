'use client';

import { useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { Lead } from '@/lib/leads-client';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

const TAB_CONFIG: Record<string, { label: string; color: string; title: string }> = {
  all: { label: 'Alle Leads', color: '#6B7AFF', title: 'Lead-Entwicklung' },
  new: { label: 'Neue Leads', color: '#6B7AFF', title: 'Neue Leads' },
  contacted: { label: 'Kontaktiert', color: '#F59E0B', title: 'Kontaktierte Leads' },
  qualified: { label: 'Qualifiziert', color: '#22C55E', title: 'Qualifizierte Leads' },
  lost: { label: 'Verloren', color: 'rgba(255,255,255,0.3)', title: 'Verlorene Leads' },
};

interface LeadsLineChartProps {
  leads: Lead[];
  activeTab: string;
}

export default function LeadsLineChart({ leads, activeTab }: LeadsLineChartProps) {
  const config = TAB_CONFIG[activeTab] ?? TAB_CONFIG.all;
  const hexColor = config.color.startsWith('#') ? config.color : null;

  const { labels, counts, total } = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return d.toISOString().split('T')[0];
    });
    const filtered = activeTab === 'all' ? leads : leads.filter((l) => l.status === activeTab);
    const dayCounts = days.map((day) => filtered.filter((l) => l.createdAt?.startsWith(day)).length);
    const dayLabels = days.map((d) => new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }));
    return { labels: dayLabels, counts: dayCounts, total: filtered.length };
  }, [leads, activeTab]);

  const maxCount = Math.max(...counts, 1);

  const chartData = {
    labels,
    datasets: [
      {
        label: config.label,
        data: counts,
        borderColor: config.color,
        backgroundColor: hexColor
          ? (ctx: any) => {
              const { ctx: c, chartArea } = ctx.chart;
              if (!chartArea) return 'transparent';
              const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
              g.addColorStop(0, hexColor + '35');
              g.addColorStop(0.7, hexColor + '08');
              g.addColorStop(1, hexColor + '00');
              return g;
            }
          : 'rgba(255,255,255,0.03)',
        fill: true,
        tension: 0.45,
        borderWidth: 2,
        pointRadius: (ctx: any) => (ctx.parsed?.y > 0 ? 3 : 0),
        pointBackgroundColor: config.color,
        pointBorderColor: '#0a0a0a',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: config.color,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 500, easing: 'easeInOutQuart' as const },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111',
        borderColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        titleColor: 'rgba(255,255,255,0.5)',
        bodyColor: '#fff',
        bodyFont: { family: 'DM Mono, monospace', size: 13, weight: 'bold' as const },
        titleFont: { family: 'DM Sans, sans-serif', size: 10 },
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (item: any) => {
            const c = item.parsed.y;
            return `${c} Lead${c !== 1 ? 's' : ''}`;
          },
        },
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
        suggestedMax: maxCount + 2,
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: 'rgba(255,255,255,0.25)', font: { size: 10 } },
        border: { display: false },
      },
    },
  };

  // Insight line
  const insight = useMemo(() => {
    const tabLeads = activeTab === 'all' ? leads : leads.filter((l) => l.status === activeTab);
    const t = tabLeads.length;
    if (t === 0) return null;
    const hot = tabLeads.filter((l) => l.score >= 70).length;
    const avg = Math.round(tabLeads.reduce((s, l) => s + l.score, 0) / t);
    const withDraft = tabLeads.filter((l) => l.emailDraft).length;
    if (activeTab === 'all') {
      if (hot > 0)
        return { icon: '🔥', text: `${hot} HOT Lead${hot > 1 ? 's' : ''} bereit zum Kontaktieren`, color: '#FF5C2E' };
      return { icon: '📊', text: `Ø Score ${avg} · ${withDraft} mit E-Mail Draft`, color: '#6B7AFF' };
    }
    if (activeTab === 'new')
      return { icon: '✦', text: `${t} neue Leads · Ø Score ${avg} · ${withDraft} mit E-Mail`, color: '#6B7AFF' };
    if (activeTab === 'contacted') return { icon: '✓', text: `${t} kontaktiert · ${hot} davon HOT`, color: '#F59E0B' };
    if (activeTab === 'qualified') return { icon: '★', text: `${t} qualifiziert · Ø Score ${avg}`, color: '#22C55E' };
    if (activeTab === 'lost') return { icon: '—', text: `${t} verloren`, color: 'rgba(255,255,255,0.3)' };
    return null;
  }, [leads, activeTab]);

  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#111111]">
      <div className="flex items-start justify-between p-5 px-6 pb-0">
        <div>
          <div className="text-[13px] font-semibold text-white">{config.title}</div>
          <div className="mt-0.5 text-[11px] text-white/30">Letzte 14 Tage</div>
        </div>
        <div
          className="text-[28px] font-bold leading-none"
          style={{ fontFamily: 'var(--font-dm-mono)', color: config.color }}
        >
          {total}
        </div>
      </div>
      <div className="px-6 pb-4 pt-3">
        <div key={activeTab} style={{ height: 160 }}>
          <Line data={chartData} options={options} />
        </div>
      </div>
      {insight && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 24px',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            fontSize: 11,
            color: insight.color,
            opacity: 0.85,
          }}
        >
          <span style={{ fontSize: 12 }}>{insight.icon}</span>
          <span>{insight.text}</span>
        </div>
      )}
    </div>
  );
}
