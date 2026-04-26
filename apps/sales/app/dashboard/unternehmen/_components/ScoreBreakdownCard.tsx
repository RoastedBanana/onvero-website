'use client';

import { TOKENS } from '../_tokens';
import { fmt } from '../_lib/formatters';
import type { Company, CompanyStatus } from '../_types';
import StatusPicker from './StatusPicker';

// ─── SIGNAL ROW ─────────────────────────────────────────────────────────────

function SignalRow({
  label,
  value,
  present,
  mono,
  wrap,
}: {
  label: string;
  value: string | null;
  present: boolean;
  mono?: boolean;
  wrap?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '8px 0',
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
          textAlign: 'right',
          ...(wrap
            ? { flexShrink: 1 }
            : { maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }),
        }}
      >
        {value ?? '—'}
      </span>
    </div>
  );
}

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export default function ScoreBreakdownCard({
  company,
  onStatusChange,
}: {
  company: Company;
  onStatusChange?: (s: CompanyStatus) => void;
}) {
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

  const size = 80;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - s.value / 100);

  const tierColor =
    tier === 'HOT'
      ? TOKENS.color.indigo
      : tier === 'WARM'
        ? TOKENS.color.warm
        : tier === 'COLD'
          ? 'rgba(147,197,253,0.7)'
          : TOKENS.color.textMuted;

  const domain = fmt.domain(company.website, company.primary_domain);
  const location = fmt.countryCity(company.country, company.city);
  const revenue = fmt.revenue(company.annual_revenue_printed, company.annual_revenue ?? null);
  const employees = company.estimated_num_employees ? fmt.employees(company.estimated_num_employees) : null;

  const statusLabel =
    company.status === 'contacted'
      ? 'In Kontakt'
      : company.status === 'qualified'
        ? 'Qualifiziert'
        : company.status === 'lost'
          ? 'Verloren'
          : 'Neu';

  const scoredAt = company.ai_scored_at
    ? new Date(company.ai_scored_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
    : null;

  const industry = fmt.industry(company.apollo_industry ?? company.industry);

  return (
    <div
      style={{
        background: TOKENS.color.bgCard,
        border: `1px solid ${TOKENS.color.borderSubtle}`,
        borderRadius: TOKENS.radius.card,
        padding: '22px 22px',
        fontFamily: TOKENS.font.family,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 0,
      }}
    >
      {/* Score header */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginBottom: 24,
          padding: '16px 18px',
          borderRadius: TOKENS.radius.card,
          background: TOKENS.color.indigoBgSubtle,
          border: `0.5px solid ${TOKENS.color.indigoBorderSoft}`,
        }}
      >
        {/* Ring */}
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

        {/* Label + tier + score explanation */}
        <div
          style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}
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
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: tierColor, flexShrink: 0 }} />
              )}
              <span style={{ fontSize: 10, fontWeight: 600, color: tierColor, letterSpacing: '0.05em' }}>
                {tier !== 'UNRATED' ? tier : 'Nicht bewertet'}
              </span>
            </div>
          </div>

          {/* Score bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div
              style={{
                height: 4,
                borderRadius: 2,
                background: TOKENS.color.bgSubtle,
                overflow: 'hidden',
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
                    ? 'Sehr starke Übereinstimmung mit ICP'
                    : s.value >= 60
                      ? 'Gute Übereinstimmung mit ICP'
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

      {/* Divider */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.07em',
          color: TOKENS.color.textMuted,
          textTransform: 'uppercase' as const,
          marginBottom: 4,
        }}
      >
        Kennzahlen
      </div>

      {/* Signal rows */}
      {/* Status row — interactive if onStatusChange provided */}
      {onStatusChange ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '8px 0',
            borderBottom: `0.5px solid ${TOKENS.color.borderSubtle}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: TOKENS.color.indigo,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 13, color: TOKENS.color.textTertiary }}>Status</span>
          </div>
          <StatusPicker status={company.status} onStatusChange={onStatusChange} />
        </div>
      ) : (
        <SignalRow label="Status" value={statusLabel} present />
      )}
      <SignalRow label="Branche" value={industry || null} present={!!industry} wrap />
      <SignalRow label="Mitarbeiter" value={employees} present={!!employees} mono />
      <SignalRow label="Umsatz" value={revenue !== '\u2014' ? revenue : null} present={revenue !== '\u2014'} mono />
      <SignalRow label="Standort" value={location !== '\u2014' ? location : null} present={location !== '\u2014'} />
      <SignalRow label="Domain" value={domain !== '\u2014' ? domain : null} present={domain !== '\u2014'} mono />
      <SignalRow label="LinkedIn" value={company.linkedin_url ? 'Vorhanden' : null} present={!!company.linkedin_url} />
      <SignalRow
        label="Gegründet"
        value={company.founded_year ? String(company.founded_year) : null}
        present={!!company.founded_year}
        mono
      />
      <SignalRow
        label="Website"
        value={company.website_scraped_at ? 'Gescannt' : null}
        present={!!company.website_scraped_at}
      />
      <div style={{ borderBottom: 'none' }}>
        <SignalRow label="Analyse" value={scoredAt} present={!!scoredAt} mono />
      </div>

      <div style={{ fontSize: 10, color: TOKENS.color.textMuted, marginTop: 10, textAlign: 'center' }}>
        Bewertung auf Basis öffentlicher Daten
      </div>
    </div>
  );
}
