'use client';

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type Tab = 'master' | 'leads' | 'website' | 'pipeline' | 'ki';

const TABS: { id: Tab; label: string }[] = [
  { id: 'master', label: 'Master' },
  { id: 'leads', label: 'Lead Intelligence' },
  { id: 'website', label: 'Website & Traffic' },
  { id: 'pipeline', label: 'Sales Pipeline' },
  { id: 'ki', label: 'KI-Performance' },
];

const S = {
  card: { background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10 } as React.CSSProperties,
  kpiCard: {
    background: '#111',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 10,
    padding: '14px 16px',
  } as React.CSSProperties,
  label: {
    fontSize: 9,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.09em',
    color: 'rgba(255,255,255,0.35)',
    fontWeight: 600,
    marginBottom: 6,
  } as React.CSSProperties,
  val: {
    fontSize: 26,
    fontWeight: 700,
    fontFamily: 'var(--font-dm-mono)',
    lineHeight: 1,
    marginBottom: 3,
  } as React.CSSProperties,
  sub: { fontSize: 11, color: 'rgba(255,255,255,0.3)' } as React.CSSProperties,
  chartTitle: { fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 2 } as React.CSSProperties,
  chartSub: { fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 12 } as React.CSSProperties,
};

function TooltipBox({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          style={{
            position: 'absolute',
            bottom: '120%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1e1e1e',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8,
            padding: '8px 12px',
            zIndex: 1000,
            width: 220,
            pointerEvents: 'none',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{text}</div>
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
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [leadsData, setLeadsData] = useState<any>(null);
  const [leadsLoading, setLeadsLoading] = useState(false);

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
    ai_analysis: '#8B5CF6',
    score_update: '#F59E0B',
    status_change: '#22C55E',
    task: '#6B7AFF',
    form_submit: '#FF5C2E',
    score_alert: '#FF5C2E',
  };
  const formatRelTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'gerade eben';
    if (mins < 60) return `vor ${mins} Min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `vor ${hrs}h`;
    const days = Math.floor(hrs / 24);
    return days < 7
      ? `vor ${days} Tagen`
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
  }, []);

  // Load content data lazily for website tab
  useEffect(() => {
    if (tab === 'website' && !contentData) {
      fetch('/api/analytics/content')
        .then((r) => r.json())
        .then(setContentData)
        .catch(() => {});
    }
  }, [tab, contentData]);

  useEffect(() => {
    if (tab === 'website' && !pageSpeed) {
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
      })
      .catch(() => setLeadsLoading(false));
  }, [tab, period, leadsData]);

  useEffect(() => {
    if (tab === 'leads') setLeadsData(null);
  }, [period]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div
        style={{
          background: '#1a1a1a',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8,
          padding: '8px 12px',
        }}
      >
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{label}</div>
        {payload.map((p: any, i: number) => (
          <div
            key={i}
            style={{ fontSize: 13, fontWeight: 700, color: p.color || '#fff', fontFamily: 'var(--font-dm-mono)' }}
          >
            {fmt(p.value)}{' '}
            <span style={{ fontSize: 10, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>{p.name}</span>
          </div>
        ))}
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>Analytics</h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '4px 0 0' }}>Onvero BusinessOS</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {(tab === 'leads' || tab === 'website' || tab === 'pipeline') && (
            <div
              style={{
                display: 'flex',
                gap: 2,
                background: '#111',
                borderRadius: 8,
                padding: 3,
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {['7d', '30d', '3mo', '12mo'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 600,
                    background: period === p ? '#fff' : 'transparent',
                    color: period === p ? '#000' : 'rgba(255,255,255,0.35)',
                    transition: 'all 0.15s',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              color: 'rgba(255,255,255,0.4)',
              padding: '6px 12px',
              background: '#111',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />
            Live
          </div>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
            {lastRefresh.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* TABS */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          marginBottom: 24,
          background: '#111',
          borderRadius: 10,
          padding: 4,
          border: '1px solid rgba(255,255,255,0.07)',
          width: 'fit-content',
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '7px 18px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              background: tab === t.id ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: tab === t.id ? '#fff' : 'rgba(255,255,255,0.35)',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

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
              <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', gap: 2, marginBottom: 8 }}>
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
              onClick={() => setTab('website')}
              style={{ ...S.card, padding: '18px 20px', cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(107,122,255,0.3)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
            >
              <div style={S.label}>Website</div>
              <div
                style={{ ...S.val, fontSize: 24, color: website.visitors > 0 ? '#6B7AFF' : 'rgba(255,255,255,0.2)' }}
              >
                {website.visitors > 0 ? fmt(website.visitors) : '—'}
              </div>
              <div style={S.sub}>{website.visitors > 0 ? 'Unique Visitors' : 'Script ausstehend'}</div>
              {!hasPlausible && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 9,
                    padding: '3px 6px',
                    background: 'rgba(245,158,11,0.1)',
                    color: '#F59E0B',
                    borderRadius: 4,
                    display: 'inline-block',
                  }}
                >
                  Setup
                </div>
              )}
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px 280px', gap: 12, marginBottom: 12 }}>
            <div style={{ ...S.card, padding: 20 }}>
              <div style={S.chartTitle}>Lead-Entwicklung</div>
              <div style={S.chartSub}>HOT / WARM / COLD pro Woche</div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weekly} barSize={18} barGap={1}>
                  <XAxis
                    dataKey="week"
                    tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={24}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="hot" stackId="a" fill="#FF5C2E" name="HOT" />
                  <Bar dataKey="warm" stackId="a" fill="#F59E0B" name="WARM" />
                  <Bar dataKey="cold" stackId="a" fill="#6B7AFF" radius={[3, 3, 0, 0]} name="COLD" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ ...S.card, padding: 20 }}>
              <div style={S.chartTitle}>System-Status</div>
              <div style={S.chartSub}>BusinessOS Komponenten</div>
              {systemStatus.map((s: any, i: number) => {
                const color =
                  s.status === 'active'
                    ? '#22C55E'
                    : s.status === 'pending'
                      ? '#F59E0B'
                      : s.status === 'planned'
                        ? 'rgba(255,255,255,0.2)'
                        : '#FF5C2E';
                const label =
                  s.status === 'active'
                    ? 'Aktiv'
                    : s.status === 'pending'
                      ? 'Pending'
                      : s.status === 'planned'
                        ? 'Geplant'
                        : 'Setup';
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '7px 0',
                      borderBottom: i < systemStatus.length - 1 ? '1px solid rgba(255,255,255,0.05)' : '',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 1 }}>{s.name}</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{s.detail}</div>
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        padding: '2px 7px',
                        borderRadius: 4,
                        background: `${color}18`,
                        color,
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {label}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ ...S.card, padding: 20 }}>
              <div style={S.chartTitle}>Aktivitaet</div>
              <div style={S.chartSub}>Letzte Ereignisse</div>
              {(activityData?.activities || []).slice(0, 5).map((a: any) => (
                <div
                  key={a.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '7px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: typeColors[a.type] || 'rgba(255,255,255,0.2)',
                      flexShrink: 0,
                      marginTop: 4,
                    }}
                  />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.7)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {a.title || typeLabels[a.type] || a.type}
                    </div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>
                      {formatRelTime(a.created_at)}
                    </div>
                  </div>
                </div>
              ))}
              {(!activityData || activityData.activities?.length === 0) && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', padding: '12px 0' }}>
                  Noch keine Aktivitaeten
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {[
              { label: 'Leads gesamt', val: fmt(leads.total), sub: `+${leads.last24h} letzte 24h`, color: '#fff' },
              {
                label: 'HOT-Rate',
                val: `${leads.total > 0 ? Math.round((leads.hot / leads.total) * 100) : 0}%`,
                sub: `${leads.hot} HOT`,
                color: '#FF5C2E',
              },
              { label: 'Ø KI-Score', val: String(leads.avgScore), sub: `${leads.aiScored} bewertet`, color: '#8B5CF6' },
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
              <div key={kpi.label} style={S.kpiCard}>
                <div style={S.label}>{kpi.label}</div>
                <div style={{ ...S.val, color: kpi.color, fontSize: 22 }}>{kpi.val}</div>
                <div style={S.sub}>{kpi.sub}</div>
              </div>
            ))}
          </div>
          {(!hasPlausible || website.visitors === 0) && (
            <div style={{ ...S.card, padding: 20, marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 10 }}>Setup-Checkliste</div>
              {[
                { done: true, text: 'Lead Generator aktiv', sub: `${fmt(leads.total)} Leads generiert` },
                { done: leads.aiScored > 0, text: 'KI-Scoring eingerichtet', sub: `${leads.aiScored} Leads bewertet` },
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
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
                ].map((kpi) => (
                  <div key={kpi.label} style={S.kpiCard}>
                    <div style={S.label}>{kpi.label}</div>
                    <div style={{ ...S.val, color: kpi.color }}>{kpi.val}</div>
                    <div style={S.sub}>{kpi.sub}</div>
                  </div>
                ))}
              </div>

              {/* Charts Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div style={{ ...S.card, padding: 20 }}>
                  <div style={S.chartTitle}>Lead-Entwicklung</div>
                  <div style={S.chartSub}>HOT / WARM / COLD pro Woche</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={leadsData.weeklyLeads} barSize={22}>
                      <XAxis
                        dataKey="week"
                        tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        width={24}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="hot" stackId="a" fill="#FF5C2E" name="HOT" />
                      <Bar dataKey="warm" stackId="a" fill="#F59E0B" name="WARM" />
                      <Bar dataKey="cold" stackId="a" fill="#6B7AFF" radius={[4, 4, 0, 0]} name="COLD" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ ...S.card, padding: 20 }}>
                  <div style={S.chartTitle}>Score-Histogramm</div>
                  <div style={S.chartSub}>Verteilung aller Lead-Scores</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={leadsData.scoreHistogram} barSize={28}>
                      <XAxis
                        dataKey="range"
                        tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        width={24}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Leads" radius={[3, 3, 0, 0]}>
                        {(leadsData.scoreHistogram || []).map((_: any, i: number) => (
                          <Cell key={i} fill={i >= 8 ? '#FF5C2E' : i >= 5 ? '#F59E0B' : '#6B7AFF'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
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
                            <td style={{ padding: '8px 10px', color: 'rgba(255,255,255,0.6)' }}>{l.company || '—'}</td>
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
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', padding: '20px 0', textAlign: 'center' }}>
                    Keine HOT Leads im Zeitraum
                  </div>
                )}
              </div>
              {activityData && (
                <div style={{ ...S.card, padding: 20, marginTop: 12 }}>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}
                  >
                    <div>
                      <div style={S.chartTitle}>Lead-Aktivitaeten</div>
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
                    <div
                      key={a.id}
                      style={{
                        display: 'flex',
                        gap: 10,
                        padding: '8px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        alignItems: 'flex-start',
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
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* WEBSITE */}
      {tab === 'website' && (
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
              {pageSpeed && (
                <div style={{ ...S.card, padding: 20, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={S.chartTitle}>Website Performance</div>
                    <InfoIcon tooltip="Google PageSpeed Insights analysiert Ladezeit, SEO und Nutzerfreundlichkeit. Daten werden stuendlich aktualisiert." />
                  </div>
                  <div style={S.chartSub}>onvero.de · Mobile</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 12 }}>
                    {[
                      {
                        label: 'Performance',
                        val: `${pageSpeed.performance}`,
                        color:
                          pageSpeed.performance >= 90 ? '#22C55E' : pageSpeed.performance >= 50 ? '#F59E0B' : '#FF5C2E',
                        suffix: '/100',
                      },
                      {
                        label: 'SEO Score',
                        val: `${pageSpeed.seo}`,
                        color: pageSpeed.seo >= 90 ? '#22C55E' : '#F59E0B',
                        suffix: '/100',
                      },
                      { label: 'LCP', val: pageSpeed.lcp, color: 'rgba(255,255,255,0.7)', suffix: '' },
                      { label: 'FCP', val: pageSpeed.fcp, color: 'rgba(255,255,255,0.7)', suffix: '' },
                    ].map((kpi) => (
                      <div key={kpi.label} style={S.kpiCard}>
                        <div style={S.label}>{kpi.label}</div>
                        <div style={{ ...S.val, color: kpi.color, fontSize: 22 }}>
                          {kpi.val}
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{kpi.suffix}</span>
                        </div>
                      </div>
                    ))}
                  </div>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              {
                label: 'Pipeline min.',
                val: fmtEur(leads.pipelineMin),
                sub: `${leads.hot} HOT x 5.000`,
                color: '#22C55E',
              },
              {
                label: 'Pipeline max.',
                val: fmtEur(leads.pipelineMax),
                sub: `${leads.hot} HOT x 20.000`,
                color: '#22C55E',
              },
              {
                label: 'Kontaktiert',
                val: fmt(leads.contacted),
                sub: `${leads.total > 0 ? Math.round((leads.contacted / leads.total) * 100) : 0}%`,
                color: '#F59E0B',
              },
              { label: 'Qualifiziert', val: fmt(leads.qualified), sub: 'Abschluss-bereit', color: '#FF5C2E' },
            ].map((kpi) => (
              <div key={kpi.label} style={S.kpiCard}>
                <div style={S.label}>{kpi.label}</div>
                <div style={{ ...S.val, color: kpi.color }}>{kpi.val}</div>
                <div style={S.sub}>{kpi.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ ...S.card, padding: 20 }}>
            <div style={S.chartTitle}>Sales Funnel</div>
            <div style={S.chartSub}>Lead → Qualifiziert</div>
            {[
              { label: 'Generiert', count: leads.total, pct: 100, color: '#6B7AFF' },
              {
                label: 'KI-bewertet',
                count: leads.aiScored,
                pct: leads.total > 0 ? Math.round((leads.aiScored / leads.total) * 100) : 0,
                color: '#8B5CF6',
              },
              {
                label: 'E-Mail bereit',
                count: leads.withEmail,
                pct: leads.total > 0 ? Math.round((leads.withEmail / leads.total) * 100) : 0,
                color: '#F59E0B',
              },
              {
                label: 'Kontaktiert',
                count: leads.contacted,
                pct: leads.total > 0 ? Math.round((leads.contacted / leads.total) * 100) : 0,
                color: '#FF5C2E',
              },
              {
                label: 'Qualifiziert',
                count: leads.qualified,
                pct: leads.total > 0 ? Math.round((leads.qualified / leads.total) * 100) : 0,
                color: '#22C55E',
              },
            ].map((step, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 0',
                  borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.05)' : '',
                }}
              >
                <div style={{ width: 90, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{step.label}</div>
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${step.pct}%`,
                      height: '100%',
                      background: step.color,
                      borderRadius: 3,
                      transition: 'width 0.8s ease',
                    }}
                  />
                </div>
                <div
                  style={{
                    width: 30,
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: 'var(--font-dm-mono)',
                    color: step.color,
                    textAlign: 'right',
                  }}
                >
                  {step.count}
                </div>
                <div style={{ width: 36, fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'right' }}>
                  {step.pct}%
                </div>
              </div>
            ))}
          </div>
          <div style={{ ...S.card, padding: 20, marginTop: 12 }}>
            <div style={S.chartTitle}>Naechste Massnahmen</div>
            <div style={S.chartSub}>Priorisiert nach Pipeline-Impact</div>
            {masterData?.leads &&
              [
                {
                  prio: 'HOCH',
                  text: `${masterData.leads.hot} HOT Leads warten auf Kontakt`,
                  sub: `${Math.round(masterData.leads.hot * 12500).toLocaleString('de-DE')} EUR Pipeline-Wert`,
                  color: '#FF5C2E',
                  href: '/dashboard/leads',
                },
                {
                  prio: 'MITTEL',
                  text: `${masterData.leads.withEmail} E-Mail Drafts bereit`,
                  sub: 'KI hat personalisierte E-Mails vorbereitet',
                  color: '#F59E0B',
                  href: '/dashboard/leads',
                },
                {
                  prio: 'NIEDRIG',
                  text: `${masterData.leads.warm} WARM Leads nachfassen`,
                  sub: 'Score 45-74, noch nicht kontaktiert',
                  color: '#6B7AFF',
                  href: '/dashboard/leads',
                },
              ].map((item, i) => (
                <a
                  key={i}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '11px 0',
                    borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : '',
                    textDecoration: 'none',
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: `${item.color}18`,
                      color: item.color,
                      fontWeight: 700,
                      flexShrink: 0,
                      width: 56,
                      textAlign: 'center',
                    }}
                  >
                    {item.prio}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{item.text}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{item.sub}</div>
                  </div>
                  <div style={{ fontSize: 13, color: item.color, flexShrink: 0 }}>→</div>
                </a>
              ))}
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
          <div style={{ ...S.card, padding: 20 }}>
            <div style={S.chartTitle}>KI-Workflow Status</div>
            <div style={S.chartSub}>n8n Automations-Pipeline</div>
            {systemStatus.map((s: any, i: number) => {
              const color =
                s.status === 'active'
                  ? '#22C55E'
                  : s.status === 'pending'
                    ? '#F59E0B'
                    : s.status === 'planned'
                      ? 'rgba(255,255,255,0.2)'
                      : '#FF5C2E';
              const label =
                s.status === 'active'
                  ? 'Aktiv'
                  : s.status === 'pending'
                    ? 'Pending'
                    : s.status === 'planned'
                      ? 'Geplant'
                      : 'Setup';
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: i < systemStatus.length - 1 ? '1px solid rgba(255,255,255,0.05)' : '',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 1 }}>{s.name}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{s.detail}</div>
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      padding: '3px 8px',
                      borderRadius: 4,
                      background: `${color}18`,
                      color,
                      fontWeight: 600,
                    }}
                  >
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16, marginBottom: 16 }}
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
                  desc: 'Findet taeglich neue Kunden via Apollo-Datenbank.',
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
                const label = item.status === 'active' ? 'Aktiv' : item.status === 'pending' ? 'Einrichten' : 'Geplant';
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
                            style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-dm-mono)' }}
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
    </div>
  );
}
