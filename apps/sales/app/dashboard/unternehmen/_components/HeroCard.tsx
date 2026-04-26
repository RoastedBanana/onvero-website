'use client';

import { TOKENS } from '../_tokens';
import { fmt } from '../_lib/formatters';
import { sanitizeForDisplay } from '../_lib/language-guard';
import type { Company, CompanyStatus } from '../_types';
import StatusPicker from './StatusPicker';

// ─── SCORE RING ─────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number | null }) {
  const s = fmt.score(score);
  const size = 64;
  const stroke = 4.5;
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
            fontSize: 18,
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
      ? { background: TOKENS.gradient.hotBadge, color: TOKENS.color.textOnAccent, boxShadow: TOKENS.shadow.hotGlow }
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

// ─── COMPANY SUMMARY ─────────────────────────────────────────────────────────
// Shows what the company actually does — the centerpiece of the header.
// Falls back through: summary → apollo_short_description → company_description

function CompanySummary({ company }: { company: Company }) {
  const text =
    sanitizeForDisplay(company.summary) ??
    sanitizeForDisplay(company.apollo_short_description) ??
    sanitizeForDisplay(company.company_description);

  if (!text) return null;

  // Cap at ~320 chars so it stays readable, break at word boundary
  const display = text.length > 320 ? text.slice(0, 320).replace(/\s\S+$/, '') + '…' : text;

  return (
    <p
      style={{
        fontSize: 14,
        lineHeight: 1.65,
        color: TOKENS.color.textSecondary,
        margin: 0,
        padding: '14px 0',
        borderTop: `0.5px solid ${TOKENS.color.borderSubtle}`,
        borderBottom: `0.5px solid ${TOKENS.color.borderSubtle}`,
      }}
    >
      {display}
    </p>
  );
}

// ─── FACT PILLS (compact, inline row) ────────────────────────────────────────

interface Fact {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
}

function FactPills({ company, contactsCount }: { company: Company; contactsCount: number }) {
  const facts: Fact[] = [];

  const industry = fmt.industry(company.industry);
  if (industry) facts.push({ label: 'Branche', value: industry });

  // Prefer scraped locations (deep research) over Apollo city/country
  const locsScraped = (company.locations_scraped ?? []).filter((s) => s && s.trim());
  if (locsScraped.length > 0) {
    const primary = locsScraped[0];
    // Show first location, hint at more
    const value = locsScraped.length > 1 ? `${primary} +${locsScraped.length - 1}` : primary;
    facts.push({ label: 'Standort', value });
  } else {
    const loc = fmt.countryCity(company.country, company.city);
    if (loc !== '—') facts.push({ label: 'Standort', value: loc });
  }

  // Prefer scraped employee range over Apollo number
  if (company.estimated_employees_scraped) {
    facts.push({ label: 'Mitarbeiter', value: company.estimated_employees_scraped, mono: true });
  } else if (company.estimated_num_employees) {
    facts.push({ label: 'Mitarbeiter', value: fmt.employees(company.estimated_num_employees), mono: true });
  }

  // Prefer scraped revenue range over Apollo printed/number
  if (company.estimated_revenue_scraped) {
    facts.push({ label: 'Umsatz', value: company.estimated_revenue_scraped, highlight: true, mono: true });
  } else {
    const revenue = fmt.revenue(company.annual_revenue_printed, company.annual_revenue ?? null);
    if (revenue !== '—') facts.push({ label: 'Umsatz', value: revenue, highlight: true, mono: true });
  }

  if (company.founded_year) facts.push({ label: 'Gegründet', value: String(company.founded_year), mono: true });

  if (contactsCount > 0) {
    facts.push({
      label: 'Kontakte',
      value: contactsCount === 1 ? '1 Kontakt' : `${contactsCount} Kontakte`,
      mono: true,
    });
  }

  // Technology hints (first 2 known tech tools)
  const knownTools = new Set(['Shopify', 'WooCommerce', 'JTL', 'Salesforce', 'HubSpot', 'Magento', 'SAP']);
  const keyTech = (company.technology_names ?? []).filter((t) => knownTools.has(t)).slice(0, 2);
  if (keyTech.length > 0) facts.push({ label: 'Tech', value: keyTech.join(', ') });

  if (facts.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px 6px',
      }}
    >
      {facts.map((f, i) => (
        <div
          key={i}
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 5,
            padding: '6px 10px',
            borderRadius: TOKENS.radius.card,
            background: f.highlight ? TOKENS.color.warmBg : TOKENS.color.bgSubtle,
            border: `0.5px solid ${f.highlight ? TOKENS.color.warmBorder : TOKENS.color.borderSubtle}`,
          }}
        >
          <span
            style={{
              fontSize: 10,
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
              fontSize: 12,
              fontWeight: 500,
              color: f.highlight ? TOKENS.color.warm : TOKENS.color.textSecondary,
              fontFamily: f.mono ? TOKENS.font.mono : TOKENS.font.family,
              lineHeight: 1,
            }}
          >
            {f.value}
          </span>
        </div>
      ))}
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
    domain !== '—' ? (company.website?.startsWith('http') ? company.website : `https://${domain}`) : null;

  const statusLabel =
    company.status === 'contacted'
      ? 'In Kontakt'
      : company.status === 'qualified'
        ? 'Qualifiziert'
        : company.status === 'lost'
          ? 'Verloren'
          : 'Neu';

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
      {/* Ambient glow — clipped by border-radius, not overflow:hidden */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 100,
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
          gap: 14,
        }}
      >
        {/* ── ROW 1: Logo · Name · Status · Score ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
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

          {/* Name + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <h1
                style={{
                  fontSize: 21,
                  fontWeight: 500,
                  color: TOKENS.color.textPrimary,
                  margin: 0,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}
              >
                {fmt.text(company.company_name, 'Unbenannt')}
              </h1>
              <TierBadge tier={company.tier} />
            </div>
            {/* Domain + status on one line */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {domain !== '—' && (
                <span style={{ fontSize: 12, color: TOKENS.color.textMuted, fontFamily: TOKENS.font.mono }}>
                  {domain}
                </span>
              )}
              {domain !== '—' && <span style={{ fontSize: 10, color: TOKENS.color.borderDefault }}>·</span>}
              {onStatusChange ? (
                <StatusPicker status={company.status} onStatusChange={onStatusChange} />
              ) : (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    padding: '2px 8px',
                    borderRadius: TOKENS.radius.chip,
                    background: TOKENS.color.bgSubtle,
                    border: `1px solid ${TOKENS.color.borderSubtle}`,
                    color: TOKENS.color.textTertiary,
                  }}
                >
                  {statusLabel}
                </span>
              )}
            </div>
          </div>

          {/* Score ring — right side */}
          <ScoreRing score={company.fit_score} />
        </div>

        {/* ── ROW 2: Company summary (what they do) ── */}
        <CompanySummary company={company} />

        {/* ── ROW 3: Key facts as compact pills ── */}
        <FactPills company={company} contactsCount={contactsCount} />

        {/* ── ROW 4: Action buttons ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 2 }}>
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
