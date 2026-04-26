export interface MockLead {
  id: string;
  company: string;
  name: string;
  email: string;
  status: 'neu' | 'kontaktiert' | 'qualifiziert' | 'verloren';
  score: number;
  industry: string;
  created_at: string;
  website: string;
  email_draft: string | null;
  ai_tags: string[];
  ai_summary: string | null;
  city: string;
  employees: string;
  next_action: string;
}

const industries = [
  'Medizintechnik',
  'Medizintechnik',
  'Medizintechnik',
  'Maschinenbau',
  'Maschinenbau',
  'Maschinenbau',
  'Bauwesen/Baumaterial',
  'Medizintechnik/Silikonverarbeitung',
  'Bauwesen',
  'Laborprüfgeräte',
  'Bauingenieurwesen',
  'Automatisierungstechnik',
  'Werkzeugbau',
  'Kunststofftechnik',
  'Elektrotechnik',
  'Fahrzeugtechnik',
  'Umwelttechnik',
  'Verpackungstechnik',
  'Lebensmitteltechnik',
  'Feinmechanik',
  'Stahlbau',
  'Energietechnik',
  'Textiltechnik',
  'Drucktechnik',
  'Chemie',
  'Optik',
  'Halbleitertechnik',
];

const companies = [
  'MedTech Solutions GmbH',
  'Bauer Maschinenbau AG',
  'ProMed Instrumente GmbH',
  'Henze Engineering GmbH',
  'KraftWerk Maschinenbau',
  'SilTech Medical GmbH',
  'Rheinbau GmbH',
  'Silikonform Medizintechnik',
  'Steinberg Bau AG',
  'LabTest Prüfsysteme GmbH',
  'Brücken & Partner Ing.',
  'AutoFlow Systems GmbH',
  'Präzision Werkzeugbau',
  'PolyForm Kunststoff GmbH',
  'Strom & Schalt AG',
  'FahrTech GmbH',
  'GreenTech Umwelt GmbH',
  'PackPro Verpackungen',
  'FoodTech Systems',
  'MikroFein GmbH',
  'StahlWerk Nord',
  'SolarPower GmbH',
  'TextilPlus AG',
  'DruckArt GmbH',
  'ChemieLab GmbH',
  'OptiVision GmbH',
  'SemiCon Deutschland',
];

const names = [
  'Thomas Becker',
  'Sandra Hoffmann',
  'Dr. Michael Lehmann',
  'Andreas Krüger',
  'Petra Schäfer',
  'Dr. Stefan Weber',
  'Markus Braun',
  'Julia Hartmann',
  'Frank Zimmermann',
  'Claudia Schulz',
  'Ing. Robert Fischer',
  'Nina Wagner',
  'Jens Richter',
  'Sabine Koch',
  'Dipl.-Ing. Hans Müller',
  'Monika Bauer',
  'Wolfgang Schmitt',
  'Katrin Vogel',
  'Bernd Schwarz',
  'Elke Neumann',
  'Rainer Hofmann',
  'Anja Weiß',
  'Uwe Lang',
  'Birgit Fuchs',
  'Martin Scholz',
  'Heike Haas',
  'Peter Keller',
];

const scores = [
  82, 78, 76, 72, 68, 65, 62, 60, 58, 55, 54, 52, 50, 48, 46, 45, 44, 42, 40, 38, 36, 35, 34, 33, 32, 31, 30,
];

export const mockLeads: MockLead[] = Array.from({ length: 27 }, (_, i) => ({
  id: `lead-${String(i + 1).padStart(3, '0')}`,
  company: companies[i],
  name: names[i],
  email: `${names[i].split(' ').pop()?.toLowerCase()}@${companies[i]
    .split(' ')[0]
    .toLowerCase()
    .replace(/[^a-z]/g, '')}.de`,
  status: i === 5 ? ('kontaktiert' as const) : ('neu' as const),
  score: scores[i],
  industry: industries[i],
  created_at:
    i < 22
      ? '2026-03-29T' + String(8 + Math.floor(i / 3)).padStart(2, '0') + ':00:00Z'
      : '2026-03-28T' + String(10 + i - 22).padStart(2, '0') + ':00:00Z',
  website: `https://www.${companies[i]
    .split(' ')[0]
    .toLowerCase()
    .replace(/[^a-z]/g, '')}.de`,
  email_draft:
    i < 23
      ? `Sehr geehrter ${names[i].split(' ').pop()},\n\nvielen Dank für Ihr Interesse an KI-gestützter Automatisierung für ${companies[i]}.\n\nIch würde Ihnen gerne in einem kurzen Gespräch zeigen, wie wir Unternehmen in der ${industries[i]} dabei unterstützen, Prozesse zu optimieren.\n\nHaben Sie diese Woche 15 Minuten Zeit?\n\nBeste Grüße\nJan Fahlbusch\nOnvero`
      : null,
  ai_tags:
    scores[i] >= 70
      ? ['premium_lead', 'ki_affin', 'firmen_email', 'B2B', 'Entscheider']
      : scores[i] >= 45
        ? ['firmen_email', 'automatisierungspotenzial', 'B2B', 'Wachstum']
        : ['firmen_email', 'B2B'],
  ai_summary:
    i < 8
      ? [
          'Wachstumsstarkes Unternehmen im Medizintechnik-Bereich mit hohem Digitalisierungsbedarf. Entscheider ist direkt erreichbar und hat Budget signalisiert.',
          'Traditionsreicher Maschinenbauer mit 180 Mitarbeitern. Aktuell Evaluation von Automatisierungslösungen für die Produktion. Zeitnahe Entscheidung wahrscheinlich.',
          'Spezialisierter Medizintechnik-Hersteller mit starkem Wachstum. Sucht aktiv nach KI-Lösungen für Qualitätskontrolle. Budget vorhanden.',
          'Engineering-Dienstleister mit Fokus auf Industrie 4.0. Hoher Bedarf an Workflow-Automatisierung, Entscheider ist CTO.',
          'Mittelständischer Maschinenbauer, digitalaffin. Nutzt bereits HubSpot und Slack. Gute Voraussetzungen für KI-Integration.',
          'Medizintechnik-Zulieferer mit FDA-Zulassungen. Sucht Automatisierung für Dokumentationsprozesse. Budget 15-25k signalisiert.',
          'Bauunternehmen im Wachstum. Digitalisierung der Projektplanung priorisiert. Mittleres Budget.',
          'Silikonverarbeiter für Medizinprodukte. Nischenmarkt mit hohem Automatisierungspotenzial.',
        ][i]
      : null,
  city: [
    'Hamburg',
    'München',
    'Berlin',
    'Düsseldorf',
    'Frankfurt',
    'Stuttgart',
    'Köln',
    'Dresden',
    'Leipzig',
    'Hannover',
    'Nürnberg',
    'Bremen',
    'Essen',
    'Dortmund',
    'Karlsruhe',
    'Mannheim',
    'Augsburg',
    'Wiesbaden',
    'Münster',
    'Aachen',
    'Freiburg',
    'Kiel',
    'Lübeck',
    'Rostock',
    'Ulm',
    'Regensburg',
    'Mainz',
  ][i],
  employees: [
    '50-200',
    '200-500',
    '50-200',
    '10-50',
    '200-500',
    '50-200',
    '500+',
    '10-50',
    '200-500',
    '50-200',
    '10-50',
    '50-200',
    '10-50',
    '50-200',
    '200-500',
    '10-50',
    '50-200',
    '200-500',
    '50-200',
    '10-50',
    '500+',
    '50-200',
    '200-500',
    '10-50',
    '50-200',
    '10-50',
    '200-500',
  ][i],
  next_action: scores[i] >= 70 ? 'Sofort kontaktieren' : scores[i] >= 45 ? 'E-Mail senden' : 'Beobachten',
}));

// Aggregated stats
export const mockStats = {
  total: 27,
  scored: 27,
  avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  premium: scores.filter((s) => s >= 70).length,
  warm: scores.filter((s) => s >= 45 && s < 70).length,
  cold: scores.filter((s) => s < 45).length,
  withEmail: 23,
  byStatus: { neu: 26, kontaktiert: 1, qualifiziert: 0, verloren: 0 },
  leadsByDay: [
    { date: '2026-03-17', count: 0 },
    { date: '2026-03-18', count: 0 },
    { date: '2026-03-19', count: 0 },
    { date: '2026-03-20', count: 0 },
    { date: '2026-03-21', count: 0 },
    { date: '2026-03-22', count: 0 },
    { date: '2026-03-23', count: 0 },
    { date: '2026-03-24', count: 0 },
    { date: '2026-03-25', count: 0 },
    { date: '2026-03-26', count: 0 },
    { date: '2026-03-27', count: 0 },
    { date: '2026-03-28', count: 5 },
    { date: '2026-03-29', count: 22 },
    { date: '2026-03-30', count: 0 },
  ],
};
