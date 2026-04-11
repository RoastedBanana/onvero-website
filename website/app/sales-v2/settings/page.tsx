'use client';

import { useState } from 'react';
import {
  C,
  SvgIcon,
  PageHeader,
  GhostButton,
  ICONS,
  Breadcrumbs,
  GlowButton,
  showToast,
  ProgressRing,
} from '../_shared';

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Section =
  | 'profil'
  | 'leads'
  | 'ki-scoring'
  | 'outreach'
  | 'meetings'
  | 'integrationen'
  | 'benachrichtigungen'
  | 'team'
  | 'api';

// ─── SETTINGS NAV ────────────────────────────────────────────────────────────

const SECTIONS: { key: Section; label: string; icon: string; color: string }[] = [
  { key: 'profil', label: 'Unternehmensprofil', icon: ICONS.globe, color: '#818CF8' },
  { key: 'leads', label: 'Lead-Management', icon: ICONS.list, color: '#38BDF8' },
  { key: 'ki-scoring', label: 'KI-Scoring', icon: ICONS.spark, color: '#A78BFA' },
  { key: 'outreach', label: 'Outreach & E-Mail', icon: ICONS.mail, color: '#34D399' },
  { key: 'meetings', label: 'Meetings', icon: ICONS.mic, color: '#38BDF8' },
  { key: 'integrationen', label: 'Integrationen', icon: ICONS.settings, color: '#FBBF24' },
  { key: 'benachrichtigungen', label: 'Benachrichtigungen', icon: ICONS.inbox, color: '#F87171' },
  { key: 'team', label: 'Team & Zugänge', icon: ICONS.users, color: '#818CF8' },
  { key: 'api', label: 'API & Webhooks', icon: ICONS.zap, color: '#34D399' },
];

// ─── FORM COMPONENTS ─────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        style={{
          fontSize: 11,
          color: C.text3,
          display: 'block',
          marginBottom: 6,
          fontWeight: 500,
          letterSpacing: '0.02em',
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: '9px 14px',
        fontSize: 13,
        color: C.text1,
        outline: 'none',
        fontFamily: 'inherit',
        transition: 'border-color 0.15s ease',
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = C.border;
      }}
    />
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: '100%',
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: '9px 14px',
        fontSize: 13,
        color: C.text1,
        outline: 'none',
        fontFamily: 'inherit',
        resize: 'vertical',
        transition: 'border-color 0.15s ease',
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = C.border;
      }}
    />
  );
}

function Toggle({ enabled, onChange, label }: { enabled: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 0',
      }}
    >
      <span style={{ fontSize: 13, color: C.text2 }}>{label}</span>
      <button
        onClick={() => onChange(!enabled)}
        style={{
          width: 40,
          height: 22,
          borderRadius: 11,
          border: 'none',
          background: enabled ? 'linear-gradient(135deg, #6366F1, #818CF8)' : 'rgba(255,255,255,0.08)',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.2s ease',
          boxShadow: enabled ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#fff',
            position: 'absolute',
            top: 3,
            left: enabled ? 21 : 3,
            transition: 'left 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        />
      </button>
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: '9px 14px',
        fontSize: 13,
        color: C.text1,
        outline: 'none',
        fontFamily: 'inherit',
        cursor: 'pointer',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%234E5170' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        paddingRight: 32,
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function TagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');

  function add() {
    if (input.trim() && !tags.includes(input.trim())) {
      onChange([...tags, input.trim()]);
      setInput('');
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: tags.length > 0 ? 8 : 0 }}>
        {tags.map((tag) => (
          <span
            key={tag}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              borderRadius: 6,
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.15)',
              fontSize: 11,
              color: C.accentBright,
            }}
          >
            {tag}
            <button
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              style={{
                background: 'none',
                border: 'none',
                color: C.text3,
                cursor: 'pointer',
                fontSize: 12,
                padding: 0,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Input value={input} onChange={setInput} placeholder={placeholder} />
        <button
          onClick={add}
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            padding: '0 14px',
            color: C.text3,
            cursor: 'pointer',
            fontSize: 12,
            fontFamily: 'inherit',
            flexShrink: 0,
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: '20px 24px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 500, color: C.text1, margin: 0 }}>{title}</h3>
        {description && (
          <p style={{ fontSize: 11.5, color: C.text3, margin: '4px 0 0', lineHeight: 1.5 }}>{description}</p>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </div>
  );
}

// ─── INTEGRATION CARD ────────────────────────────────────────────────────────

function IntegrationCard({
  name,
  description,
  icon,
  color,
  connected,
  onToggle,
}: {
  name: string;
  description: string;
  icon: string;
  color: string;
  connected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="s-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '16px 18px',
        borderRadius: 10,
        background: connected ? `${color}04` : C.surface,
        border: `1px solid ${connected ? `${color}15` : C.border}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          background: `${color}10`,
          border: `1px solid ${color}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <SvgIcon d={icon} size={16} color={color} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: C.text1 }}>{name}</div>
        <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>{description}</div>
      </div>
      <button
        onClick={onToggle}
        style={{
          padding: '6px 14px',
          borderRadius: 7,
          fontSize: 11,
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'inherit',
          border: 'none',
          background: connected ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.04)',
          color: connected ? C.success : C.text3,
          transition: 'all 0.15s ease',
        }}
      >
        {connected ? 'Verbunden' : 'Verbinden'}
      </button>
    </div>
  );
}

// ─── SECTION CONTENT ─────────────────────────────────────────────────────────

function ProfilSection() {
  const [name, setName] = useState('Onvero GmbH');
  const [desc, setDesc] = useState('B2B Sales Intelligence Plattform für den deutschsprachigen Markt');
  const [location, setLocation] = useState('Hamburg, Deutschland');
  const [websites, setWebsites] = useState(['onvero.de', 'onvero.io']);
  const [target, setTarget] = useState('B2B-Entscheider in Tech-Unternehmen, 50k–5M€ Umsatz, DACH-Region');
  const [ideal, setIdeal] = useState(
    'SaaS-Unternehmen mit 20–250 MA, aktiv wachsend, noch kein CRM oder unzufrieden mit bestehendem'
  );
  const [excluded, setExcluded] = useState('Behörden, Non-Profits, Unternehmen unter 10 MA');
  const [services, setServices] = useState(['Lead-Generierung', 'KI-Scoring', 'Sales Intelligence', 'Meeting-Analyse']);
  const [usp, setUsp] = useState(
    'Einzige Sales-Intelligence-Plattform die speziell für den DACH-Markt gebaut ist, mit deutschen Datenquellen und DSGVO-Konformität.'
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionCard
        title="Basis-Informationen"
        description="Diese Daten nutzt die KI um deine Leads besser zu qualifizieren."
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Firmenname">
            <Input value={name} onChange={setName} />
          </Field>
          <Field label="Standort">
            <Input value={location} onChange={setLocation} />
          </Field>
        </div>
        <Field label="Beschreibung">
          <TextArea value={desc} onChange={setDesc} rows={2} />
        </Field>
        <Field label="Websites">
          <TagInput tags={websites} onChange={setWebsites} placeholder="Domain hinzufügen" />
        </Field>
      </SectionCard>

      <SectionCard title="Zielgruppe & ICP" description="Je präziser, desto besser der KI-Score.">
        <Field label="Zielkunden">
          <TextArea value={target} onChange={setTarget} rows={2} />
        </Field>
        <Field label="Ideales Lead-Profil (ICP)">
          <TextArea value={ideal} onChange={setIdeal} rows={2} />
        </Field>
        <Field label="Ausgeschlossene Profile">
          <TextArea value={excluded} onChange={setExcluded} rows={2} />
        </Field>
      </SectionCard>

      <SectionCard title="Produkt & Positionierung">
        <Field label="Services / Produkte">
          <TagInput tags={services} onChange={setServices} placeholder="Service hinzufügen" />
        </Field>
        <Field label="USP (Unique Selling Proposition)">
          <TextArea value={usp} onChange={setUsp} rows={2} />
        </Field>
      </SectionCard>
    </div>
  );
}

function LeadsSection() {
  const [autoFollow, setAutoFollow] = useState(true);
  const [autoScore, setAutoScore] = useState(true);
  const [dedup, setDedup] = useState(true);
  const [source, setSource] = useState('apollo');
  const [hotThreshold, setHotThreshold] = useState('85');
  const [warmThreshold, setWarmThreshold] = useState('65');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionCard title="Lead-Verarbeitung" description="Wie neue Leads automatisch verarbeitet werden.">
        <Toggle enabled={autoScore} onChange={setAutoScore} label="Neue Leads automatisch KI-scoren" />
        <Toggle enabled={autoFollow} onChange={setAutoFollow} label="Automatische Follow-up-Erinnerungen" />
        <Toggle enabled={dedup} onChange={setDedup} label="Duplikate automatisch erkennen und mergen" />
      </SectionCard>

      <SectionCard title="Score-Schwellenwerte" description="Ab welchem Score gilt ein Lead als Hot, Warm oder Cold.">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Hot Lead ab Score">
            <Input value={hotThreshold} onChange={setHotThreshold} type="number" />
          </Field>
          <Field label="Warm Lead ab Score">
            <Input value={warmThreshold} onChange={setWarmThreshold} type="number" />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Primäre Datenquelle">
        <Field label="Lead-Quelle">
          <Select
            value={source}
            onChange={setSource}
            options={[
              { value: 'apollo', label: 'Apollo.io' },
              { value: 'google-maps', label: 'Google Maps Scraping' },
              { value: 'linkedin', label: 'LinkedIn Sales Navigator' },
              { value: 'manual', label: 'Manueller Import' },
            ]}
          />
        </Field>
      </SectionCard>
    </div>
  );
}

function KiScoringSection() {
  const [model, setModel] = useState('advanced');
  const [factors, setFactors] = useState([
    'Unternehmensgröße',
    'Branche',
    'Wachstum',
    'Tech-Stack',
    'Intent-Signale',
    'Standort',
  ]);
  const [refreshInterval, setRefreshInterval] = useState('daily');
  const [customPrompt, setCustomPrompt] = useState(
    'Bewerte Leads basierend auf Relevanz für B2B SaaS im DACH-Markt. Priorisiere Firmen mit aktivem Wachstum und Tech-Affinität.'
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionCard title="KI-Modell" description="Welches Scoring-Modell für die Lead-Bewertung verwendet wird.">
        <Field label="Scoring-Modell">
          <Select
            value={model}
            onChange={setModel}
            options={[
              { value: 'basic', label: 'Basic — Firmendaten + Branche' },
              { value: 'advanced', label: 'Advanced — Multi-Signal (empfohlen)' },
              { value: 'custom', label: 'Custom — Eigenes Prompt-Template' },
            ]}
          />
        </Field>
        <Field label="Aktualisierungsintervall">
          <Select
            value={refreshInterval}
            onChange={setRefreshInterval}
            options={[
              { value: 'realtime', label: 'Echtzeit (bei neuen Daten)' },
              { value: 'daily', label: 'Täglich' },
              { value: 'weekly', label: 'Wöchentlich' },
            ]}
          />
        </Field>
      </SectionCard>

      <SectionCard title="Scoring-Faktoren" description="Welche Signale in den KI-Score einfließen.">
        <Field label="Aktive Faktoren">
          <TagInput tags={factors} onChange={setFactors} placeholder="Faktor hinzufügen" />
        </Field>
      </SectionCard>

      <SectionCard
        title="Custom Prompt"
        description="Eigenes Prompt für die KI-Bewertung. Nur bei Modell 'Custom' aktiv."
      >
        <Field label="KI-Bewertungs-Prompt">
          <TextArea value={customPrompt} onChange={setCustomPrompt} rows={4} />
        </Field>
      </SectionCard>
    </div>
  );
}

function OutreachSection() {
  const [senderName, setSenderName] = useState('Hans Lacher');
  const [senderRole, setSenderRole] = useState('Gründer & CEO');
  const [tone, setTone] = useState('professional');
  const [signature, setSignature] = useState('Beste Grüße,\nHans Lacher\nOnvero GmbH\nwww.onvero.de');
  const [autoGen, setAutoGen] = useState(true);
  const [followUpDays, setFollowUpDays] = useState('3');
  const [lang, setLang] = useState('de');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionCard title="Absender-Profil" description="Wie du in Outreach-Nachrichten erscheinst.">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Name">
            <Input value={senderName} onChange={setSenderName} />
          </Field>
          <Field label="Rolle / Titel">
            <Input value={senderRole} onChange={setSenderRole} />
          </Field>
        </div>
        <Field label="Tonalität">
          <Select
            value={tone}
            onChange={setTone}
            options={[
              { value: 'professional', label: 'Professionell — Klar, sachlich, respektvoll' },
              { value: 'casual', label: 'Casual — Persönlich, locker, direkt' },
              { value: 'formal', label: 'Formal — Geschäftlich, förmlich' },
            ]}
          />
        </Field>
        <Field label="E-Mail-Signatur">
          <TextArea value={signature} onChange={setSignature} rows={4} />
        </Field>
      </SectionCard>

      <SectionCard title="Automatisierung">
        <Toggle
          enabled={autoGen}
          onChange={setAutoGen}
          label="Outreach-Ideen automatisch für neue Hot Leads generieren"
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Follow-up nach (Tagen)">
            <Input value={followUpDays} onChange={setFollowUpDays} type="number" />
          </Field>
          <Field label="Sprache">
            <Select
              value={lang}
              onChange={setLang}
              options={[
                { value: 'de', label: 'Deutsch' },
                { value: 'en', label: 'Englisch' },
                { value: 'auto', label: 'Auto (Sprache des Leads)' },
              ]}
            />
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}

function MeetingsSection() {
  const [autoTranscribe, setAutoTranscribe] = useState(true);
  const [autoSummary, setAutoSummary] = useState(true);
  const [autoActions, setAutoActions] = useState(true);
  const [sentimentAnalysis, setSentimentAnalysis] = useState(false);
  const [lang, setLang] = useState('de');
  const [storage, setStorage] = useState('30');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionCard title="Aufnahme & Transkription">
        <Toggle
          enabled={autoTranscribe}
          onChange={setAutoTranscribe}
          label="Automatische Transkription nach Aufnahme"
        />
        <Toggle enabled={autoSummary} onChange={setAutoSummary} label="KI-Zusammenfassung generieren" />
        <Toggle enabled={autoActions} onChange={setAutoActions} label="Action Items automatisch extrahieren" />
        <Toggle
          enabled={sentimentAnalysis}
          onChange={setSentimentAnalysis}
          label="Stimmungsanalyse aktivieren (Beta)"
        />
      </SectionCard>

      <SectionCard title="Einstellungen">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Transkriptions-Sprache">
            <Select
              value={lang}
              onChange={setLang}
              options={[
                { value: 'de', label: 'Deutsch' },
                { value: 'en', label: 'Englisch' },
                { value: 'auto', label: 'Auto-Detect' },
              ]}
            />
          </Field>
          <Field label="Aufnahmen speichern (Tage)">
            <Input value={storage} onChange={setStorage} type="number" />
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}

function IntegrationenSection() {
  const [integrations, setIntegrations] = useState<Record<string, boolean>>({
    apollo: true,
    supabase: true,
    n8n: true,
    plausible: true,
    gmail: false,
    slack: false,
    gcal: false,
    hubspot: false,
    zapier: false,
  });

  function toggle(key: string) {
    setIntegrations((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      showToast(next[key] ? `${key} verbunden` : `${key} getrennt`, next[key] ? 'success' : 'info');
      return next;
    });
  }

  const items: { key: string; name: string; description: string; icon: string; color: string }[] = [
    {
      key: 'apollo',
      name: 'Apollo.io',
      description: 'Lead-Datenbank & Enrichment',
      icon: ICONS.users,
      color: '#818CF8',
    },
    { key: 'supabase', name: 'Supabase', description: 'Datenbank & Auth', icon: ICONS.folder, color: '#34D399' },
    { key: 'n8n', name: 'n8n', description: 'Workflow-Automatisierung', icon: ICONS.zap, color: '#FBBF24' },
    {
      key: 'plausible',
      name: 'Plausible',
      description: 'Datenschutz-konforme Analytics',
      icon: ICONS.chart,
      color: '#38BDF8',
    },
    { key: 'gmail', name: 'Gmail', description: 'E-Mail-Versand & Tracking', icon: ICONS.mail, color: '#F87171' },
    { key: 'slack', name: 'Slack', description: 'Team-Benachrichtigungen', icon: ICONS.chat, color: '#A78BFA' },
    { key: 'gcal', name: 'Google Calendar', description: 'Meeting-Sync', icon: ICONS.calendar, color: '#38BDF8' },
    { key: 'hubspot', name: 'HubSpot', description: 'CRM-Sync (bidirektional)', icon: ICONS.globe, color: '#FBBF24' },
    { key: 'zapier', name: 'Zapier', description: '5.000+ App-Integrationen', icon: ICONS.zap, color: '#818CF8' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((item) => (
        <IntegrationCard
          key={item.key}
          name={item.name}
          description={item.description}
          icon={item.icon}
          color={item.color}
          connected={integrations[item.key]}
          onToggle={() => toggle(item.key)}
        />
      ))}
    </div>
  );
}

function BenachrichtigungenSection() {
  const [newLead, setNewLead] = useState(true);
  const [hotLead, setHotLead] = useState(true);
  const [intentSignal, setIntentSignal] = useState(true);
  const [meetingReminder, setMeetingReminder] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);
  const [followUpReminder, setFollowUpReminder] = useState(true);
  const [channel, setChannel] = useState('app');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionCard title="Benachrichtigungs-Kanäle">
        <Field label="Primärer Kanal">
          <Select
            value={channel}
            onChange={setChannel}
            options={[
              { value: 'app', label: 'In-App Benachrichtigungen' },
              { value: 'email', label: 'E-Mail' },
              { value: 'slack', label: 'Slack (erfordert Integration)' },
              { value: 'all', label: 'Alle Kanäle' },
            ]}
          />
        </Field>
      </SectionCard>

      <SectionCard title="Welche Benachrichtigungen" description="Wähle welche Events dich benachrichtigen sollen.">
        <Toggle enabled={newLead} onChange={setNewLead} label="Neuer Lead generiert" />
        <Toggle enabled={hotLead} onChange={setHotLead} label="Lead wird Hot (Score ≥ 85)" />
        <Toggle enabled={intentSignal} onChange={setIntentSignal} label="Neues Intent-Signal erkannt" />
        <Toggle enabled={meetingReminder} onChange={setMeetingReminder} label="Meeting-Erinnerung (30 min vorher)" />
        <Toggle enabled={followUpReminder} onChange={setFollowUpReminder} label="Follow-up überfällig" />
        <Toggle enabled={weeklyReport} onChange={setWeeklyReport} label="Wöchentlicher Performance-Report" />
      </SectionCard>
    </div>
  );
}

function TeamSection() {
  const members = [
    { name: 'Hans Lacher', email: 'hans@onvero.de', role: 'Admin', status: 'Aktiv' },
    { name: 'Maria Schmidt', email: 'maria@onvero.de', role: 'Editor', status: 'Aktiv' },
    { name: 'Felix Braun', email: 'felix@onvero.de', role: 'Viewer', status: 'Eingeladen' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionCard title="Team-Mitglieder">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {members.map((m) => (
            <div
              key={m.email}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 14px',
                borderRadius: 9,
                background: 'rgba(255,255,255,0.015)',
                border: `1px solid ${C.border}`,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #6366F1, #818CF8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                {m.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.text1 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: C.text3 }}>{m.email}</div>
              </div>
              <span
                style={{
                  fontSize: 10,
                  color: C.text3,
                  padding: '3px 8px',
                  borderRadius: 5,
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${C.border}`,
                }}
              >
                {m.role}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: m.status === 'Aktiv' ? C.success : C.warning,
                }}
              >
                {m.status}
              </span>
            </div>
          ))}
        </div>
        <GlowButton onClick={() => showToast('Einladung gesendet', 'success')}>+ Mitglied einladen</GlowButton>
      </SectionCard>
    </div>
  );
}

function ApiSection() {
  const [showKey, setShowKey] = useState(false);
  const apiKey = 'sk_live_onvero_a8f3k29d…x7m2';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionCard title="API-Schlüssel" description="Nutze den API-Key um Onvero programmatisch anzusprechen.">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${C.border}`,
          }}
        >
          <span
            style={{
              flex: 1,
              fontSize: 12,
              color: showKey ? C.text1 : C.text3,
              fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            }}
          >
            {showKey ? apiKey : '••••••••••••••••••••••••'}
          </span>
          <button
            onClick={() => setShowKey(!showKey)}
            style={{
              background: 'none',
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 10,
              color: C.text3,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {showKey ? 'Verbergen' : 'Anzeigen'}
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(apiKey);
              showToast('API-Key kopiert', 'success');
            }}
            style={{
              background: 'none',
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 10,
              color: C.text3,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Kopieren
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Webhooks" description="Erhalte Events in Echtzeit an deine eigene URL.">
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 9,
            background: 'rgba(255,255,255,0.015)',
            border: `1px solid ${C.border}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: C.text1 }}>Lead Created</span>
            <span style={{ fontSize: 10, color: C.success }}>Aktiv</span>
          </div>
          <span style={{ fontSize: 11, color: C.text3, fontFamily: 'ui-monospace, monospace' }}>
            https://n8n.srv1223027.hstgr.cloud/webhook/leads
          </span>
        </div>
        <GhostButton onClick={() => showToast('Webhook-Editor kommt bald', 'info')}>+ Webhook hinzufügen</GhostButton>
      </SectionCard>

      <SectionCard title="Rate Limits">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <ProgressRing value={342} max={1000} size={56} strokeWidth={4} color={C.accent} label="34%" />
          <div>
            <div style={{ fontSize: 13, color: C.text1 }}>342 / 1.000 Requests</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>Diesen Monat verbraucht · Reset am 1. Mai</div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── PAGE ────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>('profil');

  const sectionContent: Record<Section, React.ReactNode> = {
    profil: <ProfilSection />,
    leads: <LeadsSection />,
    'ki-scoring': <KiScoringSection />,
    outreach: <OutreachSection />,
    meetings: <MeetingsSection />,
    integrationen: <IntegrationenSection />,
    benachrichtigungen: <BenachrichtigungenSection />,
    team: <TeamSection />,
    api: <ApiSection />,
  };

  const active = SECTIONS.find((s) => s.key === activeSection)!;

  return (
    <>
      <Breadcrumbs items={[{ label: 'Onvero Sales', href: '/sales-v2' }, { label: 'Einstellungen' }]} />
      <PageHeader
        title="Einstellungen"
        subtitle="Konfiguriere Onvero Sales nach deinen Bedürfnissen"
        actions={<GlowButton onClick={() => showToast('Einstellungen gespeichert', 'success')}>Speichern</GlowButton>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>
        {/* Settings Nav */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: '12px 8px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.03)',
            alignSelf: 'flex-start',
            position: 'sticky',
            top: 20,
          }}
        >
          {SECTIONS.map((s) => {
            const isActive = activeSection === s.key;
            return (
              <button
                key={s.key}
                className="s-nav"
                onClick={() => setActiveSection(s.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: 'none',
                  background: isActive ? 'rgba(99,102,241,0.1)' : 'transparent',
                  color: isActive ? C.accentBright : C.text2,
                  fontSize: 12,
                  fontWeight: isActive ? 500 : 400,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  width: '100%',
                  boxShadow: isActive ? 'inset 0 0 0 0.5px rgba(99,102,241,0.2)' : 'none',
                }}
              >
                <SvgIcon d={s.icon} size={13} color={isActive ? s.color : C.text3} />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div key={activeSection} className="tab-content-enter">
          {sectionContent[activeSection]}
        </div>
      </div>
    </>
  );
}
