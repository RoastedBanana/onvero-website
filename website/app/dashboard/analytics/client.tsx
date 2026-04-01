'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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

export default function AnalyticsClient() {
  const [tab, setTab] = useState<Tab>('master');
  const [masterData, setMasterData] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);

  const fmt = (n: number) => Math.round(n).toLocaleString('de-DE');
  const fmtEur = (n: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  const fmtDur = (s: number) => `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;

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
              {[
                { label: `${leads.aiScored} Leads KI-bewertet`, time: 'Heute', color: '#22C55E' },
                { label: `${leads.withEmail} E-Mail Drafts`, time: 'Heute', color: '#8B5CF6' },
                { label: `${leads.last7d} Leads generiert`, time: 'Diese Woche', color: '#F59E0B' },
                { label: `${leads.total} Leads gesamt`, time: 'Gesamt', color: '#6B7AFF' },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '7px 0',
                    borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : '',
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: item.color,
                      flexShrink: 0,
                      marginTop: 4,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{item.label}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>{item.time}</div>
                  </div>
                </div>
              ))}
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
        </div>
      )}

      {/* LEADS */}
      {tab === 'leads' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Leads gesamt', val: fmt(leads.total), sub: `${leads.aiScored} KI-bewertet`, color: '#fff' },
              {
                label: 'HOT Leads',
                val: fmt(leads.hot),
                sub: `${leads.total > 0 ? Math.round((leads.hot / leads.total) * 100) : 0}% HOT-Rate`,
                color: '#FF5C2E',
              },
              { label: 'WARM Leads', val: fmt(leads.warm), sub: 'Score 45-74', color: '#F59E0B' },
              { label: 'Ø Score', val: String(leads.avgScore), sub: `${leads.cold} COLD`, color: '#8B5CF6' },
            ].map((kpi) => (
              <div key={kpi.label} style={S.kpiCard}>
                <div style={S.label}>{kpi.label}</div>
                <div style={{ ...S.val, color: kpi.color }}>{kpi.val}</div>
                <div style={S.sub}>{kpi.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ ...S.card, padding: 20 }}>
            <div style={S.chartTitle}>Lead-Entwicklung</div>
            <div style={S.chartSub}>HOT / WARM / COLD pro Woche</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weekly} barSize={22}>
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
        </div>
      )}

      {/* WEBSITE */}
      {tab === 'website' && (
        <div>
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
        </div>
      )}
    </div>
  );
}
