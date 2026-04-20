'use client';

import { TOKENS } from '../_tokens';
import { fmt } from '../_lib/formatters';
import type { Company } from '../_types';

// ─── SCORE RING (large, 64px) ───────────────────────────────────────────────

function HeroScoreRing({ score }: { score: number | null }) {
  const s = fmt.score(score);
  const size = 64;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - s.value / 100);
  const ringColor =
    s.value >= 70 ? TOKENS.color.indigo : s.value >= 40 ? 'rgba(107,122,255,0.55)' : 'rgba(255,255,255,0.3)';

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

// ─── STATUS BADGE ───────────────────────────────────────────────────────────

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

// ─── TIER BADGE ─────────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: string | null }) {
  const t = fmt.tier(tier);
  if (t === 'UNRATED') return null;
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
        border: `1px solid rgba(107,122,255,${tc.borderStrength})`,
      }}
    >
      {t}
    </span>
  );
}

// ─── META DOT SEPARATOR ─────────────────────────────────────────────────────

function MetaLine({ items }: { items: string[] }) {
  const filtered = items.filter(Boolean);
  if (filtered.length === 0) return null;
  return (
    <div style={{ fontSize: 12.5, color: TOKENS.color.textTertiary, marginTop: 6, lineHeight: 1.5 }}>
      {filtered.map((item, i) => (
        <span key={i}>
          {i > 0 && <span style={{ margin: '0 6px', color: TOKENS.color.textMuted }}>&middot;</span>}
          {item}
        </span>
      ))}
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
  const location = fmt.countryCity(company.country, company.city);
  const employees =
    company.estimated_num_employees !== null ? `${fmt.employees(company.estimated_num_employees)} Mitarbeiter` : '';
  const revenue = fmt.revenue(company.annual_revenue_printed, company.annual_revenue);
  const founded = company.founded_year ? `Gegr. ${company.founded_year}` : '';

  const metaItems = [
    domain !== '\u2014' ? domain : '',
    location !== '\u2014' ? location : '',
    founded,
    employees,
    revenue !== '\u2014' ? revenue : '',
  ];

  return (
    <div
      style={{
        background: TOKENS.color.bgCard,
        border: `1px solid ${TOKENS.color.borderSubtle}`,
        borderRadius: TOKENS.radius.hero,
        padding: '24px 28px',
        fontFamily: TOKENS.font.family,
        marginBottom: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
        {/* Logo */}
        {company.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={company.logo_url}
            alt=""
            style={{
              width: 64,
              height: 64,
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
              width: 64,
              height: 64,
              borderRadius: TOKENS.radius.card,
              background: TOKENS.color.indigoBgSoft,
              border: `1px solid ${TOKENS.color.indigoBorderSoft}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 600,
              color: TOKENS.color.indigoLight,
              flexShrink: 0,
            }}
          >
            {fmt.initials(company.company_name)}
          </div>
        )}

        {/* Name + Meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1
              style={{
                fontSize: 22,
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
          <MetaLine items={metaItems} />
        </div>

        {/* Score Ring */}
        <HeroScoreRing score={company.fit_score} />
      </div>

      {/* Bottom row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: 16 }}>
        <button
          onClick={onOutreachClick}
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
            transition: 'background 0.15s',
          }}
        >
          E-Mail schreiben
        </button>
      </div>
    </div>
  );
}
