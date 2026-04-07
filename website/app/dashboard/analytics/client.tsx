'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  CartesianGrid,
  ComposedChart,
  Area,
} from 'recharts';

type Tab = 'master' | 'leads' | 'pipeline' | 'ki' | 'activity';

const TABS: { id: Tab; label: string }[] = [
  { id: 'master', label: 'Übersicht' },
  { id: 'leads', label: 'Leads' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'ki', label: 'KI' },
  { id: 'activity', label: 'Aktivitäten' },
];

const S = {
  card: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 14,
  } as React.CSSProperties,
  kpiCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: '14px 16px',
  } as React.CSSProperties,
  label: {
    fontSize: 10,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    color: 'rgba(255,255,255,0.2)',
    fontWeight: 500,
    marginBottom: 6,
  } as React.CSSProperties,
  val: {
    fontSize: 26,
    fontWeight: 700,
    fontFamily: 'var(--font-dm-mono)',
    lineHeight: 1,
    marginBottom: 3,
    color: '#e8e8e8',
  } as React.CSSProperties,
  sub: { fontSize: 11, color: 'rgba(255,255,255,0.3)' } as React.CSSProperties,
  chartTitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.2)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    fontWeight: 500,
    marginBottom: 2,
  } as React.CSSProperties,
  chartSub: { fontSize: 11, color: 'rgba(255,255,255,0.25)', marginBottom: 12 } as React.CSSProperties,
};

function TooltipBox({ text, children }: { text: string; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  return (
    <div
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          style={{
            position: 'absolute',
            bottom: '130%',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: '#1e1e1e',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8,
            padding: '8px 12px',
            width: 220,
            pointerEvents: 'none',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          }}
        >
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{text}</div>
        </div>
      )}
    </div>
  );
}

function InfoIcon({ tooltip }: { tooltip: string }) {
  return (
    <TooltipBox text={tooltip}>
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.2)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 9,
          color: 'rgba(255,255,255,0.3)',
          cursor: 'help',
          marginLeft: 5,
          flexShrink: 0,
        }}
      >
        ?
      </div>
    </TooltipBox>
  );
}

function AnimatedNumber({
  value,
  duration = 1000,
  prefix = '',
  suffix = '',
}: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const startTime = useRef<number | null>(null);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    startTime.current = null;
    const animate = (ts: number) => {
      if (!startTime.current) startTime.current = ts;
      const progress = Math.min((ts - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);
  return (
    <>
      {prefix}
      {display.toLocaleString('de-DE')}
      {suffix}
    </>
  );
}

function LeadDevelopmentChart({ weeklyData, trendData }: { weeklyData: any[]; trendData: any[] }) {
  const [view, setView] = useState<'weekly' | 'daily'>('daily');
  const data = view === 'weekly' ? weeklyData : trendData;
  const total = weeklyData.reduce((s: number, w: any) => s + w.total, 0);
  const totalHot = weeklyData.reduce((s: number, w: any) => s + w.hot, 0);
  const totalWarm = weeklyData.reduce((s: number, w: any) => s + w.warm, 0);
  const totalCold = weeklyData.reduce((s: number, w: any) => s + w.cold, 0);

  const ChartTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
      <div
        style={{
          background: '#1a1a1a',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10,
          padding: '12px 14px',
          minWidth: 160,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8, fontWeight: 600 }}>
          {d.week || d.label}
        </div>
        {[
          { key: 'hot', label: 'HOT', color: '#FF5C2E' },
          { key: 'warm', label: 'WARM', color: '#F59E0B' },
          { key: 'cold', label: 'COLD', color: '#6B7AFF' },
        ].map((item) => (
          <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{item.label}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-dm-mono)', color: item.color }}>
              {d[item.key] || 0}
            </span>
          </div>
        ))}
        <div
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Gesamt</span>
          <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-dm-mono)', color: '#fff' }}>
            {d.total || 0}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        background: '#111',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        padding: 20,
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Lead-Entwicklung</div>
            <InfoIcon tooltip="Neue Leads pro Periode, aufgeteilt nach KI-Qualitaet. HOT = Score >= 75, WARM = 45-74, COLD = unter 45." />
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
            Neue Leads pro {view === 'weekly' ? 'Woche' : 'Tag'}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 2,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 8,
            padding: 3,
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {(['weekly', 'daily'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: '4px 12px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 600,
                background: view === v ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: view === v ? '#fff' : 'rgba(255,255,255,0.35)',
                transition: 'all 0.15s',
              }}
            >
              {v === 'weekly' ? 'Wöchentlich' : 'Täglich'}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          {[
            { label: 'HOT', count: totalHot, color: '#FF5C2E', bg: 'rgba(255,92,46,0.12)' },
            { label: 'WARM', count: totalWarm, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
            { label: 'COLD', count: totalCold, color: '#6B7AFF', bg: 'rgba(107,122,255,0.12)' },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{item.label}</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: 'var(--font-dm-mono)',
                  color: item.color,
                  padding: '1px 6px',
                  background: item.bg,
                  borderRadius: 4,
                }}
              >
                {item.count}
              </span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: 9,
                color: 'rgba(255,255,255,0.25)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Gesamt
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                fontFamily: 'var(--font-dm-mono)',
                color: '#fff',
                lineHeight: 1.2,
              }}
            >
              {total}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: 9,
                color: 'rgba(255,255,255,0.25)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              HOT-Rate
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                fontFamily: 'var(--font-dm-mono)',
                color: '#FF5C2E',
                lineHeight: 1.2,
              }}
            >
              {total > 0 ? Math.round((totalHot / total) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>
      <div style={{ position: 'relative' }}>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradCold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6B7AFF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6B7AFF" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradWarm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradHot" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF5C2E" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#FF5C2E" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey={view === 'weekly' ? 'week' : 'label'}
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={view === 'daily' ? 2 : 0}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={22}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.06)', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="cold"
              stackId="1"
              stroke="#6B7AFF"
              strokeWidth={1.5}
              fill="url(#gradCold)"
              name="COLD"
              dot={{ fill: '#6B7AFF', r: 2, strokeWidth: 0 }}
              activeDot={{ r: 4, fill: '#6B7AFF', strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="warm"
              stackId="1"
              stroke="#F59E0B"
              strokeWidth={1.5}
              fill="url(#gradWarm)"
              name="WARM"
              dot={{ fill: '#F59E0B', r: 2, strokeWidth: 0 }}
              activeDot={{ r: 4, fill: '#F59E0B', strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="hot"
              stackId="1"
              stroke="#FF5C2E"
              strokeWidth={2}
              fill="url(#gradHot)"
              name="HOT"
              dot={{ fill: '#FF5C2E', r: 2, strokeWidth: 0 }}
              activeDot={{ r: 4, fill: '#FF5C2E', strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        {view === 'weekly' && weeklyData.filter((w: any) => w.total > 0).length < 3 && (
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 10,
              color: 'rgba(255,255,255,0.2)',
              background: 'rgba(0,0,0,0.4)',
              padding: '4px 10px',
              borderRadius: 20,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}
          >
            Täglich ansehen fuer mehr Detail
          </div>
        )}
      </div>
      <div
        style={{
          marginTop: 10,
          paddingTop: 8,
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 9,
          color: 'rgba(255,255,255,0.2)',
        }}
      >
        <span>Quelle: Supabase · leads · {view === 'weekly' ? 'Kalenderwoche' : 'Tag'}</span>
        <span>Live</span>
      </div>
    </div>
  );
}

export default function AnalyticsClient() {
  const [tab, setTab] = useState<Tab>('master');
  const [masterData, setMasterData] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState<any>(null);
  const [contentData, setContentData] = useState<any>(null);
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null);
  const [pageSpeed, setPageSpeed] = useState<any>(null);
  const [trendData, setTrendData] = useState<any>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [leadsData, setLeadsData] = useState<any>(null);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [barsAnimated, setBarsAnimated] = useState(false);

  const fmt = (n: number) => Math.round(n).toLocaleString('de-DE');
  const fmtEur = (n: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  const fmtDur = (s: number) => `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;

  const typeLabels: Record<string, string> = {
    ai_analysis: 'KI-Analyse abgeschlossen',
    score_update: 'Score aktualisiert',
    status_change: 'Status geaendert',
    task: 'Aufgabe erstellt',
    form_submit: 'Formular eingereicht',
    score_alert: 'HOT Lead Alert',
  };
  const typeColors: Record<string, string> = {
    ai_analysis: '#6B7AFF',
    score_update: '#6B7AFF',
    status_change: '#a78bfa',
    task: '#22C55E',
    form_submit: '#FF5C2E',
    score_alert: '#FF5C2E',
  };
  const formatRelTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'gerade eben';
    if (mins < 60) return `vor ${mins} Min.`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `vor ${hrs} Std.`;
    const days = Math.floor(hrs / 24);
    return days < 7
      ? `vor ${days} ${days === 1 ? 'Tag' : 'Tagen'}`
      : new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  };
  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    setLeadsData((prev: any) =>
      prev
        ? { ...prev, hotLeads: prev.hotLeads?.map((l: any) => (l.id === leadId ? { ...l, status: newStatus } : l)) }
        : prev
    );
    setStatusDropdown(null);
    await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
  };
  const exportCSV = (data: any[], filename: string) => {
    if (!data?.length) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((r) =>
      Object.values(r)
        .map((v) => JSON.stringify(v ?? ''))
        .join(',')
    );
    const blob = new Blob([headers + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const displayVal = (val: number, emptyText = '—') => (val === 0 ? emptyText : fmt(val));

  useEffect(() => {
    const s = document.createElement('style');
    s.textContent = `
      @keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.6;transform:scale(0.85)}}
      @keyframes count-up{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
      @keyframes tab-slide{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
      @keyframes fadeSlideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      @keyframes livePulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.7;transform:scale(0.85)}}
      @keyframes liveRing{0%{opacity:0.6;transform:scale(1)}100%{opacity:0;transform:scale(2.5)}}
      .analytics-card{transition:border-color 0.2s ease,box-shadow 0.2s ease,transform 0.15s ease}
      .analytics-card:hover{border-color:rgba(255,255,255,0.12)!important}
      .kpi-value{animation:count-up 0.4s ease forwards}
    `;
    document.head.appendChild(s);
    return () => {
      document.head.removeChild(s);
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/analytics/master').then((r) => r.json()),
      fetch(`/api/analytics?period=${period}`).then((r) => r.json()),
    ])
      .then(([master, analytics]) => {
        setMasterData(master);
        setAnalyticsData(analytics);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period]);

  // Load activity data on mount
  useEffect(() => {
    fetch('/api/analytics/activity')
      .then((r) => r.json())
      .then(setActivityData)
      .catch(() => {});
    fetch('/api/analytics/trend')
      .then((r) => r.json())
      .then(setTrendData)
      .catch(() => {});
  }, []);

  // Load content data lazily
  useEffect(() => {
    if (!contentData) {
      fetch('/api/analytics/content')
        .then((r) => r.json())
        .then(setContentData)
        .catch(() => {});
    }
  }, [contentData]);

  useEffect(() => {
    if (!pageSpeed) {
      fetch('/api/analytics/pagespeed')
        .then((r) => r.json())
        .then((d) => {
          if (!d.error) setPageSpeed(d);
        })
        .catch(() => {});
    }
  }, [tab, pageSpeed]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/analytics/master')
        .then((r) => r.json())
        .then((d) => {
          setMasterData(d);
          setLastRefresh(new Date());
        })
        .catch(() => {});
      fetch('/api/analytics/activity')
        .then((r) => r.json())
        .then(setActivityData)
        .catch(() => {});
    }, 120000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!statusDropdown) return;
    const close = () => setStatusDropdown(null);
    const timer = setTimeout(() => {
      document.addEventListener('click', close, { once: true });
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', close);
    };
  }, [statusDropdown]);

  useEffect(() => {
    if (tab !== 'leads' || leadsData) return;
    setLeadsLoading(true);
    fetch(`/api/analytics/leads?period=${period}`)
      .then((r) => r.json())
      .then((d) => {
        setLeadsData(d);
        setLeadsLoading(false);
        setBarsAnimated(false);
        setTimeout(() => setBarsAnimated(true), 100);
      })
      .catch(() => setLeadsLoading(false));
  }, [tab, period, leadsData]);

  useEffect(() => {
    if (tab === 'leads') setLeadsData(null);
  }, [period]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const firstColor = payload[0]?.color || '#6B7AFF';
    return (
      <div
        style={{
          background: '#161616',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
          minWidth: 150,
        }}
      >
        <div style={{ height: 3, background: firstColor, opacity: 0.7 }} />
        <div style={{ padding: '10px 14px' }}>
          <div
            style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.4)',
              marginBottom: 8,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {label}
          </div>
          {payload.map((p: any, i: number) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                marginBottom: 4,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{p.name}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-dm-mono)', color: p.color }}>
                {typeof p.value === 'number' ? p.value.toLocaleString('de-DE') : p.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading || !masterData)
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 400,
          color: 'rgba(255,255,255,0.2)',
          fontSize: 13,
          fontFamily: 'var(--font-dm-mono)',
        }}
      >
        Lade Daten...
      </div>
    );

  const { leads, website, systemStatus, hasPlausible } = masterData;
  const weekly = analyticsData?.weeklyLeads || [];

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1440 }}>
      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 28,
          paddingBottom: 24,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <PageHeader title="Analytics" badge={{ label: 'Live', variant: 'live' }} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {(tab === 'leads' || tab === 'pipeline') && (
            <div
              style={{
                display: 'flex',
                gap: 1,
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 10,
                padding: 3,
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              {['7d', '30d', '3mo', '12mo'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={{
                    padding: '5px 14px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 600,
                    background: period === p ? 'rgba(255,255,255,0.12)' : 'transparent',
                    color: period === p ? '#fff' : 'rgba(255,255,255,0.3)',
                    transition: 'all 0.15s',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TABS */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          marginBottom: 24,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          paddingBottom: 0,
        }}
      >
        {TABS.map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '10px 20px',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: isActive ? '#e8e8e8' : 'rgba(255,255,255,0.3)',
                transition: 'all 0.2s',
                position: 'relative',
                borderBottom: isActive ? '2px solid rgba(255,255,255,0.15)' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {t.label}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: -1,
                    left: '10%',
                    right: '10%',
                    height: 2,
                    background: 'rgba(255,255,255,0.15)',
                    boxShadow: 'none',
                    borderRadius: 1,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div key={tab} style={{ animation: 'fadeSlideIn 0.25s ease forwards' }}>
        {/* MASTER */}
        {tab === 'master' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div
                onClick={() => setTab('leads')}
                style={{
                  ...S.card,
                  padding: '18px 20px',
                  cursor: 'pointer',
                  borderColor: 'rgba(255,92,46,0.2)',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,92,46,0.4)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,92,46,0.2)')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={S.label}>Lead Intelligence</div>
                    <div style={{ ...S.val, fontSize: 28, color: '#FF5C2E' }}>{leads.total}</div>
                    <div style={S.sub}>Leads total · {leads.last7d} diese Woche</div>
                  </div>
                  <div style={{ fontSize: 20, opacity: 0.3 }}>→</div>
                </div>
                <div
                  style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', gap: 2, marginBottom: 8 }}
                >
                  <div
                    style={{
                      width: `${leads.total > 0 ? Math.round((leads.hot / leads.total) * 100) : 0}%`,
                      background: '#FF5C2E',
                      borderRadius: 3,
                    }}
                  />
                  <div
                    style={{
                      width: `${leads.total > 0 ? Math.round((leads.warm / leads.total) * 100) : 0}%`,
                      background: '#F59E0B',
                      borderRadius: 3,
                    }}
                  />
                  <div style={{ flex: 1, background: '#6B7AFF', borderRadius: 3 }} />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ fontSize: 10, color: '#FF5C2E' }}>{leads.hot} HOT</span>
                  <span style={{ fontSize: 10, color: '#F59E0B' }}>{leads.warm} WARM</span>
                  <span style={{ fontSize: 10, color: '#6B7AFF' }}>{leads.cold} COLD</span>
                </div>
              </div>
              <div
                onClick={() => setTab('activity')}
                style={{ ...S.card, padding: '18px 20px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(107,122,255,0.3)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
              >
                <div style={S.label}>Aktivitäten</div>
                <div style={{ ...S.val, fontSize: 24, color: '#6B7AFF' }}>{leads.total > 0 ? leads.total : '—'}</div>
                <div style={S.sub}>Ereignisse gesamt</div>
              </div>
              <div
                onClick={() => setTab('pipeline')}
                style={{ ...S.card, padding: '18px 20px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(34,197,94,0.3)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
              >
                <div style={S.label}>Pipeline</div>
                <div style={{ ...S.val, fontSize: 22, color: '#22C55E' }}>{fmtEur(leads.pipelineMin)}</div>
                <div style={S.sub}>bis {fmtEur(leads.pipelineMax)}</div>
                <div style={{ marginTop: 8, fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                  {leads.contacted} kontaktiert
                </div>
              </div>
              <div
                onClick={() => setTab('ki')}
                style={{ ...S.card, padding: '18px 20px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
              >
                <div style={S.label}>KI-Scoring</div>
                <div style={{ ...S.val, fontSize: 24, color: '#8B5CF6' }}>{leads.avgScore}</div>
                <div style={S.sub}>Ø Score · {leads.aiScored} bewertet</div>
              </div>
              <div style={{ ...S.card, padding: '18px 20px', opacity: 0.4, position: 'relative' }}>
                <div style={S.label}>Clients</div>
                <div style={{ ...S.val, fontSize: 22, color: 'rgba(255,255,255,0.2)' }}>—</div>
                <div style={S.sub}>Multi-Tenant</div>
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    fontSize: 9,
                    padding: '2px 6px',
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.3)',
                    borderRadius: 4,
                  }}
                >
                  Bald
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 12, marginBottom: 12 }}>
              <LeadDevelopmentChart weeklyData={weekly} trendData={trendData?.trend || []} />
              <div style={{ ...S.card, padding: 20 }}>
                <div style={S.chartTitle}>Aktivität</div>
                <div style={S.chartSub}>Letzte Ereignisse</div>
                {(activityData?.activities || []).slice(0, 5).map((a: any, i: number) => {
                  const color = typeColors[a.type] || 'rgba(255,255,255,0.3)';
                  const icon =
                    a.type === 'status_change'
                      ? '↔'
                      : a.type === 'ai_analysis' || a.type === 'score_update'
                        ? '◈'
                        : a.type === 'task'
                          ? '◇'
                          : '·';
                  const getTitle = () => {
                    if (a.type === 'status_change' && a.metadata) {
                      const labels: Record<string, string> = {
                        new: 'Neu',
                        contacted: 'Kontaktiert',
                        qualified: 'Qualifiziert',
                        lost: 'Verloren',
                      };
                      return `${labels[a.metadata.old_status] || a.metadata.old_status || 'Neu'} → ${labels[a.metadata.new_status] || a.metadata.new_status || '?'}`;
                    }
                    return typeLabels[a.type] || a.title || a.type;
                  };
                  return (
                    <a
                      key={a.id}
                      href={a.lead_id ? `/dashboard/leads?highlight=${a.lead_id}` : '/dashboard/leads'}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        padding: '8px 10px',
                        borderRadius: 8,
                        marginBottom: 2,
                        textDecoration: 'none',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                        background: i === 0 ? 'rgba(255,255,255,0.03)' : 'transparent',
                        border: i === 0 ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
                      }}
                    >
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 7,
                          flexShrink: 0,
                          background: `${color}15`,
                          border: `1px solid ${color}25`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          color,
                          marginTop: 1,
                        }}
                      >
                        {icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: i === 0 ? 500 : 400 }}>
                          {getTitle()}
                        </div>
                        {(a.lead_name || a.company) && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              marginTop: 3,
                              flexWrap: 'nowrap',
                              overflow: 'hidden',
                            }}
                          >
                            {a.lead_name && (
                              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{a.lead_name}</span>
                            )}
                            {a.company && (
                              <>
                                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>·</span>
                                <span
                                  style={{
                                    fontSize: 10,
                                    color: 'rgba(255,255,255,0.35)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: 100,
                                  }}
                                >
                                  {a.company}
                                </span>
                              </>
                            )}
                            {a.score != null && (
                              <>
                                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>·</span>
                                <span
                                  style={{
                                    fontSize: 9,
                                    fontWeight: 700,
                                    fontFamily: 'var(--font-dm-mono)',
                                    color: a.score >= 70 ? '#FF5C2E' : a.score >= 45 ? '#F59E0B' : '#6B7AFF',
                                    padding: '1px 5px',
                                    background:
                                      a.score >= 70
                                        ? 'rgba(255,92,46,0.1)'
                                        : a.score >= 45
                                          ? 'rgba(245,158,11,0.1)'
                                          : 'rgba(107,122,255,0.1)',
                                    borderRadius: 4,
                                  }}
                                >
                                  {a.score}
                                </span>
                              </>
                            )}
                          </div>
                        )}
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>
                          {formatRelTime(a.created_at)}
                        </div>
                      </div>
                    </a>
                  );
                })}
                {(!activityData || activityData.activities?.length === 0) && (
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', padding: '12px 0' }}>
                    Noch keine Aktivitäten
                  </div>
                )}
              </div>
            </div>
            {trendData?.trend && (
              <div style={{ ...S.card, padding: 20, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={S.chartTitle}>Täglich</div>
                  <InfoIcon tooltip="Neu generierte Leads pro Tag, letzte 14 Tage." />
                </div>
                <div style={S.chartSub}>14 Tage</div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={trendData.trend}>
                    <XAxis
                      dataKey="label"
                      tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      interval={2}
                    />
                    <YAxis
                      tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={20}
                      allowDecimals={false}
                    />
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#6B7AFF"
                      strokeWidth={2}
                      dot={{ fill: '#6B7AFF', r: 3 }}
                      name="Leads"
                    />
                    <Line
                      type="monotone"
                      dataKey="hot"
                      stroke="#FF5C2E"
                      strokeWidth={1.5}
                      dot={false}
                      name="HOT"
                      strokeDasharray="3 3"
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div
                  style={{
                    fontSize: 9,
                    color: 'rgba(255,255,255,0.18)',
                    marginTop: 6,
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                    paddingTop: 6,
                  }}
                >
                  <span>Quelle: Supabase · leads</span>
                  <span>Live</span>
                </div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
              {[
                { label: 'Leads gesamt', val: fmt(leads.total), sub: `+${leads.last24h} letzte 24h`, color: '#fff' },
                {
                  label: 'HOT-Rate',
                  val: `${leads.total > 0 ? Math.round((leads.hot / leads.total) * 100) : 0}%`,
                  sub: `${leads.hot} HOT`,
                  color: '#FF5C2E',
                },
                {
                  label: 'Ø KI-Score',
                  val: String(leads.avgScore),
                  sub: `${leads.aiScored} bewertet`,
                  color: '#8B5CF6',
                },
                {
                  label: 'Pipeline',
                  val: fmtEur(leads.pipelineMin),
                  sub: `bis ${fmtEur(leads.pipelineMax)}`,
                  color: '#22C55E',
                },
                {
                  label: 'Website',
                  val: website.visitors > 0 ? fmt(website.visitors) : '—',
                  sub: website.visitors > 0 ? 'Visitors' : 'Script fehlt',
                  color: '#6B7AFF',
                },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="analytics-card"
                  style={{
                    background: '#111',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 12,
                    padding: '16px 18px 16px 22px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: 3,
                      height: '100%',
                      background: kpi.color,
                      opacity: 0.5,
                      borderRadius: '12px 0 0 12px',
                    }}
                  />
                  <div style={S.label}>{kpi.label}</div>
                  <div className="kpi-value" style={{ ...S.val, color: kpi.color, fontSize: 22 }}>
                    {kpi.val}
                  </div>
                  <div style={S.sub}>{kpi.sub}</div>
                </div>
              ))}
            </div>
            {false && (
              <div style={{ ...S.card, padding: 20, marginTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 10 }}>Setup-Checkliste</div>
                {[
                  { done: true, text: 'Lead Generator aktiv', sub: `${fmt(leads.total)} Leads generiert` },
                  {
                    done: leads.aiScored > 0,
                    text: 'KI-Scoring eingerichtet',
                    sub: `${leads.aiScored} Leads bewertet`,
                  },
                  {
                    done: website.visitors > 0,
                    text: 'Website-Analytics aktivieren',
                    sub: website.visitors > 0 ? 'Tracking aktiv' : 'Plausible Script auf onvero.de einfuegen',
                  },
                  {
                    done: leads.contacted > 0,
                    text: 'Ersten Lead kontaktieren',
                    sub: leads.contacted > 0 ? `${leads.contacted} kontaktiert` : `${leads.hot} HOT Leads warten`,
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: '8px 0',
                      borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : '',
                    }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        flexShrink: 0,
                        background: item.done ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)',
                        border: `1px solid ${item.done ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 9,
                        color: item.done ? '#22C55E' : 'rgba(255,255,255,0.2)',
                        marginTop: 1,
                      }}
                    >
                      {item.done ? '✓' : ''}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          color: item.done ? 'rgba(255,255,255,0.5)' : '#fff',
                          textDecoration: item.done ? 'line-through' : 'none',
                          marginBottom: 1,
                        }}
                      >
                        {item.text}
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* LEADS */}
        {tab === 'leads' && (
          <div>
            {leadsLoading || !leadsData ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 300,
                  color: 'rgba(255,255,255,0.2)',
                  fontSize: 13,
                  fontFamily: 'var(--font-dm-mono)',
                }}
              >
                Lade Lead-Daten...
              </div>
            ) : (
              <>
                {/* KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 20 }}>
                  {[
                    {
                      label: 'Leads gesamt',
                      val: fmt(leadsData.total),
                      sub: `${leadsData.scored} KI-bewertet`,
                      color: '#fff',
                    },
                    {
                      label: 'HOT Leads',
                      val: fmt(leadsData.hot),
                      sub: `${leadsData.total > 0 ? Math.round((leadsData.hot / leadsData.total) * 100) : 0}% HOT-Rate`,
                      color: '#FF5C2E',
                    },
                    { label: 'WARM Leads', val: fmt(leadsData.warm), sub: 'Score 45-74', color: '#F59E0B' },
                    { label: 'COLD Leads', val: fmt(leadsData.cold), sub: 'Score < 45', color: '#6B7AFF' },
                    {
                      label: 'Ø Score',
                      val: String(leadsData.avgScore),
                      sub: `${leadsData.withEmail} mit E-Mail`,
                      color: '#8B5CF6',
                    },
                    {
                      label: 'Datenqualitaet',
                      val: `${leadsData.avgDataQuality || 0}%`,
                      sub: 'Vollstaendigkeit',
                      color: '#22C55E',
                    },
                  ].map((kpi) => (
                    <div key={kpi.label} style={S.kpiCard}>
                      <div style={S.label}>{kpi.label}</div>
                      <div style={{ ...S.val, color: kpi.color }}>{kpi.val}</div>
                      <div style={S.sub}>{kpi.sub}</div>
                    </div>
                  ))}
                </div>

                <LeadDevelopmentChart weeklyData={leadsData?.weeklyLeads || []} trendData={trendData?.trend || []} />

                <div style={{ ...S.card, padding: 20, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#8B5CF6' }} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Score-Verteilung</div>
                    <InfoIcon tooltip="Verteilung aller Lead-Scores von 0-100." />
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>
                    {leadsData?.total || 0} Leads bewertet
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
                    {[
                      { label: 'COLD', range: '0-44', count: leadsData?.cold || 0, color: '#6B7AFF' },
                      { label: 'WARM', range: '45-74', count: leadsData?.warm || 0, color: '#F59E0B' },
                      { label: 'HOT', range: '75-100', count: leadsData?.hot || 0, color: '#FF5C2E' },
                    ].map((zone) => {
                      const pct =
                        (leadsData?.total || 1) > 0 ? Math.round((zone.count / (leadsData?.total || 1)) * 100) : 0;
                      return (
                        <div
                          key={zone.label}
                          style={{
                            padding: '12px 14px',
                            background: `${zone.color}08`,
                            border: `1px solid ${zone.color}20`,
                            borderRadius: 10,
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              width: `${pct}%`,
                              height: 3,
                              background: zone.color,
                              opacity: 0.6,
                            }}
                          />
                          <div
                            style={{
                              fontSize: 9,
                              textTransform: 'uppercase',
                              letterSpacing: '0.1em',
                              color: zone.color,
                              fontWeight: 700,
                              marginBottom: 6,
                            }}
                          >
                            {zone.label}
                          </div>
                          <div
                            style={{
                              fontSize: 26,
                              fontWeight: 800,
                              fontFamily: 'var(--font-dm-mono)',
                              color: zone.color,
                              lineHeight: 1,
                              marginBottom: 2,
                            }}
                          >
                            {zone.count}
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: 10,
                              color: 'rgba(255,255,255,0.3)',
                            }}
                          >
                            <span>{zone.range}</span>
                            <span>{pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {leadsData?.scoreRanges && Object.values(leadsData.scoreRanges).some((v: any) => v > 0) && (
                    <div>
                      {['0-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80-89', '90-99'].map(
                        (range, i) => {
                          const count = leadsData.scoreRanges?.[range] || 0;
                          const rangeStart = parseInt(range);
                          const color = rangeStart >= 75 ? '#FF5C2E' : rangeStart >= 45 ? '#F59E0B' : '#6B7AFF';
                          const maxCount = Math.max(
                            ...Object.values(leadsData.scoreRanges as Record<string, number>),
                            1
                          );
                          const barPct = Math.round((count / maxCount) * 100);
                          return (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '3px 0' }}>
                              <div
                                style={{
                                  fontSize: 9,
                                  fontFamily: 'var(--font-dm-mono)',
                                  color: 'rgba(255,255,255,0.3)',
                                  width: 40,
                                  flexShrink: 0,
                                  textAlign: 'right',
                                }}
                              >
                                {range}
                              </div>
                              <div
                                style={{
                                  flex: 1,
                                  height: 8,
                                  background: 'rgba(255,255,255,0.04)',
                                  borderRadius: 4,
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    width: `${barPct}%`,
                                    height: '100%',
                                    background: color,
                                    borderRadius: 4,
                                    opacity: 0.8,
                                    transition: 'width 0.6s ease',
                                  }}
                                />
                              </div>
                              <div
                                style={{
                                  fontSize: 10,
                                  fontFamily: 'var(--font-dm-mono)',
                                  color: count > 0 ? color : 'rgba(255,255,255,0.15)',
                                  width: 20,
                                  flexShrink: 0,
                                  fontWeight: count > 0 ? 700 : 400,
                                }}
                              >
                                {count}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>

                {/* Detail Cards Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                  {/* Branchen */}
                  <div style={{ ...S.card, padding: 20 }}>
                    <div style={S.chartTitle}>Top Branchen</div>
                    <div style={S.chartSub}>nach Ø Score</div>
                    {(leadsData.industries || []).map((ind: any, i: number) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 0',
                          borderBottom:
                            i < (leadsData.industries || []).length - 1 ? '1px solid rgba(255,255,255,0.05)' : '',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{ind.name}</div>
                          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
                            {ind.count} Leads · {ind.hot} HOT
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            fontFamily: 'var(--font-dm-mono)',
                            color: ind.avgScore >= 75 ? '#FF5C2E' : ind.avgScore >= 45 ? '#F59E0B' : '#6B7AFF',
                          }}
                        >
                          {ind.avgScore}
                        </div>
                      </div>
                    ))}
                    {(leadsData.industries || []).length === 0 && (
                      <div
                        style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', padding: '20px 0', textAlign: 'center' }}
                      >
                        Keine Branchendaten
                      </div>
                    )}
                  </div>
                  {/* Tech */}
                  <div style={{ ...S.card, padding: 20 }}>
                    <div style={S.chartTitle}>Top Technologien</div>
                    <div style={S.chartSub}>erkannte Technologien</div>
                    {(leadsData.topTech || []).map((t: any, i: number) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 0',
                          borderBottom:
                            i < (leadsData.topTech || []).length - 1 ? '1px solid rgba(255,255,255,0.05)' : '',
                        }}
                      >
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{t.name}</div>
                        <div
                          style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-dm-mono)', color: '#8B5CF6' }}
                        >
                          {t.count}
                        </div>
                      </div>
                    ))}
                    {(leadsData.topTech || []).length === 0 && (
                      <div
                        style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', padding: '20px 0', textAlign: 'center' }}
                      >
                        Keine Tech-Daten
                      </div>
                    )}
                  </div>
                  {/* Cities */}
                  <div style={{ ...S.card, padding: 20 }}>
                    <div style={S.chartTitle}>Top Staedte</div>
                    <div style={S.chartSub}>Lead-Standorte</div>
                    {(leadsData.topCities || []).map((c: any, i: number) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 0',
                          borderBottom:
                            i < (leadsData.topCities || []).length - 1 ? '1px solid rgba(255,255,255,0.05)' : '',
                        }}
                      >
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{c.name}</div>
                        <div
                          style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-dm-mono)', color: '#22C55E' }}
                        >
                          {c.count}
                        </div>
                      </div>
                    ))}
                    {(leadsData.topCities || []).length === 0 && (
                      <div
                        style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', padding: '20px 0', textAlign: 'center' }}
                      >
                        Keine Standortdaten
                      </div>
                    )}
                  </div>
                </div>

                {/* HOT Leads Table */}
                <div style={{ ...S.card, padding: 20 }}>
                  <div style={S.chartTitle}>HOT Leads</div>
                  <div style={S.chartSub}>{'Score \u2265 75 \u00B7 Top 10'}</div>
                  {(leadsData.hotLeads || []).length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            {['Name', 'Firma', 'Branche', 'Stadt', 'Score', 'Status', 'E-Mail', 'Tags'].map((h) => (
                              <th
                                key={h}
                                style={{
                                  padding: '8px 10px',
                                  textAlign: 'left',
                                  color: 'rgba(255,255,255,0.35)',
                                  fontWeight: 600,
                                  fontSize: 9,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.08em',
                                }}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(leadsData.hotLeads || []).map((l: any) => (
                            <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '8px 10px', color: '#fff', fontWeight: 600 }}>{l.name || '—'}</td>
                              <td style={{ padding: '8px 10px', color: 'rgba(255,255,255,0.6)' }}>
                                {l.company || '—'}
                              </td>
                              <td style={{ padding: '8px 10px', color: 'rgba(255,255,255,0.5)' }}>{l.industry}</td>
                              <td style={{ padding: '8px 10px', color: 'rgba(255,255,255,0.5)' }}>{l.city || '—'}</td>
                              <td
                                style={{
                                  padding: '8px 10px',
                                  fontWeight: 700,
                                  fontFamily: 'var(--font-dm-mono)',
                                  color: '#FF5C2E',
                                }}
                              >
                                {l.score}
                              </td>
                              <td style={{ padding: '8px 10px', position: 'relative' }}>
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.nativeEvent.stopImmediatePropagation();
                                    setStatusDropdown((prev) => (prev === l.id ? null : l.id));
                                  }}
                                  style={{
                                    fontSize: 10,
                                    padding: '3px 8px',
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                    display: 'inline-block',
                                    background:
                                      l.status === 'contacted'
                                        ? 'rgba(245,158,11,0.15)'
                                        : l.status === 'qualified'
                                          ? 'rgba(34,197,94,0.15)'
                                          : l.status === 'lost'
                                            ? 'rgba(255,92,46,0.1)'
                                            : 'rgba(255,255,255,0.07)',
                                    color:
                                      l.status === 'contacted'
                                        ? '#F59E0B'
                                        : l.status === 'qualified'
                                          ? '#22C55E'
                                          : l.status === 'lost'
                                            ? 'rgba(255,92,46,0.6)'
                                            : 'rgba(255,255,255,0.4)',
                                    border: `1px solid ${l.status === 'contacted' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.08)'}`,
                                    userSelect: 'none',
                                  }}
                                >
                                  {l.status === 'new'
                                    ? 'Neu'
                                    : l.status === 'contacted'
                                      ? 'Kontaktiert'
                                      : l.status === 'qualified'
                                        ? 'Qualifiziert'
                                        : 'Verloren'}{' '}
                                  ▾
                                </div>
                                {statusDropdown === l.id && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      position: 'absolute',
                                      top: '110%',
                                      right: 0,
                                      marginTop: 4,
                                      zIndex: 500,
                                      background: '#1a1a1a',
                                      border: '1px solid rgba(255,255,255,0.1)',
                                      borderRadius: 8,
                                      overflow: 'hidden',
                                      minWidth: 130,
                                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                                    }}
                                  >
                                    {[
                                      { value: 'new', label: 'Neu', color: 'rgba(255,255,255,0.5)' },
                                      { value: 'contacted', label: 'Kontaktiert', color: '#F59E0B' },
                                      { value: 'qualified', label: 'Qualifiziert', color: '#22C55E' },
                                      { value: 'lost', label: 'Verloren', color: 'rgba(255,92,46,0.6)' },
                                    ].map((opt) => (
                                      <div
                                        key={opt.value}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updateLeadStatus(l.id, opt.value);
                                        }}
                                        style={{
                                          padding: '8px 14px',
                                          fontSize: 11,
                                          color: opt.color,
                                          cursor: 'pointer',
                                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                                          background: l.status === opt.value ? 'rgba(255,255,255,0.05)' : 'transparent',
                                          transition: 'background 0.1s',
                                        }}
                                        onMouseEnter={(e) =>
                                          (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')
                                        }
                                        onMouseLeave={(e) =>
                                          (e.currentTarget.style.background =
                                            l.status === opt.value ? 'rgba(255,255,255,0.05)' : 'transparent')
                                        }
                                      >
                                        {opt.label}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                {l.hasEmail ? (
                                  <span style={{ color: '#22C55E' }}>&#10003;</span>
                                ) : (
                                  <span style={{ color: 'rgba(255,255,255,0.15)' }}>—</span>
                                )}
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                  {(l.tags || []).slice(0, 3).map((tag: string, ti: number) => (
                                    <span
                                      key={ti}
                                      style={{
                                        fontSize: 9,
                                        padding: '1px 5px',
                                        borderRadius: 3,
                                        background: 'rgba(139,92,246,0.12)',
                                        color: '#8B5CF6',
                                      }}
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div
                      style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', padding: '20px 0', textAlign: 'center' }}
                    >
                      Keine HOT Leads im Zeitraum
                    </div>
                  )}
                </div>
                {activityData && (
                  <div style={{ ...S.card, padding: 20, marginTop: 12 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 12,
                      }}
                    >
                      <div>
                        <div style={S.chartTitle}>Lead-Aktivitäten</div>
                        <div style={S.chartSub}>{fmt(activityData.total)} Aktionen gesamt</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {[
                          { label: 'KI', key: 'ai_analysis', color: '#8B5CF6' },
                          { label: 'Score', key: 'score_update', color: '#F59E0B' },
                          { label: 'Status', key: 'status_change', color: '#22C55E' },
                        ].map((t) => (
                          <div
                            key={t.key}
                            style={{
                              padding: '4px 10px',
                              background: `${t.color}12`,
                              border: `1px solid ${t.color}25`,
                              borderRadius: 6,
                              textAlign: 'center',
                            }}
                          >
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: 700,
                                fontFamily: 'var(--font-dm-mono)',
                                color: t.color,
                                lineHeight: 1,
                              }}
                            >
                              {activityData.typeCounts?.[t.key] || 0}
                            </div>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{t.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {activityData.activities.slice(0, 10).map((a: any) => (
                      <a
                        key={a.id}
                        href={a.lead_id ? `/dashboard/leads?highlight=${a.lead_id}` : '/dashboard/leads'}
                        style={{
                          display: 'flex',
                          gap: 10,
                          padding: '8px 0',
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          alignItems: 'flex-start',
                          textDecoration: 'none',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                      >
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            flexShrink: 0,
                            marginTop: 3,
                            background: typeColors[a.type] || 'rgba(255,255,255,0.2)',
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 11,
                              color: 'rgba(255,255,255,0.75)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {a.title || typeLabels[a.type] || a.type}
                          </div>
                          {a.content && (
                            <div
                              style={{
                                fontSize: 10,
                                color: 'rgba(255,255,255,0.3)',
                                marginTop: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {a.content}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
                          {formatRelTime(a.created_at)}
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* WEBSITE — removed, see /dashboard/website */}
        {false && (
          <div>
            {hasPlausible && website.visitors === 0 && (
              <div
                style={{
                  ...S.card,
                  padding: 20,
                  marginBottom: 16,
                  border: '1px solid rgba(245,158,11,0.2)',
                  background: 'rgba(245,158,11,0.04)',
                }}
              >
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 20, color: '#F59E0B', flexShrink: 0 }}>◎</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
                      Plausible ist verbunden — Tracking-Script fehlt noch
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 12 }}>
                      Dein API-Key ist aktiv. Damit Besucher-Daten erscheinen, muss das Script auf onvero.de eingebunden
                      werden.
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-dm-mono)',
                        fontSize: 11,
                        background: 'rgba(0,0,0,0.4)',
                        borderRadius: 6,
                        padding: '10px 14px',
                        color: '#22C55E',
                        border: '1px solid rgba(34,197,94,0.15)',
                        lineHeight: 1.6,
                        wordBreak: 'break-all' as const,
                      }}
                    >
                      {'<script async src="https://plausible.io/js/pa-kKZb9OGJJyFPeOOINz23w.js"></script>'}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
                      Nach der Installation erscheinen Daten innerhalb von Minuten.
                    </div>
                  </div>
                </div>
              </div>
            )}
            {!hasPlausible ? (
              <div style={{ ...S.card, padding: 32, textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 8 }}>
                  Plausible Analytics einrichten
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.4)',
                    maxWidth: 400,
                    margin: '0 auto',
                    lineHeight: 1.7,
                  }}
                >
                  API Key ist konfiguriert. Script muss noch auf onvero.de installiert werden.
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                  {[
                    {
                      label: 'Visitors',
                      val: website.visitors > 0 ? fmt(website.visitors) : '—',
                      sub: '30 Tage',
                      color: '#6B7AFF',
                    },
                    {
                      label: 'Seitenaufrufe',
                      val: website.pageviews > 0 ? fmt(website.pageviews) : '—',
                      sub: '30 Tage',
                      color: '#6B7AFF',
                    },
                    {
                      label: 'Bounce Rate',
                      val: website.bounceRate > 0 ? `${website.bounceRate}%` : '—',
                      sub: website.bounceRate < 50 ? 'Gut' : 'Mittel',
                      color: website.bounceRate > 0 && website.bounceRate < 50 ? '#22C55E' : '#F59E0B',
                    },
                    {
                      label: 'Besuchsdauer',
                      val: website.visitDuration > 0 ? fmtDur(website.visitDuration) : '—',
                      sub: 'pro Sitzung',
                      color: '#fff',
                    },
                  ].map((kpi) => (
                    <div key={kpi.label} style={S.kpiCard}>
                      <div style={S.label}>{kpi.label}</div>
                      <div style={{ ...S.val, color: kpi.color }}>{kpi.val}</div>
                      <div style={S.sub}>{kpi.sub}</div>
                    </div>
                  ))}
                </div>
                {pageSpeed && !pageSpeed.error && (
                  <div style={{ ...S.card, padding: 20, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={S.chartTitle}>Website-Status</div>
                      <InfoIcon tooltip="Direkte Messung von onvero.de. Ladezeit, Erreichbarkeit und SEO-Signale. Alle 5 Min aktualisiert." />
                    </div>
                    <div style={S.chartSub}>onvero.de · Live-Check</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 12 }}>
                      {[
                        {
                          label: 'Erreichbarkeit',
                          val: pageSpeed.ok ? 'Online' : 'Offline',
                          color: pageSpeed.ok ? '#22C55E' : '#FF5C2E',
                          sub: `Status ${pageSpeed.status || '—'}`,
                        },
                        {
                          label: 'Ladezeit',
                          val: pageSpeed.loadTimeFormatted || '—',
                          color:
                            pageSpeed.speedScore >= 70 ? '#22C55E' : pageSpeed.speedScore >= 50 ? '#F59E0B' : '#FF5C2E',
                          sub: pageSpeed.speed || '—',
                        },
                        {
                          label: 'SEO Signale',
                          val: `${pageSpeed.seoScore}%`,
                          color: pageSpeed.seoScore >= 80 ? '#22C55E' : '#F59E0B',
                          sub: `${Object.values(pageSpeed.checks || {}).filter(Boolean).length}/6 OK`,
                        },
                        {
                          label: 'HTTPS',
                          val: pageSpeed.hasHttps ? 'Sicher' : 'Unsicher',
                          color: pageSpeed.hasHttps ? '#22C55E' : '#FF5C2E',
                          sub: pageSpeed.isResponsive ? 'Mobil-optimiert' : 'Kein Viewport',
                        },
                      ].map((kpi) => (
                        <div key={kpi.label} style={S.kpiCard}>
                          <div style={S.label}>{kpi.label}</div>
                          <div style={{ ...S.val, color: kpi.color, fontSize: 20 }}>{kpi.val}</div>
                          <div style={S.sub}>{kpi.sub}</div>
                        </div>
                      ))}
                    </div>
                    {pageSpeed.checks && (
                      <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {[
                          { key: 'title', label: 'Seitentitel' },
                          { key: 'description', label: 'Beschreibung' },
                          { key: 'ogImage', label: 'Social-Bild' },
                          { key: 'viewport', label: 'Mobile' },
                          { key: 'https', label: 'HTTPS' },
                          { key: 'online', label: 'Online' },
                        ].map((c) => (
                          <div
                            key={c.key}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '4px 10px',
                              borderRadius: 20,
                              background: pageSpeed.checks[c.key] ? 'rgba(34,197,94,0.08)' : 'rgba(255,92,46,0.08)',
                              border: `1px solid ${pageSpeed.checks[c.key] ? 'rgba(34,197,94,0.2)' : 'rgba(255,92,46,0.15)'}`,
                            }}
                          >
                            <div style={{ fontSize: 10, color: pageSpeed.checks[c.key] ? '#22C55E' : '#FF5C2E' }}>
                              {pageSpeed.checks[c.key] ? '✓' : '✗'}
                            </div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{c.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {pageSpeed.title && (
                      <div
                        style={{
                          marginTop: 12,
                          padding: '10px 12px',
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: 6,
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginBottom: 3 }}>
                          Wie Google onvero.de sieht:
                        </div>
                        <div style={{ fontSize: 12, color: '#6B7AFF', marginBottom: 2 }}>{pageSpeed.title}</div>
                        {pageSpeed.description && (
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                            {pageSpeed.description.slice(0, 150)}
                            {pageSpeed.description.length > 150 ? '...' : ''}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <div style={{ ...S.card, padding: 20 }}>
                  <div style={S.chartTitle}>Besucher-Verlauf</div>
                  <div style={S.chartSub}>onvero.de</div>
                  {website.timeseries?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={website.timeseries}>
                        <XAxis
                          dataKey="date"
                          tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(d: string) => d.slice(5)}
                        />
                        <YAxis
                          tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                          width={24}
                        />
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="visitors"
                          stroke="#6B7AFF"
                          strokeWidth={2}
                          dot={false}
                          name="Besucher"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div
                      style={{
                        height: 180,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'rgba(255,255,255,0.2)',
                        fontSize: 12,
                      }}
                    >
                      Warte auf Besucher-Daten
                    </div>
                  )}
                </div>
              </div>
            )}
            <div style={{ margin: '20px 0 12px', paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.09em',
                  color: 'rgba(255,255,255,0.25)',
                  fontWeight: 600,
                }}
              >
                Content und Blog
              </div>
            </div>
            {contentData ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
                <div style={S.kpiCard}>
                  <div style={S.label}>Blogposts gesamt</div>
                  <div style={{ ...S.val, color: '#8B5CF6', fontSize: 22 }}>{contentData.blogs.total}</div>
                  <div style={S.sub}>+{contentData.blogs.thisMonth} diesen Monat</div>
                </div>
                <div style={S.kpiCard}>
                  <div style={S.label}>Letzter Monat</div>
                  <div style={{ ...S.val, color: 'rgba(255,255,255,0.4)', fontSize: 22 }}>
                    {contentData.blogs.lastMonth}
                  </div>
                  <div style={S.sub}>Veroeffentlicht</div>
                </div>
                <div style={S.kpiCard}>
                  <div style={S.label}>Top Tags</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                    {(contentData.blogs.topTags || []).slice(0, 4).map((t: any) => (
                      <span
                        key={t.tag}
                        style={{
                          fontSize: 9,
                          padding: '2px 6px',
                          background: 'rgba(139,92,246,0.1)',
                          borderRadius: 4,
                          color: '#8B5CF6',
                        }}
                      >
                        {t.tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ ...S.kpiCard, height: 80 }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* PIPELINE */}
        {tab === 'pipeline' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
              {[
                {
                  label: 'Aktive Chancen',
                  val: String(leads.hot + leads.warm),
                  sub: `${leads.hot} HOT · ${leads.warm} WARM`,
                  color: '#FF5C2E',
                  tip: 'Leads mit Score >= 45',
                },
                {
                  label: 'Kontaktiert',
                  val: String(leads.contacted),
                  sub: `${leads.total > 0 ? Math.round((leads.contacted / leads.total) * 100) : 0}% Kontaktrate`,
                  color: '#F59E0B',
                  tip: 'Erster Kontakt aufgenommen',
                },
                {
                  label: 'Conversion',
                  val: leads.contacted > 0 ? `${Math.round((leads.qualified / leads.contacted) * 100)}%` : '—',
                  sub: `${leads.qualified} qualifiziert`,
                  color: '#22C55E',
                  tip: 'Kontaktiert → Qualifiziert',
                },
                {
                  label: 'Tage bis Kontakt',
                  val: '—',
                  sub: 'Wird gemessen',
                  color: 'rgba(255,255,255,0.4)',
                  tip: 'Durchschnittliche Zeit bis Erstkontakt',
                },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="analytics-card"
                  style={{
                    background: '#111',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 12,
                    padding: '16px 18px 16px 22px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: 3,
                      height: '100%',
                      background: kpi.color,
                      opacity: 0.5,
                      borderRadius: '12px 0 0 12px',
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8, gap: 4 }}>
                    <div
                      style={{
                        fontSize: 9,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: 'rgba(255,255,255,0.3)',
                        fontWeight: 600,
                      }}
                    >
                      {kpi.label}
                    </div>
                    <InfoIcon tooltip={kpi.tip} />
                  </div>
                  <div
                    className="kpi-value"
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      fontFamily: 'var(--font-dm-mono)',
                      color: kpi.color,
                      lineHeight: 1,
                      marginBottom: 6,
                    }}
                  >
                    {kpi.val}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{kpi.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ ...S.card, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 4 }}>Sales Funnel</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>
                  Von Lead bis Abschluss
                </div>
                {[
                  {
                    step: 1,
                    label: 'Generiert',
                    count: leads.total,
                    pct: 100,
                    color: '#6B7AFF',
                    desc: 'Kontakt gefunden',
                  },
                  {
                    step: 2,
                    label: 'KI-bewertet',
                    count: leads.aiScored,
                    pct: leads.total > 0 ? Math.round((leads.aiScored / leads.total) * 100) : 0,
                    color: '#8B5CF6',
                    desc: 'Score vergeben',
                  },
                  {
                    step: 3,
                    label: 'E-Mail bereit',
                    count: leads.withEmail,
                    pct: leads.total > 0 ? Math.round((leads.withEmail / leads.total) * 100) : 0,
                    color: '#F59E0B',
                    desc: 'Nachricht verfasst',
                  },
                  {
                    step: 4,
                    label: 'Kontaktiert',
                    count: leads.contacted,
                    pct: leads.total > 0 ? Math.round((leads.contacted / leads.total) * 100) : 0,
                    color: '#FF8C42',
                    desc: 'Kontakt aufgenommen',
                  },
                  {
                    step: 5,
                    label: 'Qualifiziert',
                    count: leads.qualified,
                    pct: leads.total > 0 ? Math.round((leads.qualified / leads.total) * 100) : 0,
                    color: '#22C55E',
                    desc: 'Interesse bestaetigt',
                  },
                ].map((s, i, arr) => (
                  <div key={i} style={{ marginBottom: i < arr.length - 1 ? 12 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          flexShrink: 0,
                          background: `${s.color}18`,
                          border: `1px solid ${s.color}30`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          color: s.color,
                          fontWeight: 700,
                        }}
                      >
                        {s.step}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline',
                            marginBottom: 4,
                          }}
                        >
                          <div>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
                              {s.label}
                            </span>
                            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginLeft: 6 }}>{s.desc}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                fontFamily: 'var(--font-dm-mono)',
                                color: s.color,
                              }}
                            >
                              {s.count}
                            </span>
                            <span
                              style={{
                                fontSize: 10,
                                color: 'rgba(255,255,255,0.3)',
                                fontFamily: 'var(--font-dm-mono)',
                                width: 32,
                                textAlign: 'right',
                              }}
                            >
                              {s.pct}%
                            </span>
                          </div>
                        </div>
                        <div
                          style={{
                            height: 4,
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: 2,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${s.pct}%`,
                              height: '100%',
                              background: s.color,
                              borderRadius: 2,
                              transition: 'width 0.8s ease',
                              boxShadow: s.pct > 0 ? `0 0 6px ${s.color}40` : 'none',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    {i < arr.length - 1 && arr[i + 1].pct < s.pct && (
                      <div
                        style={{
                          paddingLeft: 32,
                          fontSize: 9,
                          color: 'rgba(255,92,46,0.5)',
                          marginTop: 2,
                          marginBottom: -4,
                        }}
                      >
                        ↓ -{s.pct - arr[i + 1].pct}% Drop-Off
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ ...S.card, padding: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 12 }}>Jetzt handeln</div>
                  {[
                    {
                      icon: '●',
                      text: leads.hot > 0 ? `${leads.hot} HOT Leads warten` : 'Keine HOT Leads',
                      sub: leads.hot > 0 ? 'E-Mail Drafts bereit' : 'Generator laeuft',
                      color: '#FF5C2E',
                      href: '/dashboard/leads',
                    },
                    {
                      icon: '✉',
                      text: `${leads.withEmail} E-Mail Drafts`,
                      sub: 'KI hat Texte vorbereitet',
                      color: '#F59E0B',
                      href: '/dashboard/leads',
                    },
                    {
                      icon: '⊙',
                      text: `${leads.warm} WARM Leads`,
                      sub: 'Score 45-74',
                      color: '#6B7AFF',
                      href: '/dashboard/leads',
                    },
                  ].map((item, i) => (
                    <a
                      key={i}
                      href={item.href}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        padding: '10px 0',
                        borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : '',
                        textDecoration: 'none',
                      }}
                    >
                      <div style={{ fontSize: 14, flexShrink: 0, color: item.color }}>{item.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>{item.text}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{item.sub}</div>
                      </div>
                      <div style={{ fontSize: 11, color: item.color, flexShrink: 0 }}>→</div>
                    </a>
                  ))}
                </div>
                <div style={{ ...S.card, padding: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#fff', marginBottom: 10 }}>
                    Pipeline-Insights
                  </div>
                  {[
                    {
                      label: 'Kontaktrate',
                      value: leads.total > 0 ? `${Math.round((leads.contacted / leads.total) * 100)}%` : '—',
                      bench: '> 20%',
                      good: leads.total > 0 && leads.contacted / leads.total > 0.2,
                    },
                    {
                      label: 'Draft-Abdeckung',
                      value: leads.total > 0 ? `${Math.round((leads.withEmail / leads.total) * 100)}%` : '—',
                      bench: '> 80%',
                      good: leads.total > 0 && leads.withEmail / leads.total > 0.8,
                    },
                    {
                      label: 'HOT-Rate',
                      value: leads.total > 0 ? `${Math.round((leads.hot / leads.total) * 100)}%` : '—',
                      bench: '15-25%',
                      good: leads.total > 0 && leads.hot / leads.total >= 0.15,
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 0',
                        borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : '',
                      }}
                    >
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{item.label}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{item.bench}</div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            fontFamily: 'var(--font-dm-mono)',
                            color: item.good ? '#22C55E' : '#F59E0B',
                          }}
                        >
                          {item.value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* KI */}
        {tab === 'ki' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
              {[
                {
                  label: 'Scoring Coverage',
                  val: `${leads.total > 0 ? Math.round((leads.aiScored / leads.total) * 100) : 0}%`,
                  sub: `${leads.aiScored} von ${leads.total}`,
                  color: '#22C55E',
                },
                { label: 'Ø Score', val: String(leads.avgScore), sub: 'Ziel: >= 60', color: '#8B5CF6' },
                {
                  label: 'Draft Coverage',
                  val: `${leads.total > 0 ? Math.round((leads.withEmail / leads.total) * 100) : 0}%`,
                  sub: `${leads.withEmail} Drafts`,
                  color: '#F59E0B',
                },
                {
                  label: 'HOT-Rate',
                  val: `${leads.total > 0 ? Math.round((leads.hot / leads.total) * 100) : 0}%`,
                  sub: `${leads.hot} HOT`,
                  color: '#FF5C2E',
                },
              ].map((kpi) => (
                <div key={kpi.label} style={S.kpiCard}>
                  <div style={S.label}>{kpi.label}</div>
                  <div style={{ ...S.val, color: kpi.color }}>{kpi.val}</div>
                  <div style={S.sub}>{kpi.sub}</div>
                </div>
              ))}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 12,
                marginTop: 16,
                marginBottom: 16,
              }}
            >
              {[
                { label: 'KI-Analysen', key: 'ai_analysis', color: '#8B5CF6' },
                { label: 'Score-Updates', key: 'score_update', color: '#F59E0B' },
                { label: 'Status-Aenderungen', key: 'status_change', color: '#22C55E' },
                { label: 'Aufgaben', key: 'task', color: '#6B7AFF' },
              ].map((kpi) => (
                <div key={kpi.key} style={S.kpiCard}>
                  <div style={S.label}>{kpi.label}</div>
                  <div style={{ ...S.val, color: kpi.color, fontSize: 22 }}>
                    {fmt(activityData?.typeCounts?.[kpi.key] || 0)}
                  </div>
                  <div style={S.sub}>Aktionen gesamt</div>
                </div>
              ))}
            </div>
            <div style={{ ...S.card, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={S.chartTitle}>KI-Automatisierungen</div>
                <InfoIcon tooltip="Diese Prozesse laufen automatisch im Hintergrund. Du musst nichts manuell tun." />
              </div>
              <div style={S.chartSub}>Aktive KI-Prozesse</div>
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  {
                    name: 'Lead-Generierung',
                    desc: 'Findet täglich neue Kunden via Apollo-Datenbank.',
                    status: 'active',
                    metric: `${masterData?.leads?.total || 0} Leads`,
                  },
                  {
                    name: 'KI-Bewertung und Scoring',
                    desc: 'Bewertet jeden Lead mit Claude AI — analysiert Website, Branche, Technologien.',
                    status: 'active',
                    metric: `${activityData?.typeCounts?.ai_analysis || 0} Analysen`,
                  },
                  {
                    name: 'E-Mail Draft Erstellung',
                    desc: 'Schreibt personalisierte Erstkontakt-E-Mails basierend auf Website-Analyse.',
                    status: 'active',
                    metric: `${masterData?.leads?.withEmail || 0} Drafts`,
                  },
                  {
                    name: 'Follow-up Erinnerungen',
                    desc: 'Erstellt Aufgaben fuer HOT Leads die laenger als 2 Tage nicht kontaktiert wurden.',
                    status: 'active',
                    metric: `${activityData?.typeCounts?.task || 0} Aufgaben`,
                  },
                  {
                    name: 'Website-Analytics',
                    desc: 'Trackt Besucher auf onvero.de — DSGVO-konform, ohne Cookies.',
                    status: masterData?.hasPlausible ? 'active' : 'pending',
                    metric: masterData?.hasPlausible ? 'Aktiv' : 'Script einfuegen',
                  },
                  {
                    name: 'E-Mail-Versand',
                    desc: 'Automatischer Versand der KI-Drafts nach Freigabe.',
                    status: 'planned',
                    metric: 'In Planung',
                  },
                ].map((item, i) => {
                  const color =
                    item.status === 'active'
                      ? '#22C55E'
                      : item.status === 'pending'
                        ? '#F59E0B'
                        : 'rgba(255,255,255,0.2)';
                  const label =
                    item.status === 'active' ? 'Aktiv' : item.status === 'pending' ? 'Einrichten' : 'Geplant';
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 14,
                        padding: '12px 14px',
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: color,
                          flexShrink: 0,
                          marginTop: 4,
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: 3,
                          }}
                        >
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{item.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 12 }}>
                            <div
                              style={{
                                fontSize: 10,
                                color: 'rgba(255,255,255,0.35)',
                                fontFamily: 'var(--font-dm-mono)',
                              }}
                            >
                              {item.metric}
                            </div>
                            <div
                              style={{
                                fontSize: 9,
                                padding: '2px 7px',
                                borderRadius: 4,
                                background: `${color}18`,
                                color,
                                fontWeight: 600,
                              }}
                            >
                              {label}
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{item.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══ ACTIVITY TAB ═══ */}
        {tab === 'activity' && <ActivityFeed />}
      </div>
    </div>
  );
}

function ActivityFeed() {
  const [items, setItems] = useState<
    { id: string; title: string; desc: string; color: string; time: string; href?: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      fetch('/api/leads')
        .then((r) => r.json())
        .catch(() => ({ leads: [] })),
      fetch('/api/lead-generator-runs?limit=5')
        .then((r) => r.json())
        .catch(() => ({ runs: [] })),
    ]).then(([leadsData, runsData]) => {
      const leads = (leadsData.leads ?? []) as Record<string, string | number | null>[];
      const runs = (runsData.runs ?? []) as Record<string, string | number | null>[];
      const all: typeof items = [];

      for (const l of leads.slice(0, 20)) {
        const score = Number(l.score ?? 0);
        const color = score >= 70 ? '#FF5C2E' : score >= 45 ? '#F59E0B' : '#6B7AFF';
        all.push({
          id: `s-${l.id}`,
          title: `${l.company_name}`,
          desc: `Score ${score} · ${score >= 70 ? 'HOT' : score >= 45 ? 'WARM' : 'COLD'}`,
          color,
          time: String(l.created_at),
          href: `/dashboard/leads/${l.id}`,
        });
      }
      for (const r of runs) {
        const terms = Array.isArray(r.search_terms) ? (r.search_terms as string[]).join(', ') : '';
        all.push({
          id: `r-${r.id}`,
          title: 'Kampagne',
          desc: terms || 'Lead-Generierung',
          color: '#F59E0B',
          time: String(r.started_at ?? r.created_at),
        });
      }
      all.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setItems(all);
      setLoading(false);
    });
  }, []);

  const fmt = (d: string) => {
    const ms = Date.now() - new Date(d).getTime();
    const m = Math.floor(ms / 60000);
    const h = Math.floor(ms / 3600000);
    const dy = Math.floor(ms / 86400000);
    if (m < 1) return 'gerade eben';
    if (m < 60) return `vor ${m} Min.`;
    if (h < 24) return `vor ${h} Std.`;
    if (dy === 1) return 'gestern';
    return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  };

  if (loading)
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>Laden...</div>
    );
  if (items.length === 0)
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.15)', fontSize: 13 }}>
        Keine Aktivitäten
      </div>
    );

  return (
    <div style={{ position: 'relative', paddingLeft: 24 }}>
      <div
        style={{ position: 'absolute', left: 7, top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.06)' }}
      />
      {items.map((item, i) => (
        <div
          key={item.id}
          onClick={() => item.href && router.push(item.href)}
          style={{
            display: 'flex',
            gap: 14,
            marginBottom: 8,
            cursor: item.href ? 'pointer' : 'default',
            padding: '8px 12px',
            borderRadius: 10,
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => {
            if (item.href) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: item.color,
              marginTop: 4,
              flexShrink: 0,
              marginLeft: -29,
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{item.title}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{item.desc}</div>
          </div>
          <div
            style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.15)',
              fontFamily: 'var(--font-dm-mono)',
              flexShrink: 0,
              marginTop: 2,
            }}
          >
            {fmt(item.time)}
          </div>
        </div>
      ))}
    </div>
  );
}
