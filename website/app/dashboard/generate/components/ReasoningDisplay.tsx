'use client';

import { useState, useEffect, useRef } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import TitlesMultiSelect from './TitlesMultiSelect';
import LocationsMultiSelect from './LocationsMultiSelect';

export interface ReasoningResult {
  success: boolean;
  reasoning: string;
  strategy: string;
  apollo_keywords: string[];
  apollo_industries: string[];
  person_titles?: string[];
  person_locations?: string[];
  refined_employee_min: number;
  refined_employee_max: number;
  confidence: number;
  why_contact_even_if_low_score: string;
  execution_id?: string;
}

interface Profile {
  company_name: string;
  company_description: string;
  target_customers: string;
  excluded_profiles: string;
  usp: string;
  sender_name: string;
  sender_role: string;
  deal_size_min: number | null;
  deal_size_max: number | null;
}

interface Props {
  result: ReasoningResult;
  onBack: () => void;
  onConfirm: (data: {
    leadCount: number;
    apolloKeywords: string[];
    apolloIndustries: string[];
    apolloTitles: string[];
    apolloLocations: string[];
    employeeMin: number;
    employeeMax: number;
  }) => void;
}

type Section = 'keywords' | 'industries' | 'titles' | 'locations' | 'employees';

function EditableChips({
  values,
  onChange,
  color,
  bg,
  border,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  color: string;
  bg: string;
  border: string;
  placeholder: string;
}) {
  const [input, setInput] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput('');
  };
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div
      onClick={() => ref.current?.focus()}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 4,
        cursor: 'text',
        flex: 1,
        background: '#0a0a0a',
        border: '0.5px solid #2a2a2a',
        borderRadius: 6,
        padding: '4px 6px',
        minHeight: 28,
      }}
    >
      {values.map((t) => (
        <span
          key={t}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            background: bg,
            border: `0.5px solid ${border}`,
            color,
            padding: '2px 4px 2px 8px',
            borderRadius: 6,
          }}
        >
          {t}
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChange(values.filter((x) => x !== t));
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#555',
              cursor: 'pointer',
              fontSize: 11,
              padding: '0 2px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={ref}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
            if (input.trim()) {
              e.preventDefault();
              add();
            }
          }
          if (e.key === 'Backspace' && input === '' && values.length > 0) onChange(values.slice(0, -1));
        }}
        placeholder={values.length === 0 ? placeholder : 'Enter zum Hinzufügen…'}
        style={{
          flex: 1,
          minWidth: 100,
          background: 'transparent',
          border: 'none',
          fontSize: 11,
          color: '#e0e0e0',
          outline: 'none',
          padding: '2px 4px',
          fontFamily: 'var(--font-dm-sans)',
        }}
      />
      {input.trim() && (
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            add();
          }}
          title="Hinzufügen"
          style={{
            background: bg,
            border: `0.5px solid ${border}`,
            color,
            cursor: 'pointer',
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 6,
            lineHeight: 1.4,
          }}
        >
          + hinzufügen
        </button>
      )}
    </div>
  );
}

const SECTION_LABEL_STYLE = {
  fontSize: 11,
  color: '#555',
  width: 80,
  flexShrink: 0,
  letterSpacing: '0.04em',
  textTransform: 'uppercase' as const,
} as const;

function EditButton({ onClick, active }: { onClick: () => void; active: boolean }) {
  return (
    <button
      onClick={onClick}
      title={active ? 'Fertig' : 'Bearbeiten'}
      style={{
        background: 'none',
        border: 'none',
        padding: 2,
        marginLeft: 4,
        cursor: 'pointer',
        color: active ? '#4ade80' : '#444',
        display: 'inline-flex',
        alignItems: 'center',
        flexShrink: 0,
        transition: 'color 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = active ? '#4ade80' : '#888')}
      onMouseLeave={(e) => (e.currentTarget.style.color = active ? '#4ade80' : '#444')}
    >
      {active ? <Check size={12} /> : <Pencil size={11} />}
    </button>
  );
}

const LEAD_COUNT_MIN = 10;
const LEAD_COUNT_MAX = 100;
const LEAD_COUNT_STEP = 5;
const LEAD_COUNT_DEFAULT = 50;

const labelStyle = { fontSize: 11, color: '#555', display: 'block' as const, marginBottom: 4 };
const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 12,
  padding: '7px 10px',
  fontSize: 12,
  color: '#e0e0e0',
  outline: 'none',
  fontFamily: 'var(--font-dm-sans)',
};

export default function ReasoningDisplay({ result, onBack, onConfirm }: Props) {
  const confColor = result.confidence >= 80 ? '#4ade80' : result.confidence >= 60 ? '#f59e0b' : '#444';

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [leadCount, setLeadCount] = useState<number>(LEAD_COUNT_DEFAULT);
  const sliderPct = ((leadCount - LEAD_COUNT_MIN) / (LEAD_COUNT_MAX - LEAD_COUNT_MIN)) * 100;

  // Editable refined-search state
  const [keywords, setKeywords] = useState<string[]>(result.apollo_keywords ?? []);
  const [industries, setIndustries] = useState<string[]>(result.apollo_industries ?? []);
  const [titles, setTitles] = useState<string[]>(result.person_titles ?? []);
  const [locations, setLocations] = useState<string[]>(result.person_locations ?? []);
  const [empMin, setEmpMin] = useState<number>(result.refined_employee_min);
  const [empMax, setEmpMax] = useState<number>(result.refined_employee_max);
  const [editing, setEditing] = useState<Section | null>(null);
  const toggleEdit = (s: Section) => setEditing((prev) => (prev === s ? null : s));

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((d) => {
        setProfile(d.profile ?? null);
      })
      .catch(() => {})
      .finally(() => setProfileLoaded(true));
  }, []);

  const createProfile = async () => {
    setCreatingProfile(true);
    try {
      const r = await fetch('/api/profile', { method: 'POST' });
      const d = await r.json();
      if (d.profile) setProfile(d.profile);
    } catch {
      /* ignore */
    }
    setCreatingProfile(false);
  };

  const updateProfile = (field: keyof Profile, value: string | number | null) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  };

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: profile.company_name,
          company_description: profile.company_description,
          target_customers: profile.target_customers,
          excluded_profiles: profile.excluded_profiles,
          usp: profile.usp,
          sender_name: profile.sender_name,
          sender_role: profile.sender_role,
          deal_size_min: profile.deal_size_min,
          deal_size_max: profile.deal_size_max,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {
      /* ignore */
    }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <style>{`@keyframes confBar{from{width:0%}}`}</style>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* ── Left: Analyse ── */}
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '0.5px solid rgba(255,255,255,0.05)',
            borderRadius: 14,
            padding: 24,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: '#4a9a6a',
              letterSpacing: '0.04em',
              textTransform: 'uppercase' as const,
              marginBottom: 14,
            }}
          >
            Such-Analyse
          </div>

          <p style={{ fontSize: 14, color: '#ccc', lineHeight: 1.65, margin: '0 0 16px' }}>{result.reasoning}</p>

          <div style={{ borderTop: '0.5px solid #1a1a1a', paddingTop: 14, marginBottom: 18 }}>
            <p style={{ fontSize: 14, color: '#888', lineHeight: 1.65, margin: 0 }}>{result.strategy}</p>
          </div>

          {/* Refined Search (editable) */}
          <div style={{ borderTop: '0.5px solid #1a1a1a', paddingTop: 14, marginBottom: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Keywords */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ ...SECTION_LABEL_STYLE, paddingTop: 3 }}>Keywords</span>
                {editing === 'keywords' ? (
                  <EditableChips
                    values={keywords}
                    onChange={setKeywords}
                    color="#7c9cef"
                    bg="#1a1a2a"
                    border="#2a2a3a"
                    placeholder="Keyword hinzufügen…"
                  />
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, flex: 1 }}>
                    {keywords.length === 0 ? (
                      <span style={{ fontSize: 11, color: '#444', fontStyle: 'italic' }}>—</span>
                    ) : (
                      keywords.map((k) => (
                        <span
                          key={k}
                          style={{
                            fontSize: 11,
                            background: '#1a1a2a',
                            border: '0.5px solid #2a2a3a',
                            color: '#7c9cef',
                            padding: '2px 8px',
                            borderRadius: 6,
                          }}
                        >
                          {k}
                        </span>
                      ))
                    )}
                  </div>
                )}
                <EditButton onClick={() => toggleEdit('keywords')} active={editing === 'keywords'} />
              </div>

              {/* Industries */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ ...SECTION_LABEL_STYLE, paddingTop: 3 }}>Industrien</span>
                {editing === 'industries' ? (
                  <EditableChips
                    values={industries}
                    onChange={setIndustries}
                    color="#6dbf8a"
                    bg="#1a2a1a"
                    border="#2a3a2a"
                    placeholder="Industrie hinzufügen…"
                  />
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, flex: 1 }}>
                    {industries.length === 0 ? (
                      <span style={{ fontSize: 11, color: '#444', fontStyle: 'italic' }}>—</span>
                    ) : (
                      industries.map((i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: 11,
                            background: '#1a2a1a',
                            border: '0.5px solid #2a3a2a',
                            color: '#6dbf8a',
                            padding: '2px 8px',
                            borderRadius: 6,
                          }}
                        >
                          {i}
                        </span>
                      ))
                    )}
                  </div>
                )}
                <EditButton onClick={() => toggleEdit('industries')} active={editing === 'industries'} />
              </div>

              {/* Titles */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ ...SECTION_LABEL_STYLE, paddingTop: 3 }}>Titles</span>
                {editing === 'titles' ? (
                  <TitlesMultiSelect values={titles} onChange={setTitles} />
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, flex: 1 }}>
                    {titles.length === 0 ? (
                      <span style={{ fontSize: 11, color: '#444', fontStyle: 'italic' }}>—</span>
                    ) : (
                      titles.map((t) => (
                        <span
                          key={t}
                          style={{
                            fontSize: 11,
                            background: '#2a1f10',
                            border: '0.5px solid #3a2a14',
                            color: '#f59e0b',
                            padding: '2px 8px',
                            borderRadius: 6,
                          }}
                        >
                          {t}
                        </span>
                      ))
                    )}
                  </div>
                )}
                <EditButton onClick={() => toggleEdit('titles')} active={editing === 'titles'} />
              </div>

              {/* Locations */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ ...SECTION_LABEL_STYLE, paddingTop: 3 }}>Standorte</span>
                {editing === 'locations' ? (
                  <LocationsMultiSelect values={locations} onChange={setLocations} />
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, flex: 1 }}>
                    {locations.length === 0 ? (
                      <span style={{ fontSize: 11, color: '#444', fontStyle: 'italic' }}>—</span>
                    ) : (
                      locations.map((l) => (
                        <span
                          key={l}
                          style={{
                            fontSize: 11,
                            background: '#221a2a',
                            border: '0.5px solid #332440',
                            color: '#c084fc',
                            padding: '2px 8px',
                            borderRadius: 6,
                          }}
                        >
                          {l}
                        </span>
                      ))
                    )}
                  </div>
                )}
                <EditButton onClick={() => toggleEdit('locations')} active={editing === 'locations'} />
              </div>

              {/* Employees */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={SECTION_LABEL_STYLE}>Mitarbeiter</span>
                {editing === 'employees' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                    <input
                      type="number"
                      value={empMin}
                      min={1}
                      onChange={(e) => setEmpMin(Number(e.target.value))}
                      style={{
                        ...inputStyle,
                        width: 70,
                        padding: '4px 8px',
                        fontFamily: 'var(--font-dm-mono)',
                        textAlign: 'right' as const,
                      }}
                    />
                    <span style={{ fontSize: 12, color: '#444' }}>–</span>
                    <input
                      type="number"
                      value={empMax}
                      min={1}
                      onChange={(e) => setEmpMax(Number(e.target.value))}
                      style={{
                        ...inputStyle,
                        width: 70,
                        padding: '4px 8px',
                        fontFamily: 'var(--font-dm-mono)',
                        textAlign: 'right' as const,
                      }}
                    />
                  </div>
                ) : (
                  <span style={{ fontSize: 13, color: '#aaa', fontFamily: 'var(--font-dm-mono)', flex: 1 }}>
                    {empMin} – {empMax}
                  </span>
                )}
                <EditButton onClick={() => toggleEdit('employees')} active={editing === 'employees'} />
              </div>
            </div>

            {/* Confidence */}
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  fontSize: 11,
                  color: '#555',
                  width: 80,
                  flexShrink: 0,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase' as const,
                }}
              >
                Konfidenz
              </span>
              <div style={{ flex: 1, height: 4, background: '#1a1a1a', borderRadius: 2, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${result.confidence}%`,
                    background: confColor,
                    borderRadius: 2,
                    transition: 'width 0.6s ease',
                    animation: 'confBar 0.6s ease',
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: confColor,
                  fontFamily: 'var(--font-dm-mono)',
                  width: 36,
                  textAlign: 'right' as const,
                }}
              >
                {result.confidence}%
              </span>
            </div>
          </div>

          {/* Why contact */}
          {result.why_contact_even_if_low_score && (
            <div style={{ background: '#0f1a10', border: '0.5px solid #1a2a1a', borderRadius: 8, padding: 14 }}>
              <div
                style={{
                  fontSize: 11,
                  color: '#4a7a4a',
                  marginBottom: 4,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase' as const,
                }}
              >
                Auch bei niedrigem Score
              </div>
              <p style={{ fontSize: 13, color: '#6dbf8a', lineHeight: 1.55, margin: 0 }}>
                {result.why_contact_even_if_low_score}
              </p>
            </div>
          )}
        </div>

        {/* ── Right: Profil ── */}
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '0.5px solid rgba(255,255,255,0.05)',
            borderRadius: 14,
            padding: 24,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: '#555',
              letterSpacing: '0.04em',
              textTransform: 'uppercase' as const,
              marginBottom: 14,
            }}
          >
            Unternehmensprofil
          </div>

          {!profileLoaded ? (
            <div style={{ fontSize: 12, color: '#444', padding: '20px 0', textAlign: 'center' }}>
              Profil wird geladen...
            </div>
          ) : !profile ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                padding: '24px 16px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
                Noch kein Unternehmensprofil angelegt.
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', maxWidth: 280, lineHeight: 1.55 }}>
                Lege ein Profil an, damit Lead-Suche und personalisierte E-Mails anhand deines
                Unternehmens optimiert werden können.
              </div>
              <button
                onClick={createProfile}
                disabled={creatingProfile}
                style={{
                  marginTop: 4,
                  padding: '9px 18px',
                  borderRadius: 8,
                  border: '0.5px solid rgba(107,122,255,0.35)',
                  background: 'rgba(107,122,255,0.12)',
                  color: '#7c9cef',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: creatingProfile ? 'default' : 'pointer',
                  fontFamily: 'var(--font-dm-sans)',
                  transition: 'background 0.15s',
                }}
              >
                {creatingProfile ? 'Wird angelegt…' : '+ Profil erstellen'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Firmenname</label>
                <input
                  value={profile.company_name ?? ''}
                  onChange={(e) => updateProfile('company_name', e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Beschreibung</label>
                <textarea
                  value={profile.company_description ?? ''}
                  onChange={(e) => updateProfile('company_description', e.target.value)}
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical' as const }}
                />
              </div>
              <div>
                <label style={labelStyle}>Zielkunden</label>
                <textarea
                  value={profile.target_customers ?? ''}
                  onChange={(e) => updateProfile('target_customers', e.target.value)}
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical' as const }}
                />
              </div>
              <div>
                <label style={labelStyle}>USP</label>
                <input
                  value={profile.usp ?? ''}
                  onChange={(e) => updateProfile('usp', e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Ausgeschlossene Profile</label>
                <input
                  value={profile.excluded_profiles ?? ''}
                  onChange={(e) => updateProfile('excluded_profiles', e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Absender Name</label>
                  <input
                    value={profile.sender_name ?? ''}
                    onChange={(e) => updateProfile('sender_name', e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Rolle</label>
                  <input
                    value={profile.sender_role ?? ''}
                    onChange={(e) => updateProfile('sender_role', e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Deal Min (€)</label>
                  <input
                    type="number"
                    value={profile.deal_size_min ?? ''}
                    onChange={(e) => updateProfile('deal_size_min', e.target.value ? Number(e.target.value) : null)}
                    style={{ ...inputStyle, fontFamily: 'var(--font-dm-mono)' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Deal Max (€)</label>
                  <input
                    type="number"
                    value={profile.deal_size_max ?? ''}
                    onChange={(e) => updateProfile('deal_size_max', e.target.value ? Number(e.target.value) : null)}
                    style={{ ...inputStyle, fontFamily: 'var(--font-dm-mono)' }}
                  />
                </div>
              </div>
              <button
                onClick={saveProfile}
                disabled={saving}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: 6,
                  border: '0.5px solid #222',
                  background: saved ? '#1a2a1a' : 'transparent',
                  color: saved ? '#4ade80' : '#888',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: saving ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'var(--font-dm-sans)',
                }}
              >
                {saving ? '...' : saved ? 'Gespeichert ✓' : 'Profil speichern'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lead count slider */}
      <style>{`
        .onv-lead-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;border-radius:2px;outline:none;cursor:pointer;background:linear-gradient(to right,#e0e0e0 0%,#e0e0e0 var(--pct,50%),#1a1a1a var(--pct,50%),#1a1a1a 100%);}
        .onv-lead-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:16px;height:16px;border-radius:50%;background:#e0e0e0;border:2px solid #080808;box-shadow:0 0 0 0.5px #333;cursor:pointer;transition:transform .15s;}
        .onv-lead-slider::-webkit-slider-thumb:hover{transform:scale(1.15);}
        .onv-lead-slider::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:#e0e0e0;border:2px solid #080808;box-shadow:0 0 0 0.5px #333;cursor:pointer;}
      `}</style>
      <div
        style={{
          marginTop: 20,
          maxWidth: 500,
          background: '#111',
          border: '0.5px solid #1a1a1a',
          borderRadius: 10,
          padding: '16px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
          <span
            style={{
              fontSize: 11,
              color: '#555',
              letterSpacing: '0.04em',
              textTransform: 'uppercase' as const,
            }}
          >
            Anzahl Leads
          </span>
          <span
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: '#e0e0e0',
              fontFamily: 'var(--font-dm-mono)',
            }}
          >
            {leadCount}
          </span>
        </div>
        <input
          type="range"
          min={LEAD_COUNT_MIN}
          max={LEAD_COUNT_MAX}
          step={LEAD_COUNT_STEP}
          value={leadCount}
          onChange={(e) => setLeadCount(Number(e.target.value))}
          className="onv-lead-slider"
          style={{ ['--pct' as string]: `${sliderPct}%` } as React.CSSProperties}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 6,
            fontSize: 10,
            color: '#444',
            fontFamily: 'var(--font-dm-mono)',
          }}
        >
          <span>{LEAD_COUNT_MIN}</span>
          <span>{LEAD_COUNT_MAX}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginTop: 12, maxWidth: 500 }}>
        <button
          onClick={onBack}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: 12,
            border: '0.5px solid rgba(255,255,255,0.06)',
            background: 'transparent',
            color: '#888',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'var(--font-dm-sans)',
          }}
        >
          Anpassen
        </button>
        <button
          onClick={() =>
            onConfirm({
              leadCount,
              apolloKeywords: keywords,
              apolloIndustries: industries,
              apolloTitles: titles,
              apolloLocations: locations,
              employeeMin: empMin,
              employeeMax: empMax,
            })
          }
          style={{
            flex: 2,
            padding: '10px',
            borderRadius: 12,
            border: 'none',
            background: 'rgba(255,255,255,0.9)',
            color: '#050505',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'var(--font-dm-sans)',
          }}
        >
          Leads generieren →
        </button>
      </div>
    </div>
  );
}
