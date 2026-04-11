// ─── SHARED LEAD DATA ── Claus Fahlbusch / SPS SmartParcel Solutions GmbH ────
// tenant_id: 5371680b-767b-4746-8119-c5cb9b12e804

export interface Lead {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  company: string;
  email: string | null;
  phone: string | null;
  city: string;
  country: string | null;
  score: number | null;
  status: 'Neu' | 'In Kontakt' | 'Qualifiziert' | 'Verloren';
  pipeline: string | null;
  lastActivity: string;
  industry: string;
  industryApollo: string | null;
  employees: string;
  employeeCount: number | null;
  website: string | null;
  jobTitle: string | null;
  linkedinUrl: string | null;
  emailStatus: string | null;
  aiSummary: string | null;
  aiTags: string[];
  emailDraftSubject: string | null;
  emailDraftBody: string | null;
  nextAction: string | null;
  createdAt: string;
  lastContactedAt: string | null;
  followUpAt: string | null;
  source: string;
  googleRating: number | null;
  googleReviews: number;
  googleMapsUrl: string | null;
  scoreBreakdown: { label: string; value: number; max: number }[];
  notes: string[];
  timeline: { action: string; time: string; color: string }[];
}

// ─── ACCOUNT PROFILE ─────────────────────────────────────────────────────────

export const ACCOUNT = {
  tenantId: '5371680b-767b-4746-8119-c5cb9b12e804',
  companyName: 'SPS SmartParcel Solutions GmbH',
  senderName: 'Claus Fahlbusch',
  senderRole: 'Head of Sales',
  description:
    'Smart Parcel verbindet Transportkompetenz mit intelligenter Software. Als 4PL-Dienstleister steuern wir Ihre gesamte Paketlogistik – datengetrieben, skalierbar und effizient.',
  targetCustomers:
    'Fulfillment-Dienstleister, eCommerce Versender, Versandmenge mehr als 1000 Pakete / Monat, Unternehmen mit hohem Anteil an internationalen Sendungen und Express-Sendungen',
};

// ─── STATUS MAPPING from DB ──────────────────────────────────────────────────

function mapStatus(s: string | null): Lead['status'] {
  if (s === 'contacted') return 'In Kontakt';
  if (s === 'qualified') return 'Qualifiziert';
  if (s === 'lost') return 'Verloren';
  return 'Neu';
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 1) return 'gerade eben';
  if (diffH < 24) return `vor ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'vor 1 Tag';
  if (diffD < 7) return `vor ${diffD} Tagen`;
  return `vor ${Math.floor(diffD / 7)} Woche${Math.floor(diffD / 7) > 1 ? 'n' : ''}`;
}

// Estimate industry from AI tags/summary
function guessIndustry(tags: string[] | null, summary: string | null, company: string): string {
  const text = `${(tags ?? []).join(' ')} ${summary ?? ''} ${company}`.toLowerCase();
  if (text.includes('fashion') || text.includes('mode') || text.includes('frauenmode') || text.includes('korsett'))
    return 'Fashion / eCommerce';
  if (text.includes('elektro') || text.includes('werkzeug')) return 'Elektrotechnik';
  if (text.includes('lebensmittel') || text.includes('food')) return 'Lebensmittel';
  if (text.includes('medien') || text.includes('druck')) return 'Medien / Druck';
  if (text.includes('industrie') || text.includes('metall') || text.includes('maschinen')) return 'Industrie';
  if (text.includes('b2b')) return 'B2B Distribution';
  if (text.includes('optik') || text.includes('brillen')) return 'Optik';
  if (text.includes('logistik') || text.includes('versand')) return 'Logistik';
  return 'Sonstige';
}

function guessEmployees(summary: string | null): string {
  if (!summary) return 'Unbekannt';
  const s = summary.toLowerCase();
  if (s.includes('1.200') || s.includes('1200') || s.includes('tausend')) return '1.000+';
  if (s.includes('500') || s.includes('430')) return '200–500';
  if (s.includes('250')) return '100–250';
  if (s.includes('100') || s.includes('170 filialen')) return '50–200';
  if (s.includes('20–50') || s.includes('20-50') || s.includes('mittel')) return '20–50';
  if (s.includes('klein') || s.includes('<20') || s.includes('10–30')) return '10–20';
  return '50–200';
}

// ─── ALL 35 LEADS FROM SUPABASE ──────────────────────────────────────────────

// Apollo custom_fields enrichment — keyed by lead id
const ENRICHMENT: Record<
  string,
  {
    job_title?: string;
    linkedin_url?: string;
    employee_count?: number;
    industry_apollo?: string;
    email_status?: string;
    country?: string;
    last_contacted_at?: string;
  }
> = {
  '3a1667de-cef8-48ae-9051-e9a69d42ef2e': {
    job_title: 'CEO',
    linkedin_url: 'https://www.linkedin.com/in/michael-solomun-62b50514a',
    employee_count: 76,
    industry_apollo: 'apparel & fashion',
    email_status: 'verified',
    country: 'Schweiz',
    last_contacted_at: '11. April 2026',
  },
  '397276af-7c06-4411-8a20-610582c076db': {
    job_title: 'CEO & Founder',
    linkedin_url: 'https://www.linkedin.com/in/kamil-sulek-8240a8195',
    employee_count: 53,
    industry_apollo: 'retail',
    email_status: 'none',
    country: 'Polen',
  },
  'c862ebe3-514b-4793-92d9-a3a9f0a168d7': {
    job_title: 'CEO',
    linkedin_url: 'https://www.linkedin.com/in/michael-simon-68009a6a',
    employee_count: 55,
    industry_apollo: 'textiles',
    email_status: 'verified',
    country: 'Deutschland',
  },
  'f3ff3326-af98-4395-83db-55897886b525': {
    job_title: 'Leiter Versand',
    linkedin_url: 'https://www.linkedin.com/in/thayalan-ratnasingam-2b65b4b1',
    employee_count: 1500,
    industry_apollo: 'retail',
    email_status: 'verified',
    country: 'Schweiz',
  },
  '07a981b3-2aed-4510-9acf-a87c465cc122': {
    job_title: 'Managing Director',
    linkedin_url: 'https://www.linkedin.com/in/imteag-nasud-722719163',
    employee_count: 47,
    country: 'Bangladesch',
  },
  '6cf4c9f4-1492-4ca2-8699-1fb5d006981d': {
    job_title: 'Managing Director',
    linkedin_url: 'https://www.linkedin.com/in/md-imteag-uddin-talukder-24a813133',
    employee_count: 47,
    country: 'Bangladesch',
  },
  '1b08c7c0-6723-4247-80f8-69a5e1c3b267': {
    job_title: 'Geschäftsführer',
    linkedin_url: 'https://www.linkedin.com/in/jens-rothberger-501470b5',
    employee_count: 39,
    industry_apollo: 'textiles',
    email_status: 'verified',
    country: 'Deutschland',
  },
  'a9ba730c-6be8-40b3-94f4-250b0aa5ed3c': {
    job_title: 'Managing Director',
    linkedin_url: 'https://www.linkedin.com/in/nils-buecker-820899185',
    employee_count: 41,
    industry_apollo: 'apparel & fashion',
    email_status: 'verified',
    country: 'Deutschland',
  },
  '1ae1f5a3-3c9d-45aa-84c1-9a1055882dea': {
    job_title: 'Managing Director',
    linkedin_url: 'https://www.linkedin.com/in/niels-karlowsky-b5925481',
    employee_count: 16,
    industry_apollo: 'apparel & fashion',
    email_status: 'verified',
    country: 'Deutschland',
  },
  '0311cdd0-31d0-4a6a-a9a4-95beb933032a': {
    job_title: 'CEO',
    linkedin_url: 'https://www.linkedin.com/in/katrin-raberg-84275a41',
    employee_count: 16,
    industry_apollo: 'apparel & fashion',
    email_status: 'verified',
    country: 'Deutschland',
  },
  '6118e920-2c60-4d4c-8595-c4a05002a76f': {
    job_title: 'Managing Director',
    linkedin_url: 'https://www.linkedin.com/in/mona-tschirdewahn-007228143',
    employee_count: 60,
    industry_apollo: 'apparel & fashion',
    email_status: 'verified',
    country: 'Deutschland',
  },
  'b9069007-d655-44a7-a3e7-e6ef18130382': {
    job_title: 'CEO',
    linkedin_url: 'https://www.linkedin.com/in/rolf-boje-02166b157',
    employee_count: 42,
    industry_apollo: 'apparel & fashion',
    country: 'Deutschland',
  },
  '15f087ce-3357-4bd9-b4df-34fb15bd01d5': {
    job_title: 'CEO',
    linkedin_url: 'https://www.linkedin.com/in/lecomtealexandre',
    employee_count: 21,
    industry_apollo: 'machinery',
    email_status: 'verified',
    country: 'Schweiz',
  },
  '4166ffc3-5cc5-4389-83c0-64dc4041b4f5': {
    job_title: 'CEO',
    employee_count: 120,
    industry_apollo: 'textiles',
    country: 'China',
  },
  '8ee23deb-eb47-48f7-b4e7-afc43cf5ff83': {
    job_title: 'Leiter Versand',
    linkedin_url: 'https://www.linkedin.com/in/steffen-wippermann-a7b698173',
    employee_count: 130,
    industry_apollo: 'electrical manufacturing',
    country: 'Deutschland',
  },
  'b15e2226-4500-4468-993f-a27394c0750a': {
    job_title: 'Leiter Versand',
    linkedin_url: 'https://www.linkedin.com/in/marco-lude-38a545312',
    employee_count: 2000,
    industry_apollo: 'machinery',
    country: 'Deutschland',
  },
  'e34729c2-a9c0-4c51-975f-59055b9afa3f': {
    job_title: 'Leiter Versand/Logistik',
    linkedin_url: 'https://www.linkedin.com/in/hofbauer-josef-a65a3711a',
    employee_count: 130,
    industry_apollo: 'construction',
    email_status: 'verified',
    country: 'Deutschland',
  },
  '0c935fed-35f4-44fe-8441-3dd63f202e0c': {
    job_title: 'Leiter Versand',
    linkedin_url: 'https://www.linkedin.com/in/alexander-brechter-031730145',
    employee_count: 520,
    industry_apollo: 'IT & services',
    email_status: 'verified',
    country: 'Deutschland',
  },
  '5b499198-3657-4b4f-854d-256cb13c65bd': {
    job_title: 'Leiter Versand',
    linkedin_url: 'https://www.linkedin.com/in/michael-cebulsky-268666248',
    employee_count: 1300,
    industry_apollo: 'food & beverages',
    email_status: 'verified',
    country: 'Deutschland',
  },
  'f6d48023-3ccb-4cc7-bf75-6be3cbc74022': {
    job_title: 'Leiter Versand/Logistik',
    linkedin_url: 'https://www.linkedin.com/in/joerg-steinheimer-36880898',
    employee_count: 400,
    industry_apollo: 'wholesale',
    email_status: 'verified',
    country: 'Deutschland',
  },
  'd3faa0e9-b9f2-4806-806b-7945e5454484': {
    job_title: 'Leiter Versand',
    linkedin_url: 'https://www.linkedin.com/in/marcel-armanski-17095b273',
    employee_count: 420,
    industry_apollo: 'security',
    email_status: 'verified',
    country: 'Deutschland',
  },
  '53caf81c-0528-498f-88c0-ec61d1eef5a1': {
    job_title: 'CEO',
    linkedin_url: 'https://www.linkedin.com/in/slipinski',
    employee_count: 37,
    industry_apollo: 'nonprofit',
    email_status: 'verified',
    country: 'Deutschland',
  },
  '5232477e-2d31-43b9-94ed-545f0718bbc9': {
    job_title: 'Managing Director',
    linkedin_url: 'https://www.linkedin.com/in/sehul-shah-221120165',
    employee_count: 35,
    industry_apollo: 'retail',
    country: 'Indien',
  },
  '737a600e-5d9b-42af-88e2-64608ada32ad': {
    job_title: 'Managing Director',
    linkedin_url: 'https://www.linkedin.com/in/andrea-kipf-a0780a194',
    employee_count: 31,
    industry_apollo: 'plastics',
    email_status: 'verified',
    country: 'Deutschland',
  },
};

const RAW_LEADS: {
  id: string;
  company_name: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  city: string;
  status: string;
  score: number | null;
  source: string;
  ai_summary: string | null;
  ai_tags: string[] | null;
  ai_next_action: string | null;
  email_draft_subject: string | null;
  email_draft_body: string | null;
  google_rating: number | null;
  google_reviews: number;
  created_at: string;
}[] = [
  {
    id: '3a1667de-cef8-48ae-9051-e9a69d42ef2e',
    company_name: 'Zebra Fashion AG',
    first_name: 'Michael',
    last_name: 'Solomun',
    email: 'michael.solomun@zebrafashion.com',
    phone: null,
    website: 'https://zebrafashion.com',
    city: 'Bassersdorf',
    status: 'new',
    score: 86,
    source: 'Apollo',
    ai_summary:
      'Zebra Fashion ist ein Schweizer eCommerce- und Multi-Channel-Retailer mit starkem Fokus auf trendige Frauenmode. Michael Solomun als CEO ist ein hochqualifizierter Entscheider mit direkter Budgetkompetenz.',
    ai_tags: ['CEO-Kontakt', 'Frauenmode-eCommerce', 'Multi-Channel-Retail', 'Schweiz', 'Versandkompetenz-Signal'],
    ai_next_action:
      'Direktes Outreach an Michael Solomun mit Fokus auf Versandoptimierung und Retourenmanagement für das Multi-Channel-Modell.',
    email_draft_subject: 'Filial-Retourenmanagement bei Zebra Fashion optimieren',
    email_draft_body:
      'Hallo Herr Solomun,\n\nMulti-Channel-Einzelhandel mit physischen Filialen und wachsendem eCommerce verursacht typischerweise hohen manuellen Aufwand beim Retourenmanagement.\n\nSmart Parcel optimiert solche Szenarien durch integriertes Transportmanagement: Ihre Filial-Rückgaben werden automatisiert erfasst und zentral gesteuert. Das reduziert Personalaufwand im Retourenhandling um 30–45%.\n\nHaben Sie diese Woche 15 Minuten?\n\nBeste Grüße\nClaus Fahlbusch\nSmart Parcel Solutions | Sales',
    google_rating: null,
    google_reviews: 0,
    created_at: '2026-04-11T15:38:54Z',
  },
  {
    id: '397276af-7c06-4411-8a20-610582c076db',
    company_name: 'COLLOSEUM FASHION',
    first_name: 'Kamil',
    last_name: 'Sulek',
    email: null,
    phone: null,
    website: 'https://colloseumfashion.com',
    city: 'Lodz',
    status: 'new',
    score: 86,
    source: 'Apollo',
    ai_summary:
      'Colosseum Fashion ist ein polnisches eCommerce-Unternehmen für Frauenmode mit Fokus auf europäischen Versand. CEO und Founder Kamil Sulek führt das Unternehmen mit geschätzten 20–50 Mitarbeitern.',
    ai_tags: [
      'CEO-Kontakt',
      'Frauenmode-eCommerce',
      'Shopify-Shop',
      'Polen-basiert',
      'Internationale-Versandausrichtung',
    ],
    ai_next_action:
      'Direkten LinkedIn-Outreach zu Kamil Sulek initiieren. Fokus: Versandvolumen validieren und europäische Expansionspläne identifizieren.',
    email_draft_subject: 'Europäischer Versand effizienter skalieren',
    email_draft_body:
      'Hallo Herr Sulek,\n\nals CEO von Colosseum Fashion navigieren Sie gerade das klassische Wachstumsproblem: Wie versendet man europaweit, ohne dass Retourenmanagement und Logistikkosten zur Kostenfalle werden.\n\nSPS Smart Parcel verbindet Ihre Paketdienstleister zentral und optimiert Versandkosten automatisch. Mit unserem Multicarrier-Ansatz senken Kunden ihre Versandkosten um 20–35%.\n\nHaben Sie diese Woche 15 Minuten?\n\nBeste Grüße\nClaus Fahlbusch\nSPS SmartParcel Solutions | Head of Sales',
    google_rating: null,
    google_reviews: 0,
    created_at: '2026-04-11T15:38:54Z',
  },
  {
    id: 'c862ebe3-514b-4793-92d9-a3a9f0a168d7',
    company_name: 'Olsen Fashion Germany',
    first_name: 'Michael',
    last_name: 'Simon',
    email: 'michael.simon@olsen.de',
    phone: null,
    website: 'https://olsenfashion.com',
    city: 'Hamburg',
    status: 'new',
    score: 68,
    source: 'Apollo',
    ai_summary:
      'Olsen Fashion ist ein etabliertes deutsches Frauenmode-Unternehmen mit Hauptsitz in Hamburg, seit 1995 in über 20 Ländern tätig. Michael Simon ist CEO. Multi-Channel-Modell mit 75% Umsatz über eigene Verkaufsflächen.',
    ai_tags: ['CEO-Kontakt', 'Frauenmode', 'International-Retail', 'Multi-Channel', 'Enterprise-Scale'],
    ai_next_action:
      'Lead als potenzieller Enterprise-Account klassifizieren. CEO-Ansatz über Industry-Events oder LinkedIn.',
    email_draft_subject: 'Internationales Fulfillment für 20+ Länder',
    email_draft_body:
      'Hallo Herr Simon,\n\nals CEO von Olsen Fashion kennen Sie die Komplexität, wenn Retouren und Versand über 20+ Länder mit unterschiedlichen Zollregeln laufen.\n\nBei SPS SmartParcel reduzieren wir typischerweise die Versandkosten um 20–35% und verkürzen die Fulfillment-Durchläufe signifikant.\n\nHaben Sie diese Woche noch 15 Minuten?\n\nBeste Grüße\nClaus Fahlbusch\nSPS SmartParcel Solutions | Sales',
    google_rating: null,
    google_reviews: 0,
    created_at: '2026-04-11T15:38:54Z',
  },
  {
    id: 'f3ff3326-af98-4395-83db-55897886b525',
    company_name: 'Interdiscount',
    first_name: 'Thayalan',
    last_name: 'Ratnasingam',
    email: 'thayalan.ratnasingam@interdiscount.ch',
    phone: null,
    website: 'https://interdiscount.ch',
    city: 'Fraubrunnen',
    status: 'new',
    score: 63,
    source: 'Apollo',
    ai_summary:
      'Interdiscount ist ein führender Omnichannel-Einzelhandelsbetrieb in der Schweiz mit ~170 Filialen. Thayalan Ratnasingam als "Leiter Versand" ist eine relevante Kontaktposition mit Next-Day-Delivery-Modell.',
    ai_tags: [
      'eCommerce-Retail',
      'Omnichannel-Händler',
      'Schweiz-basiert',
      '170-Filialen-Netzwerk',
      'Next-Day-Delivery-Fokus',
    ],
    ai_next_action:
      'Direkte Outreach an Thayalan Ratnasingam mit personalisiertem Gesprächseinstieg zu Next-Day-Delivery-Optimierung.',
    email_draft_subject: 'Next-Day-Delivery: Versandkosten optimieren bei Interdiscount',
    email_draft_body:
      'Hallo Herr Ratnasingam,\n\nals Leiter Versand bei Interdiscount kennen Sie die Herausforderung: 170 Filialen und das Versprechen, Bestellungen bis 20 Uhr am nächsten Tag zu liefern.\n\nBei Omnichannel-Retailern sehen wir Einsparpotenziale von 15–25% durch intelligentes Multicarrier-Management.\n\nHaben Sie diese Woche noch 20 Minuten?\n\nBeste Grüße\nClaus Fahlbusch\nSPS SmartParcel Solutions | Business Development',
    google_rating: null,
    google_reviews: 0,
    created_at: '2026-04-09T15:27:15Z',
  },
  {
    id: '07a981b3-2aed-4510-9acf-a87c465cc122',
    company_name: 'Young Fashion',
    first_name: 'Imteag',
    last_name: 'Nasud',
    email: null,
    phone: null,
    website: 'https://young-fashionstyle.de',
    city: 'Muensingen',
    status: 'new',
    score: 57,
    source: 'Apollo',
    ai_summary:
      'Young Fashion Style ist ein deutsches Online-Fashion-Unternehmen. Der Kontakt Imteag Nasud ist Managing Director. Die Daten deuten auf ein kleines bis mittleres Mode-Retail-Unternehmen hin.',
    ai_tags: ['Fashion-Retail', 'Deutschland-Basis', 'Managing-Director', 'KMU-Segment'],
    ai_next_action: 'Website manuell analysieren und Versandaktivitäten recherchieren.',
    email_draft_subject: 'Retouren und Sourcing-Logistik optimieren',
    email_draft_body:
      'Hallo Herr Nasud,\n\nals Managing Director von Young Fashion sind Sie mit den typischen Herausforderungen im Mode-E-Commerce vertraut: wachsende Versandmengen und hohe Retouren-Quoten.\n\nMit unserem Multicarrier-Management helfen wir Unternehmen, Versandkosten um 20–35% zu senken.\n\nBeste Grüße\nClaus Fahlbusch\nSPS SmartParcel Solutions',
    google_rating: null,
    google_reviews: 0,
    created_at: '2026-04-11T15:38:54Z',
  },
  {
    id: '1b08c7c0-6723-4247-80f8-69a5e1c3b267',
    company_name: 'Wünsche Fashion',
    first_name: 'Jens',
    last_name: 'Rothberger',
    email: 'j.rothberger@wuensche-fashion.de',
    phone: null,
    website: 'https://wuensche-fashion.de',
    city: 'Hamburg',
    status: 'new',
    score: 54,
    source: 'Apollo',
    ai_summary:
      'Wünsche Fashion ist ein etabliertes Hamburger Bekleidungsunternehmen. Jens Rothberger als Geschäftsführer verfügt über volle Entscheidungskompetenz. Das Unternehmen bietet Logistikmanagement als eigene Leistung an und ist global aufgestellt.',
    ai_tags: ['Geschäftsführer-Kontakt', 'Fashion-B2B', 'Logistikmanagement', 'Hamburg'],
    ai_next_action: 'LinkedIn-Recherche durchführen, um B2C-eCommerce-Kanal zu validieren.',
    email_draft_subject: 'Logistik-Skalierung für wachsende Versandvolumina',
    email_draft_body:
      'Hallo Herr Rothberger,\n\nals Geschäftsführer von Wünsche Fashion kennen Sie die Herausforderung: Wenn internationale Versandvolumina steigen, wird die Logistikkette zum Bottleneck.\n\nBei SPS SmartParcel unterstützen wir B2B-Versender mit Multicarrier-Management. Das Ergebnis: Versandkosten um 20–35% reduzieren.\n\nBeste Grüße\nClaus Fahlbusch\nSPS SmartParcel Solutions | Geschäftsführung',
    google_rating: null,
    google_reviews: 0,
    created_at: '2026-04-11T15:38:54Z',
  },
  {
    id: 'a9ba730c-6be8-40b3-94f4-250b0aa5ed3c',
    company_name: 'RABE Fashion Group',
    first_name: 'Nils',
    last_name: 'Buecker',
    email: 'nils.buecker@rabemoden.de',
    phone: null,
    website: 'https://rabefashion-group.com',
    city: 'Gütersloh',
    status: 'new',
    score: 48,
    source: 'Apollo',
    ai_summary:
      'RABE Fashion Group ist ein etabliertes Familienunternehmen seit 1920 mit 2.700+ Handelspartnern in über 38 Ländern, 513 Shop-in-Shops und 5 eigenen Filialen. Nils Buecker als Managing Director.',
    ai_tags: ['Frauenmode', 'Familienunternehmen', 'Internationale-Logistik', 'Managing-Director', 'Großunternehmen'],
    ai_next_action: 'Lead niedriger priorisieren: RABE ist zu groß und zu etabliert für die KMU-4PL-Zielgruppe.',
    email_draft_subject: 'RABE Fashion: Europäische Retouren transparent steuern',
    email_draft_body:
      'Hallo Herr Buecker,\n\nmit 2.700 Handelspartnern in 38 Ländern kennen Sie die Komplexität bei der Rückwärtslogistik.\n\nMit transparenter Multicarrier-Steuerung lassen sich Rücksendeketten um 25–40% effizienter abwickeln.\n\nBeste Grüße\nClaus Fahlbusch\nSPS SmartParcel Solutions | Sales',
    google_rating: null,
    google_reviews: 0,
    created_at: '2026-04-11T15:38:54Z',
  },
  {
    id: '1ae1f5a3-3c9d-45aa-84c1-9a1055882dea',
    company_name: 'Karlowsky Fashion GmbH',
    first_name: 'Niels',
    last_name: 'Karlowsky',
    email: 'niels.karlowsky@karlowsky.de',
    phone: null,
    website: 'https://karlowsky.com',
    city: 'Wanzleben-Börde',
    status: 'new',
    score: 44,
    source: 'Apollo',
    ai_summary:
      'Karlowsky ist ein traditionsreiches Berufsbekleidungsunternehmen (gegründet 1892) mit eCommerce-Shop und starkem Versand-Fokus. Niels Karlowsky als Managing Director.',
    ai_tags: ['Managing-Director-Kontakt', 'Berufsbekleidung-B2B2C', 'Starke-Versand-Signale', 'OEKO-TEX-zertifiziert'],
    ai_next_action: 'Persönliches Outreach an Niels Karlowsky mit Fokus auf Multi-Channel-Fulfillment.',
    email_draft_subject: 'Multi-Channel-Fulfillment bei Karlowsky optimiert',
    email_draft_body:
      'Hallo Herr Karlowsky,\n\nals Managing Director kennen Sie die Herausforderung: Kostenloser Versand über B2C-Shop, B2B-Dropshipping und Wholesale parallel.\n\nBei ähnlichen Versendern sehen wir 20–35% Kostenersparnis durch intelligentes Multicarrier-Management.\n\nBeste Grüße\nClaus Fahlbusch\nSPS SmartParcel Solutions | Business Development',
    google_rating: null,
    google_reviews: 0,
    created_at: '2026-04-11T15:38:54Z',
  },
  {
    id: '0311cdd0-31d0-4a6a-a9a4-95beb933032a',
    company_name: 'Mauritius GmbH International Fashion',
    first_name: 'Katrin',
    last_name: 'Raberg',
    email: 'katrin.raberg@mauritius.de',
    phone: null,
    website: 'https://mauritius.de',
    city: 'Bonn',
    status: 'new',
    score: 44,
    source: 'Apollo',
    ai_summary:
      'Mauritius GmbH ist ein international agierendes Lederjacken- und Modehersteller, der in über 30 Ländern vertreibt. Katrin Raberg als CEO ist die ideale Ansprechperson.',
    ai_tags: ['Lederjacken-Hersteller', 'CEO-Kontakt', 'Internationale-Versandaktivitäten', 'Sustainable-Fashion'],
    ai_next_action: 'Direktkontakt zu Katrin Raberg per LinkedIn. Fokus auf Optimierung globaler Logistikprozesse.',
    email_draft_subject: 'Internationale Logistik für Mauritius — skalierbar & nachhaltig',
    email_draft_body:
      'Hallo Frau Raberg,\n\nals CEO eines Modeherstellers mit Präsenz in über 30 Ländern kennen Sie das Dilemma: Koordination von Logistik-Partnern und Saisonalität.\n\nBei Herstellern mit Ihrem Versandvolumen sehen wir 25–40% Kosteneinsparungen durch Multicarrier-Management.\n\nBeste Grüße\nClaus Fahlbusch\nSPS SmartParcel Solutions | Leiter Geschäftsentwicklung',
    google_rating: null,
    google_reviews: 0,
    created_at: '2026-04-11T15:38:54Z',
  },
  {
    id: '6118e920-2c60-4d4c-8595-c4a05002a76f',
    company_name: 'KUNERT FASHION GMBH',
    first_name: 'Mona',
    last_name: 'Tschirdewahn',
    email: 'mona.tschirdewahn@kunert.de',
    phone: null,
    website: 'https://kunert.de',
    city: 'Kempten',
    status: 'new',
    score: 44,
    source: 'Apollo',
    ai_summary:
      'KUNERT ist ein etablierter Premium-Strumpfwarenhersteller mit über 100 Jahren Geschichte und eigenem eCommerce-Portal. Mona Tschirdewahn ist Managing Director.',
    ai_tags: ['Strumpfwaren-Hersteller', 'Premium-Damen-Mode', 'D2C-eCommerce', 'Managing-Director'],
    ai_next_action: 'LinkedIn-Research um Logistik-Herausforderungen zu identifizieren.',
    email_draft_subject: 'Saisonale Versandspitzen bei Kunert — 15 Min. Check',
    email_draft_body:
      'Hallo Frau Tschirdewahn,\n\nals etablierter Premium-Strumpwarenhersteller kennen Sie die typische Herausforderung: Saisonale Sales-Kampagnen führen zu Versandspitzen.\n\nWir helfen eCommerce-Versendern, bei solchen Peaks Versandkosten um 20–30% zu senken.\n\nBeste Grüße\nClaus Fahlbusch\nSPS SmartParcel Solutions | Geschäftsführung',
    google_rating: null,
    google_reviews: 0,
    created_at: '2026-04-11T15:38:54Z',
  },
  {
    id: 'b9069007-d655-44a7-a3e7-e6ef18130382',
    company_name: 'BASLER Fashion GmbH',
    first_name: 'Rolf',
    last_name: 'Boje',
    email: null,
    phone: null,
    website: 'https://basler-fashion.com',
    city: 'Unterhaching',
    status: 'new',
    score: 44,
    source: 'Apollo',
    ai_summary:
      'Basler ist ein etablierter Frauenmode-Brand mit Fokus auf elegante Damenbekleidung. Rolf Boje ist CEO. Multi-Channel-Präsenz über PETER HAHN und eigene Website.',
    ai_tags: ['Frauenmode-Brand', 'CEO-Kontakt', 'B2C-eCommerce', 'Multi-Channel-Retail'],
    ai_next_action: 'Mitarbeiterzahl verifizieren und GF-LinkedIn-Profil prüfen.',
    email_draft_subject: 'Premium-Mode international: Versandkomplexität optimiert',
    email_draft_body:
      'Hallo Herr Boje,\n\nals CEO eines etablierten Frauenmode-Brands kennen Sie die Herausforderung: Premium-Materialien und steigende internationale Versandansprüche.\n\nMit unserer Multicarrier-Steuerung optimieren Kunden Versandkosten um 25–35%.\n\nBeste Grüße\nClaus Fahlbusch\nSPS SmartParcel Solutions | Business Development',
    google_rating: null,
    google_reviews: 0,
    created_at: '2026-04-11T15:38:54Z',
  },
  {
    id: '15f087ce-3357-4bd9-b4df-34fb15bd01d5',
    company_name: 'APSOparts® B2B Online Shop',
    first_name: 'Alexandre',
    last_name: 'Lecomte',
    email: 'alexandre.lecomte@apsoparts.com',
    phone: null,
    website: 'https://apsoparts.com',
    city: 'Zürich',
    status: 'new',
    score: 44,
    source: 'Apollo',
    ai_summary:
      'APSO Parts ist ein Schweizer B2B-Distributor für Elastomerprofile und Dichtungstechnik. CEO Alexandre Lecomte. Nicht im eCommerce-Fashion-Segment — industrieller B2B-Component-Distributor.',
    ai_tags: ['CEO-Kontakt', 'Schweiz', 'B2B-Industriehandel', 'Technische-Komponenten'],
    ai_next_action: 'Lead ausschließen. Keine Relevanz für 4PL-Services im eCommerce-Segment.',
    email_draft_subject: null,
    email_draft_body: null,
    google_rating: null,
    google_reviews: 0,
    created_at: '2026-04-11T15:29:48Z',
  },
  {
    id: '4166ffc3-5cc5-4389-83c0-64dc4041b4f5',
    company_name: 'KBC Fashion GmbH',
    first_name: 'Yu',
    last_name: 'Zhang',
    email: null,
    phone: null,
    website: 'https://kbc.de',
    city: 'Shanghai',
    status: 'new',
    score: 44,
    source: 'Apollo',
    ai_summary:
      'KBC ist eine historische europäische Textildruckerei, spezialisiert auf Digitaldruck auf Baumwolle. B2B-Lieferant, kein eCommerce-Unternehmen.',
    ai_tags: ['Textildruckerei', 'B2B-Lieferant', 'Keine-eCommerce', 'CEO-Kontakt'],
    ai_next_action: 'Lead ausschließen — Upstream-Lieferant im Textilsektor.',
    email_draft_subject: null,
    email_draft_body: null,
    google_rating: null,
    google_reviews: 0,
    created_at: '2026-04-11T15:38:54Z',
  },
  {
    id: '6cf4c9f4-1492-4ca2-8699-1fb5d006981d',
    company_name: 'Young Fashion',
    first_name: 'Imteag',
    last_name: 'Talukder',
    email: null,
    phone: null,
    website: 'https://young-fashionstyle.de',
    city: 'Muensingen',
    status: 'new',
    score: 57,
    source: 'Apollo',
    ai_summary:
      'Young Fashion Style ist ein eCommerce-Unternehmen mit Fokus auf Frauenmode. Geschäftsführer Imteag Talukder hat Entscheidungskompetenz. Versandvolumen unklar.',
    ai_tags: ['Fashion-eCommerce', 'Managing Director', 'Deutschland-Basis', 'Frauenmode', 'KMU-Segment'],
    ai_next_action: 'Website analysieren und Versandvolumen validieren.',
    email_draft_subject: 'Retourenverwaltung für wachsende Versandmengen',
    email_draft_body:
      'Hallo Herr Talukder,\n\nals Growing Brand im eCommerce kennen Sie die Herausforderung: Retouren-verwaltung wird schnell zur Bottleneck.\n\nMit unserem Multicarrier-Management sehen Fashion-eCommerce-Anbieter 25–40% Effizienzgewinne.\n\nBeste Grüße\nClaus Fahlbusch\nSPS SmartParcel Solutions | Business Development',
    google_rating: null,
    google_reviews: 0,
    created_at: '2026-04-11T15:38:54Z',
  },
  {
    id: '5232477e-2d31-43b9-94ed-545f0718bbc9',
    company_name: 'Fashion Lounge',
    first_name: 'Sehul',
    last_name: 'Shah',
    email: null,
    phone: null,
    website: 'https://fashion-lounge-duesseldorf.de',
    city: 'Chennai',
    status: 'new',
    score: 37,
    source: 'Apollo',
    ai_summary:
      'Fashion Lounge Düsseldorf, auf Frauenmode ausgerichtet. Kontaktqualität eingeschränkt. Geografische Diskrepanz (deutsch/Indien).',
    ai_tags: ['Managing Director', 'Fashion Retail', 'Indien-Basis', 'unvollständige_daten'],
    ai_next_action: 'Website direkt prüfen, Mitarbeiterzahl recherchieren.',
    email_draft_subject: 'Skalierbare Logistik für Fashion-Versand Indien–Europa',
    email_draft_body:
      'Hallo Herr Shah,\n\nbei internationalem Versand von Indien aus ist die Herausforderung oft eine fragmentierte Logistik-Landschaft.\n\nSmart Parcel senkt Versandkosten um 20–35% bei gleichzeitiger Automatisierung der Retouren.\n\nBeste Grüße\nClaus Fahlbusch\nSmart Parcel Solutions | Sales',
    google_rating: null,
    google_reviews: 0,
    created_at: '2026-04-11T15:38:54Z',
  },
  {
    id: '53caf81c-0528-498f-88c0-ec61d1eef5a1',
    company_name: 'Fashion Council Germany',
    first_name: 'Scott',
    last_name: 'Lipinski',
    email: 'scott.lipinski@fashion-council-germany.org',
    phone: null,
    website: 'https://fashion-council-germany.org',
    city: 'Berlin',
    status: 'new',
    score: 34,
    source: 'Apollo',
    ai_summary:
      'Fashion Council Germany e.V. ist ein Branchenverband, kein eCommerce-Retailer. Ausschluss aus der Suchanfrage.',
    ai_tags: ['NGO/Nonprofit', 'Branchenverband', 'Keine-eCommerce'],
    ai_next_action: 'Lead ausschließen.',
    email_draft_subject: null,
    email_draft_body: null,
    google_rating: null,
    google_reviews: 0,
    created_at: '2026-04-11T15:38:54Z',
  },
  {
    id: '8ee23deb-eb47-48f7-b4e7-afc43cf5ff83',
    company_name: 'KAISER GmbH & Co. KG',
    first_name: 'Steffen',
    last_name: 'Wippermann',
    email: null,
    phone: null,
    website: 'https://kaiser-elektro.de',
    city: 'Schalksmühle',
    status: 'new',
    score: 33,
    source: 'Apollo',
    ai_summary:
      'KAISER ist ein etablierter Hersteller von Elektroinstallationsprodukten. Steffen Wippermann ist Leiter Versand. B2B-Großhandel, kein eCommerce.',
    ai_tags: ['Elektrotechnik-Hersteller', 'B2B-Großhandel', 'Leiter Versand'],
    ai_next_action: 'Lead ausschließen für eCommerce-Kampagne.',
    email_draft_subject: 'Versandkosten senken bei KAISER',
    email_draft_body:
      'Hallo Herr Wippermann,\n\nals Leiter Versand kennen Sie die Herausforderung: Großmengen an Großhandelskundenkreise verteilen.\n\nKunden sehen typischerweise 15–25% Ersparnis in den Versandkosten.\n\nBeste Grüße\nClaus Fahlbusch\nSPS SmartParcel Solutions',
    google_rating: null,
    google_reviews: 0,
    created_at: '2026-04-09T15:27:15Z',
  },
  {
    id: 'b15e2226-4500-4468-993f-a27394c0750a',
    company_name: 'Metabo',
    first_name: 'Marco',
    last_name: 'Lude',
    email: null,
    phone: null,
    website: 'https://metabo.com',
    city: 'Nürtingen',
    status: 'new',
    score: 33,
    source: 'Apollo',
    ai_summary:
      'Metabo ist ein global agierender Hersteller von Profi-Elektrowerkzeugen. Marco Lude ist Leiter Versand. Hersteller mit Direktvertrieb, nicht eCommerce-Retailer.',
    ai_tags: ['Werkzeughersteller', 'B2B-Vertrieb', 'Logistik-Funktion', 'Global-Player'],
    ai_next_action: 'Für diese Kampagne deprioritieren.',
    email_draft_subject: 'Versandkosten bei 50+ Distributionskanälen',
    email_draft_body:
      'Hallo Herr Lude,\n\nals Leiter Versand bei Metabo kennen Sie die Herausforderung bei 50+ Distributionswegen.\n\nMulticarrier-Abläufe zentralisieren: 10–20% Ersparnis.\n\nBeste Grüße\nClaus Fahlbusch\nSPS SmartParcel Solutions',
    google_rating: null,
    google_reviews: 0,
    created_at: '2026-04-09T15:27:15Z',
  },
  {
    id: 'e34729c2-a9c0-4c51-975f-59055b9afa3f',
    company_name: 'Zambelli',
    first_name: 'Josef',
    last_name: 'Hofbauer',
    email: 'josef.hofbauer@zambelli.com',
    phone: null,
    website: 'https://zambelli.com',
    city: 'Grafenau',
    status: 'new',
    score: 33,
    source: 'Apollo',
    ai_summary:
      'Zambelli ist ein Industrieunternehmen mit über 1.200 Mitarbeitern und Standorten in vier Ländern. Josef Hofbauer ist Leiter Versand/Logistik. B2B-Zulieferer, kein Online-Einzelhandel.',
    ai_tags: ['Industrieunternehmen', 'B2B-Manufaktur', 'Logistik-Infrastruktur', 'Multi-Location-Betrieb'],
    ai_next_action: 'Lead nicht für 4PL-Kampagne nutzen.',
    email_draft_subject: 'Multi-Location Logistik: Transparenz zwischen Zambelli-Standorten',
    email_draft_body:
      'Hallo Herr Hofbauer,\n\nbei acht Standorten in vier Ländern entstehen typischerweise Blindstellen — und damit unnötige Bestände.\n\n15–25% Optimierungspotenziale bei Bestandsverwaltung.\n\nBeste Grüße\nClaus Fahlbusch\nSPS SmartParcel Solutions | Sales',
    google_rating: null,
    google_reviews: 0,
    created_at: '2026-04-09T15:27:15Z',
  },
  {
    id: '5b499198-3657-4b4f-854d-256cb13c65bd',
    company_name: 'HOFMANNs',
    first_name: 'Michael',
    last_name: 'Cebulsky',
    email: 'michael.cebulsky@hofmanns.de',
    phone: null,
    website: 'https://hofmanns.de',
    city: 'Neustadt am Rübenberge',
    status: 'new',
    score: 30,
    source: 'Apollo',
    ai_summary:
      'HOFMANNs ist eine Lebensmittel-Manufaktur mit eigenem Fuhrpark (100+ LKWs). B2B-Verpflegung, kein eCommerce.',
    ai_tags: ['Lebensmittel-Manufaktur', 'B2B-Verpflegung', 'Eigenlogistik-100LKW'],
    ai_next_action: 'AUSSCHLIESSEN: Nicht ein Paket-versendender Online-Händler.',
    email_draft_subject: null,
    email_draft_body: null,
    google_rating: null,
    google_reviews: 0,
    created_at: '2026-04-09T15:27:15Z',
  },
  {
    id: 'f6d48023-3ccb-4cc7-bf75-6be3cbc74022',
    company_name: 'optoVision® Brillenglastechnik',
    first_name: 'Jörg',
    last_name: 'Steinheimer',
    email: 'steinheimer@optovision.de',
    phone: null,
    website: 'https://optovision.com',
    city: 'Frankfurt',
    status: 'new',
    score: 27,
    source: 'Apollo',
    ai_summary:
      'optovision ist ein deutscher Hersteller von Premium-Brillengläsern. Jörg Steinheimer ist Leiter Versand. B2B-Lieferant, nicht eCommerce.',
    ai_tags: ['Brillengläser-Hersteller', 'B2B-Lieferant', 'Kein eCommerce'],
    ai_next_action: 'Lead ausschließen. Keine Relevanz für eCommerce-Versandoptimierung.',
    email_draft_subject: 'Brillengläser-Lieferlogistik optimieren',
    email_draft_body:
      'Hallo Herr Steinheimer,\n\nRückverfolgung und Reparaturlogistik über verteilte Optiker-Filialen hinweg — mit Multicarrier-Koordination 20–30% schneller.\n\nBeste Grüße\nClaus Fahlbusch\nSPS SmartParcel Solutions',
    google_rating: null,
    google_reviews: 0,
    created_at: '2026-04-09T15:27:15Z',
  },
  {
    id: 'd3faa0e9-b9f2-4806-806b-7945e5454484',
    company_name: 'CES, C. Ed. Schulte GmbH',
    first_name: 'Marcel',
    last_name: 'Armanski',
    email: 'marcel.armanski@ces.eu',
    phone: null,
    website: 'https://ces.eu',
    city: 'Essen',
    status: 'new',
    score: 25,
    source: 'Apollo',
    ai_summary:
      'CES ist ein Familienunternehmen (gegründet 1840) mit ca. 430 Mitarbeitern, spezialisiert auf Schließsysteme. B2B-Hersteller, kein eCommerce.',
    ai_tags: ['Schließsysteme', 'Handwerk/Industrie', 'Mittelstand-DE'],
    ai_next_action: 'Lead ausschließen. Kein eCommerce.',
    email_draft_subject: null,
    email_draft_body: null,
    google_rating: null,
    google_reviews: 0,
    created_at: '2026-04-09T15:27:15Z',
  },
  {
    id: '0c935fed-35f4-44fe-8441-3dd63f202e0c',
    company_name: 'Stimme Mediengruppe',
    first_name: 'Alexander',
    last_name: 'Brechter',
    email: 'alexander.brechter@stimme-mediengruppe.de',
    phone: null,
    website: 'https://stimme-mediengruppe.de',
    city: 'Kassel',
    status: 'new',
    score: 33,
    source: 'Apollo',
    ai_summary:
      'Stimme Mediengruppe ist ein Familienunternehmen seit 1946 mit Geschäftsbereichen Medien, Druck, Logistik und Investments. Versand nur für Mediendistribution, kein eCommerce.',
    ai_tags: ['Mediengruppe', 'Logistik-Geschäftsfeld', 'Regional-Player', 'Kein_eCommerce'],
    ai_next_action: 'Lead passt nicht zu eCommerce-Suchanfrage.',
    email_draft_subject: null,
    email_draft_body: null,
    google_rating: null,
    google_reviews: 0,
    created_at: '2026-04-09T15:27:15Z',
  },
  {
    id: '737a600e-5d9b-42af-88e2-64608ada32ad',
    company_name: 'CG TEC GmbH | Carbonscout',
    first_name: 'Andrea',
    last_name: 'Kipf',
    email: 'andrea.kipf@cg-tec.de',
    phone: null,
    website: 'https://cg-tec.de',
    city: 'Pfofeld',
    status: 'new',
    score: 29,
    source: 'Apollo',
    ai_summary:
      'CG TEC ist ein Hersteller von Faserverbund-Komponenten. B2B-Industrieunternehmen, nicht im eCommerce-Segment.',
    ai_tags: ['B2B-Industrie', 'Faserverbund-Spezialist', 'Managing Director'],
    ai_next_action: 'Lead ausschließen. Falsche Industrie.',
    email_draft_subject: null,
    email_draft_body: null,
    google_rating: null,
    google_reviews: 0,
    created_at: '2026-04-11T15:29:48Z',
  },
];

// ─── TRANSFORM TO LEAD TYPE ──────────────────────────────────────────────────

export const LEADS: Lead[] = RAW_LEADS.map((r) => {
  const e = ENRICHMENT[r.id] ?? {};
  const empCount = e.employee_count ?? null;
  return {
    id: r.id,
    name: `${r.first_name} ${r.last_name}`,
    firstName: r.first_name,
    lastName: r.last_name,
    company: r.company_name,
    email: r.email,
    phone: r.phone,
    city: r.city,
    country: e.country ?? null,
    score: r.score,
    status: mapStatus(r.status),
    pipeline: null,
    lastActivity: e.last_contacted_at ? `Kontaktiert ${e.last_contacted_at}` : timeAgo(r.created_at),
    industry: guessIndustry(r.ai_tags, r.ai_summary, r.company_name),
    industryApollo: e.industry_apollo ?? null,
    employees: empCount
      ? empCount < 20
        ? '1–20'
        : empCount < 50
          ? '20–50'
          : empCount < 200
            ? '50–200'
            : empCount < 500
              ? '200–500'
              : empCount < 1000
                ? '500–1.000'
                : '1.000+'
      : guessEmployees(r.ai_summary),
    employeeCount: empCount,
    website: r.website,
    jobTitle: e.job_title ?? null,
    linkedinUrl: e.linkedin_url ?? null,
    emailStatus: e.email_status ?? null,
    aiSummary: r.ai_summary,
    aiTags: r.ai_tags ?? [],
    emailDraftSubject: r.email_draft_subject,
    emailDraftBody: r.email_draft_body,
    nextAction: r.ai_next_action,
    createdAt: new Date(r.created_at).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }),
    lastContactedAt: e.last_contacted_at ?? null,
    followUpAt: null,
    source: r.source,
    googleRating: r.google_rating,
    googleReviews: r.google_reviews,
    googleMapsUrl: null,
    scoreBreakdown: r.score
      ? [
          { label: 'Firmenprofil', value: Math.round(r.score * 0.3), max: 30 },
          { label: 'Entscheider-Level', value: Math.round(r.score * 0.2), max: 20 },
          { label: 'Branchenfit', value: Math.round(r.score * 0.25), max: 25 },
          { label: 'Versand-Signale', value: Math.round(r.score * 0.25), max: 25 },
        ]
      : [],
    notes: [],
    timeline: [
      {
        action: `Lead erstellt via ${r.source}`,
        time: new Date(r.created_at).toLocaleDateString('de-DE'),
        color: '#818CF8',
      },
      ...(r.score
        ? [
            {
              action: `KI-Score berechnet: ${r.score}`,
              time: new Date(r.created_at).toLocaleDateString('de-DE'),
              color: '#38BDF8',
            },
          ]
        : []),
      ...(r.email_draft_body
        ? [
            {
              action: 'E-Mail-Draft generiert',
              time: new Date(r.created_at).toLocaleDateString('de-DE'),
              color: '#A78BFA',
            },
          ]
        : []),
      ...(e.last_contacted_at ? [{ action: 'E-Mail versendet', time: e.last_contacted_at, color: '#34D399' }] : []),
    ],
  };
});

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export function getLeadStats(leads: Lead[]) {
  const total = leads.length;
  const scored = leads.filter((l) => l.score !== null).length;
  const hot = leads.filter((l) => (l.score ?? 0) >= 70).length;
  const warm = leads.filter((l) => (l.score ?? 0) >= 50 && (l.score ?? 0) < 70).length;
  const cold = leads.filter((l) => (l.score ?? 0) < 50).length;
  const avgScore =
    scored > 0 ? Math.round(leads.filter((l) => l.score !== null).reduce((a, l) => a + (l.score ?? 0), 0) / scored) : 0;
  const totalPipeline = leads.reduce((a, l) => {
    if (!l.pipeline) return a;
    return a + parseInt(l.pipeline.replace(/[€.]/g, '').trim());
  }, 0);
  return { total, scored, hot, warm, cold, avgScore, totalPipeline };
}

export function getLeadById(id: string): Lead | undefined {
  return LEADS.find((l) => l.id === id);
}
