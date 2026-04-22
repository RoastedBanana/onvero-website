'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TOKENS } from '../_tokens';
import { fmt } from '../_lib/formatters';
import type { CompanyWithContacts } from '../_hooks/useCompanies';

// ─── SCORE RING ─────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number | null }) {
  const s = fmt.score(score);
  const size = 40;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(s.value / 100, 1);
  const offset = circ * (1 - pct);

  const ringColor =
    s.value >= 70 ? TOKENS.color.indigo : s.value >= 40 ? 'rgba(107,122,255,0.55)' : 'rgba(242,243,247,0.3)';

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={TOKENS.color.borderSubtle} strokeWidth={stroke} />
        {s.value > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={ringColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        )}
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 600,
          fontFamily: TOKENS.font.mono,
          color: s.value > 0 ? TOKENS.color.textPrimary : TOKENS.color.textMuted,
        }}
      >
        {s.display}
      </div>
    </div>
  );
}

// ─── TIER BADGE ─────────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: string | null }) {
  const t = fmt.tier(tier);
  if (t === 'UNRATED') return null;
  if (t === 'HOT') {
    return (
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.04em',
          padding: '3px 10px',
          borderRadius: TOKENS.radius.chip,
          background: `linear-gradient(135deg, ${TOKENS.color.indigo} 0%, #8B9AFF 100%)`,
          color: TOKENS.color.textOnAccent,
          boxShadow: '0 0 12px rgba(107,122,255,0.3)',
        }}
      >
        HOT
      </span>
    );
  }
  if (t === 'WARM') {
    return (
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.04em',
          padding: '3px 10px',
          borderRadius: TOKENS.radius.chip,
          background: 'rgba(245,169,127,0.10)',
          color: TOKENS.color.warm,
          border: `0.5px solid rgba(245,169,127,0.30)`,
        }}
      >
        WARM
      </span>
    );
  }
  const tc = TOKENS.tierColors[t];
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.04em',
        padding: '2px 8px',
        borderRadius: TOKENS.radius.chip,
        background: tc.bg,
        color: tc.text,
        border: `1px solid rgba(107,122,255,${tc.borderStrength})`,
      }}
    >
      {t}
    </span>
  );
}

// ─── TAG CHIP ───────────────────────────────────────────────────────────────

function TagChip({ label }: { label: string }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 400,
        padding: '2px 8px',
        borderRadius: TOKENS.radius.chip,
        background: TOKENS.color.bgSubtle,
        color: TOKENS.color.textTertiary,
        border: `1px solid ${TOKENS.color.borderSubtle}`,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

// ─── COMPANY CARD ───────────────────────────────────────────────────────────

export default function CompanyCard({
  company,
  selected,
  onToggle,
}: {
  company: CompanyWithContacts;
  selected?: boolean;
  onToggle?: () => void;
}) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);

  const tier = fmt.tier(company.tier);
  const isHot = tier === 'HOT';
  const isWarm = tier === 'WARM';
  const isCold = tier === 'COLD';
  const borderColor = selected
    ? 'rgba(107,122,255,0.45)'
    : hovered
      ? 'rgba(107,122,255,0.3)'
      : isHot
        ? 'rgba(107,122,255,0.4)'
        : isWarm
          ? 'rgba(245,169,127,0.22)'
          : isCold
            ? 'rgba(147,197,253,0.14)'
            : TOKENS.color.borderSubtle;

  const summaryText = company.summary ?? company.apollo_short_description ?? null;
  const domain = fmt.domain(company.website, company.primary_domain);
  const location = fmt.countryCity(company.country, company.city);
  const empLabel =
    company.estimated_num_employees !== null ? `${fmt.employees(company.estimated_num_employees)} MA` : null;

  return (
    <div
      onClick={() => router.push(`/sales/unternehmen/${company.id}?tab=uebersicht`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        backgroundColor: selected ? TOKENS.color.indigoBgSubtle : hovered ? TOKENS.color.bgSubtle : TOKENS.color.bgCard,
        border: `0.5px solid ${borderColor}`,
        borderRadius: TOKENS.radius.card,
        padding: '16px 18px',
        cursor: 'pointer',
        fontFamily: TOKENS.font.family,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHot
          ? hovered
            ? '0 8px 24px rgba(107,122,255,0.15), inset 0 1px 0 0 rgba(107,122,255,0.2)'
            : 'inset 0 1px 0 0 rgba(107,122,255,0.15)'
          : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Header: Logo + Name + Score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Logo with select overlay */}
        <div
          style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}
          onClick={(e) => {
            if (onToggle) {
              e.stopPropagation();
              onToggle();
            }
          }}
        >
          {company.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={company.logo_url}
              alt=""
              style={{
                width: 44,
                height: 44,
                borderRadius: TOKENS.radius.button,
                objectFit: 'contain',
                background: '#fff',
                border: `1px solid ${TOKENS.color.borderSubtle}`,
                display: 'block',
              }}
            />
          ) : (
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: TOKENS.radius.button,
                background: TOKENS.color.bgSubtle,
                border: `1px solid ${TOKENS.color.borderSubtle}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 500,
                color: TOKENS.color.textTertiary,
              }}
            >
              {fmt.initials(company.company_name)}
            </div>
          )}
          {/* Select overlay — shows on hover or when selected */}
          {onToggle && (hovered || selected) && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: TOKENS.radius.button,
                backgroundColor: selected ? TOKENS.color.indigo : 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
            >
              {selected ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <div
                  style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.8)' }}
                />
              )}
            </div>
          )}
        </div>

        {/* Name + domain + location */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: TOKENS.color.textPrimary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {fmt.text(company.company_name, 'Unbenannt')}
          </div>
          <div
            style={{
              fontSize: 12,
              color: TOKENS.color.textMuted,
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {domain !== '\u2014' ? domain : ''}
            {domain !== '\u2014' && location !== '\u2014' ? ' \u00B7 ' : ''}
            {location !== '\u2014' ? location : ''}
            {domain === '\u2014' && location === '\u2014' ? '\u2014' : ''}
          </div>
        </div>

        {/* Score ring */}
        <ScoreRing score={company.fit_score} />
      </div>

      {/* Tags row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        <TierBadge tier={company.tier} />
        {company.industry && <TagChip label={fmt.industry(company.industry)} />}
        {empLabel && <TagChip label={empLabel} />}
      </div>

      {/* Summary */}
      <div
        style={{
          fontSize: 13,
          lineHeight: 1.55,
          color: TOKENS.color.textTertiary,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
        }}
      >
        {summaryText ?? (
          <span style={{ color: TOKENS.color.textMuted, fontStyle: 'italic' }}>Noch nicht analysiert</span>
        )}
      </div>

      {/* Separator */}
      <div style={{ height: 0, borderTop: `0.5px solid ${TOKENS.color.borderSubtle}` }} />

      {/* Contacts footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.04em',
            color: TOKENS.color.textMuted,
            textTransform: 'uppercase' as const,
          }}
        >
          Ansprechpartner
        </span>
        {company.enriched_contacts_count > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Mini avatar stack */}
            <div style={{ display: 'flex' }}>
              {Array.from({ length: Math.min(company.enriched_contacts_count, 3) }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: TOKENS.color.indigoBgSoft,
                    border: `1.5px solid ${TOKENS.color.bgCard}`,
                    marginLeft: i > 0 ? -6 : 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 8,
                    fontWeight: 600,
                    color: TOKENS.color.indigoLight,
                  }}
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <span style={{ fontSize: 12, color: TOKENS.color.textTertiary }}>
              {company.enriched_contacts_count} enriched
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: TOKENS.color.textMuted }}>Noch keine geladen</span>
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: TOKENS.color.indigoBgSubtle,
                border: `1px solid ${TOKENS.color.indigoBorderSoft}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke={TOKENS.color.indigo}
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
