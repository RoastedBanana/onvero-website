'use client';

import { TOKENS } from '../_tokens';
import { fmt } from '../_lib/formatters';
import type { ApolloPerson } from '../_types';

function StatusChip({ label, variant }: { label: string; variant: 'green' | 'amber' | 'gray' }) {
  const styles = {
    green: { bg: TOKENS.color.greenBg, border: TOKENS.color.greenBorder, color: TOKENS.color.green },
    amber: { bg: TOKENS.color.amberBg, border: TOKENS.color.amberBorder, color: TOKENS.color.amber },
    gray: { bg: TOKENS.color.bgSubtle, border: TOKENS.color.borderSubtle, color: TOKENS.color.textMuted },
  };
  const s = styles[variant];
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 500,
        padding: '2px 8px',
        borderRadius: TOKENS.radius.chip,
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.color,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

function CreditBadge({ credits }: { credits: number }) {
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 500,
        padding: '1px 6px',
        borderRadius: 4,
        background: TOKENS.color.bgSubtle,
        border: `1px solid ${TOKENS.color.borderSubtle}`,
        color: TOKENS.color.textMuted,
        whiteSpace: 'nowrap',
      }}
    >
      {credits} Cr
    </span>
  );
}

export default function SearchResultCard({
  person,
  isEnriching,
  onEnrich,
}: {
  person: ApolloPerson;
  isEnriching: boolean;
  onEnrich: (opts: { email: boolean; phone: boolean; draft: boolean }) => void;
}) {
  const raw = person.raw_apollo_person;
  const firstName = person.first_name ?? raw?.first_name ?? null;
  const lastObfuscated = raw?.last_name_obfuscated ?? null;
  const displayName = [firstName, lastObfuscated].filter(Boolean).join(' ') || 'Unbekannt';
  const title = (person.title ?? raw?.title ?? null) as string | null;
  const photoUrl = person.photo_url ?? raw?.photo_url ?? null;
  const hasEmail = raw?.has_email === true;
  const hasPhone = raw?.has_direct_phone;
  const hasCity = raw?.has_city === true;
  const initials =
    [firstName?.[0], (lastObfuscated as string | null)?.[0]].filter(Boolean).join('').toUpperCase() || '?';

  const phoneVariant: 'green' | 'amber' | 'gray' =
    hasPhone === 'Yes' ? 'green' : typeof hasPhone === 'string' && hasPhone.includes('Maybe') ? 'amber' : 'gray';
  const phoneLabel =
    hasPhone === 'Yes'
      ? 'Telefon verfügbar'
      : typeof hasPhone === 'string' && hasPhone.includes('Maybe')
        ? 'Telefon evtl.'
        : 'Kein Telefon';

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
        opacity: isEnriching ? 0.6 : 1,
        animation: isEnriching ? 'skeleton-pulse 1.2s ease-in-out infinite' : 'none',
        transition: 'opacity 0.2s',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl as string}
            alt=""
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              objectFit: 'cover',
              flexShrink: 0,
              border: `1px solid ${TOKENS.color.borderSubtle}`,
            }}
          />
        ) : (
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: TOKENS.color.bgSubtle,
              border: `1px solid ${TOKENS.color.borderSubtle}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 15,
              fontWeight: 500,
              color: TOKENS.color.textTertiary,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: TOKENS.color.textPrimary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {displayName}
            </span>
            {lastObfuscated && (
              <span
                title="Nachname wird nach Enrichment sichtbar"
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: TOKENS.color.bgSubtle,
                  border: `1px solid ${TOKENS.color.borderSubtle}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 9,
                  color: TOKENS.color.textMuted,
                  cursor: 'help',
                  flexShrink: 0,
                }}
              >
                ?
              </span>
            )}
          </div>
          {title && (
            <div style={{ fontSize: 12, color: TOKENS.color.textTertiary, marginTop: 2 }}>{fmt.text(title)}</div>
          )}
        </div>
      </div>

      {/* Status chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        <StatusChip label={hasEmail ? 'E-Mail verfügbar' : 'Keine E-Mail'} variant={hasEmail ? 'green' : 'gray'} />
        <StatusChip label={phoneLabel} variant={phoneVariant} />
        {hasCity && <StatusChip label="Standort bekannt" variant="gray" />}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button
          onClick={() => onEnrich({ email: true, phone: true, draft: true })}
          disabled={isEnriching}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '9px 16px',
            borderRadius: TOKENS.radius.button,
            width: '100%',
            background: isEnriching
              ? TOKENS.color.bgSubtle
              : `linear-gradient(135deg, ${TOKENS.color.indigo} 0%, #7A89FF 100%)`,
            border: isEnriching ? `1px solid ${TOKENS.color.borderSubtle}` : 'none',
            boxShadow: isEnriching ? 'none' : '0 2px 8px rgba(107,122,255,0.2)',
            color: isEnriching ? TOKENS.color.textMuted : TOKENS.color.textOnAccent,
            fontSize: 12,
            fontWeight: 600,
            cursor: isEnriching ? 'default' : 'pointer',
            fontFamily: TOKENS.font.family,
          }}
        >
          Vollständig anreichern
          <CreditBadge credits={5} />
        </button>
        <div style={{ display: 'flex', gap: 5 }}>
          {[
            { label: 'Nur E-Mail', credits: 1, opts: { email: true, phone: false, draft: false } },
            { label: 'Nur Telefon', credits: 2, opts: { email: false, phone: true, draft: false } },
            { label: 'Nur Draft', credits: 2, opts: { email: false, phone: false, draft: true } },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={() => onEnrich(btn.opts)}
              disabled={isEnriching}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                padding: '6px 8px',
                borderRadius: TOKENS.radius.pill,
                background: TOKENS.color.bgSubtle,
                border: `1px solid ${TOKENS.color.borderSubtle}`,
                color: isEnriching ? TOKENS.color.textMuted : TOKENS.color.textTertiary,
                fontSize: 10,
                fontWeight: 500,
                cursor: isEnriching ? 'default' : 'pointer',
                fontFamily: TOKENS.font.family,
                whiteSpace: 'nowrap',
              }}
            >
              {btn.label}
              <CreditBadge credits={btn.credits} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
