'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Lead } from '@/lib/leads-client';
import LeadAvatar from '@/components/ui/LeadAvatar';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
}

function getTierColor(score: number): string {
  if (score >= 70) return '#FF5C2E';
  if (score >= 45) return '#F59E0B';
  return '#6B7AFF';
}

function getTierLabel(score: number): string {
  if (score >= 70) return 'HOT';
  if (score >= 45) return 'WARM';
  return 'COLD';
}

function BreakdownBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
      <div
        style={{
          flex: 1,
          height: 6,
          borderRadius: 3,
          background: 'rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 3,
            background: color,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.7)',
          fontFamily: 'var(--font-dm-mono)',
          minWidth: 20,
          textAlign: 'right',
        }}
      >
        {value}
      </span>
    </div>
  );
}

const BREAKDOWN_LABELS: { key: keyof NonNullable<Lead['scoreBreakdown']>; label: string }[] = [
  { key: 'unternehmensfit', label: 'Unternehmensfit' },
  { key: 'kontaktqualitaet', label: 'Kontaktqualitaet' },
  { key: 'entscheidungsposition', label: 'Entscheidungsposition' },
  { key: 'kaufsignale', label: 'Kaufsignale' },
  { key: 'abzuege', label: 'Abzuege' },
];

export default function LeadCompare({ isOpen, onClose, leads }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen || leads.length < 2) return null;

  const colCount = leads.length;
  const hasBreakdown = leads.some((l) => l.scoreBreakdown);

  const rows: { label: string; render: (lead: Lead) => React.ReactNode }[] = [
    {
      label: 'Branche',
      render: (l) => l.industry ?? '--',
    },
    {
      label: 'Stadt',
      render: (l) => l.city ?? '--',
    },
    {
      label: 'Mitarbeiter',
      render: (l) => (l.employeeCount != null ? l.employeeCount.toLocaleString('de-DE') : '--'),
    },
    {
      label: 'E-Mail Status',
      render: (l) => {
        const status = l.emailStatus;
        if (!status) return '--';
        const isVerified = status === 'verified';
        return (
          <span
            style={{
              color: isVerified ? '#22C55E' : '#F59E0B',
              fontSize: 12,
            }}
          >
            {isVerified ? 'Verified' : 'Guessed'}
          </span>
        );
      },
    },
    {
      label: 'Source',
      render: (l) => {
        if (l.source === 'apollo_outbound') {
          return (
            <span
              style={{
                fontSize: 10,
                color: '#8B5CF6',
                background: 'rgba(139,92,246,0.1)',
                padding: '2px 8px',
                borderRadius: 6,
                fontWeight: 500,
              }}
            >
              Apollo
            </span>
          );
        }
        if (l.source === 'Website-Formular' || l.source === 'website') {
          return (
            <span
              style={{
                fontSize: 10,
                color: 'rgba(255,255,255,0.4)',
                background: 'rgba(255,255,255,0.06)',
                padding: '2px 8px',
                borderRadius: 6,
                fontWeight: 500,
              }}
            >
              Website
            </span>
          );
        }
        return l.source ?? '--';
      },
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 900,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#111',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14,
          padding: 24,
          fontFamily: 'var(--font-dm-sans)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: '#fff',
              margin: 0,
            }}
          >
            Leads vergleichen
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.5)',
              fontSize: 16,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Lead headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${colCount}, 1fr)`,
            gap: 16,
            marginBottom: 20,
          }}
        >
          {leads.map((lead) => {
            const tierColor = getTierColor(lead.score);
            const tierLabel = getTierLabel(lead.score);
            return (
              <div
                key={lead.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                  padding: '16px 12px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <LeadAvatar website={lead.website} companyName={lead.company} score={lead.score} size="lg" />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{lead.company}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{lead.name}</div>
                  {lead.jobTitle && (
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{lead.jobTitle}</div>
                  )}
                </div>
                {/* Score */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: tierColor,
                      fontFamily: 'var(--font-dm-mono)',
                      lineHeight: 1,
                    }}
                  >
                    {lead.score}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: tierColor,
                      letterSpacing: '0.1em',
                      opacity: 0.85,
                    }}
                  >
                    {tierLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison rows */}
        <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
          {rows.map((row, i) => (
            <div
              key={row.label}
              style={{
                display: 'grid',
                gridTemplateColumns: `120px repeat(${colCount}, 1fr)`,
                alignItems: 'center',
                padding: '10px 16px',
                background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                borderBottom:
                  i < rows.length + (hasBreakdown ? BREAKDOWN_LABELS.length : 0) - 1
                    ? '1px solid rgba(255,255,255,0.04)'
                    : 'none',
              }}
            >
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>{row.label}</div>
              {leads.map((lead) => (
                <div key={lead.id} style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                  {row.render(lead)}
                </div>
              ))}
            </div>
          ))}

          {/* Score breakdown rows */}
          {hasBreakdown &&
            BREAKDOWN_LABELS.map((bd, bi) => {
              const rowIndex = rows.length + bi;
              return (
                <div
                  key={bd.key}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `120px repeat(${colCount}, 1fr)`,
                    alignItems: 'center',
                    padding: '10px 16px',
                    background: rowIndex % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                    borderBottom: bi < BREAKDOWN_LABELS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}
                >
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>{bd.label}</div>
                  {leads.map((lead) => {
                    const val = lead.scoreBreakdown?.[bd.key];
                    if (val == null) {
                      return (
                        <div key={lead.id} style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
                          --
                        </div>
                      );
                    }
                    const maxVal = bd.key === 'abzuege' ? 20 : 30;
                    return (
                      <div key={lead.id}>
                        <BreakdownBar
                          value={val}
                          max={maxVal}
                          color={bd.key === 'abzuege' ? '#ef4444' : getTierColor(lead.score)}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })}
        </div>

        {/* Bottom action buttons */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${colCount}, 1fr)`,
            gap: 16,
            marginTop: 20,
          }}
        >
          {leads.map((lead) => (
            <button
              key={lead.id}
              onClick={() => {
                onClose();
                router.push(`/dashboard/leads/${lead.id}`);
              }}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '10px 16px',
                fontSize: 12,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                textAlign: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
              }}
            >
              Details oeffnen
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
