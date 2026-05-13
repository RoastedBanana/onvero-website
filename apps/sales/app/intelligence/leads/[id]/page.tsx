'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useLayoutEffect, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpIcon } from 'lucide-react';
import { useTheme, colors } from '../../layout';
import { GlassPageFilters } from '@/components/ui/liquid-glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { TypingEffect } from '@/components/ui/typing-effect';

// ─── Types ────────────────────────────────────────────────────────────────────

type LeadStatus = 'hot' | 'warm' | 'cold';
type ActiveTab = 'info' | 'outbound' | 'bot';

interface Contact {
  name: string;
  role: string;
  linkedin?: string;
  email?: string;
  phone?: string;
  source: 'linkedin' | 'openregister' | 'salesnavigator' | 'manual' | 'website';
}

interface ReviewEntry {
  score: number;
  platform: string;
  count?: number;
}

interface LeadDetail {
  id: string;
  name: string;
  city: string;
  industry: string;
  initials: string;
  color: string;
  score: number;
  scoreReason: string;
  fit: number;
  volume: number;
  timing: number;
  status: LeadStatus;
  // Firmographics
  founded?: string;
  employees?: string;
  employeeTrend?: 'up' | 'down' | 'stable';
  employeeHistory?: string;
  revenue?: string;
  website?: string;
  shopSystem?: string;
  phone?: string;
  facebook?: string;
  instagramFollowers?: number;
  facebookFollowers?: number;
  instagramPosts?: number;
  companyType?: string[];
  branchCode?: string;
  branchDescription?: string;
  representative?: string;
  // Growth / Health
  greenflags: string[];
  redflags: string[];
  financials?: string;
  lastCEOChange?: string;
  // Reviews — new array format takes priority over legacy individual fields
  reviews?: ReviewEntry[];
  trustpilot?: number;
  google?: number;
  kununu?: number;
  openMentions?: number;
  // Updates
  lastPosted?: string;
  updatesList: { text: string; time: string; source: string }[];
  aiUpdateSummary?: string;
  // Operations (AI Layer 2)
  coreServices?: string[];
  targetCustomers?: string[];
  usp?: string[];
  partners?: string[];
  openPositions?: string[];
  personalizationHooks?: string[];
  customFields?: { key: string; value: string }[];
  // Shipping estimate
  shippingEstimate?: {
    disclaimer: string;
    lines: { label: string; value: string; note?: string }[];
    total: string;
    assessment: string;
    assessmentLevel: 'low' | 'medium' | 'high';
  };
  // Outbound
  contacts: Contact[];
  toneOfVoice?: string;
  companyCharacter?: string;
  pitch: string;
  proposedOffer?: string;
  enriched: { source: string; status: 'active' | 'partial' | 'missing' }[];
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const LEADS: Record<string, LeadDetail> = {
  demo: {
    id: 'demo',
    name: 'Velora Commerce Group GmbH',
    city: 'Berlin',
    industry: 'Premium Lifestyle & Fashion',
    initials: 'VC',
    color: '#10B981',
    score: 97,
    scoreReason:
      'Frisches Series-B-Funding (12 Mio. €), neuer COO seit 6 Wochen, aktive Carrier-Frustration auf Trustpilot und ein offenes Head-of-Logistics-Posting — perfektes Timing-Fenster für Erstansprache.',
    fit: 96,
    volume: 94,
    timing: 98,
    status: 'hot',
    founded: '2017',
    employees: '148',
    employeeTrend: 'up',
    employeeHistory: '+41% in 18 Monaten (89 → 148)',
    revenue: '24,6 Mio. €',
    website: 'velora.de',
    shopSystem: 'Shopify Plus (Headless)',
    phone: '+49 30 2020 8800',
    facebook: 'veloracommerce',
    companyType: ['d2c', 'b2c', 'b2b'],
    branchCode: '47.71 / 47.91',
    branchDescription: 'Premium-Fashion, Lifestyle & Online-Einzelhandel',
    representative: 'Julian Kraft (CEO)',
    greenflags: [
      'Series B: 12 Mio. € — geschlossen vor 6 Wochen',
      'Umsatz +58% YoY — stärkstes Quartal in Firmengeschichte',
      'Mitarbeiterwachstum +41% in 18 Monaten',
      'Neuer COO (ex-Zalando) seit 6 Wochen an Bord',
      'Head of Logistics + 2× Fulfillment-Stellen ausgeschrieben',
      'Eigenmarke "Velora Essentials" lanciert — sofort ausverkauft',
      'Trustpilot 4.7★ bei 1.240 Bewertungen',
      'Expansion nach Österreich & Schweiz geplant (Q2)',
    ],
    redflags: [
      '4 negative DHL-Bewertungen letzte 10 Tage (Lieferverzögerungen)',
      'Carrier-SLA-Probleme erwähnt in CEO-LinkedIn-Post',
    ],
    financials:
      'Starker Cashflow nach Series B. EBITDA-Marge ~11%. Umsatz Q3 24,6 Mio. — Q4-Prognose 31 Mio. Keine öffentlichen Verbindlichkeiten. Investoren: HV Capital, Vorwerk Ventures.',
    lastCEOChange: 'COO neu besetzt: Markus Reiter (ex-Zalando Head of Ops) — Oktober 2024',
    trustpilot: 4.7,
    google: 4.5,
    kununu: 4.3,
    openMentions: 31,
    lastPosted: 'vor 18 Stunden',
    updatesList: [
      {
        text: 'CEO Julian Kraft: "Unser DHL-SLA erfüllt unsere Anforderungen nicht mehr" — LinkedIn-Post',
        time: 'vor 18 Std.',
        source: 'LinkedIn',
      },
      {
        text: '4 neue negative Carrier-Bewertungen (Lieferverzögerung, beschädigte Pakete)',
        time: 'vor 3 Tagen',
        source: 'Trustpilot',
      },
      {
        text: 'Head of Logistics (Senior) ausgeschrieben — Gehaltsrahmen 95–115k',
        time: 'vor 5 Tagen',
        source: 'LinkedIn Jobs',
      },
      {
        text: 'Series B Closing: 12 Mio. € — HV Capital & Vorwerk Ventures',
        time: 'vor 6 Wochen',
        source: 'Handelsregister',
      },
      { text: 'Neue COO-Position besetzt: Markus Reiter (ex-Zalando)', time: 'vor 6 Wochen', source: 'LinkedIn' },
      {
        text: 'Eigenmarke "Velora Essentials" Launch — ausverkauft in 48h',
        time: 'vor 2 Monaten',
        source: 'Pressemitteilung',
      },
    ],
    aiUpdateSummary:
      'Maximale Wechselbereitschaft: CEO postet öffentlich über Carrier-Frustration, während gleichzeitig ein neuer COO (ex-Zalando, Ops-Hintergrund) Entscheidungsgewalt aufbaut. Series B + Head-of-Logistics-Suche = aktiver Evaluationsmodus. Jetzt kontaktieren.',
    coreServices: [
      'D2C Online-Shop (Shopify Plus Headless)',
      'Eigenmarke "Velora Essentials"',
      'B2B-Wholesale (Boutiquen, Hotellerie)',
      'Abo-Modell "Velora Club" (12k aktive Abos)',
    ],
    targetCustomers: [
      'Fashion-affine Millennials & Gen Z (25–40)',
      'Premium-Boutiquen DACH (B2B)',
      'Hotel & Hospitality (Lifestyle-Sortiment)',
    ],
    usp: [
      'Headless Commerce — schnellste Ladezeiten im Segment',
      'Eigenmarke mit 68% Bruttomarge',
      'Abo-Modell für planbare Recurring Revenue',
      'Nachhaltigkeits-Zertifizierung (Bluesign, GOTS)',
    ],
    partners: [
      'Shopify Plus',
      'Klarna',
      'Adyen',
      'Salesforce CRM',
      'Meta Ads',
      'Trusted Shops',
      'DHL (aktuell, kritisch)',
    ],
    customFields: [
      { key: 'Deal-Potential', value: '38.000–52.000 €/Jahr' },
      { key: 'CRM-Status', value: 'Noch nicht kontaktiert' },
      { key: 'Zuständiger SDR', value: 'Noch nicht zugewiesen' },
      { key: 'Nächster Schritt', value: 'LinkedIn-DM an Julian Kraft' },
      { key: 'Idealer Termin', value: 'KW 48 — vor Weihnachts-Peak' },
    ],
    contacts: [
      {
        name: 'Julian Kraft',
        role: 'CEO & Co-Gründer',
        linkedin: 'linkedin.com/in/julian-kraft-velora',
        email: 'j.kraft@velora.de',
        source: 'linkedin',
      },
      {
        name: 'Markus Reiter',
        role: 'COO (neu, ex-Zalando)',
        linkedin: 'linkedin.com/in/markus-reiter-ops',
        source: 'salesnavigator',
      },
      {
        name: 'Sara Lindqvist',
        role: 'Head of E-Commerce',
        linkedin: 'linkedin.com/in/sara-lindqvist',
        email: 's.lindqvist@velora.de',
        source: 'linkedin',
      },
      {
        name: 'Thomas Brauer',
        role: 'VP Operations',
        email: 't.brauer@velora.de',
        source: 'openregister',
      },
      {
        name: 'Lena Vogel',
        role: 'Head of Marketing',
        linkedin: 'linkedin.com/in/lena-vogel-mktg',
        source: 'salesnavigator',
      },
    ],
    companyCharacter:
      'Ambitioniert, schnell, datengetrieben. Positioniert sich als "Technologie-Company mit Fashion-Produkt". CEO kommuniziert offen über Skalierungsprobleme — ungewöhnlich ehrlich für die Branche. Neue COO-Besetzung zeigt: Operations werden jetzt ernst genommen.',
    toneOfVoice:
      'Direkt, zahlenbasiert, zukunftsorientiert. Kein Bullshit. Julian Kraft postet zu Skalierung, Fulfillment-Problemen und Wachstumsstrategien. Ansprache über konkrete KPIs, Einspar-Potenziale und Referenzkunden aus Fashion/Lifestyle empfohlen. Keine generischen Pitch-Mails.',
    pitch:
      'Velora wächst schneller als ihr aktueller Carrier mithalten kann — und Julian Kraft sagt das öffentlich. Neuer COO mit Zalando-Background, offene Logistics-Stellen und Series-B-Funding schaffen genau das Zeitfenster, in dem Carrier-Entscheidungen fallen. Jetzt mit konkretem SLA-Vergleich und Fashion-Referenzkunden rein.',
    proposedOffer:
      'Carrier-Wechsel-Paket: SLA-Garantie für Peak-Season (Weihnachten), Einspar-Audit auf Basis aktualer Sendungsvolumen, 3 Fashion-Referenzkunden als Proof. Pilot: Q4 mit 15% des Volumens — kein Lock-in.',
    enriched: [
      { source: 'Apollo', status: 'active' },
      { source: 'Hunter', status: 'active' },
      { source: 'Dropcontact', status: 'active' },
    ],
  },
  '7de8adb9-9de3-418e-8ad9-716861faf386': {
    id: '7de8adb9-9de3-418e-8ad9-716861faf386',
    name: 'ARO-tec GmbH',
    city: 'Bielefeld',
    industry: 'CNC-Werkzeugmaschinen & Automation',
    initials: 'AT',
    color: '#4F46E5',
    score: 68,
    scoreReason:
      'Mitarbeiterverdopplung 5→10 (2024), Eigenkapital-Erholung 0→351k€ und neues 1.000m²-Showroom-Gebäude zeigen klares Wachstum gegen den Branchentrend. Open House Sept. 2026 und Kitamura-Partnerschaft als konkrete Signale. Einstiegsvolumen noch aufzubauen — mittelfristiges Potenzial.',
    fit: 58,
    volume: 65,
    timing: 78,
    status: 'warm',
    founded: '2000',
    employees: '10',
    employeeTrend: 'up',
    employeeHistory: '+100% in 12 Monaten (5 → 10)',
    website: 'aro-tec.org',
    phone: '+49 521 305205-10',
    instagramFollowers: 1112,
    facebookFollowers: 224,
    instagramPosts: 252,
    companyType: ['B2B', 'Handel', 'Service'],
    branchCode: '46.64 / 33.12',
    branchDescription: 'Werkzeugmaschinen-Handel & CNC-Reparatur',
    representative: 'Sebastian Lebioda · Petrus Ogur',
    greenflags: [
      'Mitarbeiter verdoppelt: 5 (2023) → 10 (2024)',
      'Eigenkapital-Erholung: 0 → 351k EUR',
      'Umzug in neues 1.000m² Showroom-Gebäude (Okt. 2025)',
      '25-jähriges Jubiläum — Grand Opening 10. Okt. 2025',
      'Kitamura neu ins Portfolio aufgenommen (2026)',
      'Regelmäßige Maschinenauslieferungen März–Mai 2026',
      'Unternehmer-Club OWL — 50+ Teilnehmer',
      'Open House Event Sept. 2026 angekündigt',
    ],
    redflags: [
      'Bilanzsumme rückläufig: 3,4M€ (2019) → 1,4M€ (2024)',
      'Eigenkapital 2022–23 auf 0 gefallen',
      'Kununu-Score: 2,8/5 — interne Herausforderungen',
      'Kern-Geschäft außerhalb SPS-Zielmarkt (kein Logistik-Fokus)',
    ],
    financials:
      'Bilanzsumme 2024: 1,43 Mio. €. Eigenkapital: 351k€ (Quote 25%) — Erholung nach Tiefpunkt 2022/23 (0€). Stammkapital: 25.200€. Verbindlichkeiten: 1,04 Mio. €. Cash: 130k€. HRB 41819 Bielefeld.',
    lastCEOChange: 'Petrus Ogur als 2. GF eingetragen: 23.03.2023 (zuvor Roland Lebioda, 2004–2023)',
    reviews: [
      { score: 5.0, platform: 'Trustami', count: 4 },
      { score: 4.8, platform: 'ProvenExpert', count: 4 },
      { score: 2.8, platform: 'Kununu', count: 1 },
    ],
    openMentions: 2,
    lastPosted: 'vor 2 Tagen',
    updatesList: [
      {
        text: 'Neue Maschinenauslieferung dokumentiert — Hyundai WIA an Kunden übergeben',
        time: 'vor 2 Tagen',
        source: 'Instagram',
      },
      {
        text: 'WB Werkstatt + Betrieb (02/2026): "Zum ARO-tec-Geburtstag ein neues Gebäude"',
        time: 'vor 2 Wochen',
        source: 'Fachpresse',
      },
      {
        text: 'Open House September 2026 angekündigt',
        time: 'vor 3 Wochen',
        source: 'Instagram',
      },
      {
        text: 'Westfalen-Blatt: "Bielefelder Unternehmen trotzt der Branchen-Krise" — Umzug nach Ummeln',
        time: '01.10.2025',
        source: 'Tagespresse',
      },
      {
        text: 'Grand Opening & Open House — 10. Oktober 2025, 25-jähriges Jubiläum',
        time: '10.10.2025',
        source: 'Website',
      },
      {
        text: 'Petrus Ogur als zweiter Geschäftsführer ins Handelsregister eingetragen',
        time: '23.03.2023',
        source: 'Handelsregister',
      },
    ],
    aiUpdateSummary:
      'Starkes Comeback nach kritischer Phase 2022/23: Mitarbeiterverdopplung, Eigenkapital-Erholung und Investition in neues Showroom-Gebäude. Zwei Fachpresse-Artikel in 12 Monaten. Kitamura-Partnerschaft und Open House Sept. 2026 als klare Wachstumssignale.',
    coreServices: [
      'CNC-Werkzeugmaschinen (Hyundai WIA, Kitamura, Priminer)',
      'Service & Wartung (inkl. ehem. Haas-Maschinen)',
      'Automation & Robotik (Hanwha Robotics)',
      'CNC-Fertigung & Turnkey-Lösungen',
      'CAD/CAM-Programmierung & Schulungen',
      'Gebrauchtmaschinen & Ersatzteile',
      'Finanzierungskonzepte',
    ],
    targetCustomers: [
      'Mittelständische Fertigungsunternehmen (Schwerpunkt NRW)',
      'Automotive-Zulieferer & Metallverarbeitung',
      'Lohnfertiger & Maschinenbauer',
      'Betriebe mit Fachkräftemangel (Automation-Fokus)',
    ],
    usp: [
      '360°-Partner: Vertrieb, Service & Automation aus einer Hand',
      '1.000m² Live-Showroom in Bielefeld',
      '3.000+ installierte Maschinen — 25 Jahre Erfahrung',
      'Service auch für Fremdmaschinen (Haas, andere)',
    ],
    partners: ['Hyundai WIA', 'Kitamura', 'Priminer', 'Hanwha Robotics', 'AR Filtrazioni', 'SmartBee'],
    openPositions: [
      'Servicetechniker (m/w/d) CNC-Werkzeugmaschinen',
      'Auszubildende (m/w/d) im Groß- und Außenhandel',
      'Verkäufer (m/w/d) CNC-Werkzeugmaschinen',
      'Junior Verkäufer (m/w/d) CNC-Werkzeugmaschinen',
    ],
    personalizationHooks: [
      'Unternehmer-Club OWL → Community-Denken als Gesprächseinstieg',
      '25-jähriges Jubiläum als Erfolgsgeschichte ansprechen',
      'Open House Sept. 2026 → Timing für Erstansprache nutzen',
      'Kitamura-Aufnahme → Portfolioerweiterung anerkennen',
      'Westfalen-Blatt-Artikel → "Gesehen, dass Sie gegen den Trend wachsen…"',
    ],
    customFields: [
      { key: 'HRB', value: '41819 Bielefeld' },
      { key: 'Stammkapital', value: '25.200 €' },
      { key: 'Eigenkapitalquote', value: '25% (2024)' },
      { key: 'Bilanzsumme', value: '1.426.750 € (2024)' },
      { key: 'WZ-Codes', value: '46.64 / 33.12 / 33.20 / 85.59' },
      { key: 'Nächster Schritt', value: 'Open House Sept. 2026 als Timing nutzen' },
    ],
    contacts: [
      {
        name: 'Sebastian Lebioda',
        role: 'Geschäftsführer · Vertrieb NRW',
        email: 'sl@aro-tec.org',
        source: 'openregister',
      },
      {
        name: 'Petrus Ogur',
        role: 'Geschäftsführer · Niedersachsen & Hessen',
        email: 'po@aro-tec.org',
        source: 'openregister',
      },
      {
        name: 'Andreas Gronau',
        role: 'Technischer Vertrieb / Anwendungstechniker',
        email: 'ag@aro-tec.org',
        source: 'website',
      },
      {
        name: 'Issa Gorges',
        role: 'Service Manager',
        email: 'ig@aro-tec.org',
        source: 'website',
      },
      {
        name: 'Kristina Stabenow',
        role: 'Marketing',
        source: 'website',
      },
      {
        name: 'Harald Prumbach',
        role: 'Vertrieb Rheinland',
        source: 'website',
      },
      {
        name: 'Torsten Lösekann',
        role: 'Vertrieb Priminer',
        source: 'website',
      },
    ],
    toneOfVoice:
      'Direkt, persönlich, nahbar. Duzen auf Social Media, Siezen auf der Website. Starker Fokus auf Vertrauen und Partnerschaft. Emotionale Ankerpunkte: Teamgeist, Kundennähe, Begeisterung für Maschinenprojekte.',
    companyCharacter:
      'Klassischer Mittelstand mit Rückgrat: Hat die COVID-Krise ohne externe Investoren überstanden und kommt stärker zurück. "Bei uns sprechen Sie mit Menschen." Die Fachpresse nimmt das Comeback wahr.',
    pitch:
      'ARO-tec wächst gegen den Branchentrend — Mitarbeiterverdopplung, neues Gebäude und zwei Fachpresse-Artikel in 12 Monaten. Die vier offenen Stellen zeigen: Sie bauen aktiv auf. Das Open House im September 2026 ist der ideale Erstkontakt-Anlass.',
    proposedOffer:
      'Erstansprache über das Unternehmer-Club-Netzwerk oder direkt zum Open House Sept. 2026. Gesprächsthema: Wie nutzt ARO-tec digitale Tools für Showroom-Lead-Generierung und Verkäufer-Onboarding?',
    shippingEstimate: {
      disclaimer:
        'Kein direktes Datenmaterial zum Versandvolumen gefunden. Schätzung basiert auf Unternehmensgegenstand (Openregister), Website-Inhalten, Instagram-Aktivität und Branchennormen für B2B-Maschinenhändler vergleichbarer Größe.',
      lines: [
        {
          label: 'Ersatzteile & Zubehör',
          value: '25–50 Pakete/Monat',
          note: 'Abgeleitet aus Serviceumfang (Haas, Hyundai WIA, Priminer) und 10 Servicetechnikern',
        },
        {
          label: 'Werkzeuge & Verbrauchsmaterial',
          value: '10–20 Pakete/Monat',
          note: 'Laut Website: Werkzeugauslegung & Spannmittel als eigenständiges Leistungsfeld',
        },
        {
          label: 'Vorab-Sendungen an Techniker',
          value: '5–15 Pakete/Monat',
          note: 'Servicetechniker legen lt. Website die 20-fache Erde-Mond-Distanz zurück — Teile werden vorab versandt',
        },
        {
          label: 'Maschinenlieferungen (Spedition)',
          value: '6–12 Transporte/Monat',
          note: 'CNC-Maschinen gehen per Schwerlast-Spedition, nicht als Standardpaket — kein SPS-relevantes Volumen',
        },
      ],
      total: 'ca. 40–85 Standardpakete/Monat (geschätzt)',
      assessment:
        'Das geschätzte Volumen liegt deutlich unter dem typischen SPS-Einstiegsschwellwert von ~200 Paketen/Monat. ARO-tec ist ein B2B-Servicebetrieb, kein Versandhändler. Wachstumspotenzial entsteht, wenn das Ersatzteil- und Zubehörgeschäft weiter skaliert — mit 10 Mitarbeitern (2024, verdoppelt) und aktivem Portfolioausbau ist das mittelfristig denkbar.',
      assessmentLevel: 'low',
    },
    enriched: [
      { source: 'Openregister', status: 'active' },
      { source: 'Instagram', status: 'active' },
      { source: 'Facebook', status: 'active' },
      { source: 'Website', status: 'active' },
      { source: 'Fachpresse', status: 'active' },
    ],
  },
  '1': {
    id: '1',
    name: 'Fashion House GmbH',
    city: 'München',
    industry: 'Mode & Bekleidung',
    initials: 'FH',
    color: '#7C3AED',
    score: 91,
    scoreReason:
      'Aktive Carrier-Probleme und Social-Commerce-Wachstum bilden ein klares Wechselsignal. Entscheider ist erreichbar.',
    fit: 89,
    volume: 94,
    timing: 87,
    status: 'hot',
    founded: '2016',
    employees: '38',
    employeeTrend: 'stable',
    revenue: '5,2 Mio. €',
    website: 'fashionhouse.de',
    shopSystem: 'Shopware 6',
    phone: '+49 89 1234 5678',
    companyType: ['b2c'],
    branchCode: '47.71',
    branchDescription: 'Einzelhandel mit Bekleidung',
    representative: 'Sophie Maier',
    greenflags: ['Social-Commerce 120k Instagram', 'Neue Kollektion lanciert', 'Carrier-Wechselbereitschaft erkennbar'],
    redflags: ['Hohe Retourenquote ~28%', '3 negative DHL-Reviews in 48h'],
    financials: 'Stabile Marge trotz hoher Retouren. Investitionen in Social-Ads skalieren.',
    lastCEOChange: 'Seit Gründung (Sophie Maier, 2016)',
    trustpilot: 3.8,
    google: 4.1,
    openMentions: 7,
    lastPosted: 'vor 1 Tag',
    updatesList: [
      { text: '3 negative Carrier-Reviews in 48h', time: 'vor 2 Tagen', source: 'Trustpilot' },
      { text: 'Neue Kollektion lanciert', time: 'vor 1 Woche', source: 'Instagram' },
    ],
    aiUpdateSummary:
      'Carrier-Frustration ist auf dem Höhepunkt — drei negative Reviews in 48 Stunden ist ein starkes Signal. Die neue Kollektion erhöht den Sendungsvolumen-Druck.',
    coreServices: ['Online-Shop (Shopware 6)', 'Social Commerce (Instagram/TikTok)'],
    targetCustomers: ['Frauen 20–35 Jahre', 'Fashion-affine Urban-Zielgruppe'],
    usp: ['Trend-zu-Markt in 4 Wochen', 'Eigendesign', 'Influencer-Kollaborationen'],
    partners: ['DHL (aktuell)', 'Meta Ads', 'Klarna'],
    customFields: [{ key: 'Deal-Potential', value: '12.000 €/Jahr' }],
    contacts: [
      {
        name: 'Sophie Maier',
        role: 'CEO',
        linkedin: 'linkedin.com/in/sophie-maier',
        email: 's.maier@fashionhouse.de',
        source: 'linkedin',
      },
      {
        name: 'Tom Richter',
        role: 'Head of Logistics',
        linkedin: 'linkedin.com/in/tom-richter',
        source: 'salesnavigator',
      },
    ],
    toneOfVoice:
      'Kreativ, trendbewusst, visuell. Ansprache über Markenimage und Kundenerlebnis. CEO ist aktiv auf Social Media.',
    companyCharacter: 'Schnell, trend-getrieben, wachstumsorientiert. Marke steht über Operations.',
    pitch:
      'Fashion House leidet unter schlechten Carrier-Bewertungen — das ist ein klares Wechselsignal. Jetzt ansprechen mit konkretem SLA-Vergleich und Retouren-Optimierungsansatz.',
    proposedOffer: 'Carrier-Wechsel-Paket mit garantiertem SLA + Retouren-Prozess-Audit.',
    enriched: [
      { source: 'Apollo', status: 'active' },
      { source: 'Hunter', status: 'partial' },
      { source: 'Dropcontact', status: 'missing' },
    ],
  },
};

function getFallback(id: string): LeadDetail {
  return {
    id,
    name: `Lead ${id.slice(0, 8)}`,
    city: 'Deutschland',
    industry: 'Unbekannt',
    initials: 'LD',
    color: '#94A3B8',
    score: 65,
    scoreReason: 'Noch keine KI-Analyse verfügbar.',
    fit: 60,
    volume: 65,
    timing: 70,
    status: 'warm',
    greenflags: [],
    redflags: [],
    updatesList: [],
    contacts: [],
    pitch: 'Keine Information verfügbar.',
    enriched: [
      { source: 'Apollo', status: 'missing' },
      { source: 'Hunter', status: 'missing' },
      { source: 'Dropcontact', status: 'missing' },
    ],
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function glassCard(isDark: boolean): React.CSSProperties {
  const b = isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.7)';
  return {
    background: isDark ? 'rgba(10,12,24,0.46)' : 'rgba(255,255,255,0.22)',
    backdropFilter: 'blur(22px)',
    WebkitBackdropFilter: 'blur(22px)',
    borderTop: b,
    borderRight: b,
    borderBottom: b,
    borderLeft: b,
    boxShadow: isDark
      ? '0 4px 24px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06)'
      : '0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
  };
}

function scoreColor(s: number) {
  return s >= 85 ? '#10B981' : s >= 70 ? '#F97316' : '#EF4444';
}

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const col = scoreColor(score);
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth={7} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={col}
        strokeWidth={7}
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - score / 100)}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill={col}
        fontSize={14}
        fontWeight={800}
        fontFamily="Inter,sans-serif"
      >
        {score}
      </text>
    </svg>
  );
}

function SectionBlock({
  title,
  badge,
  badgeColor,
  accent,
  children,
  isDark,
  c,
}: {
  title: string;
  badge?: string | number;
  badgeColor?: string;
  accent?: string;
  children: React.ReactNode;
  isDark: boolean;
  c: ReturnType<typeof colors>;
}) {
  const bc = badgeColor ?? '#10B981';
  return (
    <div
      style={{
        ...glassCard(isDark),
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
        ...(accent ? { borderTop: `2px solid ${accent}` } : {}),
      }}
    >
      <div
        style={{
          padding: '9px 14px',
          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: c.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {title}
        </span>
        {badge !== undefined && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: bc,
              background: bc + '18',
              padding: '1px 8px',
              borderRadius: 99,
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <div style={{ padding: '12px 14px' }}>{children}</div>
    </div>
  );
}

function DataRow({
  label,
  value,
  tag,
  trend,
  c,
  isDark,
}: {
  label: string;
  value?: string;
  tag?: string;
  trend?: 'up' | 'down' | 'stable';
  c: ReturnType<typeof colors>;
  isDark: boolean;
}) {
  const trendColor = trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#94A3B8';
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 0',
        borderBottom: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)',
      }}
    >
      <span style={{ fontSize: 12, color: c.textMuted, flexShrink: 0, marginRight: 10 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {trend && (
          <span style={{ fontSize: 11, color: trendColor, fontWeight: 700 }}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        )}
        {tag && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#10B981',
              background: 'rgba(16,185,129,0.15)',
              padding: '1px 6px',
              borderRadius: 4,
            }}
          >
            {tag}
          </span>
        )}
        <span style={{ fontSize: 12, fontWeight: 600, color: value ? c.text : c.textMuted, textAlign: 'right' }}>
          {value || '—'}
        </span>
      </div>
    </div>
  );
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

const QUICK_PROMPTS = ['Besten Pitch zeigen', 'Wettbewerber analysieren', 'Was übersehe ich?', 'Wann kontaktieren?'];
const BOT_RESPONSES: Record<string, string> = {
  pitch:
    'Basierend auf den Signalen: Spreche die aktuellen Carrier-Probleme direkt an und biete einen konkreten SLA-Vergleich mit 3 Referenzkunden aus der gleichen Branche.',
  wettbewerb:
    'Die Hauptwettbewerber sind DHL, GLS und DPD. Der Lead hat zuletzt negative Bewertungen für DHL erhalten — das ist dein Einstieg.',
  übersehe:
    'Das Unternehmen ist gerade intern in Umstrukturierung. Die neue Operations-Stelle deutet auf eine Professionalisierung des Fulfillments hin — guter Zeitpunkt.',
  zeitpunkt:
    'Optimaler Zeitpunkt: Diese Woche. Das Funding ist frisch, die Logistics-Stelle noch offen — der Entscheider ist im Evaluationsmodus.',
  fallback:
    'Basierend auf Score, Signalen und Firmendaten: Ein Erstkontakt per LinkedIn mit personalisierten Signal-Referenzen hat die höchste Erfolgswahrscheinlichkeit.',
};
function getBotReply(text: string) {
  const l = text.toLowerCase();
  if (l.includes('pitch')) return BOT_RESPONSES.pitch;
  if (l.includes('wettbewerb') || l.includes('konkurrenz')) return BOT_RESPONSES.wettbewerb;
  if (l.includes('übersehe') || l.includes('vergessen')) return BOT_RESPONSES.übersehe;
  if (l.includes('zeitpunkt') || l.includes('wann') || l.includes('kontakt')) return BOT_RESPONSES.zeitpunkt;
  return BOT_RESPONSES.fallback;
}

type ChatMsg = { id: string; role: 'user' | 'bot'; text: string; loading?: boolean };

function ChatTypingDots({ c }: { c: ReturnType<typeof colors> }) {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '12px 16px' }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          style={{ width: 6, height: 6, borderRadius: '50%', background: c.textMuted, display: 'block' }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.85, 1.1, 0.85] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function ChatTab({ lead, c, isDark }: { lead: LeadDetail; c: ReturnType<typeof colors>; isDark: boolean }) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '24px';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [input, adjustHeight]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [msgs]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || busy) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = '24px';
    const userMsg: ChatMsg = { id: `${Date.now()}_u`, role: 'user', text: msg };
    const loadMsg: ChatMsg = { id: `${Date.now()}_l`, role: 'bot', text: '', loading: true };
    setMsgs((p) => [...p, userMsg, loadMsg]);
    setBusy(true);
    await new Promise((r) => setTimeout(r, 1200));
    setMsgs((p) => [...p.filter((m) => !m.loading), { id: `${Date.now()}_r`, role: 'bot', text: getBotReply(msg) }]);
    setBusy(false);
  }

  const hasMessages = msgs.length > 0;

  const inputCard: React.CSSProperties = {
    background: isDark ? 'rgba(10,12,24,0.46)' : 'rgba(255,255,255,0.54)',
    backdropFilter: 'blur(22px)',
    WebkitBackdropFilter: 'blur(22px)',
    borderRadius: 24,
    border: focused
      ? `1px solid ${c.accent}60`
      : isDark
        ? '1px solid rgba(255,255,255,0.10)'
        : '1px solid rgba(255,255,255,0.72)',
    boxShadow: focused
      ? `0 0 0 3px ${c.accent}18, ${isDark ? 'inset 1px 1px 2px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.32)' : 'inset 3px 3px 4px rgba(255,255,255,0.65), 0 4px 24px rgba(0,0,0,0.07)'}`
      : isDark
        ? 'inset 1px 1px 2px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.32)'
        : 'inset 3px 3px 4px rgba(255,255,255,0.65), 0 4px 24px rgba(0,0,0,0.07)',
    transition: 'border-color 180ms ease-out, box-shadow 180ms ease-out',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Message area */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '0 0 8px', minHeight: 0 }}>
        <AnimatePresence>
          {!hasMessages && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 320,
                padding: '40px 32px',
                textAlign: 'center',
              }}
            >
              <div style={{ marginBottom: 10 }}>
                <TypingEffect
                  texts={QUICK_PROMPTS}
                  typingSpeed={60}
                  rotationInterval={2200}
                  className="font-inter"
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: c.text,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                    fontFamily: 'var(--font-inter), Inter, sans-serif',
                  }}
                />
              </div>
              <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 28, maxWidth: 340 }}>
                Stell mir eine Frage zu {lead.name} — ich analysiere Daten, Signale und Potenzial.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 440 }}>
                {QUICK_PROMPTS.map((p, i) => (
                  <motion.div
                    key={p}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.07 }}
                  >
                    <GlassButton
                      size="sm"
                      isDark={isDark}
                      onClick={() => send(p)}
                      style={{ fontSize: 12, fontWeight: 600, color: c.text, fontFamily: 'inherit' }}
                    >
                      {p}
                    </GlassButton>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {hasMessages && (
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <AnimatePresence initial={false}>
              {msgs.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  {m.loading ? (
                    <div
                      style={{
                        background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.52)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.65)',
                        borderRadius: '16px 16px 16px 4px',
                        boxShadow: isDark
                          ? 'inset 1px 1px 2px rgba(255,255,255,0.06)'
                          : 'inset 2px 2px 3px rgba(255,255,255,0.55)',
                      }}
                    >
                      <ChatTypingDots c={c} />
                    </div>
                  ) : (
                    <div
                      style={{
                        maxWidth: '80%',
                        padding: '11px 16px',
                        borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        fontSize: 14,
                        lineHeight: 1.55,
                        fontWeight: m.role === 'user' ? 600 : 400,
                        ...(m.role === 'user'
                          ? {
                              background: isDark ? 'rgba(99,102,241,0.28)' : 'rgba(79,70,229,0.13)',
                              border: isDark ? '1px solid rgba(124,58,237,0.45)' : '1px solid rgba(79,70,229,0.28)',
                              boxShadow: isDark
                                ? 'inset 1px 1px 2px rgba(124,58,237,0.18)'
                                : 'inset 2px 2px 3px rgba(255,255,255,0.45)',
                              color: isDark ? '#c4b5fd' : '#3730a3',
                            }
                          : {
                              background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.52)',
                              border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.65)',
                              boxShadow: isDark
                                ? 'inset 1px 1px 2px rgba(255,255,255,0.06)'
                                : 'inset 2px 2px 3px rgba(255,255,255,0.55)',
                              color: c.text,
                            }),
                      }}
                    >
                      {m.text}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Input area */}
      <div style={{ padding: '10px 20px 20px', flexShrink: 0 }}>
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <div style={inputCard}>
            <div style={{ padding: '10px 16px 4px', position: 'relative' }}>
              {!input && !focused && (
                <div
                  style={{
                    position: 'absolute',
                    top: 10,
                    left: 16,
                    right: 16,
                    pointerEvents: 'none',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <TypingEffect
                    texts={QUICK_PROMPTS}
                    typingSpeed={55}
                    rotationInterval={2400}
                    style={{
                      fontSize: 15,
                      color: c.textMuted,
                      fontFamily: 'inherit',
                      lineHeight: 1.55,
                    }}
                  />
                </div>
              )}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontSize: 15,
                  color: c.text,
                  fontFamily: 'inherit',
                  lineHeight: 1.55,
                  height: 24,
                  minHeight: 24,
                  maxHeight: 140,
                  overflow: 'hidden',
                  boxSizing: 'border-box',
                  caretColor: c.accent,
                }}
              />
            </div>
            <div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '6px 12px 12px' }}
            >
              <GlassButton
                size="sm"
                isDark={isDark}
                onClick={() => send()}
                disabled={!input.trim() || busy}
                contentClassName="flex items-center gap-1.5"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  background: input.trim() && !busy ? c.accent : undefined,
                  color: input.trim() && !busy ? '#fff' : c.textMuted,
                }}
              >
                <ArrowUpIcon size={13} />
                <span>Senden</span>
              </GlassButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Info Tab ─────────────────────────────────────────────────────────────────

function InfoTab({ lead, c, isDark }: { lead: LeadDetail; c: ReturnType<typeof colors>; isDark: boolean }) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div
      style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}
    >
      {/* LEFT COLUMN */}
      <div>
        {/* Firmographics */}
        <SectionBlock title="Firmographics" accent="#10B981" isDark={isDark} c={c}>
          <DataRow label="Name" value={lead.name} c={c} isDark={isDark} />
          <DataRow label="Gründung" value={lead.founded} c={c} isDark={isDark} />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 0',
              borderBottom: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)',
            }}
          >
            <span style={{ fontSize: 12, color: c.textMuted }}>Mitarbeiter</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {lead.employeeTrend === 'up' && (
                <button
                  onClick={() => setShowHistory((s) => !s)}
                  style={{
                    fontSize: 11,
                    color: '#10B981',
                    fontWeight: 700,
                    background: 'rgba(16,185,129,0.12)',
                    border: 'none',
                    borderRadius: 4,
                    padding: '1px 6px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  ↑ {showHistory && lead.employeeHistory ? lead.employeeHistory : 'trend'}
                </button>
              )}
              <span style={{ fontSize: 12, fontWeight: 600, color: c.text }}>{lead.employees || '—'}</span>
            </div>
          </div>
          <DataRow label="Jahresumsatz" value={lead.revenue} c={c} isDark={isDark} />
          <DataRow label="Vertreter" value={lead.representative} c={c} isDark={isDark} />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 0',
              borderBottom: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)',
            }}
          >
            <span style={{ fontSize: 12, color: c.textMuted }}>Unternehmenstyp</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {(lead.companyType ?? []).map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#F97316',
                    background: 'rgba(249,115,22,0.14)',
                    padding: '2px 6px',
                    borderRadius: 4,
                    textTransform: 'uppercase',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              padding: '6px 0',
              borderBottom: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)',
            }}
          >
            <span style={{ fontSize: 12, color: c.textMuted }}>Branche</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: c.text }}>{lead.branchDescription || '—'}</div>
              {lead.branchCode && (
                <div style={{ fontSize: 10, color: c.textMuted, marginTop: 2 }}>Code {lead.branchCode}</div>
              )}
            </div>
          </div>
          <DataRow label="Telefon" value={lead.phone} c={c} isDark={isDark} />
          <DataRow label="Website" value={lead.website} c={c} isDark={isDark} />
          {lead.shopSystem && <DataRow label="Shop-System" value={lead.shopSystem} c={c} isDark={isDark} />}
          {lead.instagramFollowers !== undefined && (
            <DataRow
              label="Instagram"
              value={`${lead.instagramFollowers.toLocaleString('de-DE')} Follower · ${lead.instagramPosts ?? 0} Posts`}
              c={c}
              isDark={isDark}
            />
          )}
          {lead.facebookFollowers !== undefined && (
            <DataRow
              label="Facebook"
              value={`${lead.facebookFollowers.toLocaleString('de-DE')} Follower`}
              c={c}
              isDark={isDark}
            />
          )}
        </SectionBlock>

        {/* Growth / Health */}
        <SectionBlock title="Growth / Health" accent="#F97316" isDark={isDark} c={c}>
          {lead.greenflags.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: '#10B981',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  marginBottom: 6,
                }}
              >
                Greenflags
              </div>
              {lead.greenflags.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: c.text, padding: '3px 0' }}>
                  <span style={{ color: '#10B981', fontWeight: 700, flexShrink: 0 }}>+</span> {f}
                </div>
              ))}
            </div>
          )}
          {lead.redflags.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: '#EF4444',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  marginBottom: 6,
                }}
              >
                Redflags
              </div>
              {lead.redflags.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: c.text, padding: '3px 0' }}>
                  <span style={{ color: '#EF4444', fontWeight: 700, flexShrink: 0 }}>−</span> {f}
                </div>
              ))}
            </div>
          )}
          {lead.financials && (
            <div
              style={{
                padding: '8px 10px',
                background: isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.06)',
                borderRadius: 8,
                fontSize: 12,
                color: c.text,
                lineHeight: 1.5,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: '#10B981',
                  display: 'block',
                  marginBottom: 3,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                }}
              >
                Financials
              </span>
              {lead.financials}
            </div>
          )}
          {lead.lastCEOChange && (
            <div style={{ fontSize: 12, color: c.textMuted, padding: '4px 0' }}>
              <span style={{ fontWeight: 700, color: c.text }}>Letzter GF-Wechsel: </span>
              {lead.lastCEOChange}
            </div>
          )}
        </SectionBlock>

        {/* Updates */}
        <SectionBlock title="Updates" badge={lead.updatesList.length} badgeColor="#F97316" isDark={isDark} c={c}>
          {lead.aiUpdateSummary && (
            <div
              style={{
                padding: '8px 10px',
                background: isDark ? 'rgba(79,70,229,0.12)' : 'rgba(79,70,229,0.07)',
                border: isDark ? '1px solid rgba(79,70,229,0.2)' : '1px solid rgba(79,70,229,0.15)',
                borderRadius: 8,
                fontSize: 12,
                color: c.text,
                lineHeight: 1.5,
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: '#818CF8',
                  display: 'block',
                  marginBottom: 3,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                }}
              >
                KI-Zusammenfassung
              </span>
              {lead.aiUpdateSummary}
            </div>
          )}
          {lead.lastPosted && (
            <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 8 }}>
              Zuletzt gepostet: <span style={{ color: c.text, fontWeight: 600 }}>{lead.lastPosted}</span>
            </div>
          )}
          {lead.updatesList.map((u, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 10,
                padding: '7px 0',
                borderBottom:
                  i < lead.updatesList.length - 1
                    ? isDark
                      ? '1px solid rgba(255,255,255,0.05)'
                      : '1px solid rgba(0,0,0,0.04)'
                    : 'none',
              }}
            >
              <div
                style={{ width: 6, height: 6, borderRadius: '50%', background: '#F97316', flexShrink: 0, marginTop: 5 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: c.text }}>{u.text}</div>
                <div style={{ fontSize: 11, color: c.textMuted, marginTop: 1 }}>
                  {u.source} · {u.time}
                </div>
              </div>
            </div>
          ))}
        </SectionBlock>
      </div>

      {/* RIGHT COLUMN */}
      <div>
        {/* Reviews */}
        {(lead.reviews || lead.trustpilot || lead.google || lead.kununu) &&
          (() => {
            const REVIEW_COLORS = ['#10B981', '#F97316', '#94A3B8'];
            const REVIEW_BG_LIGHT = ['rgba(16,185,129,0.07)', 'rgba(249,115,22,0.07)', 'rgba(148,163,184,0.07)'];
            const REVIEW_BG_DARK = ['rgba(16,185,129,0.1)', 'rgba(249,115,22,0.1)', 'rgba(148,163,184,0.1)'];
            const REVIEW_BORDER = ['rgba(16,185,129,0.2)', 'rgba(249,115,22,0.2)', 'rgba(148,163,184,0.2)'];
            const entries: ReviewEntry[] = lead.reviews ?? [
              ...(lead.trustpilot ? [{ score: lead.trustpilot, platform: 'Trustpilot' }] : []),
              ...(lead.google ? [{ score: lead.google, platform: 'Google' }] : []),
              ...(lead.kununu ? [{ score: lead.kununu, platform: 'Kununu' }] : []),
            ];
            return (
              <SectionBlock title="Bewertungen & Meinungen" isDark={isDark} c={c}>
                <div style={{ display: 'flex', gap: 8, marginBottom: lead.openMentions ? 10 : 0 }}>
                  {entries.map((rev, i) => (
                    <div
                      key={rev.platform}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: isDark ? REVIEW_BG_DARK[i % 3] : REVIEW_BG_LIGHT[i % 3],
                        border: `1px solid ${REVIEW_BORDER[i % 3]}`,
                        borderRadius: 9,
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 22, fontWeight: 800, color: REVIEW_COLORS[i % 3] }}>{rev.score}</div>
                      <div style={{ fontSize: 10, color: c.textMuted, marginTop: 1 }}>{rev.platform}</div>
                      {rev.count !== undefined && (
                        <div style={{ fontSize: 10, color: c.textMuted }}>{rev.count} Bew.</div>
                      )}
                    </div>
                  ))}
                </div>
                {lead.openMentions !== undefined && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 8px',
                      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      borderRadius: 7,
                    }}
                  >
                    <span style={{ fontSize: 12, color: c.textMuted }}>Presse-Erwähnungen</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{lead.openMentions}</span>
                  </div>
                )}
              </SectionBlock>
            );
          })()}

        {/* Shipping Estimate */}
        {lead.shippingEstimate &&
          (() => {
            const est = lead.shippingEstimate!;
            const levelColor =
              est.assessmentLevel === 'high' ? '#10B981' : est.assessmentLevel === 'medium' ? '#F97316' : '#EF4444';
            const levelLabel =
              est.assessmentLevel === 'high'
                ? 'Hohes Potenzial'
                : est.assessmentLevel === 'medium'
                  ? 'Mittleres Potenzial'
                  : 'Unter ICP-Schwellwert';
            return (
              <SectionBlock
                title="Versandvolumen-Schätzung"
                badge="KI-Schätzung"
                badgeColor="#F97316"
                accent="#F97316"
                isDark={isDark}
                c={c}
              >
                {/* Disclaimer */}
                <div
                  style={{
                    padding: '8px 10px',
                    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                    borderRadius: 7,
                    marginBottom: 12,
                    display: 'flex',
                    gap: 8,
                    alignItems: 'flex-start',
                  }}
                >
                  <span style={{ fontSize: 12, color: '#F97316', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>
                    ⚠
                  </span>
                  <span style={{ fontSize: 11, color: c.textMuted, lineHeight: 1.5 }}>{est.disclaimer}</span>
                </div>
                {/* Lines */}
                {est.lines.map((line, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '7px 0',
                      borderBottom:
                        i < est.lines.length - 1
                          ? isDark
                            ? '1px solid rgba(255,255,255,0.05)'
                            : '1px solid rgba(0,0,0,0.04)'
                          : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: c.text, fontWeight: 600 }}>{line.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#F97316' }}>{line.value}</span>
                    </div>
                    {line.note && (
                      <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2, lineHeight: 1.4 }}>{line.note}</div>
                    )}
                  </div>
                ))}
                {/* Total */}
                <div
                  style={{
                    marginTop: 12,
                    padding: '10px 12px',
                    background: isDark ? 'rgba(249,115,22,0.1)' : 'rgba(249,115,22,0.07)',
                    border: '1px solid rgba(249,115,22,0.25)',
                    borderRadius: 9,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#F97316',
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                    }}
                  >
                    Gesamt-Schätzung
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#F97316' }}>{est.total}</span>
                </div>
                {/* Assessment */}
                <div
                  style={{
                    marginTop: 8,
                    padding: '9px 12px',
                    background: levelColor + (isDark ? '14' : '0E'),
                    border: `1px solid ${levelColor}30`,
                    borderRadius: 9,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: levelColor,
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      marginBottom: 4,
                    }}
                  >
                    ICP-Einschätzung · {levelLabel}
                  </div>
                  <p style={{ fontSize: 12, color: c.text, lineHeight: 1.55, margin: 0 }}>{est.assessment}</p>
                </div>
              </SectionBlock>
            );
          })()}

        {/* Operations — AI Layer 2 */}
        {(lead.coreServices || lead.targetCustomers || lead.usp || lead.partners || lead.openPositions) && (
          <SectionBlock title="Operations" badge="AI" badgeColor="#818CF8" isDark={isDark} c={c}>
            {lead.coreServices && lead.coreServices.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#818CF8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    marginBottom: 5,
                  }}
                >
                  Core Services
                </div>
                {lead.coreServices.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 12,
                      color: c.text,
                      padding: '2px 0',
                      display: 'flex',
                      gap: 6,
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        background: '#818CF8',
                        flexShrink: 0,
                        display: 'inline-block',
                      }}
                    />
                    {s}
                  </div>
                ))}
              </div>
            )}
            {lead.targetCustomers && lead.targetCustomers.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#10B981',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    marginBottom: 5,
                  }}
                >
                  Target Customers
                </div>
                {lead.targetCustomers.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 12,
                      color: c.text,
                      padding: '2px 0',
                      display: 'flex',
                      gap: 6,
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        background: '#10B981',
                        flexShrink: 0,
                        display: 'inline-block',
                      }}
                    />
                    {s}
                  </div>
                ))}
              </div>
            )}
            {lead.usp && lead.usp.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#F97316',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    marginBottom: 5,
                  }}
                >
                  USP
                </div>
                {lead.usp.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 12,
                      color: c.text,
                      padding: '2px 0',
                      display: 'flex',
                      gap: 6,
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        background: '#F97316',
                        flexShrink: 0,
                        display: 'inline-block',
                      }}
                    />
                    {s}
                  </div>
                ))}
              </div>
            )}
            {lead.partners && lead.partners.length > 0 && (
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#94A3B8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    marginBottom: 5,
                  }}
                >
                  Partner
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {lead.partners.map((p, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: c.textSub,
                        background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                        border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.07)',
                        padding: '3px 8px',
                        borderRadius: 6,
                      }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {lead.openPositions && lead.openPositions.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#EF4444',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    marginBottom: 5,
                  }}
                >
                  Offene Stellen
                </div>
                {lead.openPositions.map((pos, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 12,
                      color: c.text,
                      padding: '3px 0',
                      display: 'flex',
                      gap: 6,
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        background: '#EF4444',
                        flexShrink: 0,
                        display: 'inline-block',
                      }}
                    />
                    {pos}
                  </div>
                ))}
              </div>
            )}
          </SectionBlock>
        )}

        {/* Custom Fields */}
        {lead.customFields && lead.customFields.length > 0 && (
          <SectionBlock title="Custom Fields" isDark={isDark} c={c}>
            {lead.customFields.map((f, i) => (
              <DataRow key={i} label={f.key} value={f.value} c={c} isDark={isDark} />
            ))}
          </SectionBlock>
        )}
      </div>
    </div>
  );
}

// ─── Outbound Tab ─────────────────────────────────────────────────────────────

const SOURCE_BADGE: Record<Contact['source'], { label: string; color: string }> = {
  linkedin: { label: 'LinkedIn', color: '#0077B5' },
  openregister: { label: 'Openregister', color: '#10B981' },
  salesnavigator: { label: 'SalesNav', color: '#F97316' },
  manual: { label: 'Manuell', color: '#94A3B8' },
  website: { label: 'Website', color: '#818CF8' },
};

function OutboundTab({ lead, c, isDark }: { lead: LeadDetail; c: ReturnType<typeof colors>; isDark: boolean }) {
  return (
    <div
      style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, alignItems: 'start' }}
    >
      {/* LEFT */}
      <div>
        {/* Contacts */}
        {lead.contacts.length > 0 && (
          <SectionBlock
            title="Personen"
            badge={lead.contacts.length}
            badgeColor="#10B981"
            accent="#10B981"
            isDark={isDark}
            c={c}
          >
            {lead.contacts.map((ct, i) => {
              const src = SOURCE_BADGE[ct.source];
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '9px 0',
                    borderBottom:
                      i < lead.contacts.length - 1
                        ? isDark
                          ? '1px solid rgba(255,255,255,0.05)'
                          : '1px solid rgba(0,0,0,0.04)'
                        : 'none',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: isDark ? 'rgba(16,185,129,0.18)' : 'rgba(16,185,129,0.12)',
                      color: '#10B981',
                      fontWeight: 800,
                      fontSize: 11,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {ct.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{ct.name}</span>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: src.color,
                          background: src.color + '18',
                          padding: '1px 5px',
                          borderRadius: 4,
                        }}
                      >
                        {src.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: c.textMuted }}>{ct.role}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {ct.linkedin && (
                      <a
                        href={`https://${ct.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: 11,
                          color: '#0077B5',
                          fontWeight: 700,
                          textDecoration: 'none',
                          padding: '3px 7px',
                          background: 'rgba(0,119,181,0.12)',
                          borderRadius: 5,
                        }}
                      >
                        LI
                      </a>
                    )}
                    {ct.email && (
                      <a
                        href={`mailto:${ct.email}`}
                        style={{
                          fontSize: 11,
                          color: '#10B981',
                          fontWeight: 700,
                          textDecoration: 'none',
                          padding: '3px 7px',
                          background: 'rgba(16,185,129,0.12)',
                          borderRadius: 5,
                        }}
                      >
                        Mail
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </SectionBlock>
        )}

        {/* Charakter & Tone of Voice */}
        {(lead.companyCharacter || lead.toneOfVoice) && (
          <SectionBlock title="Charakter & Tone of Voice" isDark={isDark} c={c}>
            {lead.companyCharacter && (
              <div style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#818CF8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    marginBottom: 4,
                  }}
                >
                  Charakter
                </div>
                <p style={{ fontSize: 13, color: c.text, lineHeight: 1.6, margin: 0 }}>{lead.companyCharacter}</p>
              </div>
            )}
            {lead.toneOfVoice && (
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#F97316',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                    marginBottom: 4,
                  }}
                >
                  Tone of Voice
                </div>
                <p style={{ fontSize: 13, color: c.text, lineHeight: 1.6, margin: 0 }}>{lead.toneOfVoice}</p>
              </div>
            )}
          </SectionBlock>
        )}
      </div>

      {/* RIGHT */}
      <div>
        {/* Personalization Hooks */}
        {lead.personalizationHooks && lead.personalizationHooks.length > 0 && (
          <SectionBlock title="Personalisierungs-Hooks" badge="KI" badgeColor="#F97316" isDark={isDark} c={c}>
            {lead.personalizationHooks.map((hook, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 8,
                  padding: '5px 0',
                  borderBottom:
                    i < lead.personalizationHooks!.length - 1
                      ? isDark
                        ? '1px solid rgba(255,255,255,0.04)'
                        : '1px solid rgba(0,0,0,0.04)'
                      : 'none',
                }}
              >
                <span style={{ color: '#F97316', fontWeight: 700, flexShrink: 0, fontSize: 12 }}>→</span>
                <span style={{ fontSize: 12, color: c.text, lineHeight: 1.5 }}>{hook}</span>
              </div>
            ))}
          </SectionBlock>
        )}

        {/* 1-Min Pitch + Proposed Offer */}
        <SectionBlock title="Vorgeschlagenes Angebot" accent="#10B981" isDark={isDark} c={c}>
          <div
            style={{
              padding: '10px 12px',
              background: isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.06)',
              border: isDark ? '1px solid rgba(16,185,129,0.18)' : '1px solid rgba(16,185,129,0.2)',
              borderRadius: 9,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: '#10B981',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                marginBottom: 6,
              }}
            >
              1-Minuten-Pitch
            </div>
            <p style={{ fontSize: 13, color: c.text, lineHeight: 1.6, margin: '0 0 8px' }}>{lead.pitch}</p>
            <button
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#10B981',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                padding: 0,
              }}
            >
              KI: Alternative generieren →
            </button>
          </div>
          {lead.proposedOffer && (
            <div
              style={{
                padding: '10px 12px',
                background: isDark ? 'rgba(249,115,22,0.08)' : 'rgba(249,115,22,0.06)',
                border: isDark ? '1px solid rgba(249,115,22,0.18)' : '1px solid rgba(249,115,22,0.2)',
                borderRadius: 9,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: '#F97316',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  marginBottom: 6,
                }}
              >
                Konkretes Angebot
              </div>
              <p style={{ fontSize: 13, color: c.text, lineHeight: 1.6, margin: 0 }}>{lead.proposedOffer}</p>
            </div>
          )}
        </SectionBlock>
      </div>
    </div>
  );
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG = {
  hot: { label: 'Hot', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  warm: { label: 'Warm', color: '#F97316', bg: 'rgba(249,115,22,0.15)' },
  cold: { label: 'Kalt', color: '#94A3B8', bg: 'rgba(148,163,184,0.15)' },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const c = colors(theme);
  const isDark = theme === 'dark';

  const lead = LEADS[id as string] ?? getFallback(id as string);
  const [activeTab, setActiveTab] = useState<ActiveTab>('info');
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const sCfg = STATUS_CFG[status];
  const col = scoreColor(lead.score);

  useLayoutEffect(() => {
    const main = document.querySelector('main');
    if (main) main.scrollTop = 0;
  }, []);

  const subScores = [
    { label: 'Fit', value: lead.fit, color: '#10B981' },
    { label: 'Vol', value: lead.volume, color: '#F97316' },
    { label: 'Zeit', value: lead.timing, color: '#94A3B8' },
  ];

  const TAB_LABELS: Record<ActiveTab, string> = { info: 'Info', outbound: 'Outbound', bot: 'KI-Assistent' };

  return (
    <div
      style={{
        position: 'relative',
        paddingTop: 84,
        paddingBottom: 32,
        fontFamily: 'var(--font-inter), sans-serif',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      <GlassPageFilters />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          ...glassCard(isDark),
          margin: '0 20px 0',
          borderRadius: '16px 16px 0 0',
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          borderBottom: 'none',
        }}
      >
        {/* Back */}
        <button
          onClick={() => router.push('/intelligence/leads')}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            color: c.textSub,
            flexShrink: 0,
          }}
        >
          ←
        </button>

        {/* Company badge */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 13,
            background: lead.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 800,
            color: '#fff',
            flexShrink: 0,
            boxShadow: `0 6px 20px ${lead.color}55`,
          }}
        >
          {lead.initials}
        </div>

        {/* Name + reason */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: c.text,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {lead.name}
          </div>
          <div style={{ fontSize: 12, color: c.textMuted, marginTop: 1 }}>
            {lead.city} · {lead.industry}
          </div>
          {lead.scoreReason && (
            <div
              style={{
                fontSize: 11,
                color: col,
                marginTop: 4,
                opacity: 0.85,
                maxWidth: 480,
                lineHeight: 1.4,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {lead.scoreReason}
            </div>
          )}
        </div>

        {/* Score */}
        <ScoreRing score={lead.score} size={56} />

        {/* Sub-scores */}
        <div style={{ display: 'flex', gap: 6 }}>
          {subScores.map((s) => (
            <div
              key={s.label}
              style={{
                textAlign: 'center',
                padding: '5px 12px',
                background: s.color + '18',
                border: `1px solid ${s.color}30`,
                borderRadius: 9,
              }}
            >
              <div style={{ fontSize: 10, color: s.color, fontWeight: 700 }}>{s.label}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Status */}
        <div
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            background: sCfg.bg,
            border: `1.5px solid ${sCfg.color}40`,
            color: sCfg.color,
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: sCfg.color }} />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as LeadStatus)}
            style={{
              background: 'transparent',
              border: 'none',
              color: sCfg.color,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
              outline: 'none',
              appearance: 'none',
              WebkitAppearance: 'none',
            }}
          >
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cold">Kalt</option>
          </select>
        </div>

        {/* CTA */}
        <button
          style={{
            padding: '8px 18px',
            borderRadius: 9,
            background: '#10B981',
            color: '#fff',
            border: 'none',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            flexShrink: 0,
            boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
          }}
        >
          KI-Analyse
        </button>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div
        style={{
          margin: '0 20px',
          background: isDark ? 'rgba(10,12,24,0.52)' : 'rgba(255,255,255,0.28)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          borderLeft: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.7)',
          borderRight: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.7)',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)',
          display: 'flex',
          padding: '0 8px',
          gap: 2,
        }}
      >
        {(['info', 'outbound', 'bot'] as ActiveTab[]).map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '11px 18px',
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                color: active ? col : c.textMuted,
                background: 'transparent',
                border: 'none',
                borderBottom: active ? `2px solid ${col}` : '2px solid transparent',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'color 0.15s',
                marginBottom: -1,
              }}
            >
              {TAB_LABELS[tab]}
            </button>
          );
        })}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          margin: '0 20px',
          background: isDark ? 'rgba(10,12,24,0.36)' : 'rgba(255,255,255,0.16)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          borderTop: 'none',
          borderRight: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.7)',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.7)',
          borderLeft: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.7)',
          borderRadius: '0 0 16px 16px',
          ...(activeTab === 'bot'
            ? { display: 'flex', flexDirection: 'column' as const, flex: 1, minHeight: 0, overflow: 'hidden' }
            : {}),
        }}
      >
        {activeTab === 'info' && <InfoTab lead={lead} c={c} isDark={isDark} />}
        {activeTab === 'outbound' && <OutboundTab lead={lead} c={c} isDark={isDark} />}
        {activeTab === 'bot' && <ChatTab lead={lead} c={c} isDark={isDark} />}
      </div>
    </div>
  );
}
