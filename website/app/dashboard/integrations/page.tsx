'use client';

import { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';

interface Integration {
  name: string;
  description: string;
  active: boolean;
  color: string;
}

const INTEGRATIONS: Integration[] = [
  { name: 'Apollo.io', description: 'B2B-Kontaktdatenbank', active: true, color: '#6B7AFF' },
  { name: 'Supabase', description: 'Datenbank & Auth', active: true, color: '#3ECF8E' },
  { name: 'n8n', description: 'Workflow-Automatisierung', active: true, color: '#FF6D5A' },
  { name: 'Plausible', description: 'Website Analytics (DSGVO)', active: true, color: '#5850EC' },
  { name: 'Gmail', description: 'E-Mail Versand', active: false, color: '#888' },
  { name: 'Slack', description: 'Team-Benachrichtigungen', active: false, color: '#888' },
  { name: 'Google Calendar', description: 'Meeting-Sync', active: false, color: '#888' },
  { name: 'HubSpot', description: 'CRM-Export', active: false, color: '#888' },
  { name: 'Zapier', description: '1000+ Integrationen', active: false, color: '#888' },
];

export default function IntegrationsPage() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div style={{ minHeight: '100vh', background: '#080808', fontFamily: 'var(--font-dm-sans)' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px 24px' }}>
        <div
          style={{
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            paddingTop: 0,
            paddingBottom: 16,
          }}
        >
          <PageHeader title="Integrationen" subtitle="Verbundene Tools und Dienste" />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            marginTop: 20,
          }}
        >
          {INTEGRATIONS.map((item, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <div
                key={item.name}
                style={{
                  background: '#111',
                  border: `1px solid ${item.active && isHovered ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 12,
                  padding: 16,
                  opacity: item.active ? 1 : 0.5,
                  transition: 'border-color 0.15s, opacity 0.15s',
                  cursor: item.active ? 'default' : 'not-allowed',
                }}
                onMouseEnter={() => item.active && setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Icon circle */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1.5px solid ${item.active ? item.color : 'rgba(255,255,255,0.1)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    fontWeight: 600,
                    color: item.active ? item.color : 'rgba(255,255,255,0.3)',
                    marginBottom: 12,
                  }}
                >
                  {item.name[0]}
                </div>

                {/* Title */}
                <div style={{ fontSize: 14, fontWeight: 500, color: '#fff', marginBottom: 4 }}>{item.name}</div>

                {/* Description */}
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>
                  {item.description}
                </div>

                {/* Status badge */}
                {item.active ? (
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: 10,
                      fontWeight: 500,
                      color: '#22C55E',
                      background: 'rgba(34,197,94,0.12)',
                      padding: '3px 10px',
                      borderRadius: 100,
                    }}
                  >
                    Verbunden
                  </span>
                ) : (
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: 10,
                      fontWeight: 500,
                      color: 'rgba(255,255,255,0.35)',
                      background: 'rgba(255,255,255,0.06)',
                      padding: '3px 10px',
                      borderRadius: 100,
                    }}
                  >
                    Bald verfügbar
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
