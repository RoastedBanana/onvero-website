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

export default function SettingsPage() {
  const [active, setActive] = useState<Section>('allgemein');
  const [autoFollowUp, setAutoFollowUp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 4 }}>Leads</h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>
              Einstellungen fuer das Lead-Management.
            </p>

            {loading ? (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Laden...</div>
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

                {/* Toggle Switch */}
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
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              Einstellungen werden bald verfuegbar sein.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
