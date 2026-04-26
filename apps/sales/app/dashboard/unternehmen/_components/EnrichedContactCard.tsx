'use client';

import { TOKENS } from '../_tokens';
import { fmt } from '../_lib/formatters';
import type { Contact } from '../_types';

function DecisionMakerBars({ score }: { score: number | null }) {
  const filled = score !== null ? Math.round(Math.min(score, 100) / 20) : 0;
  return (
    <div>
      <span
        style={{
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: '0.06em',
          color: TOKENS.color.textMuted,
          display: 'block',
          marginBottom: 4,
        }}
      >
        ENTSCHEIDER
      </span>
      <div style={{ display: 'flex', gap: 3 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 4,
              height: 16,
              borderRadius: 2,
              background: i < filled ? TOKENS.color.indigo : TOKENS.color.borderDefault,
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ContactField({
  label,
  value,
  variant,
  href,
  mono,
}: {
  label: string;
  value: string | null;
  variant: 'green' | 'amber' | 'gray' | 'indigo';
  href?: string | null;
  mono?: boolean;
}) {
  const styles = {
    green: { bg: TOKENS.color.greenBg, border: TOKENS.color.greenBorder, color: TOKENS.color.green },
    amber: { bg: TOKENS.color.amberBg, border: TOKENS.color.amberBorder, color: TOKENS.color.amber },
    gray: { bg: TOKENS.color.bgSubtle, border: TOKENS.color.borderSubtle, color: TOKENS.color.textMuted },
    indigo: { bg: TOKENS.color.indigoBgSubtle, border: TOKENS.color.indigoBorderSoft, color: TOKENS.color.indigoLight },
  };
  const s = styles[variant];

  const content = (
    <div
      style={{
        padding: '8px 10px',
        borderRadius: TOKENS.radius.pill,
        background: s.bg,
        border: `1px solid ${s.border}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.04em', color: TOKENS.color.textMuted }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 11.5,
          color: s.color,
          fontFamily: mono ? TOKENS.font.mono : TOKENS.font.family,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value ?? '\u2014'}
      </span>
    </div>
  );

  if (href && value) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', minWidth: 0 }}>
        {content}
      </a>
    );
  }
  return <div style={{ minWidth: 0 }}>{content}</div>;
}

export default function EnrichedContactCard({
  contact,
  onGenerateEmail,
  onOpenMail,
}: {
  contact: Contact;
  onGenerateEmail: () => void;
  onOpenMail: () => void;
}) {
  const name = (contact.full_name ?? [contact.first_name, contact.last_name].filter(Boolean).join(' ')) || 'Unbekannt';
  const photoUrl = contact.photo_url;
  const initials = fmt.initials(name);

  const emailVariant: 'green' | 'amber' | 'gray' =
    contact.email_status === 'verified' ? 'green' : contact.email ? 'amber' : 'gray';
  const linkedinDomain = contact.linkedin_url?.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') ?? null;

  const hasDraft = !!contact.email_draft_body;

  return (
    <div
      style={{
        background: TOKENS.color.bgCard,
        border: `1px solid ${TOKENS.color.borderSubtle}`,
        borderRadius: TOKENS.radius.card,
        padding: '16px 18px',
        fontFamily: TOKENS.font.family,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt=""
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              objectFit: 'cover',
              flexShrink: 0,
              border: `1px solid ${TOKENS.color.borderSubtle}`,
            }}
          />
        ) : (
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: TOKENS.color.indigoBgSoft,
              border: `1px solid ${TOKENS.color.indigoBorderSoft}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 500,
              color: TOKENS.color.indigoLight,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: TOKENS.color.textPrimary }}>{name}</span>
            {contact.is_primary && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  padding: '2px 7px',
                  borderRadius: TOKENS.radius.chip,
                  background: TOKENS.color.indigo,
                  color: TOKENS.color.textOnAccent,
                }}
              >
                PRIMARY
              </span>
            )}
          </div>
          {contact.title && (
            <div style={{ fontSize: 12, color: TOKENS.color.textTertiary, marginTop: 2 }}>{contact.title}</div>
          )}
          {contact.seniority && (
            <div style={{ fontSize: 11, color: TOKENS.color.textMuted, marginTop: 1 }}>{contact.seniority}</div>
          )}
          {/* Departments */}
          {contact.departments && contact.departments.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {contact.departments.map((d) => (
                <span
                  key={d}
                  style={{
                    fontSize: 10,
                    padding: '1px 7px',
                    borderRadius: TOKENS.radius.chip,
                    background: TOKENS.color.bgSubtle,
                    border: `1px solid ${TOKENS.color.borderSubtle}`,
                    color: TOKENS.color.textMuted,
                  }}
                >
                  {d}
                </span>
              ))}
            </div>
          )}
        </div>
        <DecisionMakerBars score={contact.decision_maker_score} />
      </div>

      {/* Contact fields */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        <ContactField
          label="E-MAIL"
          value={contact.email}
          variant={emailVariant}
          href={contact.email ? `mailto:${contact.email}` : null}
          mono
        />
        <ContactField
          label="TELEFON"
          value={contact.phone ?? contact.mobile_phone}
          variant={contact.phone || contact.mobile_phone ? 'green' : 'gray'}
          href={contact.phone ? `tel:${contact.phone}` : null}
        />
        <ContactField
          label="LINKEDIN"
          value={linkedinDomain}
          variant={contact.linkedin_url ? 'indigo' : 'gray'}
          href={contact.linkedin_url}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={hasDraft ? onOpenMail : onGenerateEmail}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: TOKENS.radius.button,
            background: hasDraft ? TOKENS.color.indigo : TOKENS.color.indigoBgSoft,
            border: hasDraft ? 'none' : `1px solid ${TOKENS.color.indigoBorderSoft}`,
            color: hasDraft ? '#0a0a0a' : TOKENS.color.indigoLight,
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: TOKENS.font.family,
          }}
        >
          {hasDraft ? (
            'E-Mail öffnen'
          ) : (
            <>
              E-Mail schreiben
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 500,
                  padding: '1px 6px',
                  borderRadius: 4,
                  background: 'rgba(107,122,255,0.15)',
                  color: TOKENS.color.indigo,
                }}
              >
                2 Cr
              </span>
            </>
          )}
        </button>
        {contact.linkedin_url && (
          <a
            href={contact.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 14px',
              borderRadius: TOKENS.radius.button,
              background: TOKENS.color.bgSubtle,
              border: `1px solid ${TOKENS.color.borderSubtle}`,
              color: TOKENS.color.textTertiary,
              fontSize: 12,
              fontWeight: 500,
              textDecoration: 'none',
              fontFamily: TOKENS.font.family,
            }}
          >
            LinkedIn
          </a>
        )}
      </div>
    </div>
  );
}
