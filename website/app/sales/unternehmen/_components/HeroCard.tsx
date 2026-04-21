'use client';

import { TOKENS } from '../_tokens';
import { fmt } from '../_lib/formatters';
import { sanitizeForDisplay, sanitizeArrayForDisplay } from '../_lib/language-guard';
import { formatRelativeTime } from '../_lib/relative-time';
import type { Company, CompanyStatus } from '../_types';
import StatusPicker from './StatusPicker';

// ─── SCORE RING ─────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number | null }) {
  const s = fmt.score(score);
  const size = 72;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - s.value / 100);
  const ringColor =
    s.value >= 70 ? TOKENS.color.indigo : s.value >= 40 ? 'rgba(107,122,255,0.5)' : 'rgba(242,243,247,0.15)';

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={TOKENS.color.bgSubtle} strokeWidth={stroke} />
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
            style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
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
            fontSize: 22,
            fontWeight: 600,
            fontFamily: TOKENS.font.mono,
            color: s.value > 0 ? TOKENS.color.textPrimary : TOKENS.color.textMuted,
            lineHeight: 1,
          }}
        >
          {s.display}
        </span>
        <span
          style={{ fontSize: 8, fontWeight: 500, color: TOKENS.color.textMuted, letterSpacing: '0.08em', marginTop: 2 }}
        >
          FIT
        </span>
      </div>
    </div>
  );
}

// ─── TIER BADGE ─────────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: string | null }) {
  const t = fmt.tier(tier);
  if (t === 'UNRATED') return null;
  const styles: React.CSSProperties =
    t === 'HOT'
      ? {
          background: TOKENS.gradient.hotBadge,
          color: TOKENS.color.textOnAccent,
          boxShadow: TOKENS.shadow.hotGlow,
        }
      : t === 'WARM'
        ? {
            background: 'rgba(245,169,127,0.10)',
            color: TOKENS.color.warm,
            border: '0.5px solid rgba(245,169,127,0.30)',
          }
        : {
            background: 'rgba(147,197,253,0.06)',
            color: 'rgba(147,197,253,0.75)',
            border: '0.5px solid rgba(147,197,253,0.20)',
          };

  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.06em',
        padding: '2px 9px',
        borderRadius: TOKENS.radius.chip,
        ...styles,
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
        padding: '2px 8px',
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

  const industryLabel = fmt.industry(company.industry);
  if (industryLabel) facts.push({ label: 'Branche', value: industryLabel });
  if (company.founded_year) facts.push({ label: 'Gegr.', value: String(company.founded_year), mono: true });
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
    facts.push({ label: 'Signal', value: deGrowth[0], highlight: true });
  }
  facts.push({
    label: 'Kontakte',
    value: contactsCount > 0 ? String(contactsCount) : 'keine',
    muted: contactsCount === 0,
    mono: true,
  });
  if (company.created_at) {
    facts.push({ label: 'Erstellt', value: formatRelativeTime(company.created_at), muted: true });
  }

  if (facts.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '6px 20px',
        padding: '10px 0',
        borderTop: `0.5px solid ${TOKENS.color.borderSubtle}`,
        borderBottom: `0.5px solid ${TOKENS.color.borderSubtle}`,
      }}
    >
      {facts.map((f, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: TOKENS.color.textMuted,
              letterSpacing: '0.04em',
              textTransform: 'uppercase' as const,
              lineHeight: 1,
            }}
          >
            {f.label}
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: f.highlight ? 500 : 400,
              color: f.highlight ? TOKENS.color.warm : f.muted ? TOKENS.color.textMuted : TOKENS.color.textSecondary,
              fontFamily: f.mono ? TOKENS.font.mono : 'inherit',
              lineHeight: 1,
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
  const sentenceMatch = cleanSummary.match(/[^.!?]*(?:[.!?](?!\d)[^.!?]*)*?[.!?]/);
  const firstSentence = sentenceMatch ? sentenceMatch[0].trim() : cleanSummary;

  return (
    <div
      style={{
        padding: '10px 14px',
        background: TOKENS.color.indigoBgSubtle,
        borderLeft: `2px solid ${TOKENS.color.indigo}`,
        borderRadius: '0 8px 8px 0',
        fontSize: 14,
        lineHeight: 1.55,
        color: TOKENS.color.textSecondary,
        fontFamily: TOKENS.font.family,
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: '0.10em',
          textTransform: 'uppercase' as const,
          color: TOKENS.color.indigoGlow,
          fontWeight: 600,
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
  onStatusChange,
}: {
  company: Company;
  contactsCount: number;
  onOutreachClick: () => void;
  onStatusChange?: (s: CompanyStatus) => void;
}) {
  const domain = fmt.domain(company.website, company.primary_domain);
  const websiteHref =
    domain !== '\u2014' ? (company.website?.startsWith('http') ? company.website : `https://${domain}`) : null;

  return (
    <article
      style={{
        position: 'relative',
        background: TOKENS.color.bgCard,
        border: `0.5px solid ${TOKENS.color.indigoBorderSoft}`,
        borderRadius: TOKENS.radius.hero,
        boxShadow: TOKENS.shadow.insetTop,
      }}
    >
      {/* Glow — border-radius clips it, NOT overflow:hidden on parent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 120,
          background: TOKENS.gradient.heroGlow,
          pointerEvents: 'none',
          zIndex: 0,
          borderRadius: `${TOKENS.radius.hero} ${TOKENS.radius.hero} 0 0`,
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* ── ROW 1: Logo + Name + Score ring ─── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Logo */}
          {company.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={company.logo_url}
              alt=""
              style={{
                width: 52,
                height: 52,
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
                width: 52,
                height: 52,
                borderRadius: TOKENS.radius.card,
                background: TOKENS.color.indigoBgSoft,
                border: `1px solid ${TOKENS.color.indigoBorderSoft}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 17,
                fontWeight: 600,
                color: TOKENS.color.indigoLight,
                flexShrink: 0,
              }}
            >
              {fmt.initials(company.company_name)}
            </div>
          )}

          {/* Name + domain + badges */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 500,
                  color: TOKENS.color.textPrimary,
                  margin: 0,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}
              >
                {fmt.text(company.company_name, 'Unbenannt')}
              </h1>
              {onStatusChange ? (
                <StatusPicker status={company.status} onStatusChange={onStatusChange} />
              ) : (
                <StatusBadge status={company.status} />
              )}
              <TierBadge tier={company.tier} />
            </div>
            {domain !== '\u2014' && (
              <div style={{ fontSize: 13, color: TOKENS.color.textMuted, marginTop: 3 }}>{domain}</div>
            )}
          </div>

          {/* Score ring — right-aligned in header */}
          <ScoreRing score={company.fit_score} />
        </div>

        {/* ── ROW 2: Info strip ─── */}
        <InfoStrip company={company} contactsCount={contactsCount} />

        {/* ── ROW 3: Tier reason (only when not empty) ─── */}
        <TierReason company={company} />

        {/* ── ROW 4: Action footer ─── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            paddingTop: 4,
          }}
        >
          {/* Primary CTA */}
          <button
            onClick={onOutreachClick}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: TOKENS.radius.button,
              background: TOKENS.gradient.ctaButton,
              border: 'none',
              color: TOKENS.color.textOnAccent,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: TOKENS.font.family,
              boxShadow: '0 2px 10px rgba(107,122,255,0.25)',
              letterSpacing: '-0.01em',
              transition: 'opacity 0.15s',
            }}
          >
            E-Mail schreiben
          </button>

          {/* Website */}
          {websiteHref && (
            <a
              href={websiteHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 14px',
                borderRadius: TOKENS.radius.button,
                border: `0.5px solid ${TOKENS.color.borderSubtle}`,
                background: 'transparent',
                color: TOKENS.color.textTertiary,
                fontSize: 12,
                textDecoration: 'none',
                fontFamily: TOKENS.font.family,
                whiteSpace: 'nowrap',
                transition: 'border-color 0.15s, color 0.15s',
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              Website
            </a>
          )}

          {/* LinkedIn */}
          {company.linkedin_url && (
            <a
              href={company.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 14px',
                borderRadius: TOKENS.radius.button,
                border: `0.5px solid ${TOKENS.color.borderSubtle}`,
                background: 'transparent',
                color: TOKENS.color.textTertiary,
                fontSize: 12,
                textDecoration: 'none',
                fontFamily: TOKENS.font.family,
                whiteSpace: 'nowrap',
                transition: 'border-color 0.15s, color 0.15s',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
                <circle cx="4" cy="4" r="2" />
              </svg>
              LinkedIn
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
