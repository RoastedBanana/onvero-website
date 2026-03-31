'use client';

import { MockLead } from '@/lib/mock-leads';

interface LeadDetailPanelProps {
  lead: MockLead | null;
  onClose: () => void;
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'rgba(107,122,255,0.15)',
        border: '1px solid rgba(107,122,255,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.3,
        fontWeight: 600,
        color: '#6B7AFF',
        flexShrink: 0,
        fontFamily: 'var(--font-dm-mono)',
      }}
    >
      {initials}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 600,
        color: 'rgba(255,255,255,0.25)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom: 10,
        paddingTop: 4,
      }}
    >
      {title}
    </div>
  );
}

export default function LeadDetailPanel({ lead, onClose }: LeadDetailPanelProps) {
  const isOpen = lead !== null;
  const scoreColor = lead ? (lead.score >= 75 ? '#FF5C2E' : lead.score >= 45 ? '#F59E0B' : '#6B7AFF') : '#6B7AFF';
  const scoreLabel = lead ? (lead.score >= 75 ? 'HOT' : lead.score >= 45 ? 'WARM' : 'COLD') : 'COLD';
  const scoreBg = lead
    ? lead.score >= 75
      ? 'rgba(255,92,46,0.1)'
      : lead.score >= 45
        ? 'rgba(245,158,11,0.08)'
        : 'rgba(107,122,255,0.08)'
    : 'rgba(107,122,255,0.08)';
  const scoreBorder = lead
    ? lead.score >= 75
      ? 'rgba(255,92,46,0.2)'
      : lead.score >= 45
        ? 'rgba(245,158,11,0.15)'
        : 'rgba(107,122,255,0.15)'
    : 'rgba(107,122,255,0.15)';

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 49,
          background: 'rgba(0,0,0,0.4)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 420,
          zIndex: 50,
          background: '#111',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'var(--font-dm-sans)',
        }}
      >
        {lead && (
          <>
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                flexShrink: 0,
              }}
            >
              <Avatar name={lead.name} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: '#fff',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {lead.company}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{lead.name}</div>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }}
              >
                ×
              </button>
            </div>

            {/* Score Banner */}
            <div
              style={{
                padding: '14px 20px',
                background: scoreBg,
                borderBottom: `1px solid ${scoreBorder}`,
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                <span
                  style={{
                    fontSize: 40,
                    fontWeight: 700,
                    color: scoreColor,
                    lineHeight: 1,
                    fontFamily: 'var(--font-dm-mono)',
                  }}
                >
                  {lead.score}
                </span>
                <span
                  style={{ fontSize: 11, fontWeight: 600, color: scoreColor, letterSpacing: '0.1em', opacity: 0.85 }}
                >
                  {scoreLabel}
                </span>
              </div>
              <div
                style={{
                  height: 4,
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: 2,
                  marginBottom: 8,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${lead.score}%`,
                    background: scoreColor,
                    borderRadius: 2,
                    transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                  }}
                />
              </div>
              <div style={{ fontSize: 11, color: scoreColor, opacity: 0.7 }}>{lead.next_action}</div>
            </div>

            {/* Scrollable Content */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '14px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
              className="hide-scrollbar"
            >
              <style>{`.hide-scrollbar::-webkit-scrollbar{display:none}.hide-scrollbar{scrollbar-width:none}`}</style>

              {/* Kontakt */}
              <div>
                <SectionHeader title="Kontakt" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { icon: '✉', label: 'E-Mail', value: lead.email, action: 'copy' },
                    { icon: '↗', label: 'Website', value: lead.website.replace('https://', ''), action: 'link' },
                    { icon: '◎', label: 'Branche', value: lead.industry },
                    { icon: '⊞', label: 'Mitarbeiter', value: lead.employees },
                    { icon: '⊙', label: 'Stadt', value: lead.city },
                  ].map((row) => (
                    <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          fontSize: 12,
                          color: 'rgba(255,255,255,0.3)',
                          width: 16,
                          textAlign: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {row.icon}
                      </span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', width: 72, flexShrink: 0 }}>
                        {row.label}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: 'rgba(255,255,255,0.8)',
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {row.value}
                      </span>
                      {row.action === 'copy' && (
                        <button
                          onClick={() => navigator.clipboard?.writeText(lead.email)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255,255,255,0.2)',
                            cursor: 'pointer',
                            fontSize: 10,
                            padding: '2px 4px',
                          }}
                          title="Kopieren"
                        >
                          ⎘
                        </button>
                      )}
                      {row.action === 'link' && (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, textDecoration: 'none' }}
                          title="Öffnen"
                        >
                          ↗
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* KI-Analyse */}
              <div>
                <SectionHeader title="KI-Analyse" />
                <div
                  style={{
                    background: '#181818',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0 }}>
                    {lead.ai_summary ??
                      `${lead.company} ist ein Unternehmen in der ${lead.industry}-Branche mit ${lead.employees} Mitarbeitern in ${lead.city}. Weitere KI-Analyse wird durchgeführt.`}
                  </p>
                </div>
              </div>

              {/* Tags */}
              <div>
                <SectionHeader title="Tags" />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {lead.ai_tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        background: 'rgba(107,122,255,0.1)',
                        color: '#6B7AFF',
                        fontSize: 10,
                        padding: '3px 10px',
                        borderRadius: 20,
                      }}
                    >
                      {tag.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>

              {/* Aktivitäten */}
              <div>
                <SectionHeader title="Aktivität" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[
                    { date: lead.created_at, text: 'Lead generiert', color: '#22C55E' },
                    { date: lead.created_at, text: `KI-Score berechnet: ${lead.score}`, color: '#6B7AFF' },
                    ...(lead.email_draft
                      ? [{ date: lead.created_at, text: 'E-Mail-Template bereit', color: '#a78bfa' }]
                      : []),
                    ...(lead.status === 'kontaktiert'
                      ? [{ date: lead.created_at, text: 'Status: Kontaktiert', color: '#F59E0B' }]
                      : []),
                  ].map((act, i, arr) => (
                    <div key={i} style={{ display: 'flex', gap: 12, position: 'relative' }}>
                      {/* Timeline line */}
                      {i < arr.length - 1 && (
                        <div
                          style={{
                            position: 'absolute',
                            left: 3,
                            top: 10,
                            bottom: -6,
                            width: 1,
                            borderLeft: '1px dashed rgba(255,255,255,0.08)',
                          }}
                        />
                      )}
                      {/* Dot */}
                      <div
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: act.color,
                          marginTop: 4,
                          flexShrink: 0,
                          position: 'relative',
                          zIndex: 1,
                        }}
                      />
                      <div style={{ paddingBottom: 12 }}>
                        <div
                          style={{
                            fontSize: 10,
                            color: 'rgba(255,255,255,0.25)',
                            marginBottom: 2,
                            fontFamily: 'var(--font-dm-mono)',
                          }}
                        >
                          {new Date(act.date).toLocaleDateString('de-DE', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{act.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions Bar (sticky bottom) */}
            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid rgba(255,255,255,0.07)',
                background: '#111',
                display: 'flex',
                gap: 8,
                flexShrink: 0,
              }}
            >
              <button
                style={{
                  flex: 1,
                  background: 'rgba(107,122,255,0.15)',
                  color: '#6B7AFF',
                  border: '1px solid rgba(107,122,255,0.25)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                E-Mail vorbereiten
              </button>
              <button
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Status ändern
              </button>
              <button
                style={{
                  width: 36,
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.4)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  padding: '8px',
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ···
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
