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
  tierCounts: { hot: number; warm: number; cold: number };
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

// ─── TIER CONFIG ────────────────────────────────────────────────────────────

const TIER_CONFIG = {
  all: {
    label: 'Alle',
    dot: TOKENS.color.textMuted,
    activeBg: TOKENS.color.indigoBgSoft,
    activeBorder: TOKENS.color.indigoBorderSoft,
    activeColor: TOKENS.color.indigoLight,
    activeGlow: 'none',
    inactiveDot: TOKENS.color.textMuted,
  },
  HOT: {
    label: 'HOT',
    dot: TOKENS.color.indigo,
    activeBg: 'rgba(107,122,255,0.14)',
    activeBorder: 'rgba(107,122,255,0.45)',
    activeColor: '#c4cdff',
    activeGlow: '0 0 8px rgba(107,122,255,0.35)',
    inactiveDot: 'rgba(107,122,255,0.5)',
  },
  WARM: {
    label: 'WARM',
    dot: TOKENS.color.warm,
    activeBg: 'rgba(245,169,127,0.10)',
    activeBorder: 'rgba(245,169,127,0.35)',
    activeColor: '#F5A97F',
    activeGlow: '0 0 8px rgba(245,169,127,0.2)',
    inactiveDot: 'rgba(245,169,127,0.45)',
  },
  COLD: {
    label: 'COLD',
    dot: 'rgba(147,197,253,0.7)',
    activeBg: 'rgba(147,197,253,0.06)',
    activeBorder: 'rgba(147,197,253,0.25)',
    activeColor: 'rgba(147,197,253,0.85)',
    activeGlow: 'none',
    inactiveDot: 'rgba(147,197,253,0.3)',
  },
} as const;

// ─── SELECT STYLE ───────────────────────────────────────────────────────────

function selectStyle(active: boolean): React.CSSProperties {
  return {
    fontSize: 12.5,
    fontFamily: TOKENS.font.family,
    padding: '6px 28px 6px 11px',
    borderRadius: TOKENS.radius.button,
    background: active ? TOKENS.color.indigoBgSubtle : TOKENS.color.bgSubtle,
    border: `1px solid ${active ? TOKENS.color.indigoBorderSoft : TOKENS.color.borderSubtle}`,
    color: active ? TOKENS.color.indigoLight : TOKENS.color.textSecondary,
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(255,255,255,0.35)' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 9px center',
  };
}

// ─── COMPONENT ──────────────────────────────────────────────────────────────

export default function FilterBar(props: FilterBarProps) {
  const tierOrder: ('all' | TierKey)[] = ['all', 'HOT', 'WARM', 'COLD'];

  const counts: Record<string, number | undefined> = {
    HOT: props.tierCounts.hot,
    WARM: props.tierCounts.warm,
    COLD: props.tierCounts.cold,
  };

  const activeFilterCount = [
    props.tierFilter !== 'all',
    !!props.industryFilter,
    !!props.countryFilter,
    !!props.employeeRange,
    !!props.scoreRange,
  ].filter(Boolean).length;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        marginBottom: 20,
        fontFamily: TOKENS.font.family,
      }}
    >
      {/* ── ROW 1: Search + Sort ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1 }}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke={TOKENS.color.textMuted}
            strokeWidth="2"
            strokeLinecap="round"
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={props.searchValue}
            onChange={(e) => props.onSearchChange(e.target.value)}
            placeholder="Unternehmen, Domain oder Ort suchen…"
            style={{
              width: '100%',
              padding: '9px 36px 9px 36px',
              borderRadius: TOKENS.radius.button,
              background: TOKENS.color.bgSubtle,
              border: `1px solid ${props.searchValue ? TOKENS.color.indigoBorderSoft : TOKENS.color.borderSubtle}`,
              color: TOKENS.color.textPrimary,
              fontSize: 13,
              fontFamily: TOKENS.font.family,
              outline: 'none',
              transition: 'border-color 0.15s',
              boxSizing: 'border-box',
            }}
          />
          {props.searchValue && (
            <button
              onClick={() => props.onSearchChange('')}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                color: TOKENS.color.textMuted,
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Sort */}
        <select
          value={props.sortBy}
          onChange={(e) => props.onSortChange(e.target.value as SortBy)}
          style={selectStyle(false)}
        >
          <option value="score_desc">Score ↓</option>
          <option value="created_desc">Neueste zuerst</option>
          <option value="industry_asc">Branche A–Z</option>
        </select>
      </div>

      {/* ── ROW 2: Tier Chips + Dropdowns ───────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {/* Tier chips */}
        {tierOrder.map((key) => {
          const cfg = TIER_CONFIG[key as keyof typeof TIER_CONFIG];
          const active = props.tierFilter === key;
          const count = key !== 'all' ? counts[key] : undefined;

          return (
            <button
              key={key}
              onClick={() => props.onTierChange(key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: TOKENS.radius.pill,
                border: `1px solid ${active ? cfg.activeBorder : TOKENS.color.borderSubtle}`,
                background: active ? cfg.activeBg : 'transparent',
                color: active ? cfg.activeColor : TOKENS.color.textMuted,
                fontSize: 12.5,
                fontWeight: active ? 600 : 400,
                letterSpacing: '0.03em',
                cursor: 'pointer',
                fontFamily: TOKENS.font.family,
                transition: 'all 0.15s',
                boxShadow: active ? cfg.activeGlow : 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {/* Dot indicator */}
              {key !== 'all' && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: active ? cfg.dot : cfg.inactiveDot,
                    flexShrink: 0,
                    boxShadow: active && key === 'HOT' ? `0 0 6px ${TOKENS.color.indigo}` : 'none',
                    transition: 'all 0.15s',
                  }}
                />
              )}
              {cfg.label}
              {/* Count badge */}
              {count !== undefined && count > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    fontFamily: TOKENS.font.mono,
                    padding: '0px 5px',
                    borderRadius: 4,
                    background: active ? 'rgba(255,255,255,0.12)' : TOKENS.color.bgSubtle,
                    color: active ? cfg.activeColor : TOKENS.color.textMuted,
                    lineHeight: '16px',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}

        {/* Visual separator */}
        <div
          style={{
            width: 1,
            height: 18,
            background: TOKENS.color.borderSubtle,
            margin: '0 4px',
            flexShrink: 0,
          }}
        />

        {/* Industry dropdown */}
        {props.industryOptions.length > 0 && (
          <select
            value={props.industryFilter ?? ''}
            onChange={(e) => props.onIndustryChange(e.target.value || null)}
            style={selectStyle(!!props.industryFilter)}
          >
            <option value="">Branche</option>
            {props.industryOptions.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        )}

        {/* Country dropdown */}
        {props.countryOptions.length > 0 && (
          <select
            value={props.countryFilter ?? ''}
            onChange={(e) => props.onCountryChange(e.target.value || null)}
            style={selectStyle(!!props.countryFilter)}
          >
            <option value="">Land</option>
            {props.countryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}

        {/* Employee range */}
        <select
          value={props.employeeRange ?? ''}
          onChange={(e) => props.onEmployeeRangeChange((e.target.value as EmployeeRange) || null)}
          style={selectStyle(!!props.employeeRange)}
        >
          <option value="">Mitarbeiter</option>
          <option value="<10">&lt;10</option>
          <option value="10-50">10–50</option>
          <option value="50-200">50–200</option>
          <option value="200+">200+</option>
        </select>

        {/* Score range */}
        <select
          value={props.scoreRange ?? ''}
          onChange={(e) => props.onScoreRangeChange((e.target.value as ScoreRange) || null)}
          style={selectStyle(!!props.scoreRange)}
        >
          <option value="">Score</option>
          <option value="<30">&lt;30</option>
          <option value="30-60">30–60</option>
          <option value="60-80">60–80</option>
          <option value="80+">80+</option>
        </select>

        {/* Clear all active filters */}
        {activeFilterCount > 0 && (
          <>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => {
                props.onTierChange('all');
                props.onIndustryChange(null);
                props.onCountryChange(null);
                props.onEmployeeRangeChange(null);
                props.onScoreRangeChange(null);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 10px',
                borderRadius: TOKENS.radius.pill,
                border: `1px solid ${TOKENS.color.borderSubtle}`,
                background: 'transparent',
                color: TOKENS.color.textMuted,
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: TOKENS.font.family,
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              {activeFilterCount} Filter
            </button>
          </>
        )}
      </div>
    </div>
  );
}
