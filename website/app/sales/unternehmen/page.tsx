'use client';

import { useState, useMemo, useEffect } from 'react';
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
import KanbanBoard from './_components/KanbanBoard';
import EmptyState from './_components/EmptyState';
import SkeletonGrid from './_components/SkeletonGrid';
import type { CompanyStatus } from './_types';

// ─── CSV EXPORT ─────────────────────────────────────────────────────────────

function exportCSV(companies: CompanyWithContacts[]) {
  const headers = ['Name', 'Domain', 'Branche', 'Stadt', 'Land', 'Tier', 'Score', 'Mitarbeiter', 'Status', 'Erstellt'];
  const rows = companies.map((c) => [
    c.company_name ?? '',
    fmt.domain(c.website, c.primary_domain),
    fmt.industry(c.industry),
    c.city ?? '',
    c.country ?? '',
    fmt.tier(c.tier),
    c.fit_score?.toString() ?? '',
    c.estimated_num_employees?.toString() ?? '',
    c.status ?? '',
    c.created_at ? new Date(c.created_at).toLocaleDateString('de-DE') : '',
  ]);
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `unternehmen-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── SELECTION BAR ───────────────────────────────────────────────────────────

function SelectionBar({
  count,
  onExport,
  onDelete,
  onClear,
  onSelectAll,
  allSelected,
}: {
  count: number;
  onExport: () => void;
  onDelete: () => void;
  onClear: () => void;
  onSelectAll: () => void;
  allSelected: boolean;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 28,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 500,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 14px',
        borderRadius: 12,
        background: 'rgba(15,15,20,0.96)',
        border: '1px solid rgba(107,122,255,0.25)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(107,122,255,0.1)',
        backdropFilter: 'blur(12px)',
        fontFamily: TOKENS.font.family,
        whiteSpace: 'nowrap',
        animation: 'slideUpBar 0.2s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}
    >
      <style>{`
        @keyframes slideUpBar {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      <span style={{ fontSize: 13, fontWeight: 500, color: TOKENS.color.textPrimary }}>
        {count > 0 ? `${count} ausgewählt` : 'Nichts ausgewählt'}
      </span>

      <button
        onClick={onSelectAll}
        style={{
          background: 'none',
          border: 'none',
          color: TOKENS.color.indigoLight,
          fontSize: 12,
          cursor: 'pointer',
          padding: '2px 6px',
          borderRadius: 5,
          fontFamily: TOKENS.font.family,
        }}
      >
        {allSelected ? 'Alle abwählen' : 'Alle auswählen'}
      </button>

      <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />

      <button
        onClick={onClear}
        style={{
          background: 'none',
          border: 'none',
          color: TOKENS.color.textMuted,
          fontSize: 12,
          cursor: 'pointer',
          padding: '2px 6px',
          borderRadius: 5,
          fontFamily: TOKENS.font.family,
        }}
      >
        Auswahl abbrechen
      </button>

      <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />

      <button
        onClick={onExport}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '7px 13px',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.04)',
          color: TOKENS.color.textSecondary,
          fontSize: 12.5,
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: TOKENS.font.family,
          transition: 'background 0.15s',
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
        CSV Export
      </button>

      <button
        onClick={onDelete}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '7px 13px',
          borderRadius: 8,
          border: '1px solid rgba(239,68,68,0.3)',
          background: 'rgba(239,68,68,0.08)',
          color: '#F87171',
          fontSize: 12.5,
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: TOKENS.font.family,
          transition: 'background 0.15s',
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
          <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
        </svg>
        Löschen
      </button>
    </div>
  );
}

// ─── DELETE CONFIRM MODAL ───────────────────────────────────────────────────

function DeleteConfirmModal({
  count,
  onConfirm,
  onCancel,
}: {
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <div
        onClick={onCancel}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 600,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 601,
          width: 420,
          backgroundColor: TOKENS.color.bgCard,
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 14,
          padding: '28px 28px 24px',
          fontFamily: TOKENS.font.family,
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#F87171"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <h2 style={{ fontSize: 16, fontWeight: 600, color: TOKENS.color.textPrimary, margin: '0 0 10px' }}>
          {count} {count === 1 ? 'Unternehmen' : 'Unternehmen'} wirklich löschen?
        </h2>
        <p
          style={{
            fontSize: 13,
            color: TOKENS.color.textTertiary,
            lineHeight: 1.65,
            margin: '0 0 24px',
          }}
        >
          Achtung — diese Aktion ist <strong style={{ color: TOKENS.color.textSecondary }}>nicht rückgängig</strong> zu
          machen. Die {count === 1 ? 'das ausgewählte Unternehmen wird' : `${count} ausgewählten Unternehmen werden`}{' '}
          vollständig aus dem System entfernt, inklusive aller verknüpften Kontakte, Aktivitäten und Notizen.
        </p>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              borderRadius: TOKENS.radius.button,
              border: `1px solid ${TOKENS.color.borderSubtle}`,
              background: 'transparent',
              color: TOKENS.color.textSecondary,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: TOKENS.font.family,
            }}
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 18px',
              borderRadius: TOKENS.radius.button,
              border: '1px solid rgba(239,68,68,0.5)',
              backgroundColor: 'rgba(239,68,68,0.15)',
              color: '#F87171',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: TOKENS.font.family,
            }}
          >
            Ja, endgültig löschen
          </button>
        </div>
      </div>
    </>
  );
}

// ─── FILTER LOGIC ───────────────────────────────────────────────────────────

// estimated_num_employees is often null — parse a representative number from
// the free-text company_size string (e.g. "Mittelstand (80–150 Mitarbeiter)" → 115)
function resolveEmployeeCount(count: number | null, sizeStr: string | null): number | null {
  if (count !== null) return count;
  if (!sizeStr) return null;
  const rangeMatch = sizeStr.match(/(\d+)[–\-](\d+)/);
  if (rangeMatch) return Math.round((parseInt(rangeMatch[1]) + parseInt(rangeMatch[2])) / 2);
  const singleMatch = sizeStr.match(/(\d{2,})/);
  if (singleMatch) return parseInt(singleMatch[1]);
  const s = sizeStr.toLowerCase();
  if (s.includes('micro') || s.includes('startup')) return 5;
  if (s.includes('klein')) return 20;
  if (s.includes('mittelstand') || s.includes('mittelständ') || s.includes('kmu')) return 100;
  if (s.includes('groß') || s.includes('konzern')) return 500;
  return null;
}

function matchesEmployeeRange(count: number | null, sizeStr: string | null, range: EmployeeRange): boolean {
  if (!range) return true;
  const n = resolveEmployeeCount(count, sizeStr);
  if (n === null) return false;
  if (range === '<10') return n < 10;
  if (range === '10-50') return n >= 10 && n < 50;
  if (range === '50-200') return n >= 50 && n < 200;
  if (range === '200+') return n >= 200;
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
  const { companies, loading, loadingMore, refetch, updateStatus, deleteCompanies } = useCompanies();

  // View state — start with URL param or default ('cards') for SSR consistency.
  // LocalStorage is applied in a useEffect after mount to avoid hydration mismatch.
  const [view, setView] = useState<'cards' | 'table' | 'kanban'>(() => {
    if (viewParam === 'table' || viewParam === 'kanban' || viewParam === 'cards') return viewParam;
    return 'cards';
  });

  // Hydrate saved view from localStorage after mount (only if URL didn't specify one)
  useEffect(() => {
    if (viewParam === 'table' || viewParam === 'kanban' || viewParam === 'cards') return;
    try {
      const saved = localStorage.getItem('unternehmen-v2-view');
      if (saved === 'table' || saved === 'kanban' || saved === 'cards') setView(saved);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter state
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | TierKey>('all');
  const [industryFilter, setIndustryFilter] = useState<string | null>(null);
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const [employeeRange, setEmployeeRange] = useState<EmployeeRange>(null);
  const [scoreRange, setScoreRange] = useState<ScoreRange>(null);
  const [sortBy, setSortBy] = useState<SortBy>('score_desc');

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Derived options for dropdowns (formatted German labels, deduplicated)
  const industryOptions = useMemo(() => {
    const set = new Set<string>();
    companies.forEach((c) => {
      const label = fmt.industry(c.industry);
      if (label) set.add(label);
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
      result = result.filter((c) => fmt.industry(c.industry) === industryFilter);
    }

    if (countryFilter) {
      result = result.filter((c) => c.country === countryFilter);
    }

    if (employeeRange) {
      result = result.filter((c) => matchesEmployeeRange(c.estimated_num_employees, null, employeeRange));
    }

    if (scoreRange) {
      result = result.filter((c) => matchesScoreRange(c.fit_score, scoreRange));
    }

    return sortCompanies(result, sortBy);
  }, [companies, search, tierFilter, industryFilter, countryFilter, employeeRange, scoreRange, sortBy]);

  // Persist nav IDs for prev/next in detail page
  useEffect(() => {
    sessionStorage.setItem('unternehmen-v2-nav-ids', JSON.stringify(filteredCompanies.map((c) => c.id)));
  }, [filteredCompanies]);

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
    setSelectionMode(true);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  useEffect(() => {
    if (selectionMode && selected.size === 0) setSelectionMode(false);
  }, [selected, selectionMode]);

  function toggleAll() {
    if (filteredCompanies.every((c) => selected.has(c.id))) setSelected(new Set());
    else setSelected(new Set(filteredCompanies.map((c) => c.id)));
  }

  function handleDelete() {
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    const ids = Array.from(selected);
    await deleteCompanies(ids);
    setSelected(new Set());
    setSelectionMode(false);
    setShowDeleteModal(false);
  }

  function exitSelectionMode() {
    setSelected(new Set());
    setSelectionMode(false);
  }

  function handleExport() {
    const toExport = filteredCompanies.filter((c) => selected.has(c.id));
    exportCSV(toExport);
  }

  function switchView(v: 'cards' | 'table' | 'kanban') {
    setView(v);
    localStorage.setItem('unternehmen-v2-view', v);
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
          <p
            style={{
              fontSize: 13,
              color: TOKENS.color.textTertiary,
              margin: '4px 0 0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {loading ? (
              'Laden...'
            ) : (
              <>
                <span>{companies.length} Unternehmen</span>
                {loadingMore && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: 'rgba(99,102,241,0.12)',
                      border: '1px solid rgba(99,102,241,0.22)',
                      color: '#A5B4FC',
                      fontSize: 10.5,
                      fontWeight: 500,
                      letterSpacing: '0.02em',
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        border: '1.5px solid rgba(165,180,252,0.25)',
                        borderTopColor: '#A5B4FC',
                        animation: 'spinLoader 0.8s linear infinite',
                        display: 'inline-block',
                      }}
                    />
                    lädt weitere…
                  </span>
                )}
              </>
            )}
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
            {(['cards', 'table', 'kanban'] as const).map((m) => (
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
                {m === 'cards' ? 'Karten' : m === 'table' ? 'Tabelle' : 'Kanban'}
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
        tierCounts={{ hot: stats.hot, warm: stats.warm, cold: stats.cold }}
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
        selectionMode={selectionMode}
        onToggleSelectionMode={() => (selectionMode ? exitSelectionMode() : setSelectionMode(true))}
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
            <CompanyCard
              key={c.id}
              company={c}
              selected={selected.has(c.id)}
              onToggle={() => toggleSelect(c.id)}
              selectionMode={selectionMode}
            />
          ))}
        </div>
      ) : view === 'table' ? (
        <CompanyTable
          companies={filteredCompanies}
          selected={selected}
          onToggle={toggleSelect}
          onToggleAll={toggleAll}
        />
      ) : (
        <KanbanBoard
          companies={filteredCompanies}
          onStatusChange={updateStatus}
          selected={selected}
          onToggle={toggleSelect}
          selectionMode={selectionMode}
        />
      )}

      {selectionMode && (
        <SelectionBar
          count={selected.size}
          onExport={handleExport}
          onDelete={handleDelete}
          onClear={exitSelectionMode}
          onSelectAll={toggleAll}
          allSelected={filteredCompanies.length > 0 && filteredCompanies.every((c) => selected.has(c.id))}
        />
      )}

      {showDeleteModal && (
        <DeleteConfirmModal
          count={selected.size}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </>
  );
}
