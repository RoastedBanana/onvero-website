'use client';

import { useState, useEffect } from 'react';

export interface ReasoningResult {
  success: boolean;
  reasoning: string;
  strategy: string;
  apollo_keywords: string[];
  apollo_industries: string[];
  refined_employee_min: number;
  refined_employee_max: number;
  confidence: number;
  why_contact_even_if_low_score: string;
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
  onConfirm: () => void;
}

const labelStyle = { fontSize: 11, color: '#555', display: 'block' as const, marginBottom: 4 };
const inputStyle = {
  width: '100%',
  background: '#0d0d0d',
  border: '0.5px solid #222',
  borderRadius: 6,
  padding: '7px 10px',
  fontSize: 12,
  color: '#e0e0e0',
  outline: 'none',
  fontFamily: 'var(--font-dm-sans)',
};

export default function ReasoningDisplay({ result, onBack, onConfirm }: Props) {
  const confColor = result.confidence >= 80 ? '#4ade80' : result.confidence >= 60 ? '#f59e0b' : '#444';

  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) setProfile(d.profile);
      })
      .catch(() => {});
  }, []);

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
        {/* ── Left: KI-Analyse ── */}
        <div style={{ background: '#111', border: '0.5px solid #1a1a1a', borderRadius: 10, padding: 24 }}>
          <div
            style={{
              fontSize: 11,
              color: '#4a9a6a',
              letterSpacing: '0.04em',
              textTransform: 'uppercase' as const,
              marginBottom: 14,
            }}
          >
            KI-Analyse
          </div>

          <p style={{ fontSize: 14, color: '#ccc', lineHeight: 1.65, margin: '0 0 16px' }}>{result.reasoning}</p>

          <div style={{ borderTop: '0.5px solid #1a1a1a', paddingTop: 14, marginBottom: 18 }}>
            <p style={{ fontSize: 14, color: '#888', lineHeight: 1.65, margin: 0 }}>{result.strategy}</p>
          </div>

          {/* Refined Search */}
          <div style={{ borderTop: '0.5px solid #1a1a1a', paddingTop: 14, marginBottom: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
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
                  Keywords
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {result.apollo_keywords.map((k) => (
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
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
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
                  Industrien
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {result.apollo_industries.map((i) => (
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
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
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
                  Mitarbeiter
                </span>
                <span style={{ fontSize: 13, color: '#aaa', fontFamily: 'var(--font-dm-mono)' }}>
                  {result.refined_employee_min} – {result.refined_employee_max}
                </span>
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
        <div style={{ background: '#111', border: '0.5px solid #1a1a1a', borderRadius: 10, padding: 24 }}>
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

          {!profile ? (
            <div style={{ fontSize: 12, color: '#444', padding: '20px 0', textAlign: 'center' }}>
              Profil wird geladen...
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

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginTop: 20, maxWidth: 500 }}>
        <button
          onClick={onBack}
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: 8,
            border: '0.5px solid #222',
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
          onClick={onConfirm}
          style={{
            flex: 2,
            padding: '10px',
            borderRadius: 8,
            border: 'none',
            background: '#e0e0e0',
            color: '#080808',
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
