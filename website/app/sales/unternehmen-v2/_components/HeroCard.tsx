'use client';

import { TOKENS } from '../_tokens';
import { fmt } from '../_lib/formatters';
import { sanitizeForDisplay, sanitizeArrayForDisplay } from '../_lib/language-guard';
import { formatRelativeTime } from '../_lib/relative-time';
import type { Company } from '../_types';

// ─── SCORE RING ─────────────────────────────────────────────────────────────

function HeroScoreRing({ score }: { score: number | null }) {
  const s = fmt.score(score);
  const size = 64;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - s.value / 100);
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
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 600,
            fontFamily: TOKENS.font.mono,
            color: s.value > 0 ? TOKENS.color.textPrimary : TOKENS.color.textMuted,
            lineHeight: 1,
          }}
        >
          {s.display}
        </span>
        <span
          style={{ fontSize: 9, fontWeight: 500, color: TOKENS.color.textMuted, letterSpacing: '0.06em', marginTop: 2 }}
        >
          FIT
        </span>
      </div>
    </div>
  );
}

// ─── BADGES ─────────────────────────────────────────────────────────────────

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
          background: TOKENS.gradient.hotBadge,
          color: TOKENS.color.textOnAccent,
          boxShadow: TOKENS.shadow.hotGlow,
        }}
      >
        HOT
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
        padding: '3px 10px',
        borderRadius: TOKENS.radius.chip,
        background: tc.bg,
        color: tc.text,
        border: `0.5px solid rgba(107,122,255,${tc.borderStrength})`,
      }}
    >
      {t}
    </span>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const label =
    status === 'contacted'
      ? 'In Kontakt'
      : status === 'qualified'
        ? 'Qualifiziert'
        : status === 'lost'
          ? 'Verloren'
          : 'Neu';
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 500,
        padding: '3px 9px',
        borderRadius: TOKENS.radius.chip,
        background: TOKENS.color.bgSubtle,
        border: `1px solid ${TOKENS.color.borderSubtle}`,
        color: TOKENS.color.textTertiary,
      }}
    >
      {label}
    </span>
  );
}

// ─── INFO STRIP ─────────────────────────────────────────────────────────────

interface Fact {
  label: string;
  value: string;
  highlight?: boolean;
  muted?: boolean;
  mono?: boolean;
}

function InfoStrip({ company, contactsCount }: { company: Company; contactsCount: number }) {
  const facts: Fact[] = [];

  if (company.industry) facts.push({ label: 'Branche', value: company.industry });
  if (company.founded_year) facts.push({ label: 'Seit', value: String(company.founded_year), mono: true });

  const t = fmt.tier(company.tier);
  if (t !== 'UNRATED') facts.push({ label: 'Tier', value: t, highlight: t === 'HOT' });

  if (company.estimated_num_employees) {
    facts.push({ label: 'MA', value: fmt.employees(company.estimated_num_employees), mono: true });
  }

  const loc = fmt.countryCity(company.country, company.city);
  if (loc !== '\u2014') facts.push({ label: 'Standort', value: loc });

  if (company.annual_revenue_printed) {
    facts.push({ label: 'Umsatz', value: company.annual_revenue_printed, highlight: true });
  }

  const deGrowth = sanitizeArrayForDisplay(company.growth_signals);
  if (deGrowth.length > 0) {
    facts.push({ label: 'Highlight', value: deGrowth[0], highlight: true });
  }

  facts.push({
    label: 'Kontakte',
    value: contactsCount > 0 ? String(contactsCount) : 'keine',
    muted: contactsCount === 0,
    mono: true,
  });

  if (company.created_at) {
    facts.push({ label: 'Erstellt', value: formatRelativeTime(company.created_at), muted: true, mono: true });
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px 14px',
        padding: '10px 0',
        borderTop: `0.5px solid ${TOKENS.color.borderSubtle}`,
        borderBottom: `0.5px solid ${TOKENS.color.borderSubtle}`,
        fontSize: 12.5,
        fontFamily: TOKENS.font.family,
      }}
    >
      {facts.map((f, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 10.5, color: TOKENS.color.textTertiary, letterSpacing: '0.04em' }}>{f.label}</span>
          <span
            style={{
              color: f.highlight ? TOKENS.color.warm : f.muted ? TOKENS.color.textTertiary : TOKENS.color.textPrimary,
              fontWeight: f.highlight ? 500 : 400,
              fontFamily: f.mono ? TOKENS.font.mono : 'inherit',
            }}
          >
            {f.value}
          </span>
        </span>
      ))}
    </div>
  );
}

// ─── TIER REASON ────────────────────────────────────────────────────────────

function TierReason({ company }: { company: Company }) {
  const t = fmt.tier(company.tier);
  if (t === 'COLD' || t === 'UNRATED') return null;
  const cleanSummary = sanitizeForDisplay(company.summary);
  if (!cleanSummary) return null;
  const firstSentence = cleanSummary.split('.')[0] + '.';

  return (
    <div
      style={{
        padding: '10px 14px',
        background: TOKENS.color.indigoBgSubtle,
        borderLeft: `2px solid ${TOKENS.color.indigo}`,
        borderRadius: '0 8px 8px 0',
        fontSize: 13,
        lineHeight: 1.5,
        color: TOKENS.color.textSecondary,
        fontFamily: TOKENS.font.family,
        maxWidth: 720,
      }}
    >
      <div
        style={{
          fontSize: 10.5,
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          color: TOKENS.color.indigoGlow,
          fontWeight: 500,
          marginBottom: 4,
          fontFamily: TOKENS.font.mono,
        }}
      >
        Warum {t}
      </div>
      {firstSentence}
    </div>
  );
}

// ─── HERO CARD ──────────────────────────────────────────────────────────────

export default function HeroCard({
  company,
  contactsCount,
  onOutreachClick,
}: {
  company: Company;
  contactsCount: number;
  onOutreachClick: () => void;
}) {
  const domain = fmt.domain(company.website, company.primary_domain);
  const founded = company.founded_year ? `Gegr. ${company.founded_year}` : '';
  const domainLine = [domain !== '\u2014' ? domain : '', founded].filter(Boolean);

  return (
    <article
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: TOKENS.color.bgCard,
        border: `0.5px solid ${TOKENS.color.indigoBorderSoft}`,
        borderRadius: TOKENS.radius.hero,
        boxShadow: TOKENS.shadow.insetTop,
      }}
    >
      {/* Glow layer */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 160,
          background: TOKENS.gradient.heroGlow,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Content grid: left=content, right=score+cta */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 200px',
          gap: 24,
          padding: 24,
          alignItems: 'start',
        }}
      >
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          {/* Header: Logo + Name + Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {company.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={company.logo_url}
                alt=""
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: TOKENS.radius.card,
                  objectFit: 'contain',
                  background: '#fff',
                  flexShrink: 0,
                  border: `1px solid ${TOKENS.color.borderSubtle}`,
                }}
              />
            ) : (
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: TOKENS.radius.card,
                  background: TOKENS.color.indigoBgSoft,
                  border: `1px solid ${TOKENS.color.indigoBorderSoft}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 600,
                  color: TOKENS.color.indigoLight,
                  flexShrink: 0,
                }}
              >
                {fmt.initials(company.company_name)}
              </div>
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1
                  style={{
                    fontSize: 24,
                    fontWeight: 500,
                    color: TOKENS.color.textPrimary,
                    margin: 0,
                    letterSpacing: '-0.02em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {fmt.text(company.company_name, 'Unbenannt')}
                </h1>
                <TierBadge tier={company.tier} />
                <StatusBadge status={company.status} />
              </div>
              {domainLine.length > 0 && (
                <div style={{ fontSize: 12.5, color: TOKENS.color.textTertiary, marginTop: 4 }}>
                  {domainLine.join(' \u00B7 ')}
                </div>
              )}
            </div>
          </div>

          {/* Info strip */}
          <InfoStrip company={company} contactsCount={contactsCount} />

          {/* Tier reason */}
          <TierReason company={company} />
        </div>

        {/* RIGHT COLUMN */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            paddingTop: 4,
          }}
        >
          <HeroScoreRing score={company.fit_score} />
          <button
            onClick={onOutreachClick}
            style={{
              padding: '10px 18px',
              borderRadius: TOKENS.radius.button,
              background: TOKENS.gradient.ctaButton,
              border: 'none',
              color: TOKENS.color.textOnAccent,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: TOKENS.font.family,
              boxShadow: '0 2px 8px rgba(107,122,255,0.2)',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            E-Mail schreiben
          </button>
        </div>
      </div>
    </article>
  );
}
