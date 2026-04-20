'use client';

import { TOKENS } from '../_tokens';
import type { TierKey } from '../_tokens';

// ─── TYPES ──────────────────────────────────────────────────────────────────

export type EmployeeRange = '<10' | '10-50' | '50-200' | '200+' | null;
export type ScoreRange = '<30' | '30-60' | '60-80' | '80+' | null;
export type SortBy = 'score_desc' | 'created_desc' | 'industry_asc';

export interface FilterBarProps {
  searchValue: string;
  onSearchChange: (v: string) => void;
  tierFilter: 'all' | TierKey;
  onTierChange: (v: 'all' | TierKey) => void;
  industryFilter: string | null;
  industryOptions: string[];
  onIndustryChange: (v: string | null) => void;
  countryFilter: string | null;
  countryOptions: string[];
  onCountryChange: (v: string | null) => void;
  employeeRange: EmployeeRange;
  onEmployeeRangeChange: (v: EmployeeRange) => void;
  scoreRange: ScoreRange;
  onScoreRangeChange: (v: ScoreRange) => void;
  sortBy: SortBy;
  onSortChange: (v: SortBy) => void;
}

// ─── STYLES ─────────────────────────────────────────────────────────────────

const chipBase: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  fontFamily: TOKENS.font.family,
  padding: '5px 12px',
  borderRadius: TOKENS.radius.pill,
  cursor: 'pointer',
  border: 'none',
  transition: 'all 0.15s',
  whiteSpace: 'nowrap',
};

const selectStyle: React.CSSProperties = {
  fontSize: 11,
  fontFamily: TOKENS.font.family,
  padding: '5px 10px',
  borderRadius: TOKENS.radius.pill,
  background: TOKENS.color.bgSubtle,
  border: `1px solid ${TOKENS.color.borderSubtle}`,
  color: TOKENS.color.textSecondary,
  cursor: 'pointer',
  outline: 'none',
  appearance: 'none' as const,
  WebkitAppearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(255,255,255,0.4)' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 8px center',
  paddingRight: 24,
};

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export default function FilterBar(props: FilterBarProps) {
  const tierOptions: { key: 'all' | TierKey; label: string }[] = [
    { key: 'all', label: 'Alle' },
    { key: 'HOT', label: 'Hot' },
    { key: 'WARM', label: 'Warm' },
    { key: 'COLD', label: 'Cold' },
  ];

  const empOptions: { key: EmployeeRange; label: string }[] = [
    { key: '<10', label: '<10' },
    { key: '10-50', label: '10\u201350' },
    { key: '50-200', label: '50\u2013200' },
    { key: '200+', label: '200+' },
  ];

  const scoreOptions: { key: ScoreRange; label: string }[] = [
    { key: '<30', label: '<30' },
    { key: '30-60', label: '30\u201360' },
    { key: '60-80', label: '60\u201380' },
    { key: '80+', label: '80+' },
  ];

  function tierChip(active: boolean): React.CSSProperties {
    return {
      ...chipBase,
      padding: '7px 14px',
      borderRadius: TOKENS.radius.pill,
      fontSize: 12.5,
      background: active ? TOKENS.color.indigoBgSoft : TOKENS.color.bgSubtle,
      color: active ? TOKENS.color.indigoLight : TOKENS.color.textTertiary,
      border: `1px solid ${active ? TOKENS.color.indigoBorderSoft : TOKENS.color.borderSubtle}`,
    };
  }

  function rangeChip(active: boolean): React.CSSProperties {
    return {
      ...chipBase,
      padding: '7px 14px',
      borderRadius: TOKENS.radius.pill,
      fontSize: 12.5,
      background: active ? 'rgba(242,243,247,0.12)' : TOKENS.color.bgSubtle,
      color: active ? TOKENS.color.textPrimary : TOKENS.color.textTertiary,
      border: `1px solid ${active ? TOKENS.color.borderHover : TOKENS.color.borderSubtle}`,
    };
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
        marginBottom: 20,
        fontFamily: TOKENS.font.family,
      }}
    >
      {/* Search */}
      <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke={TOKENS.color.textMuted}
          strokeWidth="2"
          strokeLinecap="round"
          style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={props.searchValue}
          onChange={(e) => props.onSearchChange(e.target.value)}
          placeholder="Unternehmen suchen..."
          style={{
            width: '100%',
            padding: '8px 12px 8px 32px',
            borderRadius: TOKENS.radius.button,
            background: TOKENS.color.bgSubtle,
            border: `1px solid ${TOKENS.color.borderSubtle}`,
            color: TOKENS.color.textPrimary,
            fontSize: 12,
            fontFamily: TOKENS.font.family,
            outline: 'none',
          }}
        />
      </div>

      {/* Tier chips */}
      <div style={{ display: 'flex', gap: 4 }}>
        {tierOptions.map((t) => (
          <button key={t.key} onClick={() => props.onTierChange(t.key)} style={tierChip(props.tierFilter === t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Industry select */}
      {props.industryOptions.length > 0 && (
        <select
          value={props.industryFilter ?? ''}
          onChange={(e) => props.onIndustryChange(e.target.value || null)}
          style={selectStyle}
        >
          <option value="">Branche</option>
          {props.industryOptions.map((ind) => (
            <option key={ind} value={ind}>
              {ind}
            </option>
          ))}
        </select>
      )}

      {/* Country select */}
      {props.countryOptions.length > 0 && (
        <select
          value={props.countryFilter ?? ''}
          onChange={(e) => props.onCountryChange(e.target.value || null)}
          style={selectStyle}
        >
          <option value="">Land</option>
          {props.countryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      )}

      {/* Employee range chips */}
      <div style={{ display: 'flex', gap: 4 }}>
        {empOptions.map((o) => (
          <button
            key={o.key}
            onClick={() => props.onEmployeeRangeChange(props.employeeRange === o.key ? null : o.key)}
            style={rangeChip(props.employeeRange === o.key)}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Score range chips */}
      <div style={{ display: 'flex', gap: 4 }}>
        {scoreOptions.map((o) => (
          <button
            key={o.key}
            onClick={() => props.onScoreRangeChange(props.scoreRange === o.key ? null : o.key)}
            style={rangeChip(props.scoreRange === o.key)}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <select
        value={props.sortBy}
        onChange={(e) => props.onSortChange(e.target.value as SortBy)}
        style={{ ...selectStyle, marginLeft: 'auto' }}
      >
        <option value="score_desc">Score (hoch)</option>
        <option value="created_desc">Neueste</option>
        <option value="industry_asc">Branche A-Z</option>
      </select>
    </div>
  );
}
