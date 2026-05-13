'use client';

import { useState, useEffect } from 'react';
import { useTheme, colors } from '../layout';

// ─── Types ────────────────────────────────────────────────────────────────────

type SignalType = 'job' | 'funding' | 'expansion' | 'churn' | 'growth';

interface Signal {
  id: string;
  company: string;
  companyId?: string;
  city: string;
  signal: string;
  type: SignalType;
  time: string;
  score: number;
}

interface Watch {
  id: string;
  name: string;
  criteria: Partial<{ company: string; type: SignalType | 'all'; minScore: number }>;
  createdAt: string;
  matchCount: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_META: Record<SignalType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  job: {
    label: 'Jobpost',
    color: '#7C3AED',
    bg: '#F5F3FF',
    icon: (
      <svg
        width={14}
        height={14}
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <rect x="2" y="5" width="12" height="9" rx="1.5" />
        <path d="M5 5V3.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V5" />
      </svg>
    ),
  },
  funding: {
    label: 'Funding',
    color: '#059669',
    bg: '#ECFDF5',
    icon: (
      <svg
        width={14}
        height={14}
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <circle cx="8" cy="8" r="6" />
        <path d="M8 5v6M6 7h3a1 1 0 0 1 0 2H7a1 1 0 0 0 0 2h3" />
      </svg>
    ),
  },
  expansion: {
    label: 'Expansion',
    color: '#0891B2',
    bg: '#ECFEFF',
    icon: (
      <svg
        width={14}
        height={14}
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <path d="M2 14L14 2M9 2h5v5M7 14H2V9" />
      </svg>
    ),
  },
  churn: {
    label: 'Wechselsignal',
    color: '#DC2626',
    bg: '#FEF2F2',
    icon: (
      <svg
        width={14}
        height={14}
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <path d="M1 8h10M7 4l4 4-4 4" />
        <path d="M14 4v8" />
      </svg>
    ),
  },
  growth: {
    label: 'Wachstum',
    color: '#D97706',
    bg: '#FFFBEB',
    icon: (
      <svg
        width={14}
        height={14}
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      >
        <polyline points="2 12 6 7 9 10 14 4" />
        <polyline points="11 4 14 4 14 7" />
      </svg>
    ),
  },
};

const SEED_SIGNALS: Signal[] = [
  {
    id: '1',
    company: 'Fashion House GmbH',
    city: 'München',
    signal: 'Sucht "Head of Logistics" und "Warehouse Manager" auf LinkedIn',
    type: 'job',
    time: 'vor 2h',
    score: 91,
  },
  {
    id: '2',
    company: 'SportGear Online',
    city: 'Hamburg',
    signal: '3 negative DHL-Bewertungen auf Trustpilot in 14 Tagen',
    type: 'churn',
    time: 'vor 5h',
    score: 85,
  },
  {
    id: '3',
    company: 'TechDirect GmbH',
    city: 'Berlin',
    signal: 'Series A — 4,2 Mio. € von Cherry Ventures',
    type: 'funding',
    time: 'gestern',
    score: 79,
  },
  {
    id: '4',
    company: 'BikeShop Nord',
    city: 'Bremen',
    signal: 'Neues Lager in Hamburg eröffnet — 5.000 Pakete/Tag Kapazität',
    type: 'expansion',
    time: 'gestern',
    score: 76,
  },
  {
    id: '5',
    company: 'PetStore24',
    city: 'Frankfurt',
    signal: 'Organischer Traffic +180% laut Similarweb (MoM)',
    type: 'growth',
    time: 'vor 2 Tagen',
    score: 61,
  },
  {
    id: '6',
    company: 'LuxuryBags Store',
    city: 'Düsseldorf',
    signal: 'Sucht "Fulfillment Coordinator" — Hinweis auf steigendes Volumen',
    type: 'job',
    time: 'vor 2 Tagen',
    score: 88,
  },
  {
    id: '7',
    company: 'GardenPlus GmbH',
    city: 'Leipzig',
    signal: 'COO-Wechsel: Max Müller (ex-DHL Supply Chain) neu eingestellt',
    type: 'churn',
    time: 'vor 3 Tagen',
    score: 81,
  },
  {
    id: '8',
    company: 'HomeStyle24',
    city: 'Köln',
    signal: 'Neuer Showroom in Köln Innenstadt — Expansion stationär + online',
    type: 'expansion',
    time: 'vor 3 Tagen',
    score: 74,
  },
  {
    id: '9',
    company: 'Auto Parts Pro',
    city: 'Dortmund',
    signal: 'Umsatz +40% YoY laut Jahresabschluss Handelsregister',
    type: 'growth',
    time: 'vor 4 Tagen',
    score: 52,
  },
  {
    id: '10',
    company: 'Fashion House GmbH',
    city: 'München',
    signal: 'Seed-Finanzierung 800k € von lokalen Angels',
    type: 'funding',
    time: 'vor 5 Tagen',
    score: 91,
  },
  {
    id: '11',
    company: 'BabyWorld Store',
    city: 'Stuttgart',
    signal: '2,1 Sterne bei Hermes — "Lieferung dauert zu lang"',
    type: 'churn',
    time: 'vor 5 Tagen',
    score: 68,
  },
  {
    id: '12',
    company: 'GardenPlus GmbH',
    city: 'Leipzig',
    signal: 'Neues Lager in Dresden angemietet (LinkedIn-Post)',
    type: 'expansion',
    time: 'vor 6 Tagen',
    score: 81,
  },
];

const SEED_WATCHES: Watch[] = [
  { id: 'w1', name: 'DHL-Wechsler', criteria: { type: 'churn', minScore: 60 }, createdAt: '28.04.2026', matchCount: 3 },
  {
    id: 'w2',
    name: 'Logistik-Stellenanzeigen',
    criteria: { type: 'job', minScore: 70 },
    createdAt: '26.04.2026',
    matchCount: 2,
  },
  {
    id: 'w3',
    name: 'Hot Leads Wachstum',
    criteria: { type: 'growth', minScore: 75 },
    createdAt: '24.04.2026',
    matchCount: 1,
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntentPage() {
  const { theme } = useTheme();
  const c = colors(theme);
  const isDark = theme === 'dark';

  const [signals, setSignals] = useState<Signal[]>(SEED_SIGNALS);
  const [watches, setWatches] = useState<Watch[]>(SEED_WATCHES);
  const [activeWatchId, setActiveWatchId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<SignalType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [showNewWatch, setShowNewWatch] = useState(false);
  const [leadMap, setLeadMap] = useState<Map<string, string>>(new Map());

  // Load leads for "Zum Lead" links
  useEffect(() => {
    fetch('/api/leads')
      .then((r) => r.json())
      .then((data) => {
        const map = new Map<string, string>();
        for (const lead of data.leads ?? []) {
          if (lead.company_name) map.set(lead.company_name, lead.id);
        }
        setLeadMap(map);
        // Attach company IDs to signals
        setSignals((prev) =>
          prev.map((s) => {
            const id = map.get(s.company);
            return id ? { ...s, companyId: id } : s;
          })
        );
      })
      .catch(() => {});
  }, []);

  const activeWatch = watches.find((w) => w.id === activeWatchId) ?? null;

  const filtered = signals.filter((s) => {
    if (activeWatch) {
      if (activeWatch.criteria.company && !s.company.toLowerCase().includes(activeWatch.criteria.company.toLowerCase()))
        return false;
      if (activeWatch.criteria.type && activeWatch.criteria.type !== 'all' && s.type !== activeWatch.criteria.type)
        return false;
      if (activeWatch.criteria.minScore && s.score < activeWatch.criteria.minScore) return false;
    } else {
      if (typeFilter !== 'all' && s.type !== typeFilter) return false;
    }
    if (
      search &&
      !s.company.toLowerCase().includes(search.toLowerCase()) &&
      !s.signal.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const typeCounts = Object.fromEntries(
    (['job', 'funding', 'expansion', 'churn', 'growth'] as SignalType[]).map((t) => [
      t,
      signals.filter((s) => s.type === t).length,
    ])
  ) as Record<SignalType, number>;

  function deleteWatch(id: string) {
    setWatches((prev) => prev.filter((w) => w.id !== id));
    if (activeWatchId === id) setActiveWatchId(null);
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        fontFamily: 'var(--font-inter), sans-serif',
        color: c.text,
      }}
    >
      {/* ── Left: Watches ─────────────────────────────────────────────────── */}
      <div
        style={{
          width: 264,
          borderRight: `1px solid ${c.border}`,
          background: c.bgCard,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: '16px 18px 12px',
            borderBottom: `1px solid ${c.border}`,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: c.accent,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                marginBottom: 4,
              }}
            >
              Signal Watch
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: c.text }}>Meine Watches</div>
          </div>
          <button
            onClick={() => setShowNewWatch(true)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: `1.5px solid ${c.accent}`,
              background: isDark ? `${c.accent}22` : '#EEF0FF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg
              width={12}
              height={12}
              viewBox="0 0 16 16"
              fill="none"
              stroke={c.accent}
              strokeWidth={2.5}
              strokeLinecap="round"
            >
              <path d="M8 3v10M3 8h10" />
            </svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {/* All signals */}
          <button
            onClick={() => {
              setActiveWatchId(null);
              setTypeFilter('all');
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '9px 10px',
              borderRadius: 9,
              border: `1.5px solid ${!activeWatchId ? c.accent : 'transparent'}`,
              background: !activeWatchId ? (isDark ? `${c.accent}22` : '#EEF0FF') : 'transparent',
              cursor: 'pointer',
              fontFamily: 'inherit',
              marginBottom: 4,
              textAlign: 'left',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: !activeWatchId ? c.accent : c.bgHover,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg
                width={13}
                height={13}
                viewBox="0 0 16 16"
                fill="none"
                stroke={!activeWatchId ? '#fff' : c.textSub}
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="M2 8h12M2 4h12M2 12h12" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: !activeWatchId ? c.accent : c.textSub }}>
                Alle Signale
              </div>
              <div style={{ fontSize: 10, color: c.textMuted }}>{signals.length} total</div>
            </div>
          </button>

          {/* Divider */}
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: c.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              padding: '6px 10px 4px',
              marginTop: 4,
            }}
          >
            Gespeichert
          </div>

          {watches.map((w) => {
            const isActive = activeWatchId === w.id;
            const meta = w.criteria.type && w.criteria.type !== 'all' ? TYPE_META[w.criteria.type] : null;
            return (
              <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 3 }}>
                <button
                  onClick={() => setActiveWatchId(isActive ? null : w.id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    padding: '9px 10px',
                    borderRadius: 9,
                    border: `1.5px solid ${isActive ? (meta?.color ?? c.accent) : 'transparent'}`,
                    background: isActive ? (meta ? meta.bg : isDark ? `${c.accent}22` : '#EEF0FF') : 'transparent',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      background: meta ? meta.bg : isDark ? `${c.accent}22` : '#EEF0FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: meta?.color ?? c.accent,
                    }}
                  >
                    {meta ? (
                      TYPE_META[meta === TYPE_META.job ? 'job' : (w.criteria.type as SignalType)]?.icon
                    ) : (
                      <svg
                        width={13}
                        height={13}
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke={c.accent}
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      >
                        <path d="M8 2a4 4 0 0 1 4 4v2l1.5 3h-11L4 8V6a4 4 0 0 1 4-4zM6.5 13a1.5 1.5 0 0 0 3 0" />
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: isActive ? (meta?.color ?? c.accent) : c.textSub,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {w.name}
                    </div>
                    <div style={{ fontSize: 10, color: c.textMuted, marginTop: 1 }}>
                      {w.matchCount} Treffer · {w.createdAt}
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => deleteWatch(w.id)}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 5,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: c.borderStrong,
                    flexShrink: 0,
                    marginLeft: 2,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#DC2626')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = c.borderStrong)}
                >
                  <svg
                    width={10}
                    height={10}
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  >
                    <path d="M3 3l10 10M13 3L3 13" />
                  </svg>
                </button>
              </div>
            );
          })}

          {watches.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px 12px', color: c.textMuted, fontSize: 11 }}>
              Noch keine Watches.
              <br />
              Erstelle deine erste Watch.
            </div>
          )}
        </div>
      </div>

      {/* ── Main Feed ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div
          style={{
            background: isDark
              ? `linear-gradient(135deg, ${c.bgCard} 0%, ${c.bg} 100%)`
              : 'linear-gradient(135deg, #EEF0FF 0%, #F0F4FF 60%, #F7F8FC 100%)',
            borderBottom: `1px solid ${c.border}`,
            padding: '20px 28px 16px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
            <div>
              {activeWatch ? (
                <>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: c.bgCard,
                      border: `1px solid ${isDark ? c.border : '#E0E3FF'}`,
                      color: c.accent,
                      borderRadius: 99,
                      padding: '3px 10px',
                      fontSize: 11,
                      fontWeight: 700,
                      marginBottom: 8,
                    }}
                  >
                    <svg
                      width={10}
                      height={10}
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M8 2a4 4 0 0 1 4 4v2l1.5 3h-11L4 8V6a4 4 0 0 1 4-4zM6.5 13a1.5 1.5 0 0 0 3 0" />
                    </svg>
                    Watch aktiv
                  </div>
                  <h1 style={{ fontSize: 21, fontWeight: 800, margin: '0 0 3px', color: c.text }}>
                    {activeWatch.name}
                  </h1>
                  <p style={{ fontSize: 12, color: c.textSub, margin: 0 }}>
                    {filtered.length} Treffer
                    {activeWatch.criteria.type &&
                      activeWatch.criteria.type !== 'all' &&
                      ` · ${TYPE_META[activeWatch.criteria.type].label}`}
                    {activeWatch.criteria.minScore && ` · Score ≥ ${activeWatch.criteria.minScore}`}
                  </p>
                </>
              ) : (
                <>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: c.bgCard,
                      border: `1px solid ${isDark ? c.border : '#E0E3FF'}`,
                      color: c.accent,
                      borderRadius: 99,
                      padding: '3px 10px',
                      fontSize: 11,
                      fontWeight: 700,
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.accent }} />
                    Kaufsignale
                  </div>
                  <h1 style={{ fontSize: 21, fontWeight: 800, margin: '0 0 3px', color: c.text }}>Live Feed</h1>
                  <p style={{ fontSize: 12, color: c.textSub, margin: 0 }}>
                    {signals.length} Signale der letzten 7 Tage
                  </p>
                </>
              )}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: c.bgCard,
                border: `1px solid ${isDark ? 'rgba(16,185,129,0.3)' : '#A7F3D0'}`,
                borderRadius: 99,
                padding: '5px 12px',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#059669',
                  boxShadow: '0 0 0 2px rgba(5,150,105,0.2)',
                }}
              />
              <span style={{ fontSize: 12, color: '#059669', fontWeight: 700 }}>Live</span>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div
          style={{
            background: c.bgCard,
            borderBottom: `1px solid ${c.border}`,
            padding: '10px 28px',
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          {!activeWatch && (
            <div style={{ display: 'flex', background: c.bgPage, borderRadius: 9, padding: 3, gap: 2 }}>
              {(['all', 'job', 'funding', 'expansion', 'churn', 'growth'] as const).map((t) => {
                const active = typeFilter === t;
                const label = t === 'all' ? 'Alle' : TYPE_META[t].label;
                const color = t === 'all' ? c.text : TYPE_META[t].color;
                return (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    style={{
                      padding: '5px 11px',
                      borderRadius: 7,
                      border: 'none',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      background: active ? c.bgCard : 'transparent',
                      color: active ? color : c.textSub,
                      boxShadow: active ? '0 1px 4px rgba(10,37,64,0.08)' : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    {label}
                    {t !== 'all' && <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.7 }}>{typeCounts[t]}</span>}
                  </button>
                );
              })}
            </div>
          )}
          <div style={{ flex: 1, position: 'relative' }}>
            <svg
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }}
              width={13}
              height={13}
              viewBox="0 0 16 16"
              fill="none"
              stroke={c.textMuted}
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <circle cx="7" cy="7" r="5" />
              <line x1="11" y1="11" x2="14" y2="14" />
            </svg>
            <input
              placeholder="Firma oder Signaltext suchen…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                border: `1.5px solid ${c.border}`,
                borderRadius: 8,
                fontSize: 12,
                fontFamily: 'inherit',
                outline: 'none',
                background: c.bgPage,
                color: c.text,
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Type summary cards (only in all-signals view) */}
        {!activeWatch && typeFilter === 'all' && (
          <div
            style={{
              padding: '16px 28px 0',
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 10,
              flexShrink: 0,
            }}
          >
            {(Object.entries(TYPE_META) as [SignalType, (typeof TYPE_META)[SignalType]][]).map(([type, meta]) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                style={{
                  background: c.bgCard,
                  border: `1.5px solid ${(typeFilter as string) === type ? meta.color : c.border}`,
                  borderRadius: 11,
                  padding: '12px 14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: meta.color }}>
                  {meta.icon}
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {meta.label}
                  </span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: meta.color, lineHeight: 1 }}>
                  {typeCounts[type]}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Feed */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 28px 28px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((sig) => {
              const meta = TYPE_META[sig.type];
              const leadId = sig.companyId;
              return (
                <div
                  key={sig.id}
                  style={{
                    background: c.bgCard,
                    border: `1px solid ${c.border}`,
                    borderRadius: 13,
                    padding: '16px 18px',
                    display: 'flex',
                    gap: 14,
                    alignItems: 'flex-start',
                    transition: 'box-shadow 0.15s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.boxShadow = isDark
                      ? '0 2px 12px rgba(0,0,0,0.3)'
                      : '0 2px 12px rgba(10,37,64,0.07)')
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
                >
                  {/* Type icon */}
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: isDark ? `${meta.color}22` : meta.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: meta.color,
                    }}
                  >
                    {meta.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: c.text }}>{sig.company}</span>
                      <span style={{ fontSize: 11, color: c.textMuted }}>{sig.city}</span>
                      <span
                        style={{
                          padding: '2px 7px',
                          background: isDark ? `${meta.color}22` : meta.bg,
                          color: meta.color,
                          borderRadius: 5,
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: c.textSub, lineHeight: 1.55, margin: '0 0 7px' }}>{sig.signal}</p>
                    <div style={{ fontSize: 11, color: c.textMuted, fontWeight: 600 }}>{sig.time}</div>
                  </div>

                  {/* Score + Action */}
                  <div
                    style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}
                  >
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 800,
                        color: sig.score >= 80 ? '#DC2626' : sig.score >= 65 ? '#D97706' : '#64748B',
                      }}
                    >
                      {sig.score}
                    </div>
                    {leadId ? (
                      <a
                        href={`/intelligence/leads/${leadId}`}
                        style={{
                          padding: '5px 11px',
                          background: isDark ? `${c.accent}22` : '#EEF0FF',
                          color: c.accent,
                          border: 'none',
                          borderRadius: 7,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          textDecoration: 'none',
                          display: 'block',
                        }}
                      >
                        Zum Lead →
                      </a>
                    ) : (
                      <span
                        style={{
                          padding: '5px 11px',
                          background: c.bgPage,
                          color: c.textMuted,
                          borderRadius: 7,
                          fontSize: 11,
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Kein Lead
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '64px 24px', color: c.textMuted }}>
              <svg
                width={40}
                height={40}
                viewBox="0 0 16 16"
                fill="none"
                stroke={c.border}
                strokeWidth="1.4"
                strokeLinecap="round"
                style={{ margin: '0 auto 12px', display: 'block' }}
              >
                <path d="M8 2a4 4 0 0 1 4 4v2l1.5 3h-11L4 8V6a4 4 0 0 1 4-4zM6.5 13a1.5 1.5 0 0 0 3 0" />
              </svg>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Keine Signale gefunden</div>
              <div style={{ fontSize: 11 }}>Andere Filterkriterien versuchen</div>
            </div>
          )}
        </div>
      </div>

      {/* ── New Watch Modal ───────────────────────────────────────────────── */}
      {showNewWatch && (
        <NewWatchModal
          onClose={() => setShowNewWatch(false)}
          onSave={(w) => {
            const newWatch: Watch = {
              id: `w${Date.now()}`,
              name: w.name,
              criteria: { type: w.type, minScore: w.minScore },
              createdAt: new Date().toLocaleDateString('de-DE'),
              matchCount: signals.filter((s) => {
                if (w.type !== 'all' && s.type !== w.type) return false;
                if (w.minScore && s.score < w.minScore) return false;
                return true;
              }).length,
            };
            setWatches((prev) => [newWatch, ...prev]);
            setActiveWatchId(newWatch.id);
            setShowNewWatch(false);
          }}
        />
      )}
    </div>
  );
}

// ─── New Watch Modal ──────────────────────────────────────────────────────────

function NewWatchModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (w: { name: string; type: SignalType | 'all'; minScore: number }) => void;
}) {
  const { theme } = useTheme();
  const c = colors(theme);
  const isDark = theme === 'dark';

  const [name, setName] = useState('');
  const [type, setType] = useState<SignalType | 'all'>('all');
  const [minScore, setMinScore] = useState(60);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 11px',
    border: `1.5px solid ${c.border}`,
    borderRadius: 8,
    fontSize: 13,
    fontFamily: 'var(--font-inter), sans-serif',
    outline: 'none',
    background: c.bgPage,
    color: c.text,
    boxSizing: 'border-box',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(10,37,64,0.28)',
        backdropFilter: 'blur(3px)',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: c.bgCard,
          borderRadius: 16,
          width: 420,
          boxShadow: isDark ? '0 24px 64px rgba(0,0,0,0.5)' : '0 24px 64px rgba(10,37,64,0.2)',
          border: `1px solid ${c.border}`,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{ padding: '16px 20px', borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center' }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: c.accent,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                marginBottom: 3,
              }}
            >
              Signal Watch
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: c.text }}>Neue Watch erstellen</div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              border: `1px solid ${c.border}`,
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width={10}
              height={10}
              viewBox="0 0 16 16"
              fill="none"
              stroke={c.textSub}
              strokeWidth={2.5}
              strokeLinecap="round"
            >
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 10,
                fontWeight: 700,
                color: c.textSub,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 5,
              }}
            >
              Name der Watch
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='z.B. "DHL-Wechsler", "Hot Fundings"…'
              style={inputStyle}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 10,
                fontWeight: 700,
                color: c.textSub,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 8,
              }}
            >
              Signal-Typ
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {(['all', 'job', 'funding', 'expansion', 'churn', 'growth'] as const).map((t) => {
                const meta = t !== 'all' ? TYPE_META[t] : null;
                const active = type === t;
                return (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    style={{
                      padding: '8px 6px',
                      borderRadius: 8,
                      border: `1.5px solid ${active ? (meta?.color ?? c.accent) : c.border}`,
                      background: active
                        ? meta
                          ? isDark
                            ? `${meta.color}22`
                            : meta.bg
                          : isDark
                            ? `${c.accent}22`
                            : '#EEF0FF'
                        : 'transparent',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: 11,
                      fontWeight: 700,
                      color: active ? (meta?.color ?? c.accent) : c.textSub,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                    }}
                  >
                    {meta && <span style={{ color: meta.color }}>{TYPE_META[t as SignalType].icon}</span>}
                    {t === 'all' ? 'Alle' : meta!.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 10,
                fontWeight: 700,
                color: c.textSub,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 5,
              }}
            >
              Mindest-Score: <span style={{ color: c.accent }}>{minScore}</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              style={{ width: '100%', accentColor: c.accent, cursor: 'pointer' }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 10,
                color: c.textMuted,
                marginTop: 3,
              }}
            >
              <span>0 — Alle</span>
              <span>65 — Warm</span>
              <span>80 — Hot</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px',
                border: `1.5px solid ${c.border}`,
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                background: c.bgCard,
                color: c.textSub,
                fontFamily: 'inherit',
              }}
            >
              Abbrechen
            </button>
            <button
              onClick={() => {
                if (name.trim()) onSave({ name: name.trim(), type, minScore });
              }}
              disabled={!name.trim()}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 700,
                cursor: name.trim() ? 'pointer' : 'not-allowed',
                background: name.trim() ? c.accent : c.border,
                color: name.trim() ? '#fff' : c.textMuted,
                fontFamily: 'inherit',
              }}
            >
              Watch erstellen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
