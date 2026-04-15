'use client';

import { useState, useEffect } from 'react';
import { C, SvgIcon, PageHeader, GhostButton, ICONS, Breadcrumbs, GlowButton, showToast } from '../_shared';

// ─── PROFILE DATA (loaded from /api/profile, shared across sections) ────────

interface ProfileData {
  company_name: string;
  company_description: string;
  company_location: string;
  website: string;
  websites: string[];
  target_customers: string;
  ideal_lead_profile: string;
  excluded_profiles: string;
  services: string[];
  usp: string;
  deal_size_min: number | null;
  deal_size_max: number | null;
  sender_name: string;
  sender_role: string;
  tone_of_voice: string;
  email_signature: string;
  industry: string;
  sales_cycle_days: number | null;
  ai_search_prompt: string;
  ai_scoring_prompt: string;
}

const EMPTY_PROFILE: ProfileData = {
  company_name: '',
  company_description: '',
  company_location: '',
  website: '',
  websites: [],
  target_customers: '',
  ideal_lead_profile: '',
  excluded_profiles: '',
  services: [],
  usp: '',
  deal_size_min: null,
  deal_size_max: null,
  sender_name: '',
  sender_role: '',
  tone_of_voice: 'professional',
  email_signature: '',
  industry: '',
  sales_cycle_days: null,
  ai_search_prompt: '',
  ai_scoring_prompt: '',
};

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Section = 'profil' | 'integrationen' | 'team' | 'plan';

// ─── SETTINGS NAV ────────────────────────────────────────────────────────────

const SECTIONS: { key: Section; label: string; icon: string; color: string }[] = [
  { key: 'profil', label: 'Unternehmensprofil', icon: ICONS.globe, color: '#818CF8' },
  { key: 'integrationen', label: 'Integrationen', icon: ICONS.settings, color: '#FBBF24' },
  { key: 'team', label: 'Team & Zugänge', icon: ICONS.users, color: '#818CF8' },
  { key: 'plan', label: 'Plan & Nutzung', icon: ICONS.chart, color: '#34D399' },
];

// ─── FORM COMPONENTS ─────────────────────────────────────────────────────────

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
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
      {hint && <p style={{ fontSize: 10.5, color: C.text3, margin: '4px 0 0', opacity: 0.7 }}>{hint}</p>}
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
  collapsible,
  defaultOpen = true,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

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
      <div
        style={{
          marginBottom: open ? 16 : 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: collapsible ? 'pointer' : 'default',
        }}
        onClick={collapsible ? () => setOpen(!open) : undefined}
      >
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 500, color: C.text1, margin: 0 }}>{title}</h3>
          {description && (
            <p style={{ fontSize: 11.5, color: C.text3, margin: '4px 0 0', lineHeight: 1.5 }}>{description}</p>
          )}
        </div>
        {collapsible && (
          <span
            style={{
              transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              display: 'flex',
            }}
          >
            <SvgIcon d={ICONS.chevRight} size={14} color={C.text3} />
          </span>
        )}
      </div>
      {open && <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>}
    </div>
  );
}

// ─── INTEGRATION CARD ────────────────────────────────────────────────────────

function IntegrationCard({
  name,
  description,
  icon,
  color,
  status,
  onAction,
  actionLabel,
}: {
  name: string;
  description: string;
  icon: string;
  color: string;
  status: 'connected' | 'available' | 'coming-soon';
  onAction?: () => void;
  actionLabel?: string;
}) {
  const statusStyles = {
    connected: { bg: 'rgba(52,211,153,0.1)', color: C.success, label: 'Verbunden' },
    available: { bg: 'rgba(255,255,255,0.04)', color: C.text3, label: 'Verbinden' },
    'coming-soon': { bg: 'rgba(255,255,255,0.02)', color: C.text3, label: 'Bald verfügbar' },
  };
  const s = statusStyles[status];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '16px 18px',
        borderRadius: 10,
        background: status === 'connected' ? `${color}04` : C.surface,
        border: `1px solid ${status === 'connected' ? `${color}15` : C.border}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.03)',
        opacity: status === 'coming-soon' ? 0.6 : 1,
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
        onClick={status !== 'coming-soon' ? onAction : undefined}
        disabled={status === 'coming-soon'}
        style={{
          padding: '6px 14px',
          borderRadius: 7,
          fontSize: 11,
          fontWeight: 500,
          cursor: status === 'coming-soon' ? 'default' : 'pointer',
          fontFamily: 'inherit',
          border: 'none',
          background: s.bg,
          color: s.color,
          transition: 'all 0.15s ease',
        }}
      >
        {actionLabel || s.label}
      </button>
    </div>
  );
}

// ─── SECTION: PROFIL ────────────────────────────────────────────────────────

function ProfilSection({ profile, onChange }: { profile: ProfileData; onChange: (p: ProfileData) => void }) {
  const upd = (field: keyof ProfileData, value: string | string[] | number | null) =>
    onChange({ ...profile, [field]: value });
  const [scraping, setScraping] = useState(false);
  const [scraped, setScraped] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  // Load logo on mount
  useEffect(() => {
    fetch('/api/integrations')
      .then((r) => r.json())
      .then((d) => {
        if (d.logo_url) setLogoUrl(d.logo_url);
      })
      .catch(() => {});
  }, []);

  async function handleLogoUpload(file: File) {
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const res = await fetch('/api/profile/logo', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.logo_url) {
        setLogoUrl(data.logo_url);
        showToast('Logo hochgeladen', 'success');
      } else {
        showToast(data.error || 'Upload fehlgeschlagen', 'error');
      }
    } catch {
      showToast('Netzwerkfehler', 'error');
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleWebsiteScrape() {
    const url = profile.website?.trim();
    if (!url) {
      showToast('Bitte zuerst eine Website eingeben', 'error');
      return;
    }
    setScraping(true);
    try {
      const res = await fetch('/api/profile/analyze-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (res.ok && data.suggestions) {
        const s = data.suggestions;
        const updated = { ...profile };
        if (s.company_name && !profile.company_name) updated.company_name = s.company_name;
        if (s.company_description && !profile.company_description) updated.company_description = s.company_description;
        if (s.company_location && !profile.company_location) updated.company_location = s.company_location;
        if (s.website) updated.website = s.website;
        if (s.industry && !profile.industry) updated.industry = s.industry;
        if (s.services?.length && (!profile.services || profile.services.length === 0)) updated.services = s.services;
        onChange(updated);
        setScraped(true);
        const filled = [s.company_name, s.company_description, s.company_location, s.industry].filter(Boolean).length;
        showToast(`${filled} Felder automatisch ausgefüllt — bitte prüfen und speichern`, 'success');
        setTimeout(() => setScraped(false), 8000);
      } else {
        showToast(data.error || 'Analyse fehlgeschlagen', 'error');
      }
    } catch {
      showToast('Netzwerkfehler', 'error');
    } finally {
      setScraping(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Website Scraper — auto-fill with AI */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(129,140,248,0.03))',
          border: '1px solid rgba(99,102,241,0.15)',
          borderRadius: 12,
          padding: '20px 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <SvgIcon d={ICONS.spark} size={16} color={C.accentBright} />
          <h3 style={{ fontSize: 14, fontWeight: 500, color: C.text1, margin: 0 }}>Profil mit KI ausfüllen</h3>
        </div>
        <p style={{ fontSize: 12, color: C.text3, margin: '0 0 14px', lineHeight: 1.6 }}>
          Gib deine Website-URL ein und unsere KI analysiert deine Seite — Firmenbeschreibung, Services, Branche und
          Zielgruppe werden automatisch erkannt und vorausgefüllt.
        </p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'end' }}>
          <div style={{ flex: 1 }}>
            <Field label="Website-URL">
              <Input value={profile.website} onChange={(v) => upd('website', v)} placeholder="https://deinefirma.de" />
            </Field>
          </div>
          <GlowButton onClick={handleWebsiteScrape}>
            {scraping ? 'Analysiere...' : scraped ? 'Gestartet' : 'Website analysieren'}
          </GlowButton>
        </div>
      </div>

      <SectionCard
        title="Basis-Informationen"
        description="Diese Daten nutzt die KI um deine Leads besser zu qualifizieren."
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              flexShrink: 0,
              background: logoUrl ? `url(${logoUrl}) center/cover no-repeat` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${C.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              color: C.text3,
            }}
          >
            {!logoUrl && '⬆'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: C.text1, fontWeight: 500, marginBottom: 4 }}>
              {logoUrl ? 'Logo hochgeladen' : 'Firmenlogo hochladen'}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <label
                style={{
                  padding: '4px 12px',
                  borderRadius: 6,
                  fontSize: 10,
                  fontWeight: 500,
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${C.border}`,
                  color: C.text3,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {logoUploading ? 'Lädt...' : logoUrl ? 'Ändern' : 'Hochladen'}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleLogoUpload(f);
                  }}
                />
              </label>
              {logoUrl && (
                <button
                  onClick={async () => {
                    await fetch('/api/profile/logo', { method: 'DELETE' });
                    setLogoUrl(null);
                    showToast('Logo entfernt', 'success');
                  }}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 6,
                    fontSize: 10,
                    background: 'none',
                    border: `1px solid ${C.border}`,
                    color: '#F87171',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Entfernen
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Firmenname">
            <Input value={profile.company_name} onChange={(v) => upd('company_name', v)} />
          </Field>
          <Field label="Standort">
            <Input value={profile.company_location} onChange={(v) => upd('company_location', v)} />
          </Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Branche">
            <Input
              value={profile.industry}
              onChange={(v) => upd('industry', v)}
              placeholder="z.B. SaaS, Beratung, E-Commerce"
            />
          </Field>
          <Field label="Website">
            <Input value={profile.website} onChange={(v) => upd('website', v)} placeholder="https://..." />
          </Field>
        </div>
        <Field label="Beschreibung">
          <TextArea value={profile.company_description} onChange={(v) => upd('company_description', v)} rows={2} />
        </Field>
        <Field label="Weitere Websites / Domains">
          <TagInput
            tags={profile.websites ?? []}
            onChange={(v) => upd('websites', v)}
            placeholder="Domain hinzufügen"
          />
        </Field>
      </SectionCard>

      <SectionCard title="Absender-Profil" description="Wie du in E-Mails und Outreach-Nachrichten erscheinst.">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Name">
            <Input value={profile.sender_name} onChange={(v) => upd('sender_name', v)} />
          </Field>
          <Field label="Rolle / Titel">
            <Input value={profile.sender_role} onChange={(v) => upd('sender_role', v)} />
          </Field>
        </div>
        <Field label="Tonalität">
          <Select
            value={profile.tone_of_voice || 'professional'}
            onChange={(v) => upd('tone_of_voice', v)}
            options={[
              { value: 'professional', label: 'Professionell — Klar, sachlich, respektvoll' },
              { value: 'casual', label: 'Casual — Persönlich, locker, direkt' },
              { value: 'formal', label: 'Formal — Geschäftlich, förmlich' },
            ]}
          />
        </Field>
        <Field label="E-Mail-Signatur">
          <TextArea value={profile.email_signature} onChange={(v) => upd('email_signature', v)} rows={4} />
        </Field>
      </SectionCard>

      <SectionCard title="Zielgruppe & ICP" description="Je präziser, desto besser der KI-Score.">
        <Field label="Zielkunden">
          <TextArea value={profile.target_customers} onChange={(v) => upd('target_customers', v)} rows={2} />
        </Field>
        <Field label="Ideales Lead-Profil (ICP)">
          <TextArea value={profile.ideal_lead_profile} onChange={(v) => upd('ideal_lead_profile', v)} rows={2} />
        </Field>
        <Field label="Ausgeschlossene Profile">
          <TextArea value={profile.excluded_profiles} onChange={(v) => upd('excluded_profiles', v)} rows={2} />
        </Field>
      </SectionCard>

      <SectionCard title="Produkt & Vertrieb">
        <Field label="Services / Produkte">
          <TagInput
            tags={profile.services ?? []}
            onChange={(v) => upd('services', v)}
            placeholder="Service hinzufügen"
          />
        </Field>
        <Field label="USP (Unique Selling Proposition)">
          <TextArea value={profile.usp} onChange={(v) => upd('usp', v)} rows={2} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <Field label="Deal-Size Min (€)">
            <Input
              value={profile.deal_size_min?.toString() ?? ''}
              onChange={(v) => upd('deal_size_min', v ? Number(v) : null)}
              type="number"
              placeholder="z.B. 5000"
            />
          </Field>
          <Field label="Deal-Size Max (€)">
            <Input
              value={profile.deal_size_max?.toString() ?? ''}
              onChange={(v) => upd('deal_size_max', v ? Number(v) : null)}
              type="number"
              placeholder="z.B. 50000"
            />
          </Field>
          <Field label="Sales Cycle (Tage)">
            <Input
              value={profile.sales_cycle_days?.toString() ?? ''}
              onChange={(v) => upd('sales_cycle_days', v ? Number(v) : null)}
              type="number"
              placeholder="z.B. 30"
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="KI-Personalisierung"
        description="Eigene Prompts für die KI-gestützte Lead-Suche und Bewertung. Optional."
        collapsible
        defaultOpen={false}
      >
        <Field
          label="Such-Prompt"
          hint="Wird bei der Lead-Generierung verwendet, um relevantere Ergebnisse zu liefern."
        >
          <TextArea
            value={profile.ai_search_prompt}
            onChange={(v) => upd('ai_search_prompt', v)}
            rows={3}
            placeholder="z.B. Suche nach B2B SaaS-Unternehmen im DACH-Raum mit 50-500 Mitarbeitern, die aktiv wachsen..."
          />
        </Field>
        <Field label="Scoring-Prompt" hint="Wird für die KI-basierte Lead-Bewertung verwendet.">
          <TextArea
            value={profile.ai_scoring_prompt}
            onChange={(v) => upd('ai_scoring_prompt', v)}
            rows={3}
            placeholder="z.B. Bewerte Leads nach Relevanz für B2B SaaS im DACH-Markt. Priorisiere aktives Wachstum und Tech-Affinität..."
          />
        </Field>
      </SectionCard>
    </div>
  );
}

// ─── SECTION: INTEGRATIONEN ─────────────────────────────────────────────────

function IntegrationenSection() {
  const [emailDomain, setEmailDomain] = useState('');
  const [configuring, setConfiguring] = useState<string | null>(null);
  const [autoFollowUp, setAutoFollowUp] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load from DB on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/integrations');
        if (res.ok) {
          const data = await res.json();
          setEmailDomain(data.email_resend || '');
          setAutoFollowUp(data.follow_up_email || false);
        }
      } catch {
        /* silent */
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  async function saveIntegrations(updates: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch('/api/integrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        showToast('Gespeichert', 'success');
      } else {
        const data = await res.json();
        showToast(data.error || 'Fehler beim Speichern', 'error');
      }
    } catch {
      showToast('Netzwerkfehler', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Explanation */}
      <div style={{ padding: '0 2px' }}>
        <p style={{ fontSize: 12, color: C.text3, margin: 0, lineHeight: 1.7 }}>
          Verbinde die Dienste, die dein Team täglich nutzt. Onvero verarbeitet Leads, versendet E-Mails und analysiert
          Meetings — hier stellst du ein, wie das passiert.
        </p>
      </div>

      {/* E-Mail Versand — the one that actually matters */}
      <SectionCard
        title="E-Mail-Versand"
        description="Damit du E-Mails direkt aus Onvero an deine Leads senden kannst, muss deine Absender-Domain eingerichtet sein."
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 16px',
            borderRadius: 9,
            background: emailDomain ? 'rgba(52,211,153,0.04)' : 'rgba(255,255,255,0.015)',
            border: `1px solid ${emailDomain ? 'rgba(52,211,153,0.15)' : C.border}`,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: emailDomain ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
              border: `1px solid ${emailDomain ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <SvgIcon d={ICONS.mail} size={16} color={emailDomain ? C.success : '#F87171'} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: C.text1 }}>
              {emailDomain || 'Noch nicht eingerichtet'}
            </div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 1 }}>
              {emailDomain
                ? 'Absender-Adresse verifiziert'
                : 'Richte deine Absender-E-Mail ein, um E-Mails zu versenden'}
            </div>
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              padding: '3px 8px',
              borderRadius: 5,
              background: emailDomain ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)',
              color: emailDomain ? C.success : C.warning,
            }}
          >
            {emailDomain ? 'Aktiv' : 'Einrichten'}
          </span>
        </div>

        {!configuring && (
          <GhostButton onClick={() => setConfiguring('email')}>
            {emailDomain ? 'E-Mail-Adresse ändern' : 'E-Mail einrichten'}
          </GhostButton>
        )}

        {configuring === 'email' && (
          <div
            style={{
              padding: '14px 16px',
              background: 'rgba(255,255,255,0.015)',
              border: `1px solid ${C.border}`,
              borderRadius: 9,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <Field
              label="Absender-E-Mail"
              hint="z.B. sales@deinefirma.de — muss als Domain in Resend verifiziert sein."
            >
              <Input value={emailDomain} onChange={setEmailDomain} placeholder="sales@deinefirma.de" />
            </Field>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <GhostButton onClick={() => setConfiguring(null)}>Abbrechen</GhostButton>
              <GlowButton
                onClick={async () => {
                  if (!emailDomain.includes('@')) {
                    showToast('Bitte gültige E-Mail eingeben', 'error');
                    return;
                  }
                  await saveIntegrations({ email_resend: emailDomain });
                  setConfiguring(null);
                }}
              >
                {saving ? 'Speichern...' : 'Speichern'}
              </GlowButton>
            </div>
          </div>
        )}

        <Toggle
          enabled={autoFollowUp}
          onChange={(v) => {
            setAutoFollowUp(v);
            saveIntegrations({ follow_up_email: v });
          }}
          label="Automatische Follow-up-E-Mails aktivieren"
        />
      </SectionCard>

      {/* Lead-Generierung */}
      <SectionCard
        title="Lead-Generierung"
        description="Onvero findet und qualifiziert Leads automatisch auf Basis deines Unternehmensprofils."
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 16px',
            borderRadius: 9,
            background: 'rgba(99,102,241,0.03)',
            border: '1px solid rgba(99,102,241,0.1)',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <SvgIcon d={ICONS.spark} size={16} color="#818CF8" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: C.text1 }}>Onvero KI-Engine</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 1 }}>
              Automatische Lead-Suche, Enrichment & KI-Scoring
            </div>
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              padding: '3px 8px',
              borderRadius: 5,
              background: 'rgba(52,211,153,0.1)',
              color: C.success,
            }}
          >
            Aktiv
          </span>
        </div>
        <p style={{ fontSize: 11, color: C.text3, margin: 0, lineHeight: 1.6 }}>
          Leads werden automatisch generiert, angereichert und bewertet. Je besser dein Unternehmensprofil ausgefüllt
          ist, desto relevanter die Ergebnisse.
        </p>
      </SectionCard>

      {/* Meetings & Transkription */}
      <SectionCard
        title="Meetings & Transkription"
        description="Meeting-Aufnahmen werden automatisch transkribiert und von der KI analysiert."
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 16px',
            borderRadius: 9,
            background: 'rgba(56,189,248,0.03)',
            border: '1px solid rgba(56,189,248,0.1)',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: 'rgba(56,189,248,0.08)',
              border: '1px solid rgba(56,189,248,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <SvgIcon d={ICONS.mic} size={16} color="#38BDF8" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: C.text1 }}>Whisper Transkription</div>
            <div style={{ fontSize: 11, color: C.text3, marginTop: 1 }}>Audio-zu-Text in Echtzeit, mehrsprachig</div>
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              padding: '3px 8px',
              borderRadius: 5,
              background: 'rgba(52,211,153,0.1)',
              color: C.success,
            }}
          >
            Aktiv
          </span>
        </div>
        <p style={{ fontSize: 11, color: C.text3, margin: 0, lineHeight: 1.6 }}>
          Lade Meeting-Aufnahmen hoch und erhalte automatisch Transkripte, Zusammenfassungen, Action Items und
          Coaching-Tipps.
        </p>
      </SectionCard>

      {/* Coming Soon */}
      <SectionCard
        title="In Planung"
        description="Diese Integrationen kommen in zukünftigen Updates."
        collapsible
        defaultOpen={false}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <IntegrationCard
            name="Google Calendar"
            description="Meeting-Sync & automatische Terminplanung"
            icon={ICONS.calendar}
            color="#4285F4"
            status="coming-soon"
          />
          <IntegrationCard
            name="Slack"
            description="Echtzeit-Benachrichtigungen für dein Team"
            icon={ICONS.chat}
            color="#4A154B"
            status="coming-soon"
          />
          <IntegrationCard
            name="HubSpot"
            description="CRM-Sync — Leads und Deals bidirektional"
            icon={ICONS.globe}
            color="#FF7A59"
            status="coming-soon"
          />
        </div>
      </SectionCard>
    </div>
  );
}

// ─── SECTION: TEAM & ZUGÄNGE ────────────────────────────────────────────────

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
  invited_at: string;
  last_sign_in: string | null;
}

interface TeamInvite {
  token: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
}

function TeamSection() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviting, setInviting] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Load team data
  useEffect(() => {
    loadTeam();
  }, []);

  async function loadTeam() {
    try {
      const res = await fetch('/api/team');
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members ?? []);
        setInvitations(data.invitations ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite() {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      showToast('Bitte gültige E-Mail eingeben', 'error');
      return;
    }
    setInviting(true);
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          name: inviteName,
        }),
      });
      const data = await res.json();
      if (res.ok && data.invite_link) {
        await navigator.clipboard.writeText(data.invite_link);
        setCopiedLink(data.invite_link);
        showToast('Einladungslink kopiert!', 'success');
        setInviteEmail('');
        setInviteName('');
        loadTeam();
        setTimeout(() => setCopiedLink(null), 15000);
      } else {
        showToast(data.error || 'Fehler beim Erstellen', 'error');
      }
    } catch {
      showToast('Netzwerkfehler', 'error');
    } finally {
      setInviting(false);
    }
  }

  async function handleRemoveMember(userId: string, name: string) {
    if (!confirm(`${name} wirklich aus dem Team entfernen?`)) return;
    try {
      const res = await fetch(`/api/team/members/${userId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast(`${name} entfernt`, 'success');
        loadTeam();
      } else {
        const data = await res.json();
        showToast(data.error || 'Fehler', 'error');
      }
    } catch {
      showToast('Netzwerkfehler', 'error');
    }
  }

  async function handleResetPassword(userId: string, name: string) {
    if (!confirm(`Passwort für ${name} zurücksetzen?`)) return;
    try {
      const res = await fetch(`/api/team/members/${userId}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.tempPassword) {
        await navigator.clipboard.writeText(data.tempPassword);
        showToast(`Neues Passwort kopiert: ${data.tempPassword}`, 'success');
      } else {
        showToast(data.error || 'Fehler', 'error');
      }
    } catch {
      showToast('Netzwerkfehler', 'error');
    }
  }

  async function handleRevokeInvite(token: string) {
    try {
      const res = await fetch(`/api/team/invite/${token}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast('Einladung widerrufen', 'success');
        loadTeam();
      } else {
        const data = await res.json();
        showToast(data.error || 'Fehler', 'error');
      }
    } catch {
      showToast('Netzwerkfehler', 'error');
    }
  }

  function timeAgo(dateStr: string | null) {
    if (!dateStr) return 'Nie';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Gerade eben';
    if (mins < 60) return `Vor ${mins} Min.`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Vor ${hours} Std.`;
    const days = Math.floor(hours / 24);
    return `Vor ${days} Tag${days > 1 ? 'en' : ''}`;
  }

  const roleColors: Record<string, { bg: string; border: string; text: string }> = {
    owner: { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)', text: '#FBBF24' },
    admin: { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)', text: C.accentBright },
    member: { bg: 'rgba(255,255,255,0.04)', border: C.border, text: C.text3 },
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[1, 2].map((i) => (
          <div
            key={i}
            style={{
              height: 80,
              borderRadius: 12,
              background: C.surface,
              border: `1px solid ${C.border}`,
              animation: 'pulse-live 1.5s ease infinite',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Overview */}
      <div style={{ padding: '0 2px' }}>
        <p style={{ fontSize: 12, color: C.text3, margin: 0, lineHeight: 1.7 }}>
          Hier verwaltest du, wer Zugriff auf deinen Onvero-Account hat. Jedes Teammitglied bekommt eigene Zugangsdaten.
          Maximal 10 Mitglieder pro Account.
        </p>
      </div>

      {/* Members */}
      <SectionCard title={`Team-Mitglieder (${members.length}/10)`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {members.map((m) => {
            const rc = roleColors[m.role] || roleColors.member;
            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 16px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.015)',
                  border: `1px solid ${C.border}`,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 9,
                    background:
                      m.role === 'admin'
                        ? 'linear-gradient(135deg, #6366F1, #818CF8)'
                        : 'linear-gradient(135deg, #374151, #4B5563)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#fff',
                    flexShrink: 0,
                  }}
                >
                  {m.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: C.text1 }}>{m.name}</span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        padding: '2px 7px',
                        borderRadius: 4,
                        background: rc.bg,
                        border: `1px solid ${rc.border}`,
                        color: rc.text,
                        letterSpacing: '0.03em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {m.role}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>
                    {m.email} · Aktiv: {timeAgo(m.last_sign_in)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => handleResetPassword(m.id, m.name)}
                    style={{
                      background: 'none',
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      padding: '4px 10px',
                      fontSize: 10,
                      color: C.text3,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Passwort
                  </button>
                  {m.role !== 'owner' && (
                    <button
                      onClick={() => handleRemoveMember(m.id, m.name)}
                      style={{
                        background: 'none',
                        border: `1px solid ${C.border}`,
                        borderRadius: 6,
                        padding: '4px 10px',
                        fontSize: 10,
                        color: '#F87171',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      Entfernen
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {members.length === 0 && (
            <p
              style={{
                fontSize: 12,
                color: C.text3,
                textAlign: 'center',
                padding: 20,
              }}
            >
              Noch keine Mitglieder. Lade jemanden ein!
            </p>
          )}
        </div>
      </SectionCard>

      {/* Invite */}
      <SectionCard
        title="Mitglied einladen"
        description="Es wird ein Einladungslink generiert, den du direkt teilen kannst. Der Eingeladene erstellt sich damit ein Konto."
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Vorname">
            <Input value={inviteName} onChange={setInviteName} placeholder="Max" />
          </Field>
          <Field label="E-Mail-Adresse">
            <Input value={inviteEmail} onChange={setInviteEmail} placeholder="max@firma.de" />
          </Field>
        </div>
        <Field label="Rolle">
          <Select
            value={inviteRole}
            onChange={setInviteRole}
            options={[
              {
                value: 'member',
                label: 'Mitglied — Kann Leads, Meetings & Analytics nutzen',
              },
              {
                value: 'admin',
                label: 'Admin — Vollzugriff inkl. Einstellungen & Team',
              },
            ]}
          />
        </Field>
        <GlowButton onClick={handleInvite}>
          {inviting ? 'Erstelle Link...' : 'Einladungslink erstellen & kopieren'}
        </GlowButton>

        {copiedLink && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              background: 'rgba(52,211,153,0.06)',
              border: '1px solid rgba(52,211,153,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <SvgIcon d={ICONS.check} size={14} color={C.success} />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 11,
                  color: C.success,
                  fontWeight: 500,
                  marginBottom: 4,
                }}
              >
                Link kopiert! Teile ihn mit deinem Teammitglied:
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: C.text3,
                  fontFamily: 'ui-monospace, monospace',
                  wordBreak: 'break-all',
                }}
              >
                {copiedLink}
              </div>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(copiedLink);
                showToast('Erneut kopiert', 'success');
              }}
              style={{
                background: 'none',
                border: `1px solid rgba(52,211,153,0.2)`,
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 10,
                color: C.success,
                cursor: 'pointer',
                fontFamily: 'inherit',
                flexShrink: 0,
              }}
            >
              Kopieren
            </button>
          </div>
        )}
      </SectionCard>

      {/* Pending Invites */}
      {invitations.length > 0 && (
        <SectionCard
          title={`Offene Einladungen (${invitations.length})`}
          description="Einladungen, die noch nicht angenommen wurden. Links sind 7 Tage gültig."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {invitations.map((inv) => (
              <div
                key={inv.token}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.015)',
                  border: `1px solid ${C.border}`,
                }}
              >
                <div>
                  <span style={{ fontSize: 12, color: C.text1 }}>{inv.email}</span>
                  <span
                    style={{
                      fontSize: 9,
                      marginLeft: 8,
                      padding: '2px 6px',
                      borderRadius: 3,
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${C.border}`,
                      color: C.text3,
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                    }}
                  >
                    {inv.role}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: C.text3 }}>
                    Läuft ab: {new Date(inv.expires_at).toLocaleDateString('de-DE')}
                  </span>
                  <button
                    onClick={() => {
                      const link = `${window.location.origin}/join?token=${inv.token}`;
                      navigator.clipboard.writeText(link);
                      showToast('Link kopiert', 'success');
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
                    Link kopieren
                  </button>
                  <button
                    onClick={() => handleRevokeInvite(inv.token)}
                    style={{
                      background: 'none',
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      padding: '4px 10px',
                      fontSize: 10,
                      color: '#F87171',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Widerrufen
                  </button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Permissions */}
      <SectionCard
        title="Rollen & Berechtigungen"
        description="Übersicht, was jede Rolle sehen und tun kann."
        collapsible
        defaultOpen={false}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr',
            gap: 0,
            borderRadius: 8,
            overflow: 'hidden',
            border: `1px solid ${C.border}`,
          }}
        >
          {['Funktion', 'Admin', 'Mitglied'].map((h, i) => (
            <div
              key={h}
              style={{
                padding: '10px 14px',
                fontWeight: 600,
                fontSize: 10,
                color: C.text3,
                letterSpacing: '0.05em',
                textTransform: 'uppercase' as const,
                background: 'rgba(255,255,255,0.03)',
                borderBottom: `1px solid ${C.border}`,
                textAlign: i > 0 ? ('center' as const) : ('left' as const),
              }}
            >
              {h}
            </div>
          ))}
          {[
            { label: 'Leads anzeigen & bearbeiten', admin: true, member: true },
            { label: 'Lead-Generierung', admin: true, member: true },
            { label: 'E-Mails versenden', admin: true, member: true },
            { label: 'Meetings', admin: true, member: true },
            { label: 'Analytics & Reports', admin: true, member: true },
            { label: 'Einstellungen ändern', admin: true, member: false },
            { label: 'Team verwalten', admin: true, member: false },
            { label: 'Account & Abrechnung', admin: true, member: false },
          ].map((row, i) => (
            <div key={row.label} style={{ display: 'contents' }}>
              <div
                style={{
                  padding: '8px 14px',
                  fontSize: 11,
                  color: C.text2,
                  borderBottom: i < 7 ? `1px solid ${C.border}` : 'none',
                }}
              >
                {row.label}
              </div>
              {[row.admin, row.member].map((has, ci) => (
                <div
                  key={ci}
                  style={{
                    padding: '8px 14px',
                    textAlign: 'center',
                    borderBottom: i < 7 ? `1px solid ${C.border}` : 'none',
                    fontSize: 11,
                    color: has ? C.success : 'rgba(255,255,255,0.15)',
                  }}
                >
                  {has ? '✓' : '—'}
                </div>
              ))}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── SECTION: PLAN & NUTZUNG ────────────────────────────────────────────────

function CreditBar({ used, total, color }: { used: number; total: number; color: string }) {
  const pct = Math.min(Math.round((used / total) * 100), 100);
  return (
    <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
      <div
        style={{
          height: '100%',
          borderRadius: 3,
          width: `${pct}%`,
          background:
            pct > 85 ? 'linear-gradient(90deg, #FBBF24, #F87171)' : `linear-gradient(90deg, ${color}, ${color}88)`,
          transition: 'width 0.5s ease',
        }}
      />
    </div>
  );
}

function PlanSection() {
  const totalCredits = 25000;
  const usedCredits = 8470;
  const remainingCredits = totalCredits - usedCredits;
  const usagePercent = Math.round((usedCredits / totalCredits) * 100);
  const resetDate = '1. Mai 2026';

  // What costs credits
  const creditActions = [
    {
      label: 'Lead generieren (E-Mail)',
      credits: 10,
      desc: 'Neuer Lead mit verifizierter geschäftlicher E-Mail-Adresse',
      color: '#34D399',
      icon: ICONS.mail,
    },
    {
      label: 'Lead generieren (E-Mail + Telefon)',
      credits: 50,
      desc: 'Lead mit E-Mail und direkter Durchwahl / Mobilnummer',
      color: '#38BDF8',
      icon: ICONS.users,
    },
    {
      label: 'Telefonnummer nachträglich abrufen',
      credits: 40,
      desc: 'Telefonnummer für einen bestehenden Lead nachziehen',
      color: '#38BDF8',
      icon: ICONS.zap,
    },
    {
      label: 'KI-Scoring',
      credits: 5,
      desc: 'Automatische Bewertung eines Leads durch die KI',
      color: '#818CF8',
      icon: ICONS.spark,
    },
    {
      label: 'KI Re-Scoring',
      credits: 3,
      desc: 'Lead erneut bewerten (z.B. nach neuen Daten)',
      color: '#A78BFA',
      icon: ICONS.spark,
    },
    {
      label: 'Website-Analyse',
      credits: 8,
      desc: 'Website eines Unternehmens analysieren und zusammenfassen',
      color: '#FBBF24',
      icon: ICONS.globe,
    },
  ];

  // What's free
  const freeFeatures = [
    'E-Mail-Versand (Outreach, Follow-ups)',
    'Meetings (Aufnahme, Transkription, KI-Analyse)',
    'Dashboard & Analytics',
    'Pipeline / CRM / Kanban',
    'Lead-Filter, Suche & Verwaltung',
    'Team-Zusammenarbeit (max. 10 Nutzer)',
    'Einstellungen & Integrationen',
    'Daten-Export (CSV)',
  ];

  // Usage by category
  const usageBreakdown = [
    { label: 'Leads (E-Mail)', used: 620, credits: 6200, icon: ICONS.mail, color: '#34D399' },
    { label: 'Leads (+ Telefon)', used: 18, credits: 900, icon: ICONS.users, color: '#38BDF8' },
    { label: 'KI-Scoring', used: 638, credits: 870, icon: ICONS.spark, color: '#818CF8' },
    { label: 'Website-Analysen', used: 62, credits: 500, icon: ICONS.globe, color: '#FBBF24' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Current Plan */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(52,211,153,0.06), rgba(56,189,248,0.03))',
          border: '1px solid rgba(52,211,153,0.15)',
          borderRadius: 12,
          padding: '20px 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text1, margin: 0 }}>Starter</h3>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  padding: '2px 7px',
                  borderRadius: 4,
                  background: 'rgba(52,211,153,0.1)',
                  border: '1px solid rgba(52,211,153,0.2)',
                  color: C.success,
                  letterSpacing: '0.04em',
                }}
              >
                AKTIV
              </span>
            </div>
            <p style={{ fontSize: 12, color: C.text3, margin: '4px 0 0' }}>
              €249/Monat · {totalCredits.toLocaleString()} Credits · Reset: {resetDate}
            </p>
          </div>
          <GlowButton onClick={() => showToast('Upgrade-Optionen werden geladen...', 'info')}>Upgrade</GlowButton>
        </div>

        {/* Credit bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: C.text2 }}>
              <strong style={{ color: C.text1, fontSize: 15 }}>{remainingCredits.toLocaleString()}</strong> Credits
              übrig
            </span>
            <span style={{ fontSize: 11, color: C.text3 }}>
              {usedCredits.toLocaleString()} / {totalCredits.toLocaleString()} verbraucht ({usagePercent}%)
            </span>
          </div>
          <CreditBar used={usedCredits} total={totalCredits} color="#34D399" />
        </div>
      </div>

      {/* How credits work */}
      <SectionCard
        title="So funktionieren Credits"
        description="Credits sind deine Währung auf Onvero. Du entscheidest, wofür du sie einsetzt."
      >
        <p style={{ fontSize: 12, color: C.text2, margin: 0, lineHeight: 1.7 }}>
          Jeder Plan enthält ein monatliches Credit-Budget. Credits werden verbraucht, wenn du{' '}
          <strong style={{ color: C.text1 }}>neue Lead-Daten generierst</strong> oder{' '}
          <strong style={{ color: C.text1 }}>KI-Funktionen</strong> nutzt. Alles andere — E-Mails senden, Meetings
          aufnehmen, Analytics, CRM — ist kostenlos und unbegrenzt. Nicht verbrauchte Credits verfallen am Ende des
          Monats.
        </p>
      </SectionCard>

      {/* What costs credits */}
      <SectionCard title="Was kostet Credits?">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {creditActions.map((item) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '11px 14px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.015)',
                border: `1px solid ${C.border}`,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: `${item.color}10`,
                  border: `1px solid ${item.color}18`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <SvgIcon d={item.icon} size={14} color={item.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: C.text1 }}>{item.label}</div>
                <div style={{ fontSize: 10, color: C.text3, marginTop: 1 }}>{item.desc}</div>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: item.color,
                  background: `${item.color}08`,
                  padding: '4px 10px',
                  borderRadius: 6,
                  minWidth: 50,
                  textAlign: 'center',
                }}
              >
                {item.credits}
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 10.5, color: C.text3, margin: '8px 0 0', lineHeight: 1.5, opacity: 0.7 }}>
          Tipp: Du kannst Telefonnummern auch nachträglich für gut gescorte Leads abrufen, statt sie direkt bei der
          Generierung mitzunehmen. So sparst du Credits für die Leads, die es wirklich wert sind.
        </p>
      </SectionCard>

      {/* What's free */}
      <SectionCard
        title="Kostenlos in jedem Plan"
        description="Diese Funktionen kosten keine Credits — egal wie oft du sie nutzt."
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {freeFeatures.map((f) => (
            <div
              key={f}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 7,
                background: 'rgba(52,211,153,0.03)',
                border: '1px solid rgba(52,211,153,0.08)',
              }}
            >
              <SvgIcon d={ICONS.check} size={12} color={C.success} />
              <span style={{ fontSize: 11, color: C.text2 }}>{f}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Usage this month */}
      <SectionCard title="Verbrauch diesen Monat">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {usageBreakdown.map((item) => (
            <div key={item.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <SvgIcon d={item.icon} size={12} color={item.color} />
                  <span style={{ fontSize: 12, color: C.text1 }}>{item.label}</span>
                </div>
                <span style={{ fontSize: 11, color: C.text3 }}>
                  {item.used}x · <strong style={{ color: item.color }}>{item.credits.toLocaleString()} Credits</strong>
                </span>
              </div>
              <CreditBar used={item.credits} total={totalCredits} color={item.color} />
            </div>
          ))}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px 0',
              borderTop: `1px solid ${C.border}`,
              marginTop: 4,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 500, color: C.text1 }}>Gesamt verbraucht</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.text1 }}>
              {usedCredits.toLocaleString()} / {totalCredits.toLocaleString()} Credits
            </span>
          </div>
        </div>
      </SectionCard>

      {/* Plans */}
      <SectionCard
        title="Verfügbare Pläne"
        description="Alle Pläne inkl. max. 10 Team-Mitglieder, unbegrenzt Meetings, E-Mails & Analytics."
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            {
              name: 'Starter',
              credits: '25.000',
              price: '249',
              leads: '~2.000 Leads/Mo',
              current: true,
              color: '#34D399',
            },
            {
              name: 'Growth',
              credits: '60.000',
              price: '499',
              leads: '~5.000 Leads/Mo',
              current: false,
              color: '#818CF8',
            },
            {
              name: 'Scale',
              credits: '125.000',
              price: '899',
              leads: '~10.000 Leads/Mo',
              current: false,
              color: '#FBBF24',
            },
          ].map((plan) => (
            <div
              key={plan.name}
              style={{
                padding: '20px 16px',
                borderRadius: 10,
                textAlign: 'center',
                background: plan.current ? 'rgba(52,211,153,0.04)' : 'rgba(255,255,255,0.015)',
                border: `1px solid ${plan.current ? 'rgba(52,211,153,0.2)' : C.border}`,
                position: 'relative',
              }}
            >
              {plan.current && (
                <span
                  style={{
                    position: 'absolute',
                    top: -8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: 8,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: C.success,
                    color: '#0B1120',
                    letterSpacing: '0.06em',
                  }}
                >
                  AKTUELL
                </span>
              )}
              <div style={{ fontSize: 14, fontWeight: 600, color: plan.color, marginBottom: 6 }}>{plan.name}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: C.text1 }}>
                €{plan.price}
                <span style={{ fontSize: 11, fontWeight: 400, color: C.text3 }}>/Mo</span>
              </div>
              <div style={{ fontSize: 12, color: C.text1, fontWeight: 500, margin: '8px 0 2px' }}>
                {plan.credits} Credits
              </div>
              <div style={{ fontSize: 10, color: C.text3, marginBottom: 14 }}>{plan.leads}</div>
              {!plan.current && (
                <button
                  onClick={() => showToast(`Upgrade auf ${plan.name} angefragt`, 'success')}
                  style={{
                    width: '100%',
                    padding: '8px 0',
                    borderRadius: 7,
                    fontSize: 11,
                    fontWeight: 500,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    border: `1px solid ${plan.color}30`,
                    background: `${plan.color}08`,
                    color: plan.color,
                    transition: 'all 0.15s ease',
                  }}
                >
                  Upgrade
                </button>
              )}
            </div>
          ))}
        </div>
        <p style={{ fontSize: 10.5, color: C.text3, margin: '4px 0 0', lineHeight: 1.5, opacity: 0.7 }}>
          Credits verfallen am Ende des Monats. Brauchst du mehr? Upgrade auf den nächsten Plan.
        </p>
      </SectionCard>
    </div>
  );
}

// ─── PAGE ────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>('profil');
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'member'>('member');

  const canEdit = userRole === 'owner' || userRole === 'admin';

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/profile');
        const data = await res.json();
        if (data.profile) {
          setProfile({ ...EMPTY_PROFILE, ...data.profile });
        }
        if (data.role) {
          setUserRole(data.role);
        }
      } catch {
        // Keep empty profile
      } finally {
        setProfileLoaded(true);
      }
    })();
  }, []);

  async function handleSave() {
    if (!canEdit) {
      showToast('Nur Admins können Einstellungen ändern', 'error');
      return;
    }
    setSaving(true);
    try {
      const method = profileLoaded ? 'PATCH' : 'POST';
      const res = await fetch('/api/profile', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (data.profile) {
        setProfile({ ...EMPTY_PROFILE, ...data.profile });
        showToast('Einstellungen gespeichert', 'success');
      } else {
        showToast('Fehler beim Speichern', 'error');
      }
    } catch {
      showToast('Netzwerkfehler', 'error');
    } finally {
      setSaving(false);
    }
  }

  const sectionContent: Record<Section, React.ReactNode> = {
    profil: <ProfilSection profile={profile} onChange={setProfile} />,
    integrationen: <IntegrationenSection />,
    team: <TeamSection />,
    plan: <PlanSection />,
  };

  return (
    <>
      <Breadcrumbs items={[{ label: 'Onvero Sales', href: '/sales' }, { label: 'Einstellungen' }]} />
      <PageHeader
        title="Einstellungen"
        subtitle="Konfiguriere dein Sales-Dashboard nach deinen Bedürfnissen"
        actions={
          canEdit ? <GlowButton onClick={handleSave}>{saving ? 'Speichern...' : 'Speichern'}</GlowButton> : undefined
        }
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
