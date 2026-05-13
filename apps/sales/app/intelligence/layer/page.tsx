'use client';

import { useState } from 'react';

const LAYERS = [
  {
    id: 1,
    label: 'Identifikation',
    sub: 'Firmenname, HRB, Adresse, Branche, Gründungsjahr',
    pct: 98,
    color: '#4F46E5',
    bg: '#EEF0FF',
    filled: 1221,
    missing: 26,
    fields: [
      'Firmenname',
      'Rechtsform',
      'HRB-Nummer',
      'Adresse',
      'Website',
      'Gründungsjahr',
      'Branche (NACE)',
      'Mitarbeiterzahl-Range',
    ],
  },
  {
    id: 2,
    label: 'Firmendaten',
    sub: 'Umsatz, Mitarbeiter verifiziert, Bonität, C-Level',
    pct: 67,
    color: '#0891B2',
    bg: '#ECFEFF',
    filled: 835,
    missing: 412,
    fields: [
      'Umsatz-Schätzung',
      'Mitarbeiterzahl verifiziert',
      'Bonität-Score',
      'Handelsregister-Status',
      'Geschäftsführer',
      'C-Level Kontakte',
      'Finanzielle Gesundheit',
    ],
  },
  {
    id: 3,
    label: 'Technologie',
    sub: 'Shop-System, Versandpartner, Fulfillment-Setup',
    pct: 41,
    color: '#7C3AED',
    bg: '#F5F3FF',
    filled: 511,
    missing: 736,
    fields: [
      'Shop-System',
      'Payment Provider',
      'Versanddienstleister',
      'Fulfillment-Setup',
      'Versand-Tools',
      'Paketvolumen-Schätzung',
    ],
  },
  {
    id: 4,
    label: 'Kaufsignale',
    sub: 'Jobposts, Funding, Wechselsignale, Reviews',
    pct: 18,
    color: '#DB2777',
    bg: '#FDF2F8',
    filled: 224,
    missing: 1023,
    fields: [
      'Jobposts Logistik/Versand',
      'Neue Lagerstandorte',
      'Funding/Akquise',
      'Management-Wechsel',
      'Negative Carrier-Reviews',
      'Traffic-Wachstum',
    ],
  },
];

const ENRICHMENT_QUEUE = [
  { name: 'BabyWorld Store', missing: [2, 3, 4], score: 68 },
  { name: 'KidsWorld Online', missing: [2, 3, 4], score: 44 },
  { name: 'Office24 GmbH', missing: [3, 4], score: 58 },
  { name: 'PetStore24', missing: [2, 4], score: 61 },
  { name: 'TechDirect GmbH', missing: [3], score: 79 },
  { name: 'SportGear Online', missing: [4], score: 85 },
];

export default function LayerPage() {
  const [activeLayer, setActiveLayer] = useState<number | null>(null);

  return (
    <div
      style={{
        minHeight: '100%',
        background: '#F7F8FC',
        fontFamily: 'var(--font-inter), sans-serif',
        color: '#0A2540',
      }}
    >
      {/* Hero header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #EEF0FF 0%, #F0F4FF 60%, #F7F8FC 100%)',
          borderBottom: '1px solid #E8ECF0',
          padding: '24px 32px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#fff',
              border: '1px solid #E0E3FF',
              color: '#4F46E5',
              borderRadius: 99,
              padding: '3px 10px',
              fontSize: 11,
              fontWeight: 700,
              marginBottom: 10,
              letterSpacing: '0.04em',
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4F46E5' }} />
            Leads & Daten
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 5px', color: '#0A2540', lineHeight: 1 }}>
            Firmendaten
          </h1>
          <p style={{ fontSize: 13, color: '#425466', margin: 0 }}>1.247 Leads · letzte Aktualisierung vor 12 Min.</p>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#fff',
            border: '1px solid #E8ECF0',
            borderRadius: 99,
            padding: '5px 12px',
            flexShrink: 0,
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#697386' }}>Sync vor 12 Min.</span>
        </div>
      </div>

      <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Layer Overview Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {LAYERS.map((layer) => (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(activeLayer === layer.id ? null : layer.id)}
              style={{
                background: activeLayer === layer.id ? layer.color : '#fff',
                border: activeLayer === layer.id ? 'none' : '1px solid #E8ECF0',
                borderRadius: 14,
                padding: '20px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: activeLayer === layer.id ? `0 8px 24px ${layer.color}40` : 'none',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: activeLayer === layer.id ? 'rgba(255,255,255,0.6)' : '#697386',
                  marginBottom: 8,
                }}
              >
                Layer {layer.id}
              </div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  color: activeLayer === layer.id ? '#fff' : layer.color,
                  lineHeight: 1,
                  marginBottom: 6,
                }}
              >
                {layer.pct}%
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: activeLayer === layer.id ? 'rgba(255,255,255,0.8)' : '#0A2540',
                  marginBottom: 10,
                }}
              >
                {layer.filled.toLocaleString('de-DE')} angereichert
              </div>
              <div
                style={{
                  height: 4,
                  background: activeLayer === layer.id ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
                  borderRadius: 99,
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${layer.pct}%`,
                    background: activeLayer === layer.id ? '#fff' : layer.color,
                    borderRadius: 99,
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: activeLayer === layer.id ? 'rgba(255,255,255,0.5)' : '#697386',
                  marginTop: 6,
                }}
              >
                {layer.missing} fehlen noch
              </div>
            </button>
          ))}
        </div>

        {/* Layer Detail */}
        {activeLayer &&
          (() => {
            const layer = LAYERS.find((l) => l.id === activeLayer)!;
            return (
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #E8ECF0',
                  borderRadius: 14,
                  padding: '24px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 32,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: layer.color,
                      marginBottom: 8,
                    }}
                  >
                    Layer {layer.id} — Detail
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>{layer.label}</h3>
                  <p style={{ fontSize: 13, color: '#425466', marginBottom: 20 }}>{layer.sub}</p>

                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#697386',
                      marginBottom: 10,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Datenfelder
                  </div>
                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    {layer.fields.map((f) => (
                      <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{ width: 6, height: 6, borderRadius: '50%', background: layer.color, flexShrink: 0 }}
                        />
                        <span style={{ fontSize: 13, color: '#425466' }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#697386',
                      marginBottom: 10,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Fortschritt
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: '#425466' }}>Angereichert</span>
                      <span style={{ fontWeight: 700 }}>{layer.filled.toLocaleString('de-DE')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: '#425466' }}>Fehlend</span>
                      <span style={{ fontWeight: 700, color: '#DC2626' }}>{layer.missing.toLocaleString('de-DE')}</span>
                    </div>
                    <div style={{ height: 8, background: '#F1F5F9', borderRadius: 99, marginTop: 4 }}>
                      <div
                        style={{ height: '100%', width: `${layer.pct}%`, background: layer.color, borderRadius: 99 }}
                      />
                    </div>
                  </div>

                  <button
                    style={{
                      marginTop: 20,
                      width: '100%',
                      padding: '11px',
                      background: layer.color,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 9,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {layer.missing} Leads jetzt anreichern
                  </button>
                </div>
              </div>
            );
          })()}

        {/* Enrichment Queue */}
        <div style={{ background: '#fff', border: '1px solid #E8ECF0', borderRadius: 14, padding: '22px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Ausstehende Daten</div>
              <div style={{ fontSize: 12, color: '#697386', marginTop: 2 }}>
                Leads mit fehlenden Layern, sortiert nach Score
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ENRICHMENT_QUEUE.map((item) => (
              <div
                key={item.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '12px 14px',
                  background: '#F7F8FC',
                  borderRadius: 10,
                  border: '1px solid #E8ECF0',
                }}
              >
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{item.name}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {item.missing.map((l) => {
                    const layer = LAYERS.find((lay) => lay.id === l)!;
                    return (
                      <span
                        key={l}
                        style={{
                          padding: '2px 8px',
                          background: layer.bg,
                          color: layer.color,
                          borderRadius: 5,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        L{l}
                      </span>
                    );
                  })}
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: item.score >= 80 ? '#DC2626' : item.score >= 65 ? '#D97706' : '#64748B',
                    minWidth: 32,
                    textAlign: 'right',
                  }}
                >
                  {item.score}
                </span>
                <button
                  style={{
                    padding: '6px 12px',
                    background: '#EEF0FF',
                    color: '#4F46E5',
                    border: 'none',
                    borderRadius: 7,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Anreichern
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
