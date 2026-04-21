'use client';

import { useState } from 'react';
import { TOKENS } from '../_tokens';
import { fmt } from '../_lib/formatters';
import { sanitizeForDisplay, sanitizeArrayForDisplay, PLACEHOLDER_LANG } from '../_lib/language-guard';
import EmptyInline from './EmptyInline';
import StatusPicker from './StatusPicker';
import type { Company, CompanyStatus } from '../_types';

// ─── ACCORDION SECTION ───────────────────────────────────────────────────────

function Section({
  title,
  dotColor,
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  dotColor: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      style={{
        background: TOKENS.color.bgCard,
        border: `1px solid ${TOKENS.color.borderSubtle}`,
        borderRadius: TOKENS.radius.card,
        overflow: 'hidden',
        fontFamily: TOKENS.font.family,
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 18px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontFamily: TOKENS.font.family,
          borderBottom: open ? `0.5px solid ${TOKENS.color.borderSubtle}` : 'none',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = TOKENS.color.bgSubtle)}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'transparent')}
      >
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.05em',
            color: TOKENS.color.textSecondary,
            flex: 1,
            textAlign: 'left',
          }}
        >
          {title}
        </span>
        {count !== undefined && count > 0 && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: 4,
              background: TOKENS.color.indigoBgSubtle,
              color: TOKENS.color.indigoLight,
              fontFamily: TOKENS.font.mono,
              border: `0.5px solid ${TOKENS.color.indigoBorderSoft}`,
            }}
          >
            {count}
          </span>
        )}
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke={TOKENS.color.textMuted}
          strokeWidth="2"
          strokeLinecap="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && <div style={{ padding: '16px 18px' }}>{children}</div>}
    </div>
  );
}

// ─── CHIP LIST (strengths / concerns / generic) ───────────────────────────────

function ChipList({
  items,
  color,
  bgColor,
  borderColor,
}: {
  items: string[];
  color: string;
  bgColor: string;
  borderColor: string;
}) {
  if (items.length === 0)
    return <span style={{ fontSize: 12, color: TOKENS.color.textMuted, fontStyle: 'italic' }}>Keine Einträge</span>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((item, i) => {
        const cleaned = item.replace(
          /^[\u2705\u26A0\uFE0F\uD83D\uDD25\u274C\u2714\u2716\u26A1\u2B50\uD83D\uDCA1\uD83D\uDCCA\uD83C\uDFAF]\s*/u,
          ''
        );
        return (
          <div
            key={i}
            style={{
              fontSize: 13.5,
              padding: '9px 12px',
              borderRadius: 8,
              background: bgColor,
              border: `0.5px solid ${borderColor}`,
              borderLeft: `2px solid ${color}`,
              color,
              lineHeight: 1.5,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 9,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: color,
                flexShrink: 0,
                marginTop: 6,
              }}
            />
            {cleaned}
          </div>
        );
      })}
    </div>
  );
}

// ─── NUMBERED LIST (sales approaches) ────────────────────────────────────────

function NumberedList({ items }: { items: string[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
            padding: '11px 14px',
            borderRadius: 9,
            background: TOKENS.color.indigoBgSubtle,
            border: `0.5px solid ${TOKENS.color.indigoBorderSoft}`,
          }}
        >
          <span
            style={{
              minWidth: 22,
              height: 22,
              borderRadius: '50%',
              background: TOKENS.color.indigoBgSoft,
              border: `1px solid ${TOKENS.color.indigoBorderSoft}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 700,
              color: TOKENS.color.indigoLight,
              fontFamily: TOKENS.font.mono,
              flexShrink: 0,
              marginTop: 1,
            }}
          >
            {i + 1}
          </span>
          <span style={{ fontSize: 14, color: TOKENS.color.textSecondary, lineHeight: 1.55 }}>{item}</span>
        </div>
      ))}
    </div>
  );
}

// ─── GROWTH ROW ──────────────────────────────────────────────────────────────

function GrowthList({ items }: { items: string[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
            padding: '9px 12px',
            borderRadius: 8,
            background: 'rgba(143,229,184,0.04)',
            border: '0.5px solid rgba(143,229,184,0.15)',
            borderLeft: `2px solid ${TOKENS.color.green}`,
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke={TOKENS.color.green}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0, marginTop: 2 }}
          >
            <path d="M18 20V10M12 20V4M6 20v-6" />
          </svg>
          <span style={{ fontSize: 13.5, color: TOKENS.color.textSecondary, lineHeight: 1.55 }}>{item}</span>
        </div>
      ))}
    </div>
  );
}

// ─── HOOK QUOTE ──────────────────────────────────────────────────────────────

function HookList({ items }: { items: string[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((h, i) => (
        <div
          key={i}
          style={{
            padding: '9px 14px',
            background: TOKENS.color.indigoBgSubtle,
            border: `0.5px solid ${TOKENS.color.indigoBorderSoft}`,
            borderLeft: `2px solid ${TOKENS.color.indigo}`,
            borderRadius: '0 9px 9px 0',
            fontSize: 13.5,
            lineHeight: 1.5,
            color: TOKENS.color.textSecondary,
          }}
        >
          {h}
        </div>
      ))}
    </div>
  );
}

// ─── TECH CHIPS ──────────────────────────────────────────────────────────────

const KNOWN_TOOLS = new Set([
  'Shopify',
  'WooCommerce',
  'JTL',
  'Salesforce',
  'HubSpot',
  'Magento',
  'SAP',
  'Zendesk',
  'Slack',
  'Stripe',
]);

function TechChips({ items }: { items: string[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {items.map((t) => {
        const known = KNOWN_TOOLS.has(t);
        return (
          <span
            key={t}
            style={{
              fontSize: 12,
              padding: '4px 10px',
              borderRadius: TOKENS.radius.chip,
              background: known ? TOKENS.color.indigoBgSubtle : TOKENS.color.bgSubtle,
              border: `1px solid ${known ? TOKENS.color.indigoBorderSoft : TOKENS.color.borderSubtle}`,
              color: known ? TOKENS.color.indigoLight : TOKENS.color.textTertiary,
              fontWeight: known ? 500 : 400,
            }}
          >
            {t}
          </span>
        );
      })}
    </div>
  );
}

// ─── SIGNAL ROW (for score/Kennzahlen section) ───────────────────────────────

function SignalRow({
  label,
  value,
  present,
  mono,
}: {
  label: string;
  value: string | null;
  present: boolean;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '9px 0',
        borderBottom: `0.5px solid ${TOKENS.color.borderSubtle}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: present ? TOKENS.color.indigo : TOKENS.color.borderDefault,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 13, color: TOKENS.color.textTertiary }}>{label}</span>
      </div>
      <span
        style={{
          fontSize: 13,
          color: present ? TOKENS.color.textSecondary : TOKENS.color.textMuted,
          fontFamily: mono ? TOKENS.font.mono : TOKENS.font.family,
          fontStyle: present ? 'normal' : 'italic',
        }}
      >
        {value ?? '—'}
      </span>
    </div>
  );
}

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export default function AnalyseTab({
  company,
  onOutreachClick,
  onStatusChange,
}: {
  company: Company;
  onOutreachClick?: () => void;
  onStatusChange?: (s: CompanyStatus) => void;
}) {
  // Data prep
  const cleanSummary = sanitizeForDisplay(company.summary);
  const cleanDesc = sanitizeForDisplay(company.apollo_short_description);
  const summaryText = cleanSummary ?? cleanDesc;
  const hasSummarySource = !summaryText && (company.summary || company.apollo_short_description);

  const strengths = company.strengths ?? [];
  const concerns = company.concerns ?? [];
  const painPoints = sanitizeArrayForDisplay(company.pain_points);
  const hooks = sanitizeArrayForDisplay(company.personalization_hooks);
  const automation = sanitizeArrayForDisplay(company.automation_opportunities);
  const growth = sanitizeArrayForDisplay(company.growth_signals);
  const tech = company.tech_stack ?? [];
  const coreServices = sanitizeArrayForDisplay(company.core_services);
  const keywords = company.apollo_keywords ?? [];
  const partnerUrls = company.partner_customer_urls ?? [];

  const cleanUsp = sanitizeForDisplay(company.usp);
  const cleanTone = sanitizeForDisplay(company.tone_of_voice);
  const cleanTargetCustomers = sanitizeForDisplay(company.target_customers);
  const cleanWebHighlights = sanitizeForDisplay(company.website_highlights);
  const cleanAutomationPotential = sanitizeForDisplay(company.automation_potential);

  const industry = fmt.industry(company.apollo_industry ?? company.industry);
  const location = fmt.countryCity(company.country, company.city);
  const revenue = fmt.revenue(company.annual_revenue_printed, company.annual_revenue ?? null);
  const employees = company.estimated_num_employees ? fmt.employees(company.estimated_num_employees) : null;
  const domain = fmt.domain(company.website, company.primary_domain);
  const scoredAt = company.ai_scored_at
    ? new Date(company.ai_scored_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
    : null;

  const s = fmt.score(company.fit_score);
  const tier = fmt.tier(company.tier);
  const tierLabel =
    s.value >= 80
      ? 'Sehr hoher Fit'
      : s.value >= 60
        ? 'Hoher Fit'
        : s.value >= 40
          ? 'Mittlerer Fit'
          : s.value > 0
            ? 'Geringer Fit'
            : '—';
  const ringColor =
    s.value >= 60 ? TOKENS.color.indigo : s.value >= 30 ? 'rgba(107,122,255,0.45)' : TOKENS.color.borderDefault;
  const tierColor =
    tier === 'HOT'
      ? TOKENS.color.indigo
      : tier === 'WARM'
        ? TOKENS.color.warm
        : tier === 'COLD'
          ? 'rgba(147,197,253,0.7)'
          : TOKENS.color.textMuted;

  const size = 80;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const scoreOffset = circ * (1 - s.value / 100);

  const statusLabel =
    company.status === 'contacted'
      ? 'In Kontakt'
      : company.status === 'qualified'
        ? 'Qualifiziert'
        : company.status === 'lost'
          ? 'Verloren'
          : 'Neu';

  const hasProfileData = cleanUsp || cleanTone || cleanTargetCustomers || coreServices.length > 0;
  const hasWebData = cleanWebHighlights || partnerUrls.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontFamily: TOKENS.font.family }}>
      {/* ── 1. FIT-BEWERTUNG ──────────────────────────────────────────────── */}
      <Section title="Fit-Bewertung & Kennzahlen" dotColor={TOKENS.color.indigo} defaultOpen>
        {/* Score header */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginBottom: 20,
            padding: '16px 18px',
            borderRadius: TOKENS.radius.card,
            background: TOKENS.color.indigoBgSubtle,
            border: `0.5px solid ${TOKENS.color.indigoBorderSoft}`,
          }}
        >
          {/* Score ring */}
          <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={TOKENS.color.bgSubtle}
                strokeWidth={stroke}
              />
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
                  strokeDashoffset={scoreOffset}
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
                  fontSize: 22,
                  fontWeight: 600,
                  fontFamily: TOKENS.font.mono,
                  color: s.value > 0 ? TOKENS.color.textPrimary : TOKENS.color.textMuted,
                  lineHeight: 1,
                }}
              >
                {s.display}
              </span>
              <span style={{ fontSize: 10, color: TOKENS.color.textMuted, letterSpacing: '0.06em', marginTop: 2 }}>
                FIT
              </span>
            </div>
          </div>

          {/* Score label + tier + bar */}
          <div
            style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: s.value > 0 ? TOKENS.color.textPrimary : TOKENS.color.textMuted,
                  letterSpacing: '-0.01em',
                }}
              >
                {tierLabel}
              </span>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 9px',
                  borderRadius: TOKENS.radius.chip,
                  background: tier !== 'UNRATED' ? `${tierColor}14` : TOKENS.color.bgSubtle,
                  border: `0.5px solid ${tier !== 'UNRATED' ? `${tierColor}44` : TOKENS.color.borderSubtle}`,
                }}
              >
                {tier !== 'UNRATED' && (
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: tierColor }} />
                )}
                <span style={{ fontSize: 10, fontWeight: 600, color: tierColor, letterSpacing: '0.05em' }}>
                  {tier !== 'UNRATED' ? tier : 'Nicht bewertet'}
                </span>
              </div>
            </div>
            <div>
              <div
                style={{
                  height: 4,
                  borderRadius: 2,
                  background: TOKENS.color.bgSubtle,
                  overflow: 'hidden',
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${s.value}%`,
                    background: ringColor,
                    borderRadius: 2,
                    transition: 'width 0.6s ease',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, color: TOKENS.color.textMuted }}>
                  {s.value > 0
                    ? s.value >= 80
                      ? 'Sehr starke ICP-Übereinstimmung'
                      : s.value >= 60
                        ? 'Gute ICP-Übereinstimmung'
                        : s.value >= 40
                          ? 'Teilweise Übereinstimmung'
                          : 'Geringe Übereinstimmung'
                    : 'Noch nicht bewertet'}
                </span>
                <span style={{ fontSize: 10, color: TOKENS.color.textMuted, fontFamily: TOKENS.font.mono }}>
                  {s.value}/100
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Kennzahlen */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.07em',
            color: TOKENS.color.textMuted,
            textTransform: 'uppercase' as const,
            marginBottom: 6,
          }}
        >
          Kennzahlen
        </div>
        {onStatusChange ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '9px 0',
              borderBottom: `0.5px solid ${TOKENS.color.borderSubtle}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{ width: 5, height: 5, borderRadius: '50%', background: TOKENS.color.indigo, flexShrink: 0 }}
              />
              <span style={{ fontSize: 13, color: TOKENS.color.textTertiary }}>Status</span>
            </div>
            <StatusPicker status={company.status} onStatusChange={onStatusChange} />
          </div>
        ) : (
          <SignalRow label="Status" value={statusLabel} present />
        )}
        <SignalRow label="Branche" value={industry || null} present={!!industry} />
        <SignalRow label="Mitarbeiter" value={employees} present={!!employees} mono />
        <SignalRow label="Umsatz" value={revenue !== '—' ? revenue : null} present={revenue !== '—'} mono />
        <SignalRow label="Standort" value={location !== '—' ? location : null} present={location !== '—'} />
        <SignalRow
          label="Gegründet"
          value={company.founded_year ? String(company.founded_year) : null}
          present={!!company.founded_year}
          mono
        />
        <SignalRow label="Domain" value={domain !== '—' ? domain : null} present={domain !== '—'} mono />
        <SignalRow
          label="LinkedIn"
          value={company.linkedin_url ? 'Vorhanden' : null}
          present={!!company.linkedin_url}
        />
        <SignalRow
          label="Website gescannt"
          value={company.website_scraped_at ? 'Ja' : null}
          present={!!company.website_scraped_at}
        />
        <SignalRow label="KI-Analyse" value={scoredAt} present={!!scoredAt} mono />
        <div style={{ fontSize: 10, color: TOKENS.color.textMuted, marginTop: 10, textAlign: 'center' as const }}>
          KI-Bewertung auf Basis öffentlicher Daten
        </div>
      </Section>

      {/* ── 2. ZUSAMMENFASSUNG ───────────────────────────────────────────────── */}
      <Section title="Zusammenfassung" dotColor={TOKENS.color.indigoLight} defaultOpen>
        {summaryText ? (
          <p style={{ fontSize: 15, lineHeight: 1.65, color: TOKENS.color.textSecondary, margin: '0 0 0 0' }}>
            {summaryText}
          </p>
        ) : hasSummarySource ? (
          <EmptyInline label={PLACEHOLDER_LANG} />
        ) : (
          <p style={{ fontSize: 13, color: TOKENS.color.textMuted, fontStyle: 'italic', margin: 0 }}>
            Noch nicht analysiert
          </p>
        )}
      </Section>

      {/* ── 3. TECH STACK ────────────────────────────────────────────────────── */}
      {tech.length > 0 && (
        <Section title="Tech Stack" dotColor="rgba(147,197,253,0.7)" count={tech.length} defaultOpen>
          <TechChips items={tech} />
        </Section>
      )}

      {/* ── 4. STÄRKEN & BEDENKEN ────────────────────────────────────────────── */}
      <Section title="Stärken & Bedenken" dotColor={TOKENS.color.warm} count={strengths.length + concerns.length}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                color: TOKENS.color.textMuted,
                textTransform: 'uppercase' as const,
                marginBottom: 10,
              }}
            >
              Stärken
            </div>
            <ChipList
              items={strengths}
              color={TOKENS.color.warm}
              bgColor={TOKENS.color.warmBg}
              borderColor={TOKENS.color.warmBorder}
            />
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                color: TOKENS.color.textMuted,
                textTransform: 'uppercase' as const,
                marginBottom: 10,
              }}
            >
              Bedenken
            </div>
            <ChipList
              items={concerns}
              color={TOKENS.color.amber}
              bgColor={TOKENS.color.amberBg}
              borderColor={TOKENS.color.amberBorder}
            />
          </div>
        </div>
        <style>{`@media(max-width:640px){.stbedenken-grid{grid-template-columns:1fr!important}}`}</style>
      </Section>

      {/* ── 4. VERTRIEBSANSÄTZE ──────────────────────────────────────────────── */}
      {(automation.length > 0 || hooks.length > 0 || cleanAutomationPotential) && (
        <Section
          title="Vertriebsansätze & Personalisierung"
          dotColor={TOKENS.color.indigo}
          count={automation.length + hooks.length}
        >
          {automation.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: TOKENS.color.textMuted,
                  textTransform: 'uppercase' as const,
                  marginBottom: 10,
                }}
              >
                Verkaufsansätze
              </div>
              <NumberedList items={automation} />
            </>
          )}

          {cleanAutomationPotential && (
            <div style={{ marginTop: automation.length > 0 ? 16 : 0 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: TOKENS.color.textMuted,
                  textTransform: 'uppercase' as const,
                  marginBottom: 8,
                }}
              >
                Automatisierungs-Potenzial
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: TOKENS.color.textSecondary, margin: 0 }}>
                {cleanAutomationPotential}
              </p>
            </div>
          )}

          {hooks.length > 0 && (
            <div style={{ marginTop: automation.length > 0 || cleanAutomationPotential ? 16 : 0 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: TOKENS.color.textMuted,
                  textTransform: 'uppercase' as const,
                  marginBottom: 10,
                }}
              >
                Personalisierungs-Hooks
              </div>
              <HookList items={hooks} />
            </div>
          )}
        </Section>
      )}

      {/* ── 5. PAIN POINTS ───────────────────────────────────────────────────── */}
      {painPoints.length > 0 && (
        <Section title="Pain Points" dotColor={TOKENS.color.amber} count={painPoints.length}>
          <ChipList
            items={painPoints}
            color={TOKENS.color.amber}
            bgColor={TOKENS.color.amberBg}
            borderColor={TOKENS.color.amberBorder}
          />
        </Section>
      )}

      {/* ── 6. WACHSTUMS-SIGNALE ─────────────────────────────────────────────── */}
      {growth.length > 0 && (
        <Section title="Wachstums-Signale" dotColor={TOKENS.color.green} count={growth.length}>
          <GrowthList items={growth} />
        </Section>
      )}

      {/* ── 8. UNTERNEHMENSPROFIL ────────────────────────────────────────────── */}
      {hasProfileData && (
        <Section title="Unternehmensprofil" dotColor={TOKENS.color.textTertiary}>
          {cleanUsp && (
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: TOKENS.color.textMuted,
                  textTransform: 'uppercase' as const,
                  marginBottom: 8,
                }}
              >
                Unique Selling Proposition
              </div>
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: TOKENS.radius.card,
                  background: 'rgba(107,122,255,0.04)',
                  border: `1px solid ${TOKENS.color.indigoBorderSoft}`,
                  fontSize: 15,
                  fontWeight: 500,
                  color: TOKENS.color.textPrimary,
                  lineHeight: 1.5,
                  letterSpacing: '-0.01em',
                }}
              >
                {cleanUsp}
              </div>
            </div>
          )}

          {cleanTone && (
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: TOKENS.color.textMuted,
                  textTransform: 'uppercase' as const,
                  marginBottom: 8,
                  fontStyle: 'italic',
                }}
              >
                Tone of Voice
              </div>
              <div
                style={{
                  paddingLeft: 14,
                  borderLeft: `2px solid ${TOKENS.color.indigo}`,
                  fontSize: 14,
                  color: TOKENS.color.textSecondary,
                  lineHeight: 1.6,
                }}
              >
                {cleanTone}
              </div>
            </div>
          )}

          {coreServices.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: TOKENS.color.textMuted,
                  textTransform: 'uppercase' as const,
                  marginBottom: 8,
                }}
              >
                Leistungen
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {coreServices.map((s, i) => (
                  <span
                    key={i}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      fontSize: 13,
                      padding: '5px 12px',
                      borderRadius: TOKENS.radius.pill,
                      background: TOKENS.color.indigoBgSubtle,
                      border: `1px solid ${TOKENS.color.indigoBorderSoft}`,
                      color: TOKENS.color.indigoLight,
                      fontWeight: 500,
                    }}
                  >
                    <svg
                      width="9"
                      height="9"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={TOKENS.color.green}
                      strokeWidth="3"
                      strokeLinecap="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {cleanTargetCustomers && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: TOKENS.color.textMuted,
                  textTransform: 'uppercase' as const,
                  marginBottom: 8,
                }}
              >
                Zielkunden
              </div>
              <p style={{ fontSize: 14, color: TOKENS.color.textSecondary, lineHeight: 1.6, margin: 0 }}>
                {cleanTargetCustomers}
              </p>
            </div>
          )}
        </Section>
      )}

      {/* ── 9. WEBSITE & REFERENZEN ──────────────────────────────────────────── */}
      {hasWebData && (
        <Section title="Website & Referenzen" dotColor={TOKENS.color.green}>
          {cleanWebHighlights && (
            <div style={{ marginBottom: partnerUrls.length > 0 ? 16 : 0 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: TOKENS.color.textMuted,
                  textTransform: 'uppercase' as const,
                  marginBottom: 8,
                }}
              >
                Website-Highlights
              </div>
              <p style={{ fontSize: 14, color: TOKENS.color.textSecondary, lineHeight: 1.6, margin: 0 }}>
                {cleanWebHighlights}
              </p>
            </div>
          )}

          {partnerUrls.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  color: TOKENS.color.textMuted,
                  textTransform: 'uppercase' as const,
                  marginBottom: 8,
                }}
              >
                Partner & Kunden
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {partnerUrls.map((url, i) => {
                  const d = url
                    .replace(/^https?:\/\//, '')
                    .replace(/^www\./, '')
                    .replace(/\/$/, '');
                  return (
                    <a
                      key={i}
                      href={url.startsWith('http') ? url : `https://${url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 12,
                        padding: '3px 10px',
                        borderRadius: TOKENS.radius.pill,
                        background: TOKENS.color.bgSubtle,
                        border: `1px solid ${TOKENS.color.borderSubtle}`,
                        color: TOKENS.color.textTertiary,
                        textDecoration: 'none',
                      }}
                    >
                      {d}
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* ── 10. APOLLO KEYWORDS ──────────────────────────────────────────────── */}
      {keywords.length > 0 && (
        <Section title={`Apollo Keywords`} dotColor={TOKENS.color.borderDefault} count={keywords.length}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {keywords.map((kw, i) => (
              <span
                key={i}
                style={{
                  fontSize: 12,
                  padding: '3px 9px',
                  borderRadius: TOKENS.radius.chip,
                  background: TOKENS.color.bgSubtle,
                  border: `1px solid ${TOKENS.color.borderSubtle}`,
                  color: TOKENS.color.textTertiary,
                }}
              >
                {kw}
              </span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
