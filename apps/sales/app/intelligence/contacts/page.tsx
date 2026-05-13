'use client';

import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ActivityType = 'email' | 'call' | 'meeting' | 'note' | 'deal' | 'intent';
type DealStage = 'erstkontakt' | 'gespraech' | 'termin' | 'angebot' | 'gewonnen' | 'verloren';
type IcpFit = 'hoch' | 'mittel' | 'niedrig';
type RightTab = 'signale' | 'personen' | 'notizen';

interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  detail?: string;
  date: string;
  user: string;
}
interface DealRef {
  id: string;
  title: string;
  stage: DealStage;
  value: string;
  probability: number;
}
interface PersonRef {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  email: string;
  phone: string;
}
interface Company {
  id: string;
  name: string;
  industry: string;
  city: string;
  address: string;
  website?: string;
  linkedin?: string;
  contactPerson: string;
  contactPersonId: string;
  stage: DealStage;
  lastTouch: string;
  score: number;
  employees: string;
  revenue: string;
  annualShipments?: string;
  initials: string;
  color: string;
  tags: string[];
  icpFit: IcpFit;
  intentSignals: number;
  layerCoverage: number[];
  openDealValue: string;
  deals: DealRef[];
  people: PersonRef[];
  activities: Activity[];
  aiStrategy?: string;
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const STAGE_META: Record<DealStage, { label: string; color: string; bg: string; border: string }> = {
  erstkontakt: { label: 'Erstkontakt', color: '#64748B', bg: '#F1F5F9', border: '#CBD5E1' },
  gespraech: { label: 'Im Gespräch', color: '#0891B2', bg: '#EFF6FF', border: '#BFDBFE' },
  termin: { label: 'Termin', color: '#4F46E5', bg: '#EEF2FF', border: '#C7D2FE' },
  angebot: { label: 'Angebot', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  gewonnen: { label: 'Gewonnen', color: '#059669', bg: '#F0FDF4', border: '#BBF7D0' },
  verloren: { label: 'Verloren', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
};

const ACT_META: Record<ActivityType, { label: string; color: string }> = {
  email: { label: 'E-Mail', color: '#4F46E5' },
  call: { label: 'Anruf', color: '#0891B2' },
  meeting: { label: 'Meeting', color: '#059669' },
  note: { label: 'Notiz', color: '#D97706' },
  deal: { label: 'Deal', color: '#7C3AED' },
  intent: { label: 'Signal', color: '#DC2626' },
};

const LAYER_META = [
  { id: 1, label: 'Grunddaten', color: '#0891B2' },
  { id: 2, label: 'Kontakt', color: '#4F46E5' },
  { id: 3, label: 'Verhalten', color: '#7C3AED' },
  { id: 4, label: 'Intent', color: '#DC2626' },
];

const STAGE_FILTERS = ['Alle', 'Erstkontakt', 'Im Gespräch', 'Termin', 'Angebot', 'Gewonnen', 'Verloren'];

// ─── Data ─────────────────────────────────────────────────────────────────────

const COMPANIES: Company[] = [
  {
    id: 'c1',
    name: 'Fashion House GmbH',
    industry: 'Mode & E-Commerce',
    city: 'München',
    address: 'Maximilianstr. 22, 80539 München',
    website: 'fashionhouse.de',
    linkedin: 'linkedin.com/company/fashion-house-gmbh',
    contactPerson: 'Maximilian Brauer',
    contactPersonId: 'p1',
    stage: 'termin',
    lastTouch: 'heute',
    score: 91,
    employees: '50–200',
    revenue: '5–20 Mio. €',
    annualShipments: '~18.000 / Jahr',
    initials: 'FH',
    color: '#4F46E5',
    tags: ['ICP Match', 'DHL-Wechselbereit'],
    icpFit: 'hoch',
    intentSignals: 4,
    layerCoverage: [1, 2, 3, 4],
    openDealValue: '€ 86.400',
    aiStrategy:
      'CFO-Termin 05.05. vorbereiten. Hauptargument: 34% weniger Retouren, Break-even nach 6 Wochen. Referenz auf DHL-Beschwerden ansprechen.',
    deals: [{ id: 'd1', title: 'Smart Parcel Basis', stage: 'termin', value: '€ 86.400', probability: 75 }],
    people: [
      {
        id: 'p1',
        name: 'Maximilian Brauer',
        role: 'Head of Logistics',
        initials: 'MB',
        color: '#4F46E5',
        email: 'm.brauer@fashionhouse.de',
        phone: '+49 89 123 456',
      },
    ],
    activities: [
      {
        id: 'a1',
        type: 'meeting',
        title: 'Demo-Call — 45 Min.',
        detail: 'Sehr positives Feedback. CFO-Termin am 05.05. vereinbart.',
        date: 'heute, 10:00',
        user: 'Sarah P.',
      },
      {
        id: 'a2',
        type: 'intent',
        title: 'Kaufsignal: DHL-Beschwerde',
        detail: '2 negative Kununu-Reviews: "Logistics Partner enttäuscht"',
        date: 'gestern',
        user: 'System',
      },
      {
        id: 'a3',
        type: 'email',
        title: 'Follow-up mit Angebotsunterlagen',
        detail: 'Angebotsunterlagen + Case Study Zalando Partner.',
        date: 'vor 2 Tagen',
        user: 'Sarah P.',
      },
      {
        id: 'a4',
        type: 'call',
        title: 'Qualifizierungsgespräch — 18 Min.',
        detail: '~1.500 Pakete/Monat. Entscheider: MB + CFO Thomas Huber.',
        date: 'vor 5 Tagen',
        user: 'Sarah P.',
      },
      {
        id: 'a5',
        type: 'deal',
        title: 'Deal erstellt: Smart Parcel Basis',
        detail: '€ 86.400 / Jahr · 75% Wahrscheinlichkeit',
        date: 'vor 5 Tagen',
        user: 'Sarah P.',
      },
      {
        id: 'a6',
        type: 'intent',
        title: 'Kaufsignal: Wachstumsfinanzierung',
        detail: '2,4 Mio. € Wachstumsfinanzierung laut Pressemitteilung.',
        date: 'vor 1 Woche',
        user: 'System',
      },
      { id: 'a7', type: 'email', title: 'Erstkontakt via LinkedIn', date: 'vor 2 Wochen', user: 'Sarah P.' },
    ],
  },
  {
    id: 'c2',
    name: 'SportGear Online',
    industry: 'Sport & Outdoor',
    city: 'Hamburg',
    address: 'Mönckebergstr. 7, 20095 Hamburg',
    website: 'sportgear-online.de',
    contactPerson: 'Sophie Richter',
    contactPersonId: 'p2',
    stage: 'gespraech',
    lastTouch: 'gestern',
    score: 85,
    employees: '20–50',
    revenue: '2–5 Mio. €',
    annualShipments: '~9.600 / Jahr',
    initials: 'SG',
    color: '#0891B2',
    tags: ['ICP Match', 'Wachstumsphase'],
    icpFit: 'hoch',
    intentSignals: 2,
    layerCoverage: [1, 2, 3],
    openDealValue: '€ 43.200',
    aiStrategy:
      'CEO Sophie Richter entscheidet allein. Hiring-Signal deutet auf Wachstum hin — jetzt ist der richtige Zeitpunkt. Starter-Paket mit Retouren-Feature in den Fokus stellen.',
    deals: [{ id: 'd2', title: 'Smart Parcel Starter', stage: 'gespraech', value: '€ 43.200', probability: 50 }],
    people: [
      {
        id: 'p2',
        name: 'Sophie Richter',
        role: 'CEO',
        initials: 'SR',
        color: '#0891B2',
        email: 's.richter@sportgear.de',
        phone: '+49 40 987 654',
      },
    ],
    activities: [
      {
        id: 'a1',
        type: 'email',
        title: 'Preisdetails gesendet',
        detail: 'Starter: € 3.600/Monat für 800 Pakete.',
        date: 'gestern',
        user: 'Sarah P.',
      },
      {
        id: 'a2',
        type: 'intent',
        title: 'Kaufsignal: Hiring-Signal',
        detail: '"Logistics Coordinator" auf LinkedIn ausgeschrieben.',
        date: 'vor 3 Tagen',
        user: 'System',
      },
      { id: 'a3', type: 'meeting', title: 'Erstgespräch — 30 Min.', date: 'vor 1 Woche', user: 'Sarah P.' },
    ],
  },
  {
    id: 'c3',
    name: 'LuxuryBags Store',
    industry: 'Luxus & Mode',
    city: 'Düsseldorf',
    address: 'Königsallee 56, 40212 Düsseldorf',
    website: 'luxurybags.de',
    contactPerson: 'Thomas Krüger',
    contactPersonId: 'p3',
    stage: 'angebot',
    lastTouch: 'vor 3 Tagen',
    score: 88,
    employees: '20–50',
    revenue: '2–5 Mio. €',
    annualShipments: '~14.400 / Jahr',
    initials: 'LB',
    color: '#7C3AED',
    tags: ['Premium-Segment'],
    icpFit: 'hoch',
    intentSignals: 1,
    layerCoverage: [1, 2, 3, 4],
    openDealValue: '€ 64.800',
    aiStrategy:
      'Angebot läuft seit 3 Tagen. COO Thomas Krüger nachfassen — kurze, direkte E-Mail. Angebot läuft Ende Mai ab, Dringlichkeit kommunizieren.',
    deals: [{ id: 'd3', title: 'Smart Parcel Premium', stage: 'angebot', value: '€ 64.800', probability: 60 }],
    people: [
      {
        id: 'p3',
        name: 'Thomas Krüger',
        role: 'COO',
        initials: 'TK',
        color: '#7C3AED',
        email: 't.krueger@luxurybags.de',
        phone: '+49 211 555 777',
      },
    ],
    activities: [
      {
        id: 'a1',
        type: 'email',
        title: 'Angebot versendet',
        detail: '1.200 Pakete/Monat · White-Label Tracking.',
        date: 'vor 3 Tagen',
        user: 'Sarah P.',
      },
      { id: 'a2', type: 'meeting', title: 'Produkt-Demo — 60 Min.', date: 'vor 1 Woche', user: 'Sarah P.' },
      { id: 'a3', type: 'call', title: 'Qualifizierung — 22 Min.', date: 'vor 2 Wochen', user: 'Sarah P.' },
    ],
  },
  {
    id: 'c4',
    name: 'GardenPlus GmbH',
    industry: 'Garten & Outdoor',
    city: 'Leipzig',
    address: 'Grimmaische Str. 10, 04109 Leipzig',
    contactPerson: 'Anna Hofmann',
    contactPersonId: 'p4',
    stage: 'gespraech',
    lastTouch: 'vor 5 Tagen',
    score: 81,
    employees: '10–20',
    revenue: '1–2 Mio. €',
    annualShipments: '~7.200 / Jahr',
    initials: 'GP',
    color: '#059669',
    tags: ['Same-Day Interesse'],
    icpFit: 'mittel',
    intentSignals: 1,
    layerCoverage: [1, 2],
    openDealValue: '€ 28.800',
    aiStrategy:
      'GF-Freigabe steht aus. Anna Hofmann hat Interesse bestätigt, braucht internes Buy-in. Kurze ROI-Zusammenfassung für den GF schicken.',
    deals: [{ id: 'd4', title: 'Same-Day Pilot Leipzig', stage: 'gespraech', value: '€ 28.800', probability: 40 }],
    people: [
      {
        id: 'p4',
        name: 'Anna Hofmann',
        role: 'E-Commerce Managerin',
        initials: 'AH',
        color: '#059669',
        email: 'a.hofmann@gardenplus.de',
        phone: '+49 341 222 333',
      },
    ],
    activities: [
      {
        id: 'a1',
        type: 'call',
        title: 'Telefonat — 15 Min.',
        detail: 'Same-Day Pilot besprochen. GF muss zustimmen.',
        date: 'vor 5 Tagen',
        user: 'Sarah P.',
      },
      { id: 'a2', type: 'email', title: 'Produktinfo Same-Day gesendet', date: 'vor 1 Woche', user: 'Sarah P.' },
    ],
  },
  {
    id: 'c5',
    name: 'BikeShop Nord',
    industry: 'Fahrrad & Sport',
    city: 'Bremen',
    address: 'Sögestr. 32, 28195 Bremen',
    contactPerson: 'Lukas Bauer',
    contactPersonId: 'p5',
    stage: 'gewonnen',
    lastTouch: 'vor 1 Woche',
    score: 76,
    employees: '20–50',
    revenue: '2–5 Mio. €',
    annualShipments: '~6.000 / Jahr',
    initials: 'BN',
    color: '#059669',
    tags: ['Onboarding'],
    icpFit: 'mittel',
    intentSignals: 0,
    layerCoverage: [1, 2, 3],
    openDealValue: '€ 21.600',
    deals: [{ id: 'd5', title: 'Smart Parcel Starter', stage: 'gewonnen', value: '€ 21.600', probability: 100 }],
    people: [
      {
        id: 'p5',
        name: 'Lukas Bauer',
        role: 'Geschäftsführer',
        initials: 'LB',
        color: '#059669',
        email: 'l.bauer@bikeshop-nord.de',
        phone: '+49 421 888 111',
      },
    ],
    activities: [
      {
        id: 'a1',
        type: 'deal',
        title: 'Deal gewonnen',
        detail: 'Onboarding 08.05.',
        date: 'vor 1 Woche',
        user: 'Sarah P.',
      },
      { id: 'a2', type: 'email', title: 'Vertrag unterzeichnet', date: 'vor 10 Tagen', user: 'Sarah P.' },
    ],
  },
  {
    id: 'c6',
    name: 'HomeStyle24',
    industry: 'Haushalt & Wohnen',
    city: 'Köln',
    address: 'Hohe Str. 12, 50667 Köln',
    contactPerson: 'Petra Schneider',
    contactPersonId: 'p6',
    stage: 'erstkontakt',
    lastTouch: 'vor 2 Wochen',
    score: 74,
    employees: '10–20',
    revenue: '1–2 Mio. €',
    annualShipments: '~4.800 / Jahr',
    initials: 'HS',
    color: '#D97706',
    tags: ['Pause Q2'],
    icpFit: 'mittel',
    intentSignals: 0,
    layerCoverage: [1],
    openDealValue: '—',
    deals: [],
    people: [
      {
        id: 'p6',
        name: 'Petra Schneider',
        role: 'Leiterin Operations',
        initials: 'PS',
        color: '#D97706',
        email: 'p.schneider@homestyle24.de',
        phone: '+49 221 444 555',
      },
    ],
    activities: [
      {
        id: 'a1',
        type: 'note',
        title: 'Pause bis Juli',
        detail: 'Budgetfreeze Q2. Wiedervorlage 01.07.2026.',
        date: 'vor 2 Wochen',
        user: 'Sarah P.',
      },
      { id: 'a2', type: 'call', title: 'Erstkontakt — 8 Min.', date: 'vor 3 Wochen', user: 'Sarah P.' },
    ],
  },
  {
    id: 'c7',
    name: 'TechDirect GmbH',
    industry: 'Elektronik',
    city: 'Berlin',
    address: 'Friedrichstr. 100, 10117 Berlin',
    contactPerson: 'Michael Wolff',
    contactPersonId: 'p7',
    stage: 'verloren',
    lastTouch: 'vor 2 Wochen',
    score: 79,
    employees: '10–20',
    revenue: '1–2 Mio. €',
    annualShipments: '~8.400 / Jahr',
    initials: 'TD',
    color: '#64748B',
    tags: ['Re-Engagement Okt. 26'],
    icpFit: 'hoch',
    intentSignals: 0,
    layerCoverage: [1, 2, 3],
    openDealValue: '—',
    deals: [],
    people: [
      {
        id: 'p7',
        name: 'Michael Wolff',
        role: 'Head of Supply Chain',
        initials: 'MW',
        color: '#64748B',
        email: 'm.wolff@techdirect.de',
        phone: '+49 30 666 999',
      },
    ],
    activities: [
      {
        id: 'a1',
        type: 'deal',
        title: 'Deal verloren — DHL Eigenentwicklung',
        detail: 'Re-Engagement in 6 Monaten.',
        date: 'vor 2 Wochen',
        user: 'Sarah P.',
      },
      { id: 'a2', type: 'meeting', title: 'Abschluss-Gespräch — 20 Min.', date: 'vor 2 Wochen', user: 'Sarah P.' },
    ],
  },
  {
    id: 'c8',
    name: 'BabyWorld Store',
    industry: 'Baby & Kinder',
    city: 'Stuttgart',
    address: 'Königstr. 24, 70173 Stuttgart',
    contactPerson: 'Julia Maier',
    contactPersonId: 'p8',
    stage: 'gespraech',
    lastTouch: 'vor 3 Wochen',
    score: 68,
    employees: '5–10',
    revenue: '< 1 Mio. €',
    annualShipments: '~3.600 / Jahr',
    initials: 'BW',
    color: '#DB2777',
    tags: ['Gesellschafter-OK offen'],
    icpFit: 'niedrig',
    intentSignals: 1,
    layerCoverage: [1, 2],
    openDealValue: '€ 14.400',
    deals: [{ id: 'd8', title: 'Smart Parcel Starter', stage: 'gespraech', value: '€ 14.400', probability: 30 }],
    people: [
      {
        id: 'p8',
        name: 'Julia Maier',
        role: 'Gründerin',
        initials: 'JM',
        color: '#DB2777',
        email: 'j.maier@babyworld.de',
        phone: '+49 711 777 888',
      },
    ],
    activities: [
      {
        id: 'a1',
        type: 'email',
        title: 'Nachfass gesendet',
        detail: 'Gesellschafter-OK ausstehend.',
        date: 'vor 3 Wochen',
        user: 'Sarah P.',
      },
      { id: 'a2', type: 'meeting', title: 'Demo — 25 Min.', date: 'vor 4 Wochen', user: 'Sarah P.' },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(s: number) {
  if (s >= 80) return '#DC2626';
  if (s >= 65) return '#D97706';
  return '#64748B';
}

// ─── CollapsibleSection ───────────────────────────────────────────────────────

function CollapsibleSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ borderBottom: '1px solid #E8ECF0' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font-inter), sans-serif',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#8896A5',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {title}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s' }}
        >
          <path d="M4 6l4 4 4-4" stroke="#8896A5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div style={{ padding: '0 16px 12px 16px' }}>{children}</div>}
    </div>
  );
}

// ─── ListView ─────────────────────────────────────────────────────────────────

function ListView({ onSelect }: { onSelect: (id: string) => void }) {
  const [stageFilter, setStageFilter] = useState('Alle');
  const [searchQuery, setSearchQuery] = useState('');
  const [showScoreFilter, setShowScoreFilter] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const filtered = COMPANIES.filter((c) => {
    if (stageFilter !== 'Alle' && STAGE_META[c.stage].label !== stageFilter) return false;
    if (
      searchQuery &&
      !c.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !c.industry.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  function exportCSV() {
    const header = 'Unternehmen,Branche,Score,Stage,Kaufsignale,Deal-Wert';
    const rows = filtered.map((c) =>
      [c.name, c.industry, c.score, STAGE_META[c.stage].label, c.intentSignals, c.openDealValue ?? '—'].join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kontakte-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const highScore = COMPANIES.filter((c) => c.score >= 80).length;
  const newSignals = COMPANIES.reduce((sum, c) => sum + c.intentSignals, 0);
  const avgScore = Math.round(COMPANIES.reduce((sum, c) => sum + c.score, 0) / COMPANIES.length);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Top bar */}
      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid #E8ECF0',
          padding: '0 24px',
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0A2540', lineHeight: 1 }}>Leads</div>
          <div style={{ fontSize: 11, color: '#8896A5', marginTop: 1 }}>
            {COMPANIES.length} qualifizierte Unternehmen
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={exportCSV}
            style={{
              padding: '6px 12px',
              border: '1px solid #E8ECF0',
              borderRadius: 4,
              background: '#fff',
              color: '#0A2540',
              fontSize: 12,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              cursor: 'pointer',
              fontFamily: 'var(--font-inter), sans-serif',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 11V1M3 6l5-5 5 5M2 13h12"
                stroke="#64748B"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Exportieren
          </button>
          <button
            onClick={() => {
              window.location.href = '/intelligence/import';
            }}
            style={{
              padding: '6px 14px',
              border: 'none',
              borderRadius: 4,
              background: '#4F46E5',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              cursor: 'pointer',
              fontFamily: 'var(--font-inter), sans-serif',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Lead hinzufügen
          </button>
        </div>
      </div>

      <div
        style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        {/* KPI Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {[
            { label: 'Erkannte Leads', value: String(COMPANIES.length), sub: '+12 diese Woche', subColor: '#059669' },
            {
              label: 'Hochqualifiziert',
              value: String(highScore),
              sub: 'Score ≥ 80',
              subColor: '#8896A5',
              valueColor: '#DC2626',
            },
            { label: 'Aktive Signale', value: String(newSignals), sub: 'Neue Kaufsignale', subColor: '#8896A5' },
            { label: 'Ø Lead-Score', value: String(avgScore), sub: 'Ø Markt: 45', subColor: '#8896A5' },
          ].map((kpi) => (
            <div
              key={kpi.label}
              style={{ background: '#fff', border: '1px solid #E8ECF0', borderRadius: 4, padding: '12px 14px' }}
            >
              <div style={{ fontSize: 11, color: '#8896A5', fontWeight: 500, marginBottom: 6 }}>{kpi.label}</div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: (kpi as { valueColor?: string }).valueColor ?? '#0A2540',
                  lineHeight: 1,
                }}
              >
                {kpi.value}
              </div>
              <div style={{ fontSize: 11, color: kpi.subColor, marginTop: 4 }}>{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* Filters + Search */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {STAGE_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setStageFilter(f)}
                style={{
                  padding: '5px 10px',
                  border: `1px solid ${stageFilter === f ? '#4F46E5' : '#E8ECF0'}`,
                  borderRadius: 4,
                  background: stageFilter === f ? '#EEF2FF' : '#fff',
                  color: stageFilter === f ? '#4F46E5' : '#0A2540',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-inter), sans-serif',
                }}
              >
                {f}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ position: 'relative' }}>
              <svg
                style={{
                  position: 'absolute',
                  left: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="none"
              >
                <circle cx="7" cy="7" r="5" stroke="#8896A5" strokeWidth="1.5" />
                <path d="M11 11l3 3" stroke="#8896A5" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '6px 10px 6px 26px',
                  border: '1px solid #E8ECF0',
                  borderRadius: 4,
                  width: 200,
                  outline: 'none',
                  color: '#0A2540',
                  background: '#fff',
                  fontSize: 12,
                  fontFamily: 'var(--font-inter), sans-serif',
                }}
              />
            </div>
            <button
              onClick={() => setShowScoreFilter((v) => !v)}
              style={{
                padding: '6px 12px',
                border: `1px solid ${showScoreFilter ? '#4F46E5' : '#E8ECF0'}`,
                borderRadius: 4,
                background: showScoreFilter ? '#EEF2FF' : '#fff',
                color: showScoreFilter ? '#4F46E5' : '#0A2540',
                fontSize: 12,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
                fontFamily: 'var(--font-inter), sans-serif',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 4h12M4 8h8M6 12h4"
                  stroke={showScoreFilter ? '#4F46E5' : '#64748B'}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Filter
            </button>
          </div>
        </div>

        {/* Score filter panel */}
        {showScoreFilter && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
            {[
              { label: 'Alle Scores', min: 0 },
              { label: 'Score ≥ 80', min: 80 },
              { label: 'Score ≥ 65', min: 65 },
              { label: 'Score < 65', min: -1 },
            ].map((opt) => (
              <button
                key={opt.label}
                onClick={() => {
                  if (opt.min === -1) setSearchQuery('__low__');
                  else setSearchQuery('');
                }}
                style={{
                  padding: '4px 10px',
                  border: '1px solid #E8ECF0',
                  borderRadius: 4,
                  background: '#fff',
                  color: '#425466',
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-inter), sans-serif',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Table */}
        <div style={{ background: '#fff', border: '1px solid #E8ECF0', borderRadius: 4, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F7F8FC', borderBottom: '1px solid #E8ECF0' }}>
                {['Unternehmen', 'Branche', 'Score', 'Stage', 'Signale', 'Letzte Aktivität', 'KI-Empfehlung', ''].map(
                  (h, i) => (
                    <th
                      key={i}
                      style={{
                        padding: '9px 12px',
                        textAlign: 'left',
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#8896A5',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const sm = STAGE_META[c.stage];
                const isHovered = hoveredRow === c.id;
                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: '1px solid #F0F2F5',
                      cursor: 'pointer',
                      background: isHovered ? '#F7F8FC' : '#fff',
                    }}
                    onMouseEnter={() => setHoveredRow(c.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => onSelect(c.id)}
                  >
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input type="checkbox" onClick={(e) => e.stopPropagation()} />
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            background: c.color,
                            borderRadius: 3,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 9,
                            fontWeight: 800,
                            color: '#fff',
                            flexShrink: 0,
                          }}
                        >
                          {c.initials}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#0A2540' }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: '#8896A5' }}>{c.city}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 11, color: '#64748B' }}>{c.industry}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: scoreColor(c.score) }}>
                      {c.score}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          padding: '2px 7px',
                          border: `1px solid ${sm.border}`,
                          borderRadius: 3,
                          background: sm.bg,
                          color: sm.color,
                          fontWeight: 500,
                        }}
                      >
                        {sm.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {c.intentSignals === 0 ? (
                        <span style={{ fontSize: 11, color: '#C4C9D4' }}>—</span>
                      ) : (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: c.intentSignals >= 3 ? '#DC2626' : c.intentSignals >= 2 ? '#D97706' : '#64748B',
                          }}
                        >
                          {c.intentSignals} Signal{c.intentSignals !== 1 ? 'e' : ''}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 11, color: '#64748B' }}>{c.lastTouch}</td>
                    <td style={{ padding: '10px 12px', fontSize: 11, color: '#64748B', maxWidth: 240 }}>
                      {c.aiStrategy ? (
                        <span
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            color: '#0A2540',
                          }}
                        >
                          {c.aiStrategy}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ visibility: isHovered ? 'visible' : 'hidden' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const row = `${c.name},${c.city},${c.industry},${c.score},${STAGE_META[c.stage].label},${c.openDealValue ?? '—'}`;
                            const csv = `Unternehmen,Stadt,Branche,Score,Stage,Deal-Wert\n${row}`;
                            const blob = new Blob([csv], { type: 'text/csv' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${c.name.replace(/\s+/g, '-')}-crm.csv`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          style={{
                            padding: '4px 10px',
                            border: '1px solid #4F46E5',
                            borderRadius: 3,
                            background: '#EEF2FF',
                            color: '#4F46E5',
                            fontSize: 11,
                            fontWeight: 500,
                            cursor: 'pointer',
                            fontFamily: 'var(--font-inter), sans-serif',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          In CRM exportieren
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── DetailView ───────────────────────────────────────────────────────────────

function DetailView({ companyId, onBack }: { companyId: string; onBack: () => void }) {
  const company = COMPANIES.find((c) => c.id === companyId) ?? COMPANIES[0];
  const [rightTab, setRightTab] = useState<RightTab>('signale');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    details: true,
    deals: false,
    personen: false,
  });
  const [noteText, setNoteText] = useState('');

  const sm = STAGE_META[company.stage];

  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const TABS: { key: RightTab; label: string }[] = [
    { key: 'signale', label: 'Signale & Verlauf' },
    { key: 'personen', label: 'Personen' },
    { key: 'notizen', label: 'Notizen' },
  ];

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* ── LEFT SIDEBAR ── */}
      <div
        style={{
          width: 280,
          flexShrink: 0,
          background: '#fff',
          borderRight: '1px solid #E8ECF0',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Back + Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #E8ECF0' }}>
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              color: '#8896A5',
              fontSize: 12,
              padding: '0 0 10px 0',
              cursor: 'pointer',
              fontFamily: 'var(--font-inter), sans-serif',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="#8896A5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Zurück zu Leads
          </button>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                background: company.color,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 800,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {company.initials}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0A2540', lineHeight: 1.2 }}>{company.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                <span
                  style={{
                    fontSize: 11,
                    padding: '1px 6px',
                    border: '1px solid #E8ECF0',
                    borderRadius: 3,
                    color: '#64748B',
                  }}
                >
                  {company.industry}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: scoreColor(company.score) }}>{company.score}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stage + Export */}
        <div
          style={{
            padding: '10px 16px',
            borderBottom: '1px solid #E8ECF0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: 11,
              padding: '2px 8px',
              border: `1px solid ${sm.border}`,
              borderRadius: 3,
              background: sm.bg,
              color: sm.color,
              fontWeight: 600,
            }}
          >
            {sm.label}
          </span>
          <button
            style={{
              padding: '5px 12px',
              border: 'none',
              borderRadius: 3,
              background: '#4F46E5',
              color: '#fff',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-inter), sans-serif',
            }}
          >
            In CRM exportieren
          </button>
        </div>

        {/* KI-Strategie */}
        {company.aiStrategy && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #E8ECF0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <div
                style={{
                  fontSize: 11,
                  color: '#8896A5',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                KI-Empfehlung
              </div>
              <span
                style={{
                  fontSize: 9,
                  padding: '1px 5px',
                  border: '1px solid #4F46E5',
                  borderRadius: 2,
                  color: '#4F46E5',
                  fontWeight: 600,
                }}
              >
                beta
              </span>
            </div>
            <div
              style={{
                background: '#F7F8FC',
                borderLeft: '3px solid #4F46E5',
                padding: '8px 10px',
                borderRadius: '0 3px 3px 0',
              }}
            >
              <div style={{ fontSize: 12, color: '#0A2540', lineHeight: 1.55 }}>{company.aiStrategy}</div>
            </div>
          </div>
        )}

        {/* Kaufsignale */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #E8ECF0' }}>
          <div
            style={{
              fontSize: 11,
              color: '#8896A5',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: 8,
            }}
          >
            Kaufsignale
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: company.intentSignals >= 3 ? '#DC2626' : company.intentSignals >= 1 ? '#D97706' : '#C4C9D4',
                lineHeight: 1,
              }}
            >
              {company.intentSignals}
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#0A2540', fontWeight: 500 }}>erkannte Signale</div>
              <div style={{ fontSize: 11, color: '#8896A5' }}>{company.annualShipments ?? '—'} Pakete/Jahr</div>
            </div>
          </div>
          {/* Layer coverage */}
          <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
            {LAYER_META.map((l) => {
              const active = company.layerCoverage.includes(l.id);
              return (
                <div
                  key={l.id}
                  title={l.label}
                  style={{ flex: 1, height: 4, borderRadius: 2, background: active ? l.color : '#E8ECF0' }}
                />
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
            {LAYER_META.map((l) => {
              const active = company.layerCoverage.includes(l.id);
              return (
                <div
                  key={l.id}
                  style={{ flex: 1, fontSize: 9, color: active ? l.color : '#C4C9D4', textAlign: 'center' }}
                >
                  {l.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Company Identity */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #E8ECF0' }}>
          <div
            style={{
              fontSize: 11,
              color: '#8896A5',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: 8,
            }}
          >
            Unternehmen
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {company.website && (
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 11, color: '#8896A5', width: 80, flexShrink: 0 }}>Website</span>
                <a href={`https://${company.website}`} style={{ fontSize: 11, color: '#4F46E5' }}>
                  {company.website}
                </a>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#8896A5', width: 80, flexShrink: 0 }}>Ort</span>
              <span style={{ fontSize: 11, color: '#0A2540' }}>{company.city}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#8896A5', width: 80, flexShrink: 0 }}>Mitarbeiter</span>
              <span style={{ fontSize: 11, color: '#0A2540' }}>{company.employees}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#8896A5', width: 80, flexShrink: 0 }}>Umsatz</span>
              <span style={{ fontSize: 11, color: '#0A2540' }}>{company.revenue}</span>
            </div>
          </div>
        </div>

        {/* Tags */}
        {company.tags.length > 0 && (
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #E8ECF0' }}>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {company.tags.map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: 10,
                    padding: '2px 6px',
                    border: '1px solid #E8ECF0',
                    borderRadius: 3,
                    color: '#64748B',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Details collapsible */}
        <CollapsibleSection title="Details" open={openSections.details} onToggle={() => toggleSection('details')}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#8896A5', width: 80, flexShrink: 0 }}>Adresse</span>
              <span style={{ fontSize: 11, color: '#0A2540' }}>{company.address}</span>
            </div>
            {company.annualShipments && (
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 11, color: '#8896A5', width: 80, flexShrink: 0 }}>Sendungen</span>
                <span style={{ fontSize: 11, color: '#0A2540' }}>{company.annualShipments}</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#8896A5', width: 80, flexShrink: 0 }}>ICP-Fit</span>
              <span style={{ fontSize: 11, color: '#0A2540', fontWeight: 500 }}>
                {company.icpFit === 'hoch' ? 'Hoch' : company.icpFit === 'mittel' ? 'Mittel' : 'Niedrig'}
              </span>
            </div>
          </div>
        </CollapsibleSection>

        {/* Deals collapsible */}
        {company.deals.length > 0 && (
          <CollapsibleSection title="Deals" open={openSections.deals} onToggle={() => toggleSection('deals')}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {company.deals.map((d) => (
                <div key={d.id} style={{ padding: '8px 10px', border: '1px solid #E8ECF0', borderRadius: 3 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#0A2540' }}>{d.title}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0A2540' }}>{d.value}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: STAGE_META[d.stage].color }}>{STAGE_META[d.stage].label}</span>
                    <span style={{ fontSize: 10, color: '#8896A5' }}>{d.probability}% Wahrsch.</span>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Personen collapsible */}
        <CollapsibleSection title="Personen" open={openSections.personen} onToggle={() => toggleSection('personen')}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {company.people.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 8px',
                  border: '1px solid #E8ECF0',
                  borderRadius: 3,
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    background: p.color,
                    borderRadius: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 9,
                    fontWeight: 700,
                    color: '#fff',
                    flexShrink: 0,
                  }}
                >
                  {p.initials}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#0A2540' }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: '#8896A5' }}>{p.role}</div>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      </div>
      {/* ── END SIDEBAR ── */}

      {/* ── RIGHT MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Company strip */}
        <div
          style={{
            background: '#fff',
            borderBottom: '1px solid #E8ECF0',
            padding: '0 20px',
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0A2540' }}>{company.name}</div>
            <span
              style={{
                fontSize: 11,
                padding: '2px 7px',
                border: `1px solid ${sm.border}`,
                borderRadius: 3,
                background: sm.bg,
                color: sm.color,
              }}
            >
              {sm.label}
            </span>
            {company.openDealValue !== '—' && (
              <span
                style={{
                  fontSize: 11,
                  padding: '2px 7px',
                  border: '1px solid #E8ECF0',
                  borderRadius: 3,
                  color: '#64748B',
                }}
              >
                {company.openDealValue}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              style={{
                padding: '5px 10px',
                border: '1px solid #E8ECF0',
                borderRadius: 4,
                background: '#fff',
                color: '#0A2540',
                fontSize: 11,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-inter), sans-serif',
              }}
            >
              Bearbeiten
            </button>
            <button
              style={{
                padding: '5px 14px',
                border: 'none',
                borderRadius: 4,
                background: '#4F46E5',
                color: '#fff',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-inter), sans-serif',
              }}
            >
              In CRM exportieren
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            background: '#fff',
            borderBottom: '1px solid #E8ECF0',
            padding: '0 20px',
            display: 'flex',
            gap: 0,
            flexShrink: 0,
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setRightTab(t.key)}
              style={{
                padding: '10px 14px',
                border: 'none',
                borderBottom: `2px solid ${rightTab === t.key ? '#4F46E5' : 'transparent'}`,
                background: 'none',
                fontSize: 12,
                fontWeight: rightTab === t.key ? 600 : 500,
                color: rightTab === t.key ? '#4F46E5' : '#8896A5',
                cursor: 'pointer',
                fontFamily: 'var(--font-inter), sans-serif',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {/* ── SIGNALE TAB ── */}
          {rightTab === 'signale' && (
            <div>
              {/* Signal count banner */}
              {company.intentSignals > 0 && (
                <div
                  style={{
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: 4,
                    padding: '10px 14px',
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <div style={{ width: 8, height: 8, background: '#DC2626', borderRadius: '50%', flexShrink: 0 }} />
                  <div style={{ fontSize: 12, color: '#0A2540' }}>
                    <strong style={{ color: '#DC2626' }}>{company.intentSignals} aktive Intent-Signale</strong> erkannt
                    — Lead kaufbereit
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div style={{ position: 'relative', paddingLeft: 16, borderLeft: '2px solid #E8ECF0' }}>
                {company.activities.map((a) => {
                  const meta = ACT_META[a.type];
                  return (
                    <div key={a.id} style={{ position: 'relative', paddingBottom: 18, paddingLeft: 16 }}>
                      <div
                        style={{
                          position: 'absolute',
                          left: -9,
                          top: 3,
                          width: 14,
                          height: 14,
                          background: '#fff',
                          border: `2px solid ${meta.color}`,
                          borderRadius: 2,
                        }}
                      />
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                        <span
                          style={{
                            fontSize: 10,
                            padding: '1px 5px',
                            border: `1px solid ${meta.color}`,
                            borderRadius: 2,
                            color: meta.color,
                            fontWeight: 600,
                            flexShrink: 0,
                          }}
                        >
                          {meta.label}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#0A2540' }}>{a.title}</span>
                      </div>
                      {a.detail && (
                        <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.5, marginBottom: 2 }}>
                          {a.detail}
                        </div>
                      )}
                      <div style={{ fontSize: 10, color: '#8896A5' }}>
                        {a.date} · {a.user}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── PERSONEN TAB ── */}
          {rightTab === 'personen' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {company.people.map((p) => (
                <div
                  key={p.id}
                  style={{ background: '#fff', border: '1px solid #E8ECF0', borderRadius: 4, padding: '14px 16px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        background: p.color,
                        borderRadius: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#fff',
                        flexShrink: 0,
                      }}
                    >
                      {p.initials}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0A2540' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#8896A5' }}>{p.role}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ fontSize: 11, color: '#8896A5', width: 60, flexShrink: 0 }}>E-Mail</span>
                      <span style={{ fontSize: 11, color: '#0A2540' }}>{p.email}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ fontSize: 11, color: '#8896A5', width: 60, flexShrink: 0 }}>Telefon</span>
                      <span style={{ fontSize: 11, color: '#0A2540' }}>{p.phone}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── NOTIZEN TAB ── */}
          {rightTab === 'notizen' && (
            <div>
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #E8ECF0',
                  borderRadius: 4,
                  overflow: 'hidden',
                  marginBottom: 16,
                }}
              >
                <div style={{ padding: '8px 12px', borderBottom: '1px solid #E8ECF0', display: 'flex', gap: 4 }}>
                  {['B', 'I', 'U'].map((f) => (
                    <button
                      key={f}
                      style={{
                        padding: '2px 7px',
                        border: '1px solid #E8ECF0',
                        borderRadius: 3,
                        background: '#fff',
                        fontSize: 12,
                        fontWeight: f === 'B' ? 700 : 400,
                        fontStyle: f === 'I' ? 'italic' : 'normal',
                        textDecoration: f === 'U' ? 'underline' : 'none',
                        color: '#0A2540',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-inter), sans-serif',
                      }}
                    >
                      {f}
                    </button>
                  ))}
                  <div style={{ width: 1, height: 16, background: '#E8ECF0', margin: '4px' }} />
                  <button
                    style={{
                      padding: '2px 8px',
                      border: '1px solid #E8ECF0',
                      borderRadius: 3,
                      background: '#fff',
                      fontSize: 11,
                      color: '#64748B',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-inter), sans-serif',
                    }}
                  >
                    @Erwähnen
                  </button>
                </div>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Notiz hinzufügen..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: 'none',
                    outline: 'none',
                    fontSize: 12,
                    color: '#0A2540',
                    resize: 'none',
                    minHeight: 80,
                    fontFamily: 'var(--font-inter), sans-serif',
                    background: '#fff',
                  }}
                />
                <div
                  style={{
                    padding: '8px 12px',
                    borderTop: '1px solid #E8ECF0',
                    display: 'flex',
                    justifyContent: 'flex-end',
                  }}
                >
                  <button
                    style={{
                      padding: '5px 14px',
                      border: 'none',
                      borderRadius: 3,
                      background: '#4F46E5',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-inter), sans-serif',
                    }}
                  >
                    Speichern
                  </button>
                </div>
              </div>

              {/* Example pinned note from activities */}
              {company.activities
                .filter((a) => a.type === 'note')
                .map((n) => (
                  <div
                    key={n.id}
                    style={{
                      background: '#FFFBEB',
                      border: '1px solid #FDE68A',
                      borderRadius: 4,
                      padding: '12px 14px',
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: '#D97706',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Notiz
                      </span>
                      <span style={{ fontSize: 10, color: '#8896A5', marginLeft: 'auto' }}>
                        {n.user} · {n.date}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#0A2540', lineHeight: 1.5 }}>{n.detail ?? n.title}</div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
      {/* ── END RIGHT MAIN ── */}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContactsPage() {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function handleSelect(id: string) {
    setSelectedId(id);
    setView('detail');
  }

  return (
    <div
      style={{
        height: '100%',
        overflow: 'hidden',
        background: '#F7F8FC',
        fontFamily: 'var(--font-inter), sans-serif',
      }}
    >
      {view === 'list' && <ListView onSelect={handleSelect} />}
      {view === 'detail' && selectedId && <DetailView companyId={selectedId} onBack={() => setView('list')} />}
    </div>
  );
}
