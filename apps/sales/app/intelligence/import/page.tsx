'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ─── Field definitions ────────────────────────────────────────────────────────

type FieldKey =
  | '__skip'
  | 'company_name'
  | 'website'
  | 'city'
  | 'state'
  | 'country'
  | 'zip'
  | 'phone'
  | 'email'
  | 'industry'
  | 'employees'
  | 'revenue'
  | 'founded'
  | 'linkedin_url'
  | 'contact_name'
  | 'contact_role'
  | 'contact_email'
  | 'shop_system'
  | 'carrier'
  | 'description';

interface FieldDef {
  key: FieldKey;
  label: string;
  group: string;
  required?: boolean;
}

const FIELDS: FieldDef[] = [
  { key: '__skip', label: 'Ignorieren', group: '' },
  { key: 'company_name', label: 'Firmenname', group: 'Identifikation', required: true },
  { key: 'website', label: 'Website', group: 'Identifikation' },
  { key: 'linkedin_url', label: 'LinkedIn URL', group: 'Identifikation' },
  { key: 'city', label: 'Stadt', group: 'Adresse' },
  { key: 'state', label: 'Bundesland', group: 'Adresse' },
  { key: 'country', label: 'Land', group: 'Adresse' },
  { key: 'zip', label: 'PLZ', group: 'Adresse' },
  { key: 'phone', label: 'Telefon', group: 'Kontakt' },
  { key: 'email', label: 'E-Mail', group: 'Kontakt' },
  { key: 'contact_name', label: 'Ansprechpartner', group: 'Kontakt' },
  { key: 'contact_role', label: 'Position', group: 'Kontakt' },
  { key: 'contact_email', label: 'Ansprechpartner E-Mail', group: 'Kontakt' },
  { key: 'industry', label: 'Branche', group: 'Firmographics' },
  { key: 'employees', label: 'Mitarbeiter', group: 'Firmographics' },
  { key: 'revenue', label: 'Umsatz', group: 'Firmographics' },
  { key: 'founded', label: 'Gegründet', group: 'Firmographics' },
  { key: 'shop_system', label: 'Shop-System', group: 'Technographics' },
  { key: 'carrier', label: 'Logistikpartner', group: 'Technographics' },
  { key: 'description', label: 'Beschreibung / Notizen', group: 'Sonstiges' },
];

// ─── Label auto-detection ─────────────────────────────────────────────────────

const LABEL_MAP: Record<string, FieldKey> = {
  // Firmenname
  firmenname: 'company_name',
  company: 'company_name',
  'company name': 'company_name',
  unternehmen: 'company_name',
  firma: 'company_name',
  name: 'company_name',
  organization: 'company_name',
  organisation: 'company_name',
  // Pipedrive
  'organization name': 'company_name',
  // HubSpot
  'company name (required)': 'company_name',

  // Website
  website: 'website',
  domain: 'website',
  url: 'website',
  homepage: 'website',
  web: 'website',
  'website url': 'website',

  // LinkedIn
  linkedin: 'linkedin_url',
  'linkedin url': 'linkedin_url',
  'linkedin profile': 'linkedin_url',
  linkedin_company_page: 'linkedin_url',
  'company linkedin': 'linkedin_url',

  // Stadt
  stadt: 'city',
  city: 'city',
  ort: 'city',
  standort: 'city',
  'address city': 'city',
  'billing city': 'city',

  // Bundesland
  bundesland: 'state',
  state: 'state',
  region: 'state',
  'address state': 'state',

  // Land
  land: 'country',
  country: 'country',
  'address country': 'country',

  // PLZ
  plz: 'zip',
  zip: 'zip',
  postleitzahl: 'zip',
  postal: 'zip',
  'address postal code': 'zip',

  // Telefon
  telefon: 'phone',
  phone: 'phone',
  tel: 'phone',
  mobile: 'phone',
  handy: 'phone',
  'phone number': 'phone',

  // E-Mail
  'e-mail': 'email',
  email: 'email',
  mail: 'email',
  'company email': 'email',

  // Kontakt
  ansprechpartner: 'contact_name',
  'contact name': 'contact_name',
  kontakt: 'contact_name',
  'first name': 'contact_name',
  vorname: 'contact_name',
  // Pipedrive: person
  person: 'contact_name',
  'person name': 'contact_name',

  position: 'contact_role',
  jobtitle: 'contact_role',
  'job title': 'contact_role',
  rolle: 'contact_role',
  title: 'contact_role',
  funktion: 'contact_role',

  'contact email': 'contact_email',
  'person email': 'contact_email',
  'kontakt email': 'contact_email',

  // Firmographics
  branche: 'industry',
  industry: 'industry',
  kategorie: 'industry',
  sektor: 'industry',
  sector: 'industry',
  'industry/sector': 'industry',

  mitarbeiter: 'employees',
  employees: 'employees',
  'num employees': 'employees',
  numberofemployees: 'employees',
  'number of employees': 'employees',
  mitarbeiteranzahl: 'employees',

  umsatz: 'revenue',
  revenue: 'revenue',
  'annual revenue': 'revenue',
  annualrevenue: 'revenue',
  jahresumsatz: 'revenue',

  gegründet: 'founded',
  founded: 'founded',
  gründungsjahr: 'founded',
  'year founded': 'founded',

  // Technographics
  'shop system': 'shop_system',
  shopsystem: 'shop_system',
  shop: 'shop_system',
  ecommerce: 'shop_system',
  platform: 'shop_system',

  carrier: 'carrier',
  logistik: 'carrier',
  versand: 'carrier',
  versandpartner: 'carrier',

  // Beschreibung
  beschreibung: 'description',
  description: 'description',
  notizen: 'description',
  notes: 'description',
  kommentar: 'description',
};

// ─── CRM presets ──────────────────────────────────────────────────────────────

const CRM_PRESETS: Record<string, Record<string, FieldKey>> = {
  pipedrive: {
    name: 'company_name',
    web: 'website',
    address_city: 'city',
    address_state: 'state',
    address_country: 'country',
    address_postal_code: 'zip',
    phone: 'phone',
    email: 'email',
    industry: 'industry',
    num_employees: 'employees',
    annual_revenue: 'revenue',
    linkedin: 'linkedin_url',
    person_name: 'contact_name',
    job_title: 'contact_role',
    person_email: 'contact_email',
    description: 'description',
  },
  hubspot: {
    name: 'company_name',
    website: 'website',
    city: 'city',
    state: 'state',
    country: 'country',
    zip: 'zip',
    phone: 'phone',
    email: 'email',
    industry: 'industry',
    numberofemployees: 'employees',
    annualrevenue: 'revenue',
    linkedin_company_page: 'linkedin_url',
    firstname: 'contact_name',
    jobtitle: 'contact_role',
    'person email': 'contact_email',
    description: 'description',
  },
};

// ─── CSV parsing ──────────────────────────────────────────────────────────────

function parseCsvLine(line: string, delim: ',' | ';' | '\t'): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (ch === delim && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function detectDelimiter(line: string): ',' | ';' | '\t' {
  const tabs = (line.match(/\t/g) ?? []).length;
  const semis = (line.match(/;/g) ?? []).length;
  const commas = (line.match(/,/g) ?? []).length;
  if (tabs >= semis && tabs >= commas) return '\t';
  if (semis > commas) return ';';
  return ',';
}

function parseCsv(raw: string): { headers: string[]; rows: string[][]; delimiter: ',' | ';' | '\t' } {
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [], delimiter: ',' };
  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter);
  const rows = lines
    .slice(1)
    .map((l) => parseCsvLine(l, delimiter))
    .filter((r) => r.some((c) => c));
  return { headers, rows, delimiter };
}

function guessMapping(headers: string[], preset?: string): Record<number, FieldKey> {
  const mapping: Record<number, FieldKey> = {};
  const presetMap = preset ? (CRM_PRESETS[preset] ?? {}) : {};
  headers.forEach((h, i) => {
    const normalized = h.toLowerCase().trim();
    const presetKey = presetMap[normalized] ?? presetMap[h.trim()];
    const labelKey = LABEL_MAP[normalized];
    mapping[i] = presetKey ?? labelKey ?? '__skip';
  });
  return mapping;
}

// ─── Paste parser ─────────────────────────────────────────────────────────────

function isDomain(s: string): boolean {
  return /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(s.trim());
}

function isCity(s: string): boolean {
  return s.trim().length > 0 && !isDomain(s) && /^[A-ZÄÖÜa-zäöüß\s-]+$/.test(s.trim());
}

interface PasteRow {
  company_name: string;
  website?: string;
  city?: string;
}

function parsePaste(text: string): PasteRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/^[\s\-\*\d\.]+/, '').trim())
    .filter((l) => l.length > 2);

  return lines.map((line) => {
    const parts = line
      .split(/[,;\t]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    const name = parts[0];
    const second = parts[1] ?? '';
    const third = parts[2] ?? '';

    let website: string | undefined;
    let city: string | undefined;

    if (isDomain(second)) {
      website = second;
      if (third && isCity(third)) city = third;
    } else if (isCity(second)) {
      city = second;
    }

    return { company_name: name, website, city };
  });
}

// ─── Template downloads ───────────────────────────────────────────────────────

const TEMPLATES = {
  minimal: {
    label: 'Minimal',
    desc: 'Nur Firmenname + Website',
    csv: 'Firmenname,Website\nBeispiel GmbH,beispiel.de\nMuster AG,muster.de\n',
    filename: 'vorlage-minimal.csv',
  },
  full: {
    label: 'Vollständig',
    desc: 'Alle verfügbaren Felder',
    csv: 'Firmenname,Website,Stadt,Bundesland,Land,Telefon,E-Mail,Branche,Mitarbeiter,Umsatz,LinkedIn URL,Ansprechpartner,Position,Kontakt E-Mail,Shop-System,Logistik\nBeispiel GmbH,beispiel.de,München,Bayern,Deutschland,+49 89 123456,info@beispiel.de,E-Commerce,50-200,5-20 Mio.,linkedin.com/company/beispiel,Max Muster,CEO,max@beispiel.de,Shopware 6,DHL\n',
    filename: 'vorlage-vollstaendig.csv',
  },
  pipedrive: {
    label: 'Pipedrive',
    desc: 'Direkt aus Pipedrive exportierbar',
    csv: 'name,web,address_city,address_state,address_country,phone,email,industry,num_employees,annual_revenue,linkedin,person_name,job_title,person_email\nBeispiel GmbH,beispiel.de,München,Bayern,Deutschland,+49 89 123456,info@beispiel.de,E-Commerce,100,5000000,linkedin.com/company/beispiel,Max Muster,CEO,max@beispiel.de\n',
    filename: 'vorlage-pipedrive.csv',
  },
  hubspot: {
    label: 'HubSpot',
    desc: 'HubSpot Company Export Format',
    csv: 'name,website,city,state,country,zip,phone,email,industry,numberofemployees,annualrevenue,linkedin_company_page,firstname,jobtitle\nBeispiel GmbH,beispiel.de,München,Bayern,Deutschland,80331,+49 89 123456,info@beispiel.de,E-Commerce,100,5000000,linkedin.com/company/beispiel,Max Muster,CEO\n',
    filename: 'vorlage-hubspot.csv',
  },
};

function downloadTemplate(key: keyof typeof TEMPLATES) {
  const t = TEMPLATES[key];
  const blob = new Blob(['﻿' + t.csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `onvero-${t.filename}`;
  a.click();
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ImportMode = 'csv' | 'paste' | 'crm';
type CrmPreset = 'pipedrive' | 'hubspot';
type Step = 'select' | 'configure' | 'map' | 'importing' | 'done';

// ─── Shared style tokens ──────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #E8ECF0',
  borderRadius: 16,
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  overflow: 'hidden',
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: '#9AA5B4',
  marginBottom: 10,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ImportPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const crmFileRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<ImportMode>('csv');
  const [step, setStep] = useState<Step>('select');
  const [dragging, setDragging] = useState(false);
  const [crmPreset, setCrmPreset] = useState<CrmPreset>('pipedrive');
  const [sourceTag, setSourceTag] = useState('');

  // CSV/CRM state
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<number, FieldKey>>({});

  // Paste state
  const [pasteText, setPasteText] = useState('');
  const [pasteRows, setPasteRows] = useState<PasteRow[]>([]);

  // Import state
  const [progress, setProgress] = useState(0);
  const [imported, setImported] = useState(0);
  const [enrichTriggered, setEnrichTriggered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadFile(file: File, preset?: string) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers: h, rows: r } = parseCsv(text);
      if (!h.length) {
        setError('CSV konnte nicht gelesen werden.');
        return;
      }
      setHeaders(h);
      setRows(r);
      setMapping(guessMapping(h, preset));
      setStep('map');
      setError(null);
    };
    reader.readAsText(file, 'utf-8');
  }

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) loadFile(file, mode === 'crm' ? crmPreset : undefined);
    },
    [mode, crmPreset]
  );

  function processPaste() {
    const parsed = parsePaste(pasteText);
    if (parsed.length === 0) {
      setError('Keine gültigen Firmennamen gefunden.');
      return;
    }
    setPasteRows(parsed);
    setError(null);
    setStep('map');
  }

  const mappedCsvRows = rows
    .map((row) => {
      const lead: Record<string, string> = {};
      Object.entries(mapping).forEach(([idx, key]) => {
        if (key !== '__skip') lead[key] = row[Number(idx)] ?? '';
      });
      return lead;
    })
    .filter((r) => r.company_name?.trim());

  const allLeads: Record<string, string>[] =
    mode === 'paste' ? pasteRows.map((r) => ({ ...r }) as Record<string, string>) : mappedCsvRows;

  const canImport = allLeads.length > 0;

  async function handleImport() {
    setStep('importing');
    setProgress(0);
    setError(null);

    const payload = allLeads.map((r) => ({
      ...r,
      source: sourceTag.trim() || (mode === 'crm' ? crmPreset : 'csv_import'),
    }));

    const BATCH = 50;
    let total = 0;

    for (let i = 0; i < payload.length; i += BATCH) {
      const batch = payload.slice(i, i + BATCH);
      const res = await fetch('/api/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: batch }),
      });
      const data = (await res.json()) as { imported?: number; enrich_triggered?: boolean; error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? 'Import fehlgeschlagen.');
        setStep('map');
        return;
      }
      total += data.imported ?? 0;
      if (data.enrich_triggered) setEnrichTriggered(true);
      setProgress(Math.round(((i + batch.length) / payload.length) * 100));
    }

    setImported(total);
    setStep('done');
  }

  function reset() {
    setStep('select');
    setHeaders([]);
    setRows([]);
    setMapping({});
    setPasteText('');
    setPasteRows([]);
    setProgress(0);
    setImported(0);
    setEnrichTriggered(false);
    setError(null);
    setSourceTag('');
  }

  const skippedCount = rows.length - mappedCsvRows.length;
  const previewLeads = allLeads.slice(0, 5);

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px',
    border: '1.5px solid #E8ECF0',
    borderRadius: 8,
    fontSize: 12,
    fontFamily: 'inherit',
    color: '#0A2540',
    background: '#fff',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };

  const stepOrder: Step[] = ['select', 'configure', 'map', 'importing', 'done'];
  const currentStepIdx = stepOrder.indexOf(step);

  return (
    <div
      style={{
        minHeight: '100%',
        background: '#F7F8FC',
        fontFamily: 'var(--font-inter), sans-serif',
        color: '#0A2540',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #EEF0FF 0%, #F0F4FF 60%, #F7F8FC 100%)',
          borderBottom: '1px solid #E8ECF0',
          padding: '28px 40px 24px',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#EEF0FF',
            border: '1px solid #C7D2FE',
            color: '#4F46E5',
            borderRadius: 99,
            padding: '4px 12px',
            fontSize: 10,
            fontWeight: 800,
            marginBottom: 16,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.1em',
          }}
        >
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4F46E5' }} />
          Lead Import
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0A2540', margin: '0 0 6px', lineHeight: 1.2 }}>
          Leads importieren & anreichern
        </h1>
        <p style={{ fontSize: 13, color: '#425466', margin: 0, lineHeight: 1.65, maxWidth: 560 }}>
          Egal ob du nur Firmennamen hast oder vollständige CRM-Daten — das System reichert alles automatisch an.
        </p>
      </div>

      {/* ── Stepper ── */}
      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid #E8ECF0',
          padding: '0 40px',
          display: 'flex',
          gap: 0,
        }}
      >
        {(
          [
            { key: 'select', label: 'Methode wählen' },
            { key: 'configure', label: mode === 'paste' ? 'Namen einfügen' : 'Datei hochladen' },
            { key: 'map', label: mode === 'paste' ? 'Vorschau' : 'Spalten zuordnen' },
            { key: 'importing', label: 'Importieren' },
          ] as const
        ).map(({ key, label }, idx) => {
          const thisIdx = stepOrder.indexOf(key);
          const isActive = step === key || (step === 'done' && key === 'importing');
          const isDone = currentStepIdx > thisIdx || step === 'done';
          return (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 22px',
                borderBottom: isActive ? '2.5px solid #4F46E5' : '2.5px solid transparent',
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: isDone && !isActive ? '#4F46E5' : isActive ? '#EEF0FF' : '#F1F5F9',
                  border: isActive ? '1.5px solid #C7D2FE' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {isDone && !isActive ? (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="2 6 5 9 10 3" />
                  </svg>
                ) : (
                  <span style={{ fontSize: 10, fontWeight: 800, color: isActive ? '#4F46E5' : '#9AA5B4' }}>
                    {idx + 1}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? '#4F46E5' : isDone ? '#425466' : '#9AA5B4',
                  whiteSpace: 'nowrap' as const,
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Content ── */}
      <div style={{ padding: '32px 40px', maxWidth: 640, margin: '0 auto' }}>
        {/* ── Step: Methode wählen ── */}
        {step === 'select' && (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
            {(
              [
                {
                  key: 'csv' as ImportMode,
                  title: 'CSV-Datei hochladen',
                  sub: 'Du hast eine Tabelle mit Firmendaten',
                  detail: 'Eigene CSV, Excel-Export oder Liste aus einem Tool. Spalten werden automatisch erkannt.',
                  iconBg: '#EEF0FF',
                  icon: (
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#4F46E5"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  ),
                },
                {
                  key: 'paste' as ImportMode,
                  title: 'Namen einfügen',
                  sub: 'Du hast nur Firmennamen oder eine Liste',
                  detail:
                    'Einfach Namen einfügen — einer pro Zeile. Onvero sucht Website, Kontakt und alle Daten automatisch.',
                  iconBg: '#ECFDF5',
                  icon: (
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#059669"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="9" y="2" width="6" height="4" rx="1" />
                      <path d="M9 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-3" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                      <line x1="8" y1="16" x2="13" y2="16" />
                    </svg>
                  ),
                },
                {
                  key: 'crm' as ImportMode,
                  title: 'Aus CRM importieren',
                  sub: 'Du exportierst aus Pipedrive oder HubSpot',
                  detail:
                    'Vordefiniertes Mapping für Pipedrive und HubSpot. CSV direkt aus dem CRM hochladen — fertig.',
                  iconBg: '#FFF7ED',
                  icon: (
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#D97706"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                  ),
                },
              ] as const
            ).map((opt) => {
              const active = mode === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => {
                    setMode(opt.key);
                    setStep('configure');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '18px 20px',
                    border: `1.5px solid ${active ? '#4F46E5' : '#E8ECF0'}`,
                    borderRadius: 14,
                    background: active ? '#EEF0FF' : '#fff',
                    cursor: 'pointer',
                    textAlign: 'left' as const,
                    fontFamily: 'inherit',
                    transition: 'all 0.12s',
                    width: '100%',
                  }}
                >
                  {/* Icon box */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: opt.iconBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {opt.icon}
                  </div>
                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0A2540', marginBottom: 2 }}>{opt.title}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#4F46E5', marginBottom: 4 }}>{opt.sub}</div>
                    <div style={{ fontSize: 11, color: '#697386', lineHeight: 1.5 }}>{opt.detail}</div>
                  </div>
                  {/* Arrow */}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={active ? '#4F46E5' : '#C7D2FE'}
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              );
            })}

            {/* Templates */}
            <div style={{ ...card, marginTop: 4 }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0A2540' }}>Vorlagen</div>
                <div style={{ fontSize: 11, color: '#697386', marginTop: 2 }}>
                  CSV-Vorlagen herunterladen und befüllen
                </div>
              </div>
              <div style={{ padding: '14px 20px', display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                {(
                  Object.entries(TEMPLATES) as [keyof typeof TEMPLATES, (typeof TEMPLATES)[keyof typeof TEMPLATES]][]
                ).map(([key, t]) => (
                  <button
                    key={key}
                    onClick={() => downloadTemplate(key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      background: '#F7F8FC',
                      border: '1.5px solid #E8ECF0',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#0A2540',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#4F46E5"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    {t.label}
                    <span style={{ fontSize: 10, color: '#9AA5B4', fontWeight: 600 }}>{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step: CSV / CRM Upload ── */}
        {step === 'configure' && (mode === 'csv' || mode === 'crm') && (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
            {/* CRM selector */}
            {mode === 'crm' && (
              <div style={card}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0A2540' }}>CRM auswählen</div>
                </div>
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                    {(['pipedrive', 'hubspot'] as CrmPreset[]).map((crm) => {
                      const active = crmPreset === crm;
                      const cfg: Record<CrmPreset, { color: string; label: string }> = {
                        pipedrive: { color: '#1F7A4D', label: 'Pipedrive' },
                        hubspot: { color: '#E05C1A', label: 'HubSpot' },
                      };
                      return (
                        <button
                          key={crm}
                          onClick={() => setCrmPreset(crm)}
                          style={{
                            flex: 1,
                            padding: '12px 16px',
                            border: `2px solid ${active ? cfg[crm].color : '#E8ECF0'}`,
                            borderRadius: 10,
                            background: active ? '#F0FDF4' : '#fff',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              background: cfg[crm].color,
                            }}
                          />
                          <span style={{ fontSize: 14, fontWeight: 800, color: active ? '#0A2540' : '#697386' }}>
                            {cfg[crm].label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 11, color: '#697386', lineHeight: 1.6 }}>
                    {crmPreset === 'pipedrive'
                      ? 'Gehe in Pipedrive zu Unternehmen → Exportieren → CSV. Die Spalten werden automatisch gemappt.'
                      : 'Gehe in HubSpot zu Unternehmen → Exportieren → CSV/Excel. Alle Standard-Felder werden erkannt.'}
                  </div>
                </div>
              </div>
            )}

            {/* Drop zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => (mode === 'crm' ? crmFileRef : fileRef).current?.click()}
              style={{
                border: `2px dashed ${dragging ? '#4F46E5' : '#C7D2FE'}`,
                borderRadius: 16,
                padding: '52px 32px',
                background: dragging ? '#EEF0FF' : '#fff',
                textAlign: 'center' as const,
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: '#EEF0FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#4F46E5"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0A2540', marginBottom: 6 }}>
                CSV-Datei hierher ziehen
              </div>
              <div style={{ fontSize: 13, color: '#697386', marginBottom: 20, lineHeight: 1.5 }}>
                oder klicken zum Auswählen · max. 500 Zeilen · UTF-8 oder Latin-1
              </div>
              <div
                style={{
                  display: 'inline-block',
                  padding: '10px 24px',
                  background: '#4F46E5',
                  color: '#fff',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                Datei auswählen
              </div>
              <input
                ref={mode === 'crm' ? crmFileRef : fileRef}
                type="file"
                accept=".csv,text/csv,.xlsx,.xls"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) loadFile(f, mode === 'crm' ? crmPreset : undefined);
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  padding: '14px 18px',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 12,
                  fontSize: 13,
                  color: '#DC2626',
                  fontWeight: 600,
                }}
              >
                {error}
              </div>
            )}

            <button
              onClick={() => setStep('select')}
              style={{
                padding: '10px 20px',
                background: '#fff',
                border: '1.5px solid #E8ECF0',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                color: '#697386',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Zurück zur Auswahl
            </button>
          </div>
        )}

        {/* ── Step: Namen einfügen ── */}
        {step === 'configure' && mode === 'paste' && (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
            <div style={card}>
              <div
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid #F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0A2540' }}>Firmennamen einfügen</div>
                  <div style={{ fontSize: 11, color: '#697386', marginTop: 2 }}>
                    Ein Name pro Zeile — optional mit Website oder Stadt dahinter
                  </div>
                </div>
                {pasteText.trim().length > 2 && (
                  <div
                    style={{
                      background: '#EEF0FF',
                      border: '1px solid #C7D2FE',
                      borderRadius: 8,
                      padding: '4px 10px',
                      fontSize: 12,
                      fontWeight: 800,
                      color: '#4F46E5',
                    }}
                  >
                    {pasteText.split('\n').filter((l) => l.trim().length > 2).length} erkannt
                  </div>
                )}
              </div>
              <div style={{ padding: '16px 20px' }}>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={
                    'Fashion House GmbH\nSportGear Online, sportgear.de\nTechDirect GmbH, Berlin\n\nOder aus Excel kopieren — jede Zeile wird ein Lead.'
                  }
                  rows={12}
                  style={{
                    ...inputStyle,
                    resize: 'vertical' as const,
                    lineHeight: 1.8,
                    fontSize: 13,
                    padding: '12px 14px',
                    fontFamily: 'monospace',
                    borderRadius: 10,
                  }}
                />
                <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                  {[
                    { label: 'Name', code: true },
                    { label: 'Name, Website', code: true },
                    { label: 'Name, Stadt', code: true },
                  ].map((f) => (
                    <span
                      key={f.label}
                      style={{
                        background: '#F1F5F9',
                        border: '1px solid #E8ECF0',
                        borderRadius: 5,
                        padding: '2px 7px',
                        fontSize: 10,
                        fontFamily: 'monospace',
                        color: '#425466',
                        fontWeight: 600,
                      }}
                    >
                      {f.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div
                style={{
                  padding: '14px 18px',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 12,
                  fontSize: 13,
                  color: '#DC2626',
                  fontWeight: 600,
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setStep('select')}
                style={{
                  padding: '11px 20px',
                  background: '#fff',
                  border: '1.5px solid #E8ECF0',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#697386',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Zurück
              </button>
              <button
                onClick={processPaste}
                disabled={pasteText.trim().length < 3}
                style={{
                  flex: 1,
                  padding: '11px 20px',
                  background: pasteText.trim().length >= 3 ? '#4F46E5' : '#E8ECF0',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 800,
                  color: pasteText.trim().length >= 3 ? '#fff' : '#B0BAC9',
                  cursor: pasteText.trim().length >= 3 ? 'pointer' : 'default',
                  fontFamily: 'inherit',
                }}
              >
                Vorschau anzeigen
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Map / Preview ── */}
        {step === 'map' && (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
            {/* Stats row */}
            <div style={{ display: 'flex', gap: 10 }}>
              {mode === 'paste' ? (
                <>
                  {[
                    { value: pasteRows.length, label: 'Erkannte Firmen', bg: '#EEF0FF', color: '#4F46E5' },
                    {
                      value: pasteRows.filter((r) => r.website).length,
                      label: 'Mit Website',
                      bg: '#ECFDF5',
                      color: '#059669',
                    },
                    {
                      value: pasteRows.filter((r) => !r.website).length,
                      label: 'Wird angereichert',
                      bg: '#F0F9FF',
                      color: '#0284C7',
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      style={{
                        flex: 1,
                        background: s.bg,
                        borderRadius: 12,
                        padding: '14px 16px',
                      }}
                    >
                      <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: s.color,
                          opacity: 0.7,
                          textTransform: 'uppercase' as const,
                          letterSpacing: '0.08em',
                          marginTop: 4,
                        }}
                      >
                        {s.label}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {[
                    { value: rows.length, label: 'Zeilen erkannt', bg: '#EEF0FF', color: '#4F46E5' },
                    { value: mappedCsvRows.length, label: 'Bereit zum Import', bg: '#ECFDF5', color: '#059669' },
                    { value: skippedCount, label: 'Ohne Firmenname', bg: '#FFF7ED', color: '#D97706' },
                  ].map((s) => (
                    <div
                      key={s.label}
                      style={{
                        flex: 1,
                        background: s.bg,
                        borderRadius: 12,
                        padding: '14px 16px',
                      }}
                    >
                      <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: s.color,
                          opacity: 0.7,
                          textTransform: 'uppercase' as const,
                          letterSpacing: '0.08em',
                          marginTop: 4,
                        }}
                      >
                        {s.label}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Column mapping (CSV / CRM only) */}
            {mode !== 'paste' && (
              <div style={card}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0A2540' }}>Spalten zuordnen</div>
                  <div style={{ fontSize: 11, color: '#697386', marginTop: 2 }}>
                    {mode === 'crm'
                      ? `Vordefiniertes Mapping für ${crmPreset === 'pipedrive' ? 'Pipedrive' : 'HubSpot'} — überprüfe und passe bei Bedarf an.`
                      : 'Ordne jede CSV-Spalte dem richtigen Lead-Feld zu. Bekannte Spalten werden automatisch erkannt.'}
                  </div>
                </div>
                <div style={{ padding: '8px 0' }}>
                  {headers.map((header, i) => {
                    const isSkipped = !mapping[i] || mapping[i] === '__skip';
                    const example = rows[0]?.[i];
                    return (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '9px 20px',
                          borderLeft: `3px solid ${!isSkipped ? '#4F46E5' : 'transparent'}`,
                          borderBottom: i < headers.length - 1 ? '1px solid #F1F5F9' : 'none',
                          background: !isSkipped ? '#FAFBFF' : '#fff',
                        }}
                      >
                        <div
                          style={{
                            width: 140,
                            fontSize: 12,
                            fontWeight: 700,
                            color: isSkipped ? '#B0BAC9' : '#0A2540',
                            background: '#F7F8FC',
                            padding: '6px 10px',
                            borderRadius: 7,
                            border: '1px solid #E8ECF0',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap' as const,
                            flexShrink: 0,
                          }}
                        >
                          {header}
                        </div>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#C7D2FE"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                        <select
                          value={mapping[i] ?? '__skip'}
                          onChange={(e) => setMapping((prev) => ({ ...prev, [i]: e.target.value as FieldKey }))}
                          style={{
                            flex: 1,
                            padding: '7px 10px',
                            border: `1.5px solid ${!isSkipped ? '#C7D2FE' : '#E8ECF0'}`,
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            color: !isSkipped ? '#4F46E5' : '#697386',
                            background: !isSkipped ? '#EEF0FF' : '#fff',
                            fontFamily: 'inherit',
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {FIELDS.map((f) => (
                            <option key={f.key} value={f.key}>
                              {f.key === '__skip'
                                ? '— Ignorieren'
                                : `${f.group ? `${f.group}: ` : ''}${f.label}${f.required ? ' *' : ''}`}
                            </option>
                          ))}
                        </select>
                        <div
                          style={{
                            fontSize: 11,
                            color: '#9AA5B4',
                            width: 120,
                            flexShrink: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap' as const,
                            fontStyle: 'italic' as const,
                          }}
                        >
                          {example ?? '—'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Preview table */}
            {previewLeads.length > 0 && (
              <div style={card}>
                <div
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid #F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0A2540' }}>Vorschau</div>
                  <div style={{ fontSize: 11, color: '#697386' }}>
                    Erste {previewLeads.length} von{' '}
                    <span style={{ fontWeight: 700, color: '#0A2540' }}>{allLeads.length}</span> Leads
                  </div>
                </div>
                <div style={{ overflowX: 'auto' as const }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 12 }}>
                    <thead>
                      <tr>
                        {['Firmenname', 'Website', 'Stadt', 'Telefon', 'Branche', 'Ansprechpartner'].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: '9px 14px',
                              background: '#F7F8FC',
                              borderBottom: '1px solid #E8ECF0',
                              textAlign: 'left' as const,
                              fontWeight: 800,
                              color: '#9AA5B4',
                              fontSize: 10,
                              textTransform: 'uppercase' as const,
                              letterSpacing: '0.08em',
                              whiteSpace: 'nowrap' as const,
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewLeads.map((row, i) => (
                        <tr
                          key={i}
                          style={{
                            background: i % 2 === 0 ? '#fff' : '#FAFBFF',
                            borderBottom: i < previewLeads.length - 1 ? '1px solid #F1F5F9' : 'none',
                          }}
                        >
                          <td style={{ padding: '9px 14px', fontWeight: 700, color: '#0A2540', fontSize: 12 }}>
                            {row.company_name || '—'}
                          </td>
                          <td style={{ padding: '9px 14px', color: '#697386', fontSize: 12 }}>
                            {row.website || (
                              <span style={{ color: '#C7D2FE', fontStyle: 'italic' as const }}>wird gesucht</span>
                            )}
                          </td>
                          <td style={{ padding: '9px 14px', color: '#697386', fontSize: 12 }}>{row.city || '—'}</td>
                          <td style={{ padding: '9px 14px', color: '#697386', fontSize: 12 }}>{row.phone || '—'}</td>
                          <td style={{ padding: '9px 14px', color: '#697386', fontSize: 12 }}>{row.industry || '—'}</td>
                          <td style={{ padding: '9px 14px', color: '#697386', fontSize: 12 }}>
                            {row.contact_name || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Source tag */}
            <div style={card}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0A2540' }}>Quelle (optional)</div>
                <div style={{ fontSize: 11, color: '#697386', marginTop: 2 }}>
                  Woher kommen diese Leads? Erscheint als Quelle in der Leadliste.
                </div>
              </div>
              <div style={{ padding: '14px 20px' }}>
                <input
                  type="text"
                  value={sourceTag}
                  onChange={(e) => setSourceTag(e.target.value)}
                  placeholder={mode === 'crm' ? crmPreset : 'z.B. Messe München, Cold Outreach Liste, LinkedIn'}
                  style={inputStyle}
                />
              </div>
            </div>

            {error && (
              <div
                style={{
                  padding: '14px 18px',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 12,
                  fontSize: 13,
                  color: '#DC2626',
                  fontWeight: 600,
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setStep('configure')}
                style={{
                  padding: '13px 20px',
                  background: '#fff',
                  border: '1.5px solid #E8ECF0',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#697386',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Zurück
              </button>
              <button
                onClick={handleImport}
                disabled={!canImport}
                style={{
                  flex: 1,
                  padding: '13px 20px',
                  background: canImport ? '#4F46E5' : '#E8ECF0',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 800,
                  color: canImport ? '#fff' : '#B0BAC9',
                  cursor: canImport ? 'pointer' : 'default',
                  fontFamily: 'inherit',
                }}
              >
                {allLeads.length} Leads importieren & anreichern
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Importing ── */}
        {step === 'importing' && (
          <div
            style={{
              ...card,
              padding: '60px 40px',
              textAlign: 'center' as const,
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: '#EEF0FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4F46E5"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ animation: 'spin 1s linear infinite' }}
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0A2540', marginBottom: 6 }}>
              Leads werden importiert...
            </div>
            <div style={{ fontSize: 13, color: '#697386', marginBottom: 28, lineHeight: 1.6 }}>
              {progress}% — {Math.round((progress / 100) * allLeads.length)} von {allLeads.length} Leads
            </div>
            <div
              style={{
                width: '100%',
                maxWidth: 400,
                height: 8,
                background: '#E8ECF0',
                borderRadius: 99,
                margin: '0 auto',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #4F46E5, #7C3AED)',
                  borderRadius: 99,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        )}

        {/* ── Step: Done ── */}
        {step === 'done' && (
          <div
            style={{
              ...card,
              border: '1.5px solid #6EE7B7',
              padding: '56px 40px',
              textAlign: 'center' as const,
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: '#ECFDF5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#059669"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0A2540', marginBottom: 10 }}>
              {imported} Leads importiert
            </div>
            <div
              style={{
                fontSize: 13,
                color: '#697386',
                lineHeight: 1.65,
                maxWidth: 420,
                margin: '0 auto',
                marginBottom: 16,
              }}
            >
              {enrichTriggered
                ? 'Die Datenergänzung läuft — Website, Kontakte, Shop-System und alle verfügbaren Daten werden automatisch ergänzt.'
                : 'Die Leads wurden importiert und stehen sofort in der Lead-Liste bereit.'}
            </div>
            {enrichTriggered && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '6px 14px',
                  background: '#EEF0FF',
                  border: '1px solid #C7D2FE',
                  color: '#4F46E5',
                  borderRadius: 99,
                  fontSize: 12,
                  fontWeight: 800,
                  marginBottom: 32,
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#4F46E5',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                />
                KI-Analyse läuft
              </div>
            )}
            {!enrichTriggered && <div style={{ marginBottom: 32 }} />}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={reset}
                style={{
                  padding: '11px 22px',
                  background: '#fff',
                  border: '1.5px solid #E8ECF0',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#697386',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Weiteren Import
              </button>
              <button
                onClick={() => router.push('/intelligence/leads')}
                style={{
                  padding: '11px 24px',
                  background: '#4F46E5',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 800,
                  color: '#fff',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Zu den Leads
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        input[type=date]::-webkit-calendar-picker-indicator { opacity: 0.4; cursor: pointer; }
      `}</style>
    </div>
  );
}
