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
}

const sectionLabel = {
  fontSize: 11,
  color: 'rgba(255,255,255,0.2)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  marginBottom: 10,
  marginTop: 20,
  fontWeight: 600,
};
const fieldLabel = { fontSize: 12, color: 'rgba(255,255,255,0.35)', display: 'block' as const, marginBottom: 4 };
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

function Skeleton({ width, height = 38 }: { width?: string | number; height?: number }) {
  return (
    <div
      style={{
        width: width ?? '100%',
        height,
        borderRadius: 8,
        background: 'rgba(255,255,255,0.04)',
        animation: 'skeletonPulse 1.5s ease-in-out infinite',
      }}
    />
  );
}

function SkeletonField() {
  return (
    <div>
      <Skeleton width={80} height={14} />
      <div style={{ height: 4 }} />
      <Skeleton height={38} />
    </div>
  );
}

export default function SettingsPage() {
  const [active, setActive] = useState<Section>('allgemein');
  const [autoFollowUp, setAutoFollowUp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [servicesText, setServicesText] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('tenant_preferences')
      .select('automatic_followup_emails, logo_url')
      .eq('tenant_id', TENANT_ID)
      .single()
      .then(({ data }) => {
        if (data) {
          setAutoFollowUp(data.automatic_followup_emails ?? false);
          setLogoUrl(data.logo_url ?? null);
        }
        setLoading(false);
      });

    // Load profile on mount
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
  }, []);

  async function uploadLogo(file: File) {
    setLogoUploading(true);
    const supabase = createClient();
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
    const fileName = `logos/${TENANT_ID}/${crypto.randomUUID()}.${ext}`;

    if (logoUrl) {
      const oldPath = logoUrl.split('/website-assets/')[1];
      if (oldPath) await supabase.storage.from('website-assets').remove([oldPath]);
    }

    const { error: uploadErr } = await supabase.storage
      .from('website-assets')
      .upload(fileName, file, { contentType: file.type, upsert: false });

    if (uploadErr) {
      setLogoUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('website-assets').getPublicUrl(fileName);
    const url = urlData.publicUrl;

    await supabase
      .from('tenant_preferences')
      .update({ logo_url: url, updated_at: new Date().toISOString() })
      .eq('tenant_id', TENANT_ID);

    setLogoUrl(url);
    setLogoUploading(false);
  }

  async function removeLogo() {
    const supabase = createClient();
    if (logoUrl) {
      const oldPath = logoUrl.split('/website-assets/')[1];
      if (oldPath) await supabase.storage.from('website-assets').remove([oldPath]);
    }
    await supabase
      .from('tenant_preferences')
      .update({ logo_url: null, updated_at: new Date().toISOString() })
      .eq('tenant_id', TENANT_ID);
    setLogoUrl(null);
  }

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

  function updateProfile(field: keyof Profile, value: string | number | null) {
    if (profile) setProfile({ ...profile, [field]: value });
  }

  async function saveProfile() {
    if (!profile) return;
    setProfileSaving(true);
    const payload = {
      ...profile,
      services: servicesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      // Send to vector store webhook
      fetch('/api/proxy/n8n', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          (() => {
            const { websites, ...rest } = { action: 'vector-store', tenant_id: TENANT_ID, ...payload };
            return { ...rest, urls: (websites ?? []).join(', ') };
          })()
        ),
      }).catch(() => {});
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 1500);
    } catch {
      /* ignore */
    }
    setProfileSaving(false);
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'var(--font-dm-sans)' }}>
      <style>{`@keyframes skeletonPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }`}</style>

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
          <div style={{ maxWidth: 600 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 4 }}>Allgemein</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>
              Allgemeine Einstellungen fuer Ihr Unternehmen.
            </p>

            {/* Logo Upload */}
            <div
              style={{
                padding: '20px 18px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10,
                marginBottom: 24,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 500, color: '#fff', marginBottom: 4 }}>Firmenlogo</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>
                Wird als Signatur am Ende jeder ausgehenden E-Mail angezeigt.
              </div>

              {loading ? (
                <Skeleton height={60} width={120} />
              ) : logoUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div
                    style={{
                      width: 120,
                      height: 60,
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      padding: 8,
                    }}
                  >
                    <img
                      src={logoUrl}
                      alt="Logo"
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <label
                      style={{
                        fontSize: 12,
                        color: '#6B7AFF',
                        background: 'rgba(107,122,255,0.1)',
                        border: '1px solid rgba(107,122,255,0.2)',
                        borderRadius: 6,
                        padding: '6px 14px',
                        cursor: logoUploading ? 'wait' : 'pointer',
                      }}
                    >
                      {logoUploading ? 'Laden...' : 'Aendern'}
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadLogo(f);
                        }}
                      />
                    </label>
                    <button
                      onClick={removeLogo}
                      style={{
                        fontSize: 12,
                        color: '#ef4444',
                        background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.15)',
                        borderRadius: 6,
                        padding: '6px 14px',
                        cursor: 'pointer',
                      }}
                    >
                      Entfernen
                    </button>
                  </div>
                </div>
              ) : (
                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 100,
                    border: '2px dashed rgba(255,255,255,0.1)',
                    borderRadius: 10,
                    cursor: logoUploading ? 'wait' : 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(107,122,255,0.3)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                >
                  <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.2)', marginBottom: 4 }}>+</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                    {logoUploading ? 'Wird hochgeladen...' : 'Logo hochladen (PNG, JPG)'}
                  </div>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadLogo(f);
                    }}
                  />
                </label>
              )}
            </div>

            {/* Company Profile */}
            {profileLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Skeleton width={120} height={14} />
                <SkeletonField />
                <SkeletonField />
                <SkeletonField />
                <SkeletonField />
                <Skeleton width={100} height={14} />
                <SkeletonField />
                <SkeletonField />
                <SkeletonField />
                <Skeleton width={80} height={14} />
                <SkeletonField />
                <SkeletonField />
                <Skeleton width={130} height={14} />
                <SkeletonField />
                <SkeletonField />
                <SkeletonField />
              </div>
            ) : (
              profile && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={sectionLabel}>Dein Unternehmen</div>
                  <div>
                    <label style={fieldLabel}>Firmenname</label>
                    <input
                      value={profile.company_name ?? ''}
                      onChange={(e) => updateProfile('company_name', e.target.value)}
                      style={fieldInput}
                    />
                  </div>
                  <div>
                    <label style={fieldLabel}>Was ihr macht</label>
                    <textarea
                      value={profile.company_description ?? ''}
                      onChange={(e) => updateProfile('company_description', e.target.value)}
                      rows={4}
                      style={{ ...fieldInput, resize: 'vertical' as const }}
                    />
                  </div>
                  <div>
                    <label style={fieldLabel}>Standort</label>
                    <input
                      value={profile.company_location ?? ''}
                      onChange={(e) => updateProfile('company_location', e.target.value)}
                      style={fieldInput}
                    />
                  </div>
                  <div>
                    <label style={fieldLabel}>URLs</label>
                    {(profile.websites ?? []).length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                        {(profile.websites ?? []).map((url, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: 12,
                              color: '#6B7AFF',
                              background: 'rgba(107,122,255,0.1)',
                              border: '1px solid rgba(107,122,255,0.2)',
                              borderRadius: 6,
                              padding: '4px 8px 4px 10px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            {url}
                            <button
                              onClick={() => {
                                const next = (profile.websites ?? []).filter((_, idx) => idx !== i);
                                setProfile({ ...profile, websites: next });
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'rgba(255,255,255,0.3)',
                                cursor: 'pointer',
                                fontSize: 13,
                                padding: 0,
                                lineHeight: 1,
                              }}
                            >
                              x
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <input
                      placeholder="URL eingeben und Enter druecken"
                      style={fieldInput}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = e.currentTarget.value.trim();
                          if (val && !(profile.websites ?? []).includes(val)) {
                            setProfile({ ...profile, websites: [...(profile.websites ?? []), val] });
                          }
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6, lineHeight: 1.5 }}>
                      Die URLs werden zur Erschliessung Ihres Unternehmensprofils verwendet. Nutzen Sie vor allem Ihre
                      Startseite, Leistungen, Preise und Ueber-uns-Seite.
                    </div>
                  </div>

                  <div style={sectionLabel}>Zielkunden</div>
                  <div>
                    <label style={fieldLabel}>Wen ihr sucht</label>
                    <textarea
                      value={profile.target_customers ?? ''}
                      onChange={(e) => updateProfile('target_customers', e.target.value)}
                      rows={4}
                      style={{ ...fieldInput, resize: 'vertical' as const }}
                    />
                  </div>
                  <div>
                    <label style={fieldLabel}>Ideales Profil</label>
                    <textarea
                      value={profile.ideal_lead_profile ?? ''}
                      onChange={(e) => updateProfile('ideal_lead_profile', e.target.value)}
                      rows={3}
                      style={{ ...fieldInput, resize: 'vertical' as const }}
                    />
                  </div>
                  <div>
                    <label style={fieldLabel}>Ausgeschlossen</label>
                    <textarea
                      value={profile.excluded_profiles ?? ''}
                      onChange={(e) => updateProfile('excluded_profiles', e.target.value)}
                      rows={2}
                      style={{ ...fieldInput, resize: 'vertical' as const }}
                    />
                  </div>

                  <div style={sectionLabel}>Angebot</div>
                  <div>
                    <label style={fieldLabel}>Leistungen (kommagetrennt)</label>
                    <textarea
                      value={servicesText}
                      onChange={(e) => setServicesText(e.target.value)}
                      rows={3}
                      style={{ ...fieldInput, resize: 'vertical' as const }}
                    />
                  </div>
                  <div>
                    <label style={fieldLabel}>USP</label>
                    <textarea
                      value={profile.usp ?? ''}
                      onChange={(e) => updateProfile('usp', e.target.value)}
                      rows={2}
                      style={{ ...fieldInput, resize: 'vertical' as const }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label style={fieldLabel}>Deal-Groesse min EUR</label>
                      <input
                        type="number"
                        value={profile.deal_size_min ?? ''}
                        onChange={(e) => updateProfile('deal_size_min', e.target.value ? Number(e.target.value) : null)}
                        style={{ ...fieldInput, fontFamily: 'var(--font-dm-mono)' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={fieldLabel}>Deal-Groesse max EUR</label>
                      <input
                        type="number"
                        value={profile.deal_size_max ?? ''}
                        onChange={(e) => updateProfile('deal_size_max', e.target.value ? Number(e.target.value) : null)}
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
                        onChange={(e) => updateProfile('sender_name', e.target.value)}
                        style={fieldInput}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={fieldLabel}>Absender Rolle</label>
                      <input
                        value={profile.sender_role ?? ''}
                        onChange={(e) => updateProfile('sender_role', e.target.value)}
                        style={fieldInput}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={fieldLabel}>Tonalitaet</label>
                    <input
                      value={profile.tone_of_voice ?? ''}
                      onChange={(e) => updateProfile('tone_of_voice', e.target.value)}
                      style={fieldInput}
                    />
                  </div>
                  <div>
                    <label style={fieldLabel}>E-Mail Signatur</label>
                    <textarea
                      value={profile.email_signature ?? ''}
                      onChange={(e) => updateProfile('email_signature', e.target.value)}
                      rows={3}
                      style={{ ...fieldInput, resize: 'vertical' as const }}
                    />
                  </div>

                  <button
                    onClick={saveProfile}
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
        )}

        {active === 'leads' && (
          <div style={{ maxWidth: 600 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 4 }}>Leads</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>
              Lead-Management Einstellungen.
            </p>

            {/* Follow-up toggle */}
            {loading ? (
              <Skeleton height={56} />
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 18px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 10,
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
          </div>
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
