'use client';

import { C, SvgIcon, ICONS, StatusBadge, ScoreBar } from '../_shared';
import type { Meeting } from './_meeting-store';
import type { Lead } from '../_lead-data';

// ─── LEAD DOSSIER ───────────────────────────────────────────────────────────
// Comprehensive one-page briefing with everything you need before a call.

export default function PrepareDossier({ meeting, lead }: { meeting: Meeting; lead: Lead | null }) {
  if (!lead) {
    return (
      <div
        style={{
          padding: '32px 20px',
          textAlign: 'center',
          borderRadius: 12,
          background: C.surface,
          border: `1px solid ${C.border}`,
        }}
      >
        <SvgIcon d={ICONS.users} size={24} color={C.text3} />
        <p style={{ fontSize: 13, color: C.text3, marginTop: 12 }}>Kein Lead mit diesem Meeting verknüpft.</p>
      </div>
    );
  }

  const hasEmail = !!lead.emailDraftSubject;

  const sections: { label: string; icon: string; color: string; items: { key: string; value: string | null }[] }[] = [
    {
      label: 'KONTAKT',
      icon: ICONS.users,
      color: C.accent,
      items: [
        { key: 'Name', value: lead.name },
        { key: 'Position', value: lead.jobTitle },
        { key: 'E-Mail', value: lead.email },
        { key: 'Telefon', value: lead.phone },
        { key: 'LinkedIn', value: lead.linkedinUrl ? 'Profil vorhanden' : null },
      ],
    },
    {
      label: 'UNTERNEHMEN',
      icon: ICONS.globe,
      color: '#38BDF8',
      items: [
        { key: 'Firma', value: lead.company },
        { key: 'Branche', value: lead.industry },
        { key: 'Apollo Branche', value: lead.industryApollo },
        { key: 'Standort', value: [lead.city, lead.country].filter(Boolean).join(', ') || null },
        { key: 'Mitarbeiter', value: lead.employees !== 'Unbekannt' ? lead.employees : null },
        { key: 'Website', value: lead.website?.replace(/^https?:\/\//, '') ?? null },
      ],
    },
    {
      label: 'BEWERTUNG',
      icon: ICONS.trending,
      color: '#FBBF24',
      items: [
        { key: 'Google Rating', value: lead.googleRating ? `${lead.googleRating} ★` : null },
        { key: 'Google Reviews', value: lead.googleReviews > 0 ? `${lead.googleReviews} Bewertungen` : null },
        { key: 'Quelle', value: lead.source },
        { key: 'Erstellt am', value: lead.createdAt },
      ],
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header Card — Name, Score, Status */}
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.borderLight}`,
          borderRadius: 12,
          padding: '22px 24px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 2px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
          animation: 'fadeInUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${C.accent}30, transparent)`,
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Avatar */}
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: `linear-gradient(135deg, ${C.accentGhost}, ${C.accentGlow})`,
              border: `1px solid ${C.borderAccent}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              fontWeight: 600,
              color: C.accent,
              flexShrink: 0,
            }}
          >
            {lead.firstName?.charAt(0)}
            {lead.lastName?.charAt(0)}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: C.text1, letterSpacing: '-0.02em' }}>
                {lead.name}
              </span>
              <StatusBadge status={lead.status} />
            </div>
            <div style={{ fontSize: 12, color: C.text2, display: 'flex', alignItems: 'center', gap: 6 }}>
              {lead.jobTitle && <span>{lead.jobTitle}</span>}
              {lead.jobTitle && <span style={{ opacity: 0.3, fontSize: 8 }}>●</span>}
              <span>{lead.company}</span>
            </div>
          </div>

          {/* Score */}
          {lead.score !== null && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: C.text3, letterSpacing: '0.06em', marginBottom: 4 }}>SCORE</div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                  letterSpacing: '-0.03em',
                  color: lead.score >= 70 ? C.success : lead.score >= 45 ? C.warning : C.text3,
                  textShadow: `0 0 20px ${lead.score >= 70 ? C.success : lead.score >= 45 ? C.warning : C.text3}30`,
                }}
              >
                {lead.score}
              </div>
            </div>
          )}
        </div>

        {/* Score Breakdown */}
        {lead.scoreBreakdown.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${lead.scoreBreakdown.length}, 1fr)`,
              gap: 10,
              marginTop: 16,
              paddingTop: 14,
              borderTop: `1px solid ${C.border}`,
            }}
          >
            {lead.scoreBreakdown.map((b) => (
              <div key={b.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: C.text3 }}>{b.label}</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                      color: C.text2,
                    }}
                  >
                    {b.value}/{b.max}
                  </span>
                </div>
                <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.04)' }}>
                  <div
                    style={{
                      height: '100%',
                      borderRadius: 2,
                      width: `${(b.value / b.max) * 100}%`,
                      background: `linear-gradient(90deg, ${C.accentDim}, ${C.accent})`,
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {sections.map((section, si) => (
          <div
            key={section.label}
            style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: '18px 20px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
              animation: 'fadeInUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
              animationDelay: `${0.08 + si * 0.05}s`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: `${section.color}10`,
                  border: `1px solid ${section.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SvgIcon d={section.icon} size={13} color={section.color} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: C.text3, letterSpacing: '0.08em' }}>
                {section.label}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {section.items
                .filter((item) => item.value)
                .map((item) => (
                  <div key={item.key}>
                    <div style={{ fontSize: 10, color: C.text3, marginBottom: 2 }}>{item.key}</div>
                    <div
                      style={{
                        fontSize: 13,
                        color: C.text1,
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Interaction History */}
      <div
        style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: '18px 20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          animation: 'fadeInUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) 0.25s both',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: `${C.purple}10`,
              border: `1px solid ${C.purple}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SvgIcon d={ICONS.clock} size={13} color={C.purple} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, color: C.text3, letterSpacing: '0.08em' }}>
            INTERAKTIONS-HISTORIE
          </span>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {/* Email Status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 8,
              background: hasEmail ? C.successBg : 'rgba(255,255,255,0.02)',
              border: `1px solid ${hasEmail ? C.successBorder : C.border}`,
            }}
          >
            <SvgIcon d={ICONS.mail} size={12} color={hasEmail ? C.success : C.text3} />
            <div>
              <div style={{ fontSize: 10, color: C.text3 }}>E-Mail</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: hasEmail ? C.success : C.text3 }}>
                {hasEmail ? 'Gesendet' : 'Nicht gesendet'}
              </div>
            </div>
          </div>

          {/* Email Subject */}
          {lead.emailDraftSubject && (
            <div
              style={{
                flex: 1,
                minWidth: 200,
                padding: '8px 14px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${C.border}`,
              }}
            >
              <div style={{ fontSize: 10, color: C.text3 }}>Betreff</div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: C.text1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {lead.emailDraftSubject}
              </div>
            </div>
          )}

          {/* Last Contact */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.02)',
              border: `1px solid ${C.border}`,
            }}
          >
            <SvgIcon d={ICONS.calendar} size={12} color={C.text3} />
            <div>
              <div style={{ fontSize: 10, color: C.text3 }}>Letzte Aktivität</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: C.text2 }}>{lead.lastActivity}</div>
            </div>
          </div>
        </div>

        {/* Next Action */}
        {lead.nextAction && (
          <div
            style={{
              marginTop: 12,
              padding: '10px 14px',
              borderRadius: 8,
              background: `${C.accent}06`,
              border: `1px solid ${C.accent}12`,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <SvgIcon d={ICONS.zap} size={12} color={C.accent} />
            <div>
              <span style={{ fontSize: 10, color: C.accent, fontWeight: 500 }}>EMPFOHLENER NÄCHSTER SCHRITT: </span>
              <span style={{ fontSize: 12, color: C.text1 }}>{lead.nextAction}</span>
            </div>
          </div>
        )}
      </div>

      {/* AI Analysis */}
      {lead.aiSummary && (
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: '18px 20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            animation: 'fadeInUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: `${C.accent}10`,
                border: `1px solid ${C.accent}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SvgIcon d={ICONS.spark} size={13} color={C.accent} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: C.text3, letterSpacing: '0.08em' }}>KI-ANALYSE</span>
          </div>
          <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.7, margin: 0 }}>{lead.aiSummary}</p>

          {lead.aiTags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
              {lead.aiTags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 6,
                    background: C.accentGhost,
                    border: `1px solid ${C.borderAccent}`,
                    fontSize: 11,
                    color: C.accentBright,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Employment History */}
      {lead.employmentHistory.length > 0 && (
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: '18px 20px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            animation: 'fadeInUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) 0.35s both',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: `${C.cyan}10`,
                border: `1px solid ${C.cyan}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SvgIcon d={ICONS.chart} size={13} color={C.cyan} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 600, color: C.text3, letterSpacing: '0.08em' }}>KARRIERE</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {lead.employmentHistory.slice(0, 5).map((job, i) => (
              <div
                key={`${job.company}-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: job.current ? `${C.accent}06` : 'transparent',
                  border: `1px solid ${job.current ? C.borderAccent : C.border}`,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: job.current ? C.accent : C.text3,
                    flexShrink: 0,
                    opacity: job.current ? 1 : 0.4,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: C.text1 }}>{job.title}</div>
                  <div style={{ fontSize: 11, color: C.text3, marginTop: 1 }}>{job.company}</div>
                </div>
                {(job.startDate || job.endDate) && (
                  <span style={{ fontSize: 10, color: C.text3, fontFamily: 'ui-monospace, SFMono-Regular, monospace' }}>
                    {job.startDate ?? '?'} — {job.current ? 'Heute' : (job.endDate ?? '?')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
