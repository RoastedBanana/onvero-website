'use client';

type Status = 'active' | 'evaluating' | 'planned';

interface Source {
  name: string;
  layer: number;
  status: Status;
  leads: number;
  coverage: number;
  cost: string;
  costRaw: number;
  lastSync: string;
  description: string;
  website: string;
}

const SOURCES: Source[] = [
  {
    name: 'Unternehmensregister',
    layer: 1,
    status: 'active',
    leads: 1247,
    coverage: 98,
    cost: '200 €/Mo',
    costRaw: 200,
    lastSync: 'vor 12 Min.',
    description: 'Stammdaten, Kontakte, Branche, Website. Basis für alle Leads.',
    website: '',
  },
  {
    name: 'DACH-Firmendaten',
    layer: 2,
    status: 'active',
    leads: 835,
    coverage: 67,
    cost: '180 €/Mo',
    costRaw: 180,
    lastSync: 'vor 28 Min.',
    description: '2,5 Mio. deutsche Unternehmen aus Handelsregister. Umsatz, Mitarbeiter, Bonität, C-Level.',
    website: '',
  },
  {
    name: 'Boniforce',
    layer: 2,
    status: 'evaluating',
    leads: 0,
    coverage: 0,
    cost: '~5 €/Lead',
    costRaw: 0,
    lastSync: '—',
    description: 'Echtzeit-Bonitätsprüfung, API-first. Alternative zu Creditreform. Nur für qualifizierte Leads.',
    website: 'boniforce.de',
  },
  {
    name: 'Storeleads',
    layer: 3,
    status: 'planned',
    leads: 0,
    coverage: 0,
    cost: '125 $/Mo',
    costRaw: 0,
    lastSync: '—',
    description: 'E-Commerce-spezialisierte Datenbank. Shop-System, Traffic, Produktkategorien, Technologie-Stack.',
    website: 'storeleads.app',
  },
  {
    name: 'Wappalyzer',
    layer: 3,
    status: 'evaluating',
    leads: 0,
    coverage: 0,
    cost: '~50 €/Mo',
    costRaw: 0,
    lastSync: '—',
    description: 'Technologie-Erkennung für Websites. Shop-System, Payment Provider, Analytics-Tools.',
    website: 'wappalyzer.com',
  },
  {
    name: 'Jobboard-Feeds',
    layer: 4,
    status: 'planned',
    leads: 0,
    coverage: 0,
    cost: 'Kostenlos',
    costRaw: 0,
    lastSync: '—',
    description:
      'Indeed, StepStone, LinkedIn Jobs. Automatisch gescannte Stellenausschreibungen für Logistik & Versand.',
    website: 'indeed.de',
  },
  {
    name: 'Crunchbase',
    layer: 4,
    status: 'planned',
    leads: 0,
    coverage: 0,
    cost: '~40 €/Mo',
    costRaw: 0,
    lastSync: '—',
    description: 'Funding-Daten, Akquisitionen, Investoren. Trigger: Neue Finanzierungsrunden im DACH-Raum.',
    website: 'crunchbase.com',
  },
  {
    name: 'Trustpilot API',
    layer: 4,
    status: 'evaluating',
    leads: 0,
    coverage: 0,
    cost: '~80 €/Mo',
    costRaw: 0,
    lastSync: '—',
    description: 'Review-Monitoring für aktuelle Versandpartner. Negative Reviews = Wechselbereitschaft.',
    website: 'trustpilot.com',
  },
];

const STATUS_META: Record<Status, { label: string; color: string; bg: string }> = {
  active: { label: 'Aktiv', color: '#059669', bg: '#ECFDF5' },
  evaluating: { label: 'In Prüfung', color: '#D97706', bg: '#FFFBEB' },
  planned: { label: 'Geplant', color: '#64748B', bg: '#F1F5F9' },
};

const LAYER_META: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'Identifikation', color: '#4F46E5', bg: '#EEF0FF' },
  2: { label: 'Firmendaten', color: '#0891B2', bg: '#ECFEFF' },
  3: { label: 'Technologie', color: '#7C3AED', bg: '#F5F3FF' },
  4: { label: 'Kaufsignale', color: '#DB2777', bg: '#FDF2F8' },
};

const totalActiveCost = SOURCES.filter((s) => s.status === 'active').reduce((sum, s) => sum + s.costRaw, 0);

export default function SourcesPage() {
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
            Datenquellen
          </h1>
          <p style={{ fontSize: 13, color: '#425466', margin: 0 }}>
            {SOURCES.filter((s) => s.status === 'active').length} aktiv · {totalActiveCost} €/Monat
          </p>
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
        {/* Cost overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[
            { label: 'Laufende Kosten', value: `${totalActiveCost} €/Mo`, sub: 'Phase 1', color: '#0A2540' },
            {
              label: 'Aktive Quellen',
              value: SOURCES.filter((s) => s.status === 'active').length.toString(),
              sub: 'von ' + SOURCES.length + ' gesamt',
              color: '#059669',
            },
            { label: 'Leads angereichert', value: '835', sub: 'Mit Firmendaten', color: '#4F46E5' },
          ].map((card) => (
            <div
              key={card.label}
              style={{ background: '#fff', border: '1px solid #E8ECF0', borderRadius: 12, padding: '18px 20px' }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#697386',
                  marginBottom: 6,
                }}
              >
                {card.label}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.value}</div>
              <div style={{ fontSize: 12, color: '#697386', marginTop: 4 }}>{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Sources by layer */}
        {[1, 2, 3, 4].map((layerNum) => {
          const layerSources = SOURCES.filter((s) => s.layer === layerNum);
          const lm = LAYER_META[layerNum];
          return (
            <div key={layerNum}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span
                  style={{
                    padding: '3px 10px',
                    background: lm.bg,
                    color: lm.color,
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {lm.label}
                </span>
                <div style={{ flex: 1, height: 1, background: '#E8ECF0' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
                {layerSources.map((src) => {
                  const sm = STATUS_META[src.status];
                  return (
                    <div
                      key={src.name}
                      style={{
                        background: '#fff',
                        border: '1px solid #E8ECF0',
                        borderRadius: 14,
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        opacity: src.status === 'planned' ? 0.75 : 1,
                      }}
                    >
                      {/* Header */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#0A2540', marginBottom: 2 }}>
                            {src.name}
                          </div>
                          <div style={{ fontSize: 11, color: '#697386' }}>{src.website}</div>
                        </div>
                        <span
                          style={{
                            padding: '3px 9px',
                            background: sm.bg,
                            color: sm.color,
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {sm.label}
                        </span>
                      </div>

                      {/* Description */}
                      <p style={{ fontSize: 13, color: '#425466', lineHeight: 1.5, margin: 0 }}>{src.description}</p>

                      {/* Stats */}
                      <div style={{ display: 'flex', gap: 16, paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
                        <div>
                          <div style={{ fontSize: 11, color: '#697386', marginBottom: 2 }}>Kosten</div>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{src.cost}</div>
                        </div>
                        {src.status === 'active' && (
                          <>
                            <div>
                              <div style={{ fontSize: 11, color: '#697386', marginBottom: 2 }}>Coverage</div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: lm.color }}>{src.coverage}%</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: '#697386', marginBottom: 2 }}>Leads</div>
                              <div style={{ fontSize: 13, fontWeight: 700 }}>{src.leads.toLocaleString('de-DE')}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: '#697386', marginBottom: 2 }}>Sync</div>
                              <div style={{ fontSize: 13, fontWeight: 700 }}>{src.lastSync}</div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Coverage bar (active only) */}
                      {src.status === 'active' && (
                        <div>
                          <div style={{ height: 4, background: '#F1F5F9', borderRadius: 99 }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${src.coverage}%`,
                                background: lm.color,
                                borderRadius: 99,
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Action */}
                      <button
                        style={{
                          padding: '8px',
                          border: 'none',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          background: src.status === 'active' ? '#F7F8FC' : lm.bg,
                          color: src.status === 'active' ? '#425466' : lm.color,
                        }}
                      >
                        {src.status === 'active'
                          ? 'Konfigurieren'
                          : src.status === 'evaluating'
                            ? 'Testen'
                            : 'Einrichten'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
