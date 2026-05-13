'use client';

import { useState, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Format = 'csv' | 'excel' | 'json' | 'pipedrive' | 'hubspot';
type StatusFilter = 'alle' | 'hot' | 'warm' | 'cold';

interface LeadRow {
  id: string;
  tenant_id?: string;
  company_name: string;
  website?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
  phone?: string;
  email?: string;
  industry?: string;
  sub_industry?: string;
  employees?: string;
  revenue?: string;
  legal_form?: string;
  founded?: string;
  hrb?: string;
  linkedin_url?: string;
  xing_url?: string;
  status?: string;
  fit_score?: number;
  fit_sub?: Record<string, number>;
  tier?: string;
  next_action?: string;
  source?: string;
  source_detail?: string;
  shop_system?: string;
  carrier?: string;
  erp_system?: string;
  wms_system?: string;
  l1?: boolean;
  l2?: boolean;
  l3?: boolean;
  l4?: boolean;
  contact_name?: string;
  contact_role?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_linkedin?: string;
  description?: string;
  ai_summary?: string;
  enrichment_status?: string;
  is_excluded?: boolean;
  exclusion_reason?: string;
  created_at?: string;
  updated_at?: string;
}

interface FieldOption {
  key: keyof LeadRow;
  label: string;
  group: string;
  default: boolean;
  crm?: { pipedrive?: string; hubspot?: string };
}

// ─── Field definitions ────────────────────────────────────────────────────────

const FIELD_OPTIONS: FieldOption[] = [
  // Identifikation
  {
    key: 'company_name',
    label: 'Firmenname',
    group: 'Identifikation',
    default: true,
    crm: { pipedrive: 'name', hubspot: 'name' },
  },
  {
    key: 'website',
    label: 'Website',
    group: 'Identifikation',
    default: true,
    crm: { pipedrive: 'web', hubspot: 'website' },
  },
  {
    key: 'linkedin_url',
    label: 'LinkedIn',
    group: 'Identifikation',
    default: true,
    crm: { pipedrive: 'linkedin', hubspot: 'linkedin_company_page' },
  },
  { key: 'xing_url', label: 'Xing', group: 'Identifikation', default: false },
  { key: 'hrb', label: 'Handelsregister', group: 'Identifikation', default: false },
  { key: 'legal_form', label: 'Rechtsform', group: 'Identifikation', default: false },
  { key: 'founded', label: 'Gegründet', group: 'Identifikation', default: false },

  // Adresse
  { key: 'city', label: 'Stadt', group: 'Adresse', default: true, crm: { pipedrive: 'address_city', hubspot: 'city' } },
  {
    key: 'state',
    label: 'Bundesland',
    group: 'Adresse',
    default: false,
    crm: { pipedrive: 'address_state', hubspot: 'state' },
  },
  {
    key: 'zip',
    label: 'PLZ',
    group: 'Adresse',
    default: false,
    crm: { pipedrive: 'address_postal_code', hubspot: 'zip' },
  },
  {
    key: 'country',
    label: 'Land',
    group: 'Adresse',
    default: false,
    crm: { pipedrive: 'address_country', hubspot: 'country' },
  },

  // Kontakt
  {
    key: 'phone',
    label: 'Telefon (Firma)',
    group: 'Kontakt',
    default: true,
    crm: { pipedrive: 'phone', hubspot: 'phone' },
  },
  {
    key: 'email',
    label: 'E-Mail (Firma)',
    group: 'Kontakt',
    default: false,
    crm: { pipedrive: 'email', hubspot: 'email' },
  },
  {
    key: 'contact_name',
    label: 'Ansprechpartner',
    group: 'Kontakt',
    default: true,
    crm: { pipedrive: 'contact_person', hubspot: 'firstname' },
  },
  {
    key: 'contact_role',
    label: 'Position',
    group: 'Kontakt',
    default: true,
    crm: { pipedrive: 'job_title', hubspot: 'jobtitle' },
  },
  {
    key: 'contact_email',
    label: 'Ansprechpartner E-Mail',
    group: 'Kontakt',
    default: true,
    crm: { pipedrive: 'person_email', hubspot: 'email' },
  },
  { key: 'contact_phone', label: 'Ansprechpartner Telefon', group: 'Kontakt', default: false },
  { key: 'contact_linkedin', label: 'Ansprechpartner LinkedIn', group: 'Kontakt', default: false },

  // Firmographics
  {
    key: 'industry',
    label: 'Branche',
    group: 'Firmographics',
    default: true,
    crm: { pipedrive: 'industry', hubspot: 'industry' },
  },
  { key: 'sub_industry', label: 'Unterbranche', group: 'Firmographics', default: false },
  {
    key: 'employees',
    label: 'Mitarbeiter',
    group: 'Firmographics',
    default: true,
    crm: { pipedrive: 'num_employees', hubspot: 'numberofemployees' },
  },
  {
    key: 'revenue',
    label: 'Umsatz',
    group: 'Firmographics',
    default: true,
    crm: { pipedrive: 'annual_revenue', hubspot: 'annualrevenue' },
  },

  // Technographics
  { key: 'shop_system', label: 'Shop-System', group: 'Technographics', default: true },
  { key: 'carrier', label: 'Logistikpartner', group: 'Technographics', default: true },
  { key: 'erp_system', label: 'ERP-System', group: 'Technographics', default: false },
  { key: 'wms_system', label: 'WMS-System', group: 'Technographics', default: false },

  // Scoring
  {
    key: 'fit_score',
    label: 'Fit-Score (0–100)',
    group: 'Scoring',
    default: true,
    crm: { pipedrive: 'deal_value', hubspot: 'hs_lead_status' },
  },
  { key: 'tier', label: 'Tier (A/B/C)', group: 'Scoring', default: true },
  {
    key: 'status',
    label: 'Status (hot/warm/cold)',
    group: 'Scoring',
    default: true,
    crm: { pipedrive: 'status', hubspot: 'lead_status' },
  },
  { key: 'next_action', label: 'Nächste Aktion', group: 'Scoring', default: false },

  // Datenanreicherung
  { key: 'l1', label: 'Stammdaten', group: 'Datenebenen', default: false },
  { key: 'l2', label: 'Firmendaten', group: 'Datenebenen', default: false },
  { key: 'l3', label: 'Technologie', group: 'Datenebenen', default: false },
  { key: 'l4', label: 'Kaufsignale & Kontakte', group: 'Datenebenen', default: false },
  { key: 'enrichment_status', label: 'Datenstatus', group: 'Datenebenen', default: false },

  // KI & Notizen
  {
    key: 'description',
    label: 'Beschreibung',
    group: 'KI & Notizen',
    default: false,
    crm: { pipedrive: 'description', hubspot: 'description' },
  },
  { key: 'ai_summary', label: 'KI-Zusammenfassung', group: 'KI & Notizen', default: false },

  // Metadaten
  {
    key: 'source',
    label: 'Quelle',
    group: 'Metadaten',
    default: false,
    crm: { pipedrive: 'source', hubspot: 'hs_lead_status' },
  },
  { key: 'source_detail', label: 'Quellendetail', group: 'Metadaten', default: false },
  {
    key: 'created_at',
    label: 'Erstellt am',
    group: 'Metadaten',
    default: false,
    crm: { pipedrive: 'add_time', hubspot: 'createdate' },
  },
  {
    key: 'updated_at',
    label: 'Zuletzt aktualisiert',
    group: 'Metadaten',
    default: false,
    crm: { pipedrive: 'update_time', hubspot: 'lastmodifieddate' },
  },
];

const FIELD_GROUPS = [
  'Identifikation',
  'Adresse',
  'Kontakt',
  'Firmographics',
  'Technographics',
  'Scoring',
  'Datenebenen',
  'KI & Notizen',
  'Metadaten',
];

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string; border: string }> = {
  alle: { label: 'Alle', bg: '#EEF0FF', color: '#4F46E5', border: '#4F46E5' },
  hot: { label: 'Hot', bg: '#FEF2F2', color: '#DC2626', border: '#DC2626' },
  warm: { label: 'Warm', bg: '#FFF7ED', color: '#D97706', border: '#D97706' },
  cold: { label: 'Kalt', bg: '#EFF6FF', color: '#2563EB', border: '#2563EB' },
};

const TIER_LABELS: Record<string, { label: string }> = {
  alle: { label: 'Alle Tiers' },
  A: { label: 'Tier A' },
  B: { label: 'Tier B' },
  C: { label: 'Tier C' },
};

const SOURCE_OPTIONS = ['alle', 'csv_import', 'manual', 'n8n_generated', 'apollo', 'web_scraping'];
const SOURCE_LABELS: Record<string, string> = {
  alle: 'Alle Quellen',
  csv_import: 'CSV Import',
  manual: 'Manuell',
  n8n_generated: 'KI-generiert',
  apollo: 'Datenanbieter',
  web_scraping: 'Web-Analyse',
};

const FORMAT_OPTIONS: {
  key: Format;
  label: string;
  ext: string;
  desc: string;
  badge?: string;
  badgeColor?: string;
}[] = [
  { key: 'csv', label: 'CSV', ext: '.csv', desc: 'Universal — Google Sheets, Numbers, alle CRMs' },
  { key: 'excel', label: 'Excel', ext: '.csv', desc: 'CSV mit UTF-8 BOM — direkt in Excel öffnen' },
  { key: 'json', label: 'JSON', ext: '.json', desc: 'Strukturierte Daten für APIs und Webhooks' },
  {
    key: 'pipedrive',
    label: 'Pipedrive',
    ext: '.csv',
    desc: 'Optimierte Spalten für Pipedrive-Import',
    badge: 'CRM',
    badgeColor: '#1F7A4D',
  },
  {
    key: 'hubspot',
    label: 'HubSpot',
    ext: '.csv',
    desc: 'HubSpot-kompatible Feldnamen für Company Import',
    badge: 'CRM',
    badgeColor: '#E05C1A',
  },
];

// ─── Conversion helpers ───────────────────────────────────────────────────────

function remapForCrm(lead: LeadRow, fmt: Format, fields: (keyof LeadRow)[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of fields) {
    const fieldDef = FIELD_OPTIONS.find((o) => o.key === f);
    let colName: string = fieldDef?.label ?? String(f);
    if (fmt === 'pipedrive' && fieldDef?.crm?.pipedrive) colName = fieldDef.crm.pipedrive;
    if (fmt === 'hubspot' && fieldDef?.crm?.hubspot) colName = fieldDef.crm.hubspot;
    const raw = lead[f];
    if (typeof raw === 'boolean') out[colName] = raw ? 'ja' : 'nein';
    else if (raw === null || raw === undefined) out[colName] = '';
    else if (typeof raw === 'object') out[colName] = JSON.stringify(raw);
    else out[colName] = String(raw);
  }
  return out;
}

function toCsv(leads: LeadRow[], fields: (keyof LeadRow)[], fmt: Format): string {
  if (leads.length === 0) return '';
  const rows = leads.map((l) => remapForCrm(l, fmt, fields));
  const headers = Object.keys(rows[0]);
  const escape = (v: string) =>
    v.includes(',') || v.includes('"') || v.includes('\n') ? `"${v.replace(/"/g, '""')}"` : v;
  const header = headers.map(escape).join(',');
  const body = rows.map((r) => headers.map((h) => escape(r[h] ?? '')).join(','));
  return [header, ...body].join('\r\n');
}

function toJson(leads: LeadRow[], fields: (keyof LeadRow)[]): string {
  return JSON.stringify(
    leads.map((lead) => {
      const obj: Record<string, unknown> = {};
      for (const f of fields) {
        const raw = lead[f];
        obj[f] = raw === undefined ? null : raw;
      }
      return obj;
    }),
    null,
    2
  );
}

function downloadBlob(content: string, filename: string, mime: string, bom = false) {
  const bytes = bom ? '﻿' + content : content;
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function scoreLabel(score: number | undefined): string {
  if (!score) return '';
  if (score >= 80) return 'Hoch';
  if (score >= 50) return 'Mittel';
  return 'Niedrig';
}

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

function chipStyle(
  active: boolean,
  customBg?: string,
  customColor?: string,
  customBorder?: string
): React.CSSProperties {
  return {
    padding: '5px 12px',
    border: `1.5px solid ${active ? (customBorder ?? '#4F46E5') : '#E8ECF0'}`,
    borderRadius: 8,
    background: active ? (customBg ?? '#EEF0FF') : '#F7F8FC',
    color: active ? (customColor ?? '#4F46E5') : '#697386',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  };
}

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExportPage() {
  const [format, setFormat] = useState<Format>('csv');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('alle');
  const [tierFilter, setTierFilter] = useState<string>('alle');
  const [sourceFilter, setSourceFilter] = useState<string>('alle');
  const [scoreMin, setScoreMin] = useState<number>(0);
  const [scoreMax, setScoreMax] = useState<number>(100);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [layerFilter, setLayerFilter] = useState<string>('alle');
  const [selectedFields, setSelectedFields] = useState<Set<keyof LeadRow>>(
    new Set(FIELD_OPTIONS.filter((o) => o.default).map((o) => o.key))
  );
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState<{ count: number; filename: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/leads')
      .then((r) => r.json())
      .then((d) => setLeads(d.leads ?? []))
      .catch(() => setError('Leads konnten nicht geladen werden.'))
      .finally(() => setLoadingLeads(false));
  }, []);

  function toggleField(key: keyof LeadRow) {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function selectGroup(group: string) {
    const groupKeys = FIELD_OPTIONS.filter((o) => o.group === group).map((o) => o.key);
    setSelectedFields((prev) => {
      const next = new Set(prev);
      const allActive = groupKeys.every((k) => next.has(k));
      if (allActive) {
        groupKeys.forEach((k) => {
          if (next.size > 1) next.delete(k);
        });
      } else {
        groupKeys.forEach((k) => next.add(k));
      }
      return next;
    });
  }

  function selectPreset(preset: 'minimal' | 'full' | 'crm') {
    if (preset === 'minimal') {
      setSelectedFields(new Set(['company_name', 'website', 'city', 'phone', 'status', 'fit_score']));
    } else if (preset === 'full') {
      setSelectedFields(new Set(FIELD_OPTIONS.map((o) => o.key)));
    } else {
      setSelectedFields(new Set(FIELD_OPTIONS.filter((o) => !!o.crm).map((o) => o.key)));
    }
  }

  const filteredLeads = leads.filter((l) => {
    if (statusFilter !== 'alle' && l.status !== statusFilter) return false;
    if (tierFilter !== 'alle' && l.tier !== tierFilter) return false;
    if (sourceFilter !== 'alle' && l.source !== sourceFilter) return false;
    if ((l.fit_score ?? 0) < scoreMin || (l.fit_score ?? 0) > scoreMax) return false;
    if (dateFrom && l.created_at && l.created_at < dateFrom) return false;
    if (dateTo && l.created_at && l.created_at > dateTo + 'T23:59:59') return false;
    if (layerFilter !== 'alle') {
      if (layerFilter === 'l1' && !l.l1) return false;
      if (layerFilter === 'l2' && !l.l2) return false;
      if (layerFilter === 'l3' && !l.l3) return false;
      if (layerFilter === 'l4' && !l.l4) return false;
    }
    return true;
  });

  async function handleExport() {
    setExporting(true);
    setDone(null);
    setError(null);

    try {
      if (filteredLeads.length === 0) {
        setError('Keine Leads gefunden für diese Filtereinstellungen.');
        return;
      }

      const fields = FIELD_OPTIONS.filter((o) => selectedFields.has(o.key)).map((o) => o.key);
      const date = new Date().toISOString().slice(0, 10);
      const suffix = statusFilter !== 'alle' ? `-${statusFilter}` : '';

      if (format === 'json') {
        const content = toJson(filteredLeads, fields);
        const filename = `onvero-leads${suffix}-${date}.json`;
        downloadBlob(content, filename, 'application/json');
        setDone({ count: filteredLeads.length, filename });
      } else {
        const content = toCsv(filteredLeads, fields, format);
        const filename = `onvero-leads${suffix}-${date}.csv`;
        downloadBlob(content, filename, 'text/csv;charset=utf-8;', format === 'excel');
        setDone({ count: filteredLeads.length, filename });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export fehlgeschlagen.');
    } finally {
      setExporting(false);
    }
  }

  const canExport = filteredLeads.length > 0 && !exporting && !loadingLeads;

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
          Lead Export
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0A2540', margin: '0 0 6px', lineHeight: 1.2 }}>
          Leads exportieren
        </h1>
        <p style={{ fontSize: 13, color: '#425466', margin: '0 0 22px', lineHeight: 1.65, maxWidth: 560 }}>
          Wähle Format, Filter und Felder — alle gesammelten Daten stehen dir vollständig zur Verfügung.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { value: loadingLeads ? '—' : String(leads.length), label: 'Leads gesamt', color: '#0A2540' },
            { value: loadingLeads ? '—' : String(filteredLeads.length), label: 'Treffen Filter', color: '#4F46E5' },
            { value: String(selectedFields.size), label: 'Felder aktiv', color: '#059669' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: 'rgba(255,255,255,0.85)',
                border: '1px solid #E8ECF0',
                borderRadius: 12,
                padding: '10px 20px',
                display: 'flex',
                flexDirection: 'column' as const,
                gap: 3,
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: '#697386', fontWeight: 600 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div
        style={{
          padding: '28px 40px',
          maxWidth: 720,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column' as const,
          gap: 12,
        }}
      >
        {/* Format */}
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
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0A2540' }}>Format</div>
            <div style={{ fontSize: 11, color: '#697386' }}>Wähle das Ausgabeformat</div>
          </div>
          <div style={{ padding: '12px', display: 'flex', gap: 6 }}>
            {FORMAT_OPTIONS.map((opt) => {
              const active = format === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setFormat(opt.key)}
                  style={{
                    flex: 1,
                    padding: '10px 6px',
                    border: `1.5px solid ${active ? '#4F46E5' : 'transparent'}`,
                    borderRadius: 10,
                    background: active ? '#EEF0FF' : '#F7F8FC',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'center' as const,
                    transition: 'all 0.12s',
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: active ? '#4F46E5' : '#0A2540',
                      marginBottom: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                    }}
                  >
                    {opt.label}
                    {opt.badge && (
                      <span
                        style={{
                          fontSize: 8,
                          fontWeight: 800,
                          color: '#fff',
                          background: opt.badgeColor,
                          padding: '1px 4px',
                          borderRadius: 3,
                          textTransform: 'uppercase' as const,
                        }}
                      >
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: '#9AA5B4', fontWeight: 600 }}>{opt.ext}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter */}
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
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0A2540' }}>Filter</div>
            <button
              onClick={() => {
                setStatusFilter('alle');
                setTierFilter('alle');
                setSourceFilter('alle');
                setScoreMin(0);
                setScoreMax(100);
                setDateFrom('');
                setDateTo('');
                setLayerFilter('alle');
              }}
              style={{
                padding: '4px 10px',
                border: '1px solid #E8ECF0',
                borderRadius: 6,
                background: '#F7F8FC',
                color: '#697386',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Zurücksetzen
            </button>
          </div>

          {/* Row 1: Status + Tier */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #F1F5F9',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 24,
            }}
          >
            <div>
              <div style={sectionLabelStyle}>Status</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const }}>
                {(['alle', 'hot', 'warm', 'cold'] as StatusFilter[]).map((s) => {
                  const c = STATUS_LABELS[s];
                  const active = statusFilter === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      style={chipStyle(active, c.bg, c.color, c.border)}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div style={sectionLabelStyle}>Tier</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const }}>
                {Object.entries(TIER_LABELS).map(([key, t]) => (
                  <button key={key} onClick={() => setTierFilter(key)} style={chipStyle(tierFilter === key)}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Score + Source */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #F1F5F9',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 24,
            }}
          >
            <div>
              <div style={sectionLabelStyle}>
                Fit-Score: {scoreMin} – {scoreMax}
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={scoreMin}
                  onChange={(e) => setScoreMin(Math.min(Number(e.target.value), scoreMax))}
                  style={{ ...inputStyle, width: '50%' }}
                  placeholder="Min"
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={scoreMax}
                  onChange={(e) => setScoreMax(Math.max(Number(e.target.value), scoreMin))}
                  style={{ ...inputStyle, width: '50%' }}
                  placeholder="Max"
                />
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[
                  { label: '80+', min: 80, max: 100 },
                  { label: '50–79', min: 50, max: 79 },
                  { label: 'Alle', min: 0, max: 100 },
                ].map((p) => (
                  <button
                    key={p.label}
                    onClick={() => {
                      setScoreMin(p.min);
                      setScoreMax(p.max);
                    }}
                    style={{
                      padding: '3px 8px',
                      border: '1px solid #E8ECF0',
                      borderRadius: 5,
                      background: '#F7F8FC',
                      color: '#697386',
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={sectionLabelStyle}>Quelle</div>
              <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} style={inputStyle}>
                {SOURCE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {SOURCE_LABELS[s] ?? s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Zeitraum + Datenebene */}
          <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <div style={sectionLabelStyle}>Zeitraum</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  style={{ ...inputStyle, width: '50%' }}
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  style={{ ...inputStyle, width: '50%' }}
                />
              </div>
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                  }}
                  style={{
                    marginTop: 6,
                    border: 'none',
                    background: 'none',
                    color: '#4F46E5',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  Datum zurücksetzen
                </button>
              )}
            </div>
            <div>
              <div style={sectionLabelStyle}>Datenebene</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const }}>
                {[
                  { key: 'alle', label: 'Alle' },
                  { key: 'l1', label: 'Identifikation' },
                  { key: 'l2', label: 'Firmendaten' },
                  { key: 'l3', label: 'Technologie' },
                  { key: 'l4', label: 'Kaufsignale' },
                ].map((l) => (
                  <button key={l.key} onClick={() => setLayerFilter(l.key)} style={chipStyle(layerFilter === l.key)}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Fields + preview + button share the same column */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          {/* Exportierte Felder */}
          <div style={card}>
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0A2540' }}>Exportierte Felder</div>
                <div style={{ fontSize: 11, color: '#697386', marginTop: 2 }}>
                  <span style={{ fontWeight: 800, color: '#4F46E5' }}>{selectedFields.size}</span> von{' '}
                  {FIELD_OPTIONS.length} Feldern ausgewählt
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { key: 'minimal', label: 'Minimal' },
                  { key: 'crm', label: 'CRM-Felder' },
                  { key: 'full', label: 'Alle' },
                ].map((p) => (
                  <button
                    key={p.key}
                    onClick={() => selectPreset(p.key as 'minimal' | 'full' | 'crm')}
                    style={{
                      padding: '5px 12px',
                      border: '1.5px solid #E8ECF0',
                      borderRadius: 8,
                      background: '#F7F8FC',
                      color: '#697386',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column' as const, gap: 18 }}>
              {FIELD_GROUPS.map((group) => {
                const groupFields = FIELD_OPTIONS.filter((o) => o.group === group);
                const activeCount = groupFields.filter((o) => selectedFields.has(o.key)).length;
                const allActive = activeCount === groupFields.length;
                return (
                  <div key={group}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 10,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ ...sectionLabelStyle, marginBottom: 0 }}>{group}</span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: activeCount > 0 ? '#4F46E5' : '#C7D2FE',
                            background: activeCount > 0 ? '#EEF0FF' : '#F7F8FC',
                            padding: '1px 6px',
                            borderRadius: 4,
                          }}
                        >
                          {activeCount}/{groupFields.length}
                        </span>
                      </div>
                      <button
                        onClick={() => selectGroup(group)}
                        style={{
                          padding: '3px 8px',
                          border: `1px solid ${allActive ? '#C7D2FE' : '#E8ECF0'}`,
                          borderRadius: 6,
                          background: allActive ? '#EEF0FF' : '#F7F8FC',
                          color: allActive ? '#4F46E5' : '#697386',
                          fontSize: 10,
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        {allActive ? 'Alle ab' : 'Alle an'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                      {groupFields.map((opt) => {
                        const active = selectedFields.has(opt.key);
                        return (
                          <button
                            key={opt.key}
                            onClick={() => toggleField(opt.key)}
                            title={
                              opt.crm
                                ? `Pipedrive: ${opt.crm.pipedrive ?? '—'} · HubSpot: ${opt.crm.hubspot ?? '—'}`
                                : undefined
                            }
                            style={{
                              padding: '5px 10px',
                              border: `1.5px solid ${active ? '#4F46E5' : '#E8ECF0'}`,
                              borderRadius: 8,
                              background: active ? '#EEF0FF' : '#F7F8FC',
                              color: active ? '#4F46E5' : '#697386',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5,
                              transition: 'all 0.12s',
                            }}
                          >
                            {active && (
                              <svg
                                width="9"
                                height="9"
                                viewBox="0 0 12 12"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="2 6 5 9 10 3" />
                              </svg>
                            )}
                            {opt.label}
                            {opt.crm && (
                              <span
                                style={{
                                  fontSize: 9,
                                  fontWeight: 800,
                                  color: active ? '#818CF8' : '#C7D2FE',
                                }}
                              >
                                CRM
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preview table */}
          {filteredLeads.length > 0 && (
            <div style={card}>
              <div
                style={{
                  padding: '14px 24px',
                  borderBottom: '1px solid #F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0A2540' }}>Vorschau</div>
                <div style={{ fontSize: 11, color: '#697386' }}>
                  Erste 5 von <span style={{ fontWeight: 700, color: '#0A2540' }}>{filteredLeads.length}</span> Leads
                </div>
              </div>
              <div style={{ overflowX: 'auto' as const }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: '#F7F8FC' }}>
                      {FIELD_OPTIONS.filter((o) => selectedFields.has(o.key))
                        .slice(0, 6)
                        .map((o) => (
                          <th
                            key={o.key}
                            style={{
                              padding: '9px 14px',
                              textAlign: 'left' as const,
                              fontWeight: 800,
                              color: '#9AA5B4',
                              fontSize: 10,
                              textTransform: 'uppercase' as const,
                              letterSpacing: '0.08em',
                              borderBottom: '1px solid #E8ECF0',
                              whiteSpace: 'nowrap' as const,
                            }}
                          >
                            {o.label}
                          </th>
                        ))}
                      {selectedFields.size > 6 && (
                        <th
                          style={{
                            padding: '9px 14px',
                            color: '#9AA5B4',
                            fontSize: 10,
                            fontWeight: 700,
                            borderBottom: '1px solid #E8ECF0',
                          }}
                        >
                          +{selectedFields.size - 6} mehr
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.slice(0, 5).map((lead, i) => (
                      <tr
                        key={lead.id}
                        style={{
                          background: i % 2 === 0 ? '#fff' : '#FAFBFF',
                          borderBottom: i < 4 ? '1px solid #F1F5F9' : 'none',
                        }}
                      >
                        {FIELD_OPTIONS.filter((o) => selectedFields.has(o.key))
                          .slice(0, 6)
                          .map((o) => {
                            const val = lead[o.key];
                            let display = '';
                            if (typeof val === 'boolean') display = val ? 'ja' : 'nein';
                            else if (val === null || val === undefined) display = '—';
                            else if (typeof val === 'object') display = '…';
                            else display = String(val);
                            if (o.key === 'created_at' && val) display = String(val).slice(0, 10);
                            const isEmpty = display === '—';
                            return (
                              <td
                                key={o.key}
                                style={{
                                  padding: '9px 14px',
                                  color: isEmpty ? '#C7D2FE' : '#0A2540',
                                  maxWidth: 140,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap' as const,
                                  fontSize: 12,
                                }}
                              >
                                {display}
                              </td>
                            );
                          })}
                        {selectedFields.size > 6 && <td style={{ padding: '9px 14px' }} />}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CRM hint */}
          {(format === 'pipedrive' || format === 'hubspot') && (
            <div
              style={{
                padding: '14px 18px',
                background: '#F0F9FF',
                border: '1px solid #BAE6FD',
                borderRadius: 12,
                fontSize: 12,
                color: '#0369A1',
                lineHeight: 1.65,
              }}
            >
              <strong>{format === 'pipedrive' ? 'Pipedrive Import:' : 'HubSpot Import:'}</strong>{' '}
              {format === 'pipedrive'
                ? 'Gehe zu Kontakte → Importieren → CSV. Die Spalten werden automatisch gemappt wenn du die Standard-Feldnamen verwendest.'
                : 'Gehe zu Kontakte → Importieren → Unternehmen. HubSpot erkennt company_name, website, city etc. automatisch.'}
            </div>
          )}

          {/* Error */}
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

          {/* Success */}
          {done && (
            <div
              style={{
                padding: '16px 20px',
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="2 6 5 9 10 3" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#059669' }}>
                  {done.count} Leads erfolgreich exportiert
                </div>
                <div style={{ fontSize: 11, color: '#697386', marginTop: 2 }}>Datei: {done.filename}</div>
              </div>
            </div>
          )}

          {/* Export button */}
          <button
            onClick={handleExport}
            disabled={!canExport}
            style={{
              width: '100%',
              padding: '14px',
              background: canExport ? '#4F46E5' : '#E8ECF0',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 800,
              color: canExport ? '#fff' : '#B0BAC9',
              cursor: canExport ? 'pointer' : 'default',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              transition: 'background 0.15s',
            }}
          >
            {exporting ? (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  style={{ animation: 'spin 1s linear infinite' }}
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Exportiere...
              </>
            ) : (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {filteredLeads.length === 0
                  ? 'Keine Leads für diesen Filter'
                  : `${filteredLeads.length} Leads exportieren als ${format.toUpperCase()}`}
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input[type=date]::-webkit-calendar-picker-indicator { opacity: 0.4; cursor: pointer; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { opacity: 0.5; }
      `}</style>
    </div>
  );
}
