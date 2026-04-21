'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TOKENS } from '../_tokens';
import { fmt } from '../_lib/formatters';
import type { CompanyWithContacts } from '../_hooks/useCompanies';

const TH: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 14px',
  fontSize: 11,
  letterSpacing: '0.06em',
  color: TOKENS.color.textMuted,
  fontWeight: 500,
  borderBottom: `1px solid ${TOKENS.color.borderSubtle}`,
  fontFamily: TOKENS.font.family,
  whiteSpace: 'nowrap',
};

const TD: React.CSSProperties = {
  padding: '12px 14px',
  fontSize: 13,
  fontFamily: TOKENS.font.family,
  color: TOKENS.color.textSecondary,
};

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export default function CompanyTable({
  companies,
  selected,
  onToggle,
  onToggleAll,
}: {
  companies: CompanyWithContacts[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
}) {
  const router = useRouter();
  const allSelected = companies.length > 0 && companies.every((c) => selected.has(c.id));

  return (
    <div
      style={{
        background: TOKENS.color.bgCard,
        border: `1px solid ${TOKENS.color.borderSubtle}`,
        borderRadius: TOKENS.radius.cardLarge,
        overflow: 'clip',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'rgba(242,243,247,0.015)' }}>
            <th style={{ ...TH, width: 36, padding: '10px 12px' }}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                style={{ accentColor: TOKENS.color.indigo, cursor: 'pointer', width: 13, height: 13 }}
              />
            </th>
            <th style={TH}>UNTERNEHMEN</th>
            <th style={TH}>BRANCHE</th>
            <th style={TH}>MA</th>
            <th style={TH}>ORT</th>
            <th style={TH}>TIER</th>
            <th style={TH}>SCORE</th>
            <th style={TH}>KONTAKTE</th>
            <th style={TH}>ERSTELLT</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((c, i) => (
            <Row
              key={c.id}
              company={c}
              index={i}
              total={companies.length}
              isSelected={selected.has(c.id)}
              onToggle={() => onToggle(c.id)}
              onClick={() => router.push(`/sales/unternehmen/${c.id}?tab=uebersicht`)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── ROW ────────────────────────────────────────────────────────────────────

function Row({
  company: c,
  index,
  total,
  isSelected,
  onToggle,
  onClick,
}: {
  company: CompanyWithContacts;
  index: number;
  total: number;
  isSelected: boolean;
  onToggle: () => void;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const tier = fmt.tier(c.tier);
  const tc = TOKENS.tierColors[tier];
  const created = c.created_at
    ? new Date(c.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
    : '\u2014';

  return (
    <tr
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderBottom: index < total - 1 ? `1px solid ${TOKENS.color.borderSubtle}` : 'none',
        cursor: 'pointer',
        background: isSelected ? TOKENS.color.indigoBgSubtle : hovered ? 'rgba(107,122,255,0.04)' : 'transparent',
        borderLeft: tier === 'HOT' ? `2px solid rgba(107,122,255,0.5)` : '2px solid transparent',
        transition: 'background 0.1s ease',
      }}
    >
      {/* Checkbox */}
      <td style={{ ...TD, width: 36, padding: '12px 12px' }} onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          style={{ accentColor: TOKENS.color.indigo, cursor: 'pointer', width: 13, height: 13 }}
        />
      </td>

      {/* Company */}
      <td style={TD}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {c.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={c.logo_url}
              alt=""
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                objectFit: 'contain',
                background: '#fff',
                flexShrink: 0,
                border: `1px solid ${TOKENS.color.borderSubtle}`,
              }}
            />
          ) : (
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: TOKENS.color.bgSubtle,
                border: `1px solid ${TOKENS.color.borderSubtle}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 500,
                color: TOKENS.color.textMuted,
                flexShrink: 0,
              }}
            >
              {fmt.initials(c.company_name)}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 500,
                color: TOKENS.color.textPrimary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 200,
              }}
            >
              {fmt.text(c.company_name, 'Unbenannt')}
            </div>
            <div style={{ fontSize: 11, color: TOKENS.color.textMuted, marginTop: 1 }}>
              {fmt.domain(c.website, c.primary_domain)}
            </div>
          </div>
        </div>
      </td>

      {/* Industry */}
      <td style={TD}>
        <span style={{ fontSize: 11 }}>{fmt.text(c.industry)}</span>
      </td>

      {/* Employees */}
      <td style={{ ...TD, fontFamily: TOKENS.font.mono, fontSize: 11 }}>{fmt.employees(c.estimated_num_employees)}</td>

      {/* Location */}
      <td style={TD}>
        <span style={{ fontSize: 11 }}>{fmt.countryCity(c.country, c.city)}</span>
      </td>

      {/* Tier */}
      <td style={TD}>
        {tier !== 'UNRATED' ? (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.04em',
              padding: '2px 7px',
              borderRadius: TOKENS.radius.chip,
              background: tc.bg,
              color: tc.text,
              border: `1px solid rgba(107,122,255,${tc.borderStrength})`,
            }}
          >
            {tier}
          </span>
        ) : (
          <span style={{ color: TOKENS.color.textMuted, fontSize: 11 }}>{'\u2014'}</span>
        )}
      </td>

      {/* Score */}
      <td
        style={{
          ...TD,
          fontFamily: TOKENS.font.mono,
          fontSize: 12,
          fontWeight: 500,
          color:
            (c.fit_score ?? 0) >= 70
              ? TOKENS.color.indigoLight
              : (c.fit_score ?? 0) >= 40
                ? TOKENS.color.textSecondary
                : TOKENS.color.textTertiary,
        }}
      >
        {fmt.score(c.fit_score).display}
      </td>

      {/* Contacts */}
      <td style={{ ...TD, fontFamily: TOKENS.font.mono, fontSize: 11 }}>
        {c.enriched_contacts_count > 0 ? (
          <span style={{ color: TOKENS.color.indigo }}>{c.enriched_contacts_count}</span>
        ) : (
          <span style={{ color: TOKENS.color.textMuted }}>{'\u2014'}</span>
        )}
      </td>

      {/* Created */}
      <td style={{ ...TD, fontSize: 11, color: TOKENS.color.textMuted }}>{created}</td>
    </tr>
  );
}
