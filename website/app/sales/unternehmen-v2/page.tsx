'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TOKENS } from './_tokens';
import type { TierKey } from './_tokens';
import { fmt } from './_lib/formatters';
import { useCompanies } from './_hooks/useCompanies';
import type { CompanyWithContacts } from './_hooks/useCompanies';
import Breadcrumbs from './_components/Breadcrumbs';
import StatsGrid from './_components/StatsGrid';
import FilterBar from './_components/FilterBar';
import type { EmployeeRange, ScoreRange, SortBy } from './_components/FilterBar';
import CompanyCard from './_components/CompanyCard';
import CompanyTable from './_components/CompanyTable';
import EmptyState from './_components/EmptyState';
import SkeletonGrid from './_components/SkeletonGrid';

// ─── FILTER LOGIC ───────────────────────────────────────────────────────────

function matchesEmployeeRange(count: number | null, range: EmployeeRange): boolean {
  if (!range || count === null) return !range;
  if (range === '<10') return count < 10;
  if (range === '10-50') return count >= 10 && count <= 50;
  if (range === '50-200') return count >= 50 && count <= 200;
  if (range === '200+') return count > 200;
  return true;
}

function matchesScoreRange(score: number | null, range: ScoreRange): boolean {
  if (!range) return true;
  if (score === null) return false;
  if (range === '<30') return score < 30;
  if (range === '30-60') return score >= 30 && score < 60;
  if (range === '60-80') return score >= 60 && score < 80;
  if (range === '80+') return score >= 80;
  return true;
}

function sortCompanies(companies: CompanyWithContacts[], sortBy: SortBy): CompanyWithContacts[] {
  const sorted = [...companies];
  if (sortBy === 'score_desc') {
    sorted.sort((a, b) => (b.fit_score ?? -1) - (a.fit_score ?? -1));
  } else if (sortBy === 'created_desc') {
    sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else if (sortBy === 'industry_asc') {
    sorted.sort((a, b) => (a.industry ?? '').localeCompare(b.industry ?? ''));
  }
  return sorted;
}

// ─── PAGE ───────────────────────────────────────────────────────────────────

export default function UnternehmenV2Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewParam = searchParams.get('view');
  const { companies, loading, refetch } = useCompanies();

  // View state
  const [view, setView] = useState<'cards' | 'table'>(viewParam === 'table' ? 'table' : 'cards');

  // Filter state
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | TierKey>('all');
  const [industryFilter, setIndustryFilter] = useState<string | null>(null);
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const [employeeRange, setEmployeeRange] = useState<EmployeeRange>(null);
  const [scoreRange, setScoreRange] = useState<ScoreRange>(null);
  const [sortBy, setSortBy] = useState<SortBy>('score_desc');

  // Table selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Derived options for dropdowns
  const industryOptions = useMemo(() => {
    const set = new Set<string>();
    companies.forEach((c) => {
      if (c.industry) set.add(c.industry);
    });
    return Array.from(set).sort();
  }, [companies]);

  const countryOptions = useMemo(() => {
    const set = new Set<string>();
    companies.forEach((c) => {
      if (c.country) set.add(c.country);
    });
    return Array.from(set).sort();
  }, [companies]);

  // Stats
  const stats = useMemo(() => {
    let hot = 0,
      warm = 0,
      cold = 0;
    companies.forEach((c) => {
      const t = fmt.tier(c.tier);
      if (t === 'HOT') hot++;
      else if (t === 'WARM') warm++;
      else cold++;
    });
    return { total: companies.length, hot, warm, cold };
  }, [companies]);

  // Filtered + sorted
  const filteredCompanies = useMemo(() => {
    let result = companies;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          (c.company_name ?? '').toLowerCase().includes(q) ||
          (c.industry ?? '').toLowerCase().includes(q) ||
          (c.city ?? '').toLowerCase().includes(q) ||
          (c.primary_domain ?? '').toLowerCase().includes(q)
      );
    }

    if (tierFilter !== 'all') {
      result = result.filter((c) => fmt.tier(c.tier) === tierFilter);
    }

    if (industryFilter) {
      result = result.filter((c) => c.industry === industryFilter);
    }

    if (countryFilter) {
      result = result.filter((c) => c.country === countryFilter);
    }

    if (employeeRange) {
      result = result.filter((c) => matchesEmployeeRange(c.estimated_num_employees, employeeRange));
    }

    if (scoreRange) {
      result = result.filter((c) => matchesScoreRange(c.fit_score, scoreRange));
    }

    return sortCompanies(result, sortBy);
  }, [companies, search, tierFilter, industryFilter, countryFilter, employeeRange, scoreRange, sortBy]);

  // Has any filter active?
  const hasActiveFilters =
    search || tierFilter !== 'all' || industryFilter || countryFilter || employeeRange || scoreRange;

  function clearFilters() {
    setSearch('');
    setTierFilter('all');
    setIndustryFilter(null);
    setCountryFilter(null);
    setEmployeeRange(null);
    setScoreRange(null);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (filteredCompanies.every((c) => selected.has(c.id))) setSelected(new Set());
    else setSelected(new Set(filteredCompanies.map((c) => c.id)));
  }

  function switchView(v: 'cards' | 'table') {
    setView(v);
    const url = new URL(window.location.href);
    url.searchParams.set('view', v);
    window.history.replaceState(null, '', url.toString());
  }

  return (
    <>
      <Breadcrumbs segments={[{ label: 'Onvero Sales', href: '/sales' }, { label: 'Unternehmen' }]} />

      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          fontFamily: TOKENS.font.family,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: TOKENS.color.textPrimary,
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Unternehmen
          </h1>
          <p style={{ fontSize: 13, color: TOKENS.color.textTertiary, margin: '4px 0 0' }}>
            {loading ? 'Laden...' : `${companies.length} Unternehmen`}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* View toggle */}
          <div
            style={{
              display: 'flex',
              gap: 1,
              padding: 2,
              borderRadius: TOKENS.radius.pill,
              background: TOKENS.color.bgSubtle,
              border: `1px solid ${TOKENS.color.borderSubtle}`,
            }}
          >
            {(['cards', 'table'] as const).map((m) => (
              <button
                key={m}
                onClick={() => switchView(m)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 5,
                  border: 'none',
                  background: view === m ? TOKENS.color.indigoBgSoft : 'transparent',
                  color: view === m ? TOKENS.color.indigoLight : TOKENS.color.textTertiary,
                  fontSize: 11,
                  fontWeight: view === m ? 500 : 400,
                  cursor: 'pointer',
                  fontFamily: TOKENS.font.family,
                  transition: 'all 0.15s',
                }}
              >
                {m === 'cards' ? 'Karten' : 'Tabelle'}
              </button>
            ))}
          </div>

          {/* Primary CTA */}
          <button
            onClick={() => router.push('/sales/generate')}
            style={{
              padding: '8px 16px',
              borderRadius: TOKENS.radius.button,
              background: TOKENS.color.indigo,
              border: 'none',
              color: '#0a0a0a',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: TOKENS.font.family,
            }}
          >
            + Unternehmen finden
          </button>
        </div>
      </div>

      <StatsGrid {...stats} />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        tierFilter={tierFilter}
        onTierChange={setTierFilter}
        industryFilter={industryFilter}
        industryOptions={industryOptions}
        onIndustryChange={setIndustryFilter}
        countryFilter={countryFilter}
        countryOptions={countryOptions}
        onCountryChange={setCountryFilter}
        employeeRange={employeeRange}
        onEmployeeRangeChange={setEmployeeRange}
        scoreRange={scoreRange}
        onScoreRangeChange={setScoreRange}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* Content */}
      {loading ? (
        <SkeletonGrid />
      ) : filteredCompanies.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            title="Keine Treffer"
            subtitle="Kein Unternehmen passt zu den aktuellen Filtern."
            cta={{ label: 'Filter zurucksetzen', onClick: clearFilters }}
          />
        ) : (
          <EmptyState
            title="Noch keine Unternehmen"
            subtitle="Starte eine Suche, um potenzielle Kunden zu finden."
            cta={{ label: 'Erste Suche starten', onClick: () => router.push('/sales/generate') }}
          />
        )
      ) : view === 'cards' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 12,
          }}
        >
          {filteredCompanies.map((c) => (
            <CompanyCard key={c.id} company={c} />
          ))}
        </div>
      ) : (
        <CompanyTable
          companies={filteredCompanies}
          selected={selected}
          onToggle={toggleSelect}
          onToggleAll={toggleAll}
        />
      )}
    </>
  );
}
