'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type AnalyticsData = {
  leads: {
    total: number;
    hot: number;
    warm: number;
    cold: number;
    contacted: number;
    qualified: number;
    withEmail: number;
    avgScore: number;
    pipelineMin: number;
    pipelineMax: number;
    conversionRate: number;
    hotRate: number;
  };
  weeklyLeads: { week: string; total: number; hot: number; warm: number; cold: number }[];
  industries: { name: string; count: number; avgScore: number }[];
  topTech: { name: string; count: number }[];
  topCities: { name: string; count: number }[];
  website: {
    visitors: number;
    pageviews: number;
    bounceRate: number;
    visitDuration: number;
    visits: number;
    timeseries: { date: string; visitors: number }[];
    sources: { source: string; visitors: number }[];
    pages: { page: string; visitors: number; pageviews: number; bounce_rate: number }[];
  };
  hasPlausible: boolean;
};

const PERIODS = [
  { label: '7 Tage', value: '7d' },
  { label: '30 Tage', value: '30d' },
  { label: '3 Monate', value: '3mo' },
  { label: '12 Monate', value: '12mo' },
];

export default function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics?period=${period}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period]);

  const fmt = (n: number) => n.toLocaleString('de-DE');
  const fmtEur = (n: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  const fmtDuration = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;
  const scoreColor = (score: number) => (score >= 75 ? '#FF5C2E' : score >= 45 ? '#F59E0B' : '#6B7AFF');

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div
        style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px' }}
      >
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{label}</div>
        {payload.map((p: any, i: number) => (
          <div
            key={i}
            style={{ fontSize: 13, fontWeight: 600, color: p.color || '#fff', fontFamily: 'var(--font-dm-mono)' }}
          >
            {fmt(p.value)} {p.name}
          </div>
        ))}
      </div>
    );
  };

  if (loading)
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 400,
          color: 'rgba(255,255,255,0.3)',
          fontSize: 13,
        }}
      >
        Lade Analytics...
      </div>
    );
  if (!data) return null;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400 }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: '#fff', margin: 0 }}>Analytics</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: '4px 0 0' }}>Performance & Wachstum</p>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 4,
            background: '#111',
            borderRadius: 8,
            padding: 4,
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
                background: period === p.value ? '#fff' : 'transparent',
                color: period === p.value ? '#000' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.15s',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          {
            label: 'Leads gesamt',
            value: fmt(data.leads.total),
            sub: `${data.leads.withEmail} mit E-Mail Draft`,
            color: '#fff',
          },
          { label: 'HOT Leads', value: fmt(data.leads.hot), sub: `${data.leads.hotRate}% HOT-Rate`, color: '#FF5C2E' },
          {
            label: 'Ø KI-Score',
            value: String(data.leads.avgScore),
            sub: `${data.leads.warm} WARM · ${data.leads.cold} COLD`,
            color: '#6B7AFF',
          },
          {
            label: 'Pipeline-Wert',
            value: fmtEur(data.leads.pipelineMin),
            sub: `bis ${fmtEur(data.leads.pipelineMax)}`,
            color: '#22C55E',
          },
          {
            label: 'Kontaktiert',
            value: fmt(data.leads.contacted),
            sub: `${data.leads.qualified} qualifiziert · ${data.leads.conversionRate}% Conv.`,
            color: '#F59E0B',
          },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              background: '#111',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10,
              padding: '14px 16px',
            }}
          >
            <div
              style={{
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'rgba(255,255,255,0.35)',
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              {card.label}
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: card.color,
                fontFamily: 'var(--font-dm-mono)',
                lineHeight: 1,
                marginBottom: 4,
              }}
            >
              {card.value}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* WEBSITE KPIs */}
      {data.hasPlausible && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            {
              label: 'Besucher',
              value: fmt(data.website.visitors),
              sub: `${fmt(data.website.visits)} Besuche`,
              color: '#6B7AFF',
            },
            {
              label: 'Seitenaufrufe',
              value: fmt(data.website.pageviews),
              sub: `Ø ${(data.website.visitors > 0 ? data.website.pageviews / data.website.visitors : 0).toFixed(1)} pro Besuch`,
              color: '#6B7AFF',
            },
            {
              label: 'Bounce Rate',
              value: `${data.website.bounceRate}%`,
              sub: data.website.bounceRate < 50 ? 'Gut' : data.website.bounceRate < 70 ? 'Mittel' : 'Hoch',
              color: data.website.bounceRate < 50 ? '#22C55E' : data.website.bounceRate < 70 ? '#F59E0B' : '#FF5C2E',
            },
            {
              label: 'Ø Besuchsdauer',
              value: fmtDuration(data.website.visitDuration),
              sub: 'pro Sitzung',
              color: '#fff',
            },
            {
              label: 'Quelle #1',
              value: data.website.sources[0]?.source || '—',
              sub: `${fmt(data.website.sources[0]?.visitors || 0)} Besucher`,
              color: '#fff',
            },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                background: '#111',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10,
                padding: '14px 16px',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'rgba(255,255,255,0.35)',
                  marginBottom: 8,
                  fontWeight: 500,
                }}
              >
                {card.label}
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: card.color,
                  fontFamily: 'var(--font-dm-mono)',
                  lineHeight: 1,
                  marginBottom: 4,
                }}
              >
                {card.value}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{card.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* CHARTS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#fff', marginBottom: 4 }}>Lead-Entwicklung</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>
            HOT / WARM / COLD pro Woche
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.weeklyLeads} barSize={16} barGap={2}>
              <XAxis
                dataKey="week"
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="hot" stackId="a" fill="#FF5C2E" name="HOT" />
              <Bar dataKey="warm" stackId="a" fill="#F59E0B" name="WARM" />
              <Bar dataKey="cold" stackId="a" fill="#6B7AFF" radius={[4, 4, 0, 0]} name="COLD" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20 }}>
          {data.hasPlausible && data.website.timeseries.length > 0 ? (
            <>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#fff', marginBottom: 4 }}>Website-Besucher</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>onvero.de</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={data.website.timeseries}>
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(d) => d.slice(5)}
                    interval={Math.floor(data.website.timeseries.length / 6)}
                  />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
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
            </>
          ) : (
            <>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#fff', marginBottom: 4 }}>Score-Verteilung</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>Lead-Qualität</div>
              <div style={{ display: 'flex', gap: 12, height: 180, alignItems: 'flex-end', padding: '0 12px' }}>
                {[
                  {
                    label: 'HOT',
                    count: data.leads.hot,
                    color: '#FF5C2E',
                    pct: data.leads.total > 0 ? data.leads.hot / data.leads.total : 0,
                  },
                  {
                    label: 'WARM',
                    count: data.leads.warm,
                    color: '#F59E0B',
                    pct: data.leads.total > 0 ? data.leads.warm / data.leads.total : 0,
                  },
                  {
                    label: 'COLD',
                    count: data.leads.cold,
                    color: '#6B7AFF',
                    pct: data.leads.total > 0 ? data.leads.cold / data.leads.total : 0,
                  },
                ].map((b) => (
                  <div
                    key={b.label}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
                  >
                    <span style={{ fontSize: 16, fontWeight: 700, color: b.color, fontFamily: 'var(--font-dm-mono)' }}>
                      {b.count}
                    </span>
                    <div
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: 6,
                        height: 120,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: `${Math.max(Math.round(b.pct * 100), 4)}%`,
                          background: b.color,
                          borderRadius: 6,
                          transition: 'height 0.8s ease',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{b.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* DETAIL TABLES */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Branchen */}
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#fff', marginBottom: 4 }}>Top Branchen</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>nach Lead-Anzahl</div>
          {data.industries.slice(0, 7).map((ind, i) => (
            <div key={ind.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span
                style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-dm-mono)', width: 14 }}
              >
                {i + 1}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{ind.name}</span>
                  <span style={{ fontSize: 11, color: scoreColor(ind.avgScore), fontFamily: 'var(--font-dm-mono)' }}>
                    {ind.avgScore}
                  </span>
                </div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                  <div
                    style={{
                      height: '100%',
                      borderRadius: 2,
                      background: '#6B7AFF',
                      width: `${(ind.count / (data.industries[0]?.count || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.35)',
                  fontFamily: 'var(--font-dm-mono)',
                  width: 20,
                  textAlign: 'right',
                }}
              >
                {ind.count}
              </span>
            </div>
          ))}
        </div>

        {/* Sources or Tech */}
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20 }}>
          {data.hasPlausible && data.website.sources.length > 0 ? (
            <>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#fff', marginBottom: 4 }}>Traffic-Quellen</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>
                Woher kommen Besucher
              </div>
              {data.website.sources.slice(0, 7).map((src: any, i: number) => (
                <div key={src.source} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span
                    style={{
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.2)',
                      fontFamily: 'var(--font-dm-mono)',
                      width: 14,
                    }}
                  >
                    {i + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{src.source || 'Direct'}</span>
                      <span style={{ fontSize: 11, color: '#6B7AFF', fontFamily: 'var(--font-dm-mono)' }}>
                        {fmt(src.visitors)}
                      </span>
                    </div>
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                      <div
                        style={{
                          height: '100%',
                          borderRadius: 2,
                          background: '#6B7AFF',
                          width: `${(src.visitors / (data.website.sources[0]?.visitors || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#fff', marginBottom: 4 }}>Top Technologien</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>in Lead-Firmen</div>
              {data.topTech.slice(0, 7).map((tech, i) => (
                <div key={tech.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span
                    style={{
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.2)',
                      fontFamily: 'var(--font-dm-mono)',
                      width: 14,
                    }}
                  >
                    {i + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{tech.name}</span>
                      <span style={{ fontSize: 11, color: '#22C55E', fontFamily: 'var(--font-dm-mono)' }}>
                        {tech.count}
                      </span>
                    </div>
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                      <div
                        style={{
                          height: '100%',
                          borderRadius: 2,
                          background: '#22C55E',
                          width: `${(tech.count / (data.topTech[0]?.count || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Pages or Cities */}
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 20 }}>
          {data.hasPlausible && data.website.pages.length > 0 ? (
            <>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#fff', marginBottom: 4 }}>Top-Seiten</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>onvero.de</div>
              {data.website.pages.slice(0, 7).map((pg: any, i: number) => (
                <div key={pg.page} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span
                    style={{
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.2)',
                      fontFamily: 'var(--font-dm-mono)',
                      width: 14,
                    }}
                  >
                    {i + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-dm-mono)' }}>
                        {pg.page.length > 22 ? pg.page.slice(0, 22) + '...' : pg.page}
                      </span>
                      <span style={{ fontSize: 11, color: '#6B7AFF', fontFamily: 'var(--font-dm-mono)' }}>
                        {fmt(pg.visitors)}
                      </span>
                    </div>
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                      <div
                        style={{
                          height: '100%',
                          borderRadius: 2,
                          background: '#6B7AFF',
                          width: `${(pg.visitors / (data.website.pages[0]?.visitors || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#fff', marginBottom: 4 }}>Top Städte</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>Lead-Herkunft</div>
              {data.topCities.map((city, i) => (
                <div key={city.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span
                    style={{
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.2)',
                      fontFamily: 'var(--font-dm-mono)',
                      width: 14,
                    }}
                  >
                    {i + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{city.name}</span>
                      <span style={{ fontSize: 11, color: '#F59E0B', fontFamily: 'var(--font-dm-mono)' }}>
                        {city.count}
                      </span>
                    </div>
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                      <div
                        style={{
                          height: '100%',
                          borderRadius: 2,
                          background: '#F59E0B',
                          width: `${(city.count / (data.topCities[0]?.count || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Plausible hint */}
      {!data.hasPlausible && (
        <div
          style={{
            background: 'rgba(107,122,255,0.06)',
            border: '1px solid rgba(107,122,255,0.15)',
            borderRadius: 10,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#fff' }}>Website-Analytics einrichten</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
              Plausible API Key als PLAUSIBLE_API_KEY Umgebungsvariable setzen.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
