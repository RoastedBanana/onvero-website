'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

const TENANT_ID = 'df763f85-c687-42d6-be66-a2b353b89c90';

type Section = 'allgemein' | 'leads' | 'meetings' | 'analytics' | 'workflows' | 'support' | 'website' | 'business-ai';

const SECTIONS: { key: Section; label: string }[] = [
  { key: 'allgemein', label: 'Allgemein' },
  { key: 'leads', label: 'Leads' },
  { key: 'meetings', label: 'Meetings' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'workflows', label: 'Workflows' },
  { key: 'support', label: 'Support' },
  { key: 'website', label: 'Website' },
  { key: 'business-ai', label: 'Business AI' },
];

interface Profile {
  company_name: string;
  company_description: string;
  company_location: string;
  website: string;
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
}

const sectionLabel = {
  fontSize: 11,
  color: 'rgba(255,255,255,0.3)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  marginBottom: 10,
  marginTop: 20,
  fontWeight: 600,
};
const fieldLabel = { fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block' as const, marginBottom: 4 };
const fieldInput = {
  width: '100%',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 13,
  color: '#e0e0e0',
  outline: 'none',
  fontFamily: 'var(--font-dm-sans)',
};

export default function SettingsPage() {
  const [active, setActive] = useState<Section>('allgemein');
  const [autoFollowUp, setAutoFollowUp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [servicesText, setServicesText] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('tenant_preferences')
      .select('automatic_followup_emails')
      .eq('tenant_id', TENANT_ID)
      .single()
      .then(({ data }) => {
        if (data) setAutoFollowUp(data.automatic_followup_emails ?? false);
        setLoading(false);
      });
  }, []);

  async function toggleFollowUp() {
    const next = !autoFollowUp;
    setAutoFollowUp(next);
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from('tenant_preferences')
      .update({ automatic_followup_emails: next, updated_at: new Date().toISOString() })
      .eq('tenant_id', TENANT_ID);
    setSaving(false);
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'var(--font-dm-sans)' }}>
      {/* Sidebar */}
      <div
        style={{
          width: 200,
          borderRight: '1px solid rgba(255,255,255,0.07)',
          padding: '28px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'rgba(255,255,255,0.3)',
            padding: '0 10px 8px',
            fontWeight: 600,
          }}
        >
          Einstellungen
        </div>
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setActive(s.key)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '8px 10px',
              borderRadius: 7,
              border: 'none',
              background: active === s.key ? 'rgba(255,255,255,0.06)' : 'transparent',
              color: active === s.key ? '#fff' : 'rgba(255,255,255,0.45)',
              fontSize: 13,
              fontWeight: active === s.key ? 500 : 400,
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => {
              if (active !== s.key) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
              }
            }}
            onMouseLeave={(e) => {
              if (active !== s.key) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
              }
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '28px 36px', overflowY: 'auto' }}>
        {active === 'allgemein' && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Allgemein</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              Allgemeine Einstellungen werden bald verfuegbar sein.
            </p>
          </div>
        )}

        {active === 'leads' && (
          <LeadsSettings
            loading={loading}
            autoFollowUp={autoFollowUp}
            saving={saving}
            toggleFollowUp={toggleFollowUp}
            profile={profile}
            profileLoading={profileLoading}
            profileSaving={profileSaving}
            profileSaved={profileSaved}
            servicesText={servicesText}
            onLoadProfile={() => {
              if (profile) return;
              setProfileLoading(true);
              fetch('/api/profile')
                .then((r) => r.json())
                .then((d) => {
                  if (d.profile) {
                    setProfile(d.profile);
                    setServicesText((d.profile.services ?? []).join(', '));
                  }
                })
                .catch(() => {})
                .finally(() => setProfileLoading(false));
            }}
            onUpdateProfile={(field, value) => {
              if (profile) setProfile({ ...profile, [field]: value });
            }}
            onServicesText={setServicesText}
            onSaveProfile={async () => {
              if (!profile) return;
              setProfileSaving(true);
              try {
                await fetch('/api/profile', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    ...profile,
                    services: servicesText
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  }),
                });
                setProfileSaved(true);
                setTimeout(() => setProfileSaved(false), 1500);
              } catch {
                /* ignore */
              }
              setProfileSaving(false);
            }}
          />
        )}

        {active !== 'allgemein' && active !== 'leads' && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 8 }}>
              {SECTIONS.find((s) => s.key === active)?.label}
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Einstellungen werden bald verfuegbar sein.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LeadsSettings({
  loading,
  autoFollowUp,
  saving,
  toggleFollowUp,
  profile,
  profileLoading,
  profileSaving,
  profileSaved,
  servicesText,
  onLoadProfile,
  onUpdateProfile,
  onServicesText,
  onSaveProfile,
}: {
  loading: boolean;
  autoFollowUp: boolean;
  saving: boolean;
  toggleFollowUp: () => void;
  profile: Profile | null;
  profileLoading: boolean;
  profileSaving: boolean;
  profileSaved: boolean;
  servicesText: string;
  onLoadProfile: () => void;
  onUpdateProfile: (field: keyof Profile, value: string | number | null) => void;
  onServicesText: (v: string) => void;
  onSaveProfile: () => void;
}) {
  useEffect(() => {
    onLoadProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ maxWidth: 600 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 4 }}>Leads</h2>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>
        Lead-Management und KI-Profil Einstellungen.
      </p>

      {/* Follow-up toggle */}
      {!loading && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 18px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10,
            marginBottom: 28,
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#fff', marginBottom: 4 }}>
              Automatische Follow-up E-Mails
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', maxWidth: 400 }}>
              Sendet nach 3 Tagen automatisch eine Follow-up E-Mail an kontaktierte Leads.
            </div>
          </div>
          <button
            onClick={toggleFollowUp}
            disabled={saving}
            style={{
              position: 'relative',
              width: 44,
              height: 24,
              borderRadius: 12,
              border: 'none',
              background: autoFollowUp ? 'rgba(107,122,255,0.4)' : 'rgba(255,255,255,0.1)',
              cursor: saving ? 'wait' : 'pointer',
              transition: 'background 0.25s',
              flexShrink: 0,
              padding: 0,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 3,
                left: autoFollowUp ? 23 : 3,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: autoFollowUp ? '#6B7AFF' : 'rgba(255,255,255,0.35)',
                transition: 'left 0.25s, background 0.25s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }}
            />
          </button>
        </div>
      )}

      {/* KI-Profil */}
      {profileLoading ? (
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Profil wird geladen...</div>
      ) : (
        profile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={sectionLabel}>Dein Unternehmen</div>
            <div>
              <label style={fieldLabel}>Firmenname</label>
              <input
                value={profile.company_name ?? ''}
                onChange={(e) => onUpdateProfile('company_name', e.target.value)}
                style={fieldInput}
              />
            </div>
            <div>
              <label style={fieldLabel}>Was ihr macht</label>
              <textarea
                value={profile.company_description ?? ''}
                onChange={(e) => onUpdateProfile('company_description', e.target.value)}
                rows={4}
                style={{ ...fieldInput, resize: 'vertical' as const }}
              />
            </div>
            <div>
              <label style={fieldLabel}>Standort</label>
              <input
                value={profile.company_location ?? ''}
                onChange={(e) => onUpdateProfile('company_location', e.target.value)}
                style={fieldInput}
              />
            </div>
            <div>
              <label style={fieldLabel}>Website</label>
              <input
                value={profile.website ?? ''}
                onChange={(e) => onUpdateProfile('website', e.target.value)}
                style={fieldInput}
              />
            </div>

            <div style={sectionLabel}>Zielkunden</div>
            <div>
              <label style={fieldLabel}>Wen ihr sucht</label>
              <textarea
                value={profile.target_customers ?? ''}
                onChange={(e) => onUpdateProfile('target_customers', e.target.value)}
                rows={4}
                style={{ ...fieldInput, resize: 'vertical' as const }}
              />
            </div>
            <div>
              <label style={fieldLabel}>Ideales Profil</label>
              <textarea
                value={profile.ideal_lead_profile ?? ''}
                onChange={(e) => onUpdateProfile('ideal_lead_profile', e.target.value)}
                rows={3}
                style={{ ...fieldInput, resize: 'vertical' as const }}
              />
            </div>
            <div>
              <label style={fieldLabel}>Ausgeschlossen</label>
              <textarea
                value={profile.excluded_profiles ?? ''}
                onChange={(e) => onUpdateProfile('excluded_profiles', e.target.value)}
                rows={2}
                style={{ ...fieldInput, resize: 'vertical' as const }}
              />
            </div>

            <div style={sectionLabel}>Angebot</div>
            <div>
              <label style={fieldLabel}>Leistungen (kommagetrennt)</label>
              <textarea
                value={servicesText}
                onChange={(e) => onServicesText(e.target.value)}
                rows={3}
                style={{ ...fieldInput, resize: 'vertical' as const }}
              />
            </div>
            <div>
              <label style={fieldLabel}>USP</label>
              <textarea
                value={profile.usp ?? ''}
                onChange={(e) => onUpdateProfile('usp', e.target.value)}
                rows={2}
                style={{ ...fieldInput, resize: 'vertical' as const }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={fieldLabel}>Deal-Größe min €</label>
                <input
                  type="number"
                  value={profile.deal_size_min ?? ''}
                  onChange={(e) => onUpdateProfile('deal_size_min', e.target.value ? Number(e.target.value) : null)}
                  style={{ ...fieldInput, fontFamily: 'var(--font-dm-mono)' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={fieldLabel}>Deal-Größe max €</label>
                <input
                  type="number"
                  value={profile.deal_size_max ?? ''}
                  onChange={(e) => onUpdateProfile('deal_size_max', e.target.value ? Number(e.target.value) : null)}
                  style={{ ...fieldInput, fontFamily: 'var(--font-dm-mono)' }}
                />
              </div>
            </div>

            <div style={sectionLabel}>E-Mail & Absender</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={fieldLabel}>Absender Name</label>
                <input
                  value={profile.sender_name ?? ''}
                  onChange={(e) => onUpdateProfile('sender_name', e.target.value)}
                  style={fieldInput}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={fieldLabel}>Absender Rolle</label>
                <input
                  value={profile.sender_role ?? ''}
                  onChange={(e) => onUpdateProfile('sender_role', e.target.value)}
                  style={fieldInput}
                />
              </div>
            </div>
            <div>
              <label style={fieldLabel}>Tonalität</label>
              <input
                value={profile.tone_of_voice ?? ''}
                onChange={(e) => onUpdateProfile('tone_of_voice', e.target.value)}
                style={fieldInput}
              />
            </div>
            <div>
              <label style={fieldLabel}>E-Mail Signatur</label>
              <textarea
                value={profile.email_signature ?? ''}
                onChange={(e) => onUpdateProfile('email_signature', e.target.value)}
                rows={3}
                style={{ ...fieldInput, resize: 'vertical' as const }}
              />
            </div>

            <button
              onClick={onSaveProfile}
              disabled={profileSaving}
              style={{
                marginTop: 12,
                width: '100%',
                padding: '10px',
                borderRadius: 8,
                border: 'none',
                background: profileSaved ? 'rgba(74,222,128,0.15)' : '#e0e0e0',
                color: profileSaved ? '#4ade80' : '#080808',
                fontSize: 14,
                fontWeight: 500,
                cursor: profileSaving ? 'default' : 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'var(--font-dm-sans)',
              }}
            >
              {profileSaving ? '...' : profileSaved ? 'Gespeichert ✓' : 'Speichern'}
            </button>
          </div>
        )
      )}
    </div>
  );
}
