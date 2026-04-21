'use client';

import { TOKENS } from '../_tokens';
import { fmt } from '../_lib/formatters';
import { useContactEnrich } from '../_hooks/useContactEnrich';
import type { Company, Contact } from '../_types';
import NextActionBanner from './NextActionBanner';

// ─── FOLLOW-UP CONTEXT ──────────────────────────────────────────────────────

function FollowUpContext({ context }: { context: Company['follow_up_context'] }) {
  if (!context) return null;
  const entries = Object.entries(context).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (entries.length === 0) return null;

  const labels: Record<string, string> = {
    target_customers: 'Zielkunden',
    tone_of_voice: 'Tonalität',
    conversation_opener: 'Gesprächseinstieg',
    personalization_hooks: 'Personalisierung',
  };

  return (
    <div
      style={{
        background: TOKENS.color.bgCard,
        border: `1px solid ${TOKENS.color.borderSubtle}`,
        borderRadius: TOKENS.radius.card,
        padding: '20px 22px',
        fontFamily: TOKENS.font.family,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: TOKENS.color.indigo }} />
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.06em',
            color: TOKENS.color.textMuted,
            textTransform: 'uppercase' as const,
          }}
        >
          FOLLOW-UP KONTEXT
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {entries.map(([key, value]) => (
          <div key={key} style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontSize: 11, color: TOKENS.color.textMuted, minWidth: 110, flexShrink: 0 }}>
              {labels[key] ?? key}
            </span>
            <span style={{ fontSize: 12.5, color: TOKENS.color.textSecondary, lineHeight: 1.5 }}>
              {Array.isArray(value) ? value.join(', ') : String(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── DRAFT CARD ─────────────────────────────────────────────────────────────

function DraftCard({
  contact,
  onRegenerate,
  isRegenerating,
}: {
  contact: Contact;
  onRegenerate: () => void;
  isRegenerating: boolean;
}) {
  const name = (contact.full_name ?? [contact.first_name, contact.last_name].filter(Boolean).join(' ')) || 'Kontakt';
  const initials = fmt.initials(name);
  const hasSent = !!contact.last_contacted_at;

  function handleMailto() {
    if (!contact.email) return;
    const subject = encodeURIComponent(contact.email_draft_subject ?? '');
    const body = encodeURIComponent(contact.email_draft_body ?? '');
    window.open(`mailto:${contact.email}?subject=${subject}&body=${body}`, '_self');
  }

  function handleCopy() {
    const text = `Betreff: ${contact.email_draft_subject ?? ''}\n\n${contact.email_draft_body ?? ''}`;
    navigator.clipboard.writeText(text);
  }

  return (
    <div
      style={{
        background: TOKENS.color.bgCard,
        border: `1px solid ${TOKENS.color.borderSubtle}`,
        borderRadius: TOKENS.radius.card,
        padding: '20px 22px',
        fontFamily: TOKENS.font.family,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        opacity: isRegenerating ? 0.5 : 1,
        animation: isRegenerating ? 'skeleton-pulse 1.2s ease-in-out infinite' : 'none',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {contact.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={contact.photo_url}
              alt=""
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                objectFit: 'cover',
                border: `1px solid ${TOKENS.color.borderSubtle}`,
              }}
            />
          ) : (
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: TOKENS.color.indigoBgSoft,
                border: `1px solid ${TOKENS.color.indigoBorderSoft}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 500,
                color: TOKENS.color.indigoLight,
              }}
            >
              {initials}
            </div>
          )}
          <div>
            <span style={{ fontSize: 13, fontWeight: 500, color: TOKENS.color.textPrimary }}>{name}</span>
            {contact.title && (
              <span style={{ fontSize: 11, color: TOKENS.color.textMuted, marginLeft: 8 }}>{contact.title}</span>
            )}
          </div>
        </div>
        <span
          style={{
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.04em',
            padding: '2px 8px',
            borderRadius: TOKENS.radius.chip,
            background: hasSent ? TOKENS.color.greenBg : TOKENS.color.bgSubtle,
            border: `1px solid ${hasSent ? TOKENS.color.greenBorder : TOKENS.color.borderSubtle}`,
            color: hasSent ? TOKENS.color.green : TOKENS.color.textMuted,
          }}
        >
          {hasSent ? 'GESENDET' : 'ENTWURF'}
        </span>
      </div>

      {/* Subject */}
      {contact.email_draft_subject && (
        <div style={{ fontSize: 15, fontWeight: 500, color: TOKENS.color.textPrimary, lineHeight: 1.4 }}>
          {contact.email_draft_subject}
        </div>
      )}

      {/* Body */}
      <div
        style={{
          fontSize: 14,
          color: TOKENS.color.textSecondary,
          lineHeight: 1.65,
          whiteSpace: 'pre-wrap',
          maxHeight: 300,
          overflowY: 'auto',
        }}
      >
        {contact.email_draft_body}
      </div>

      {/* Footer buttons */}
      <div style={{ display: 'flex', gap: 8, paddingTop: 4, borderTop: `0.5px solid ${TOKENS.color.borderSubtle}` }}>
        {contact.email && (
          <button
            onClick={handleMailto}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '9px 14px',
              borderRadius: TOKENS.radius.button,
              background: TOKENS.color.indigo,
              border: 'none',
              color: TOKENS.color.textOnAccent,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: TOKENS.font.family,
            }}
          >
            In Mail-Client öffnen
          </button>
        )}
        <button
          onClick={handleCopy}
          style={{
            padding: '9px 14px',
            borderRadius: TOKENS.radius.button,
            background: TOKENS.color.bgSubtle,
            border: `1px solid ${TOKENS.color.borderSubtle}`,
            color: TOKENS.color.textTertiary,
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: TOKENS.font.family,
          }}
        >
          Kopieren
        </button>
        <button
          onClick={onRegenerate}
          disabled={isRegenerating}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '9px 14px',
            borderRadius: TOKENS.radius.button,
            background: TOKENS.color.bgSubtle,
            border: `1px solid ${TOKENS.color.borderSubtle}`,
            color: isRegenerating ? TOKENS.color.textMuted : TOKENS.color.textTertiary,
            fontSize: 12,
            fontWeight: 500,
            cursor: isRegenerating ? 'default' : 'pointer',
            fontFamily: TOKENS.font.family,
          }}
        >
          Regenerieren
          <span
            style={{
              fontSize: 9,
              fontWeight: 500,
              padding: '1px 5px',
              borderRadius: 4,
              background: TOKENS.color.bgSubtle,
              border: `1px solid ${TOKENS.color.borderSubtle}`,
              color: TOKENS.color.textMuted,
            }}
          >
            2 Cr
          </span>
        </button>
      </div>
    </div>
  );
}

// ─── MAIN ───────────────────────────────────────────────────────────────────

export default function OutreachTab({
  company,
  contacts,
  refetchContacts,
  onTabChange,
}: {
  company: Company;
  contacts: Contact[];
  refetchContacts: () => void;
  onTabChange: (tab: string) => void;
}) {
  const { enrich, enrichingContactId } = useContactEnrich(company.id);
  const drafts = contacts.filter((c) => c.email_draft_body);

  async function handleRegenerate(contact: Contact) {
    if (!contact.apollo_person_id) return;
    await enrich({
      apolloPersonId: contact.apollo_person_id,
      rawApolloPerson: (contact.raw_apollo_person as Record<string, unknown>) ?? {},
      getEmail: false,
      getPhone: false,
      generateEmail: true,
    });
    refetchContacts();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontFamily: TOKENS.font.family }}>
      {/* Next Action */}
      <NextActionBanner nextAction={company.next_action} onDraftClick={() => onTabChange('kontakte')} />

      {/* Follow-up Context */}
      <FollowUpContext context={company.follow_up_context} />

      {/* Email Drafts */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: TOKENS.color.indigo }} />
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.06em',
              color: TOKENS.color.textMuted,
              textTransform: 'uppercase' as const,
            }}
          >
            EMAIL-ENTWÜRFE
          </span>
          {drafts.length > 0 && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 500,
                padding: '1px 6px',
                borderRadius: 4,
                background: TOKENS.color.indigoBgSubtle,
                color: TOKENS.color.indigoLight,
                fontFamily: TOKENS.font.mono,
              }}
            >
              {drafts.length}
            </span>
          )}
        </div>

        {drafts.length === 0 ? (
          <div
            style={{
              padding: '32px 24px',
              borderRadius: TOKENS.radius.card,
              textAlign: 'center',
              border: `1.5px dashed ${TOKENS.color.indigoBorderSoft}`,
              background: TOKENS.color.indigoBgSubtle,
            }}
          >
            <p style={{ fontSize: 13, color: TOKENS.color.textTertiary, margin: '0 0 14px', lineHeight: 1.5 }}>
              Noch keine Email-Drafts. Erstelle einen Ansprechpartner-Draft auf dem Ansprechpartner-Tab.
            </p>
            <button
              onClick={() => onTabChange('kontakte')}
              style={{
                padding: '8px 18px',
                borderRadius: TOKENS.radius.button,
                background: TOKENS.color.indigoBgSoft,
                border: `1px solid ${TOKENS.color.indigoBorderSoft}`,
                color: TOKENS.color.indigoLight,
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: TOKENS.font.family,
              }}
            >
              Zu Ansprechpartner
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {drafts.map((c) => (
              <DraftCard
                key={c.id}
                contact={c}
                onRegenerate={() => handleRegenerate(c)}
                isRegenerating={enrichingContactId === c.apollo_person_id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
