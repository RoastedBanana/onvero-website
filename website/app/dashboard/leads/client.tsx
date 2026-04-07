'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Lead, LeadStats } from '@/lib/leads-client';
import { mapLead, computeStats } from '@/lib/leads-client';
import LeadsTable from '@/components/leads/LeadsTable';
import PageHeader from '@/components/ui/PageHeader';
import { LayoutGrid, List, Download, X } from 'lucide-react';
import KanbanBoard from '@/components/leads/KanbanBoard';
import LeadCompare from '@/components/leads/LeadCompare';

type StatusFilter = 'all' | 'new' | 'contacted' | 'qualified' | 'lost';

interface Props {
  leads: Lead[];
  stats: LeadStats;
}

export function LeadsDashboardClient({ leads: initialLeads, stats: initialStats }: Props) {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [stats, setStats] = useState<LeadStats>(initialStats);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [industryFilter, setIndustryFilter] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState<'hot' | 'warm' | 'cold' | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'board'>(() => {
    if (typeof window === 'undefined') return 'table';
    return (localStorage.getItem('onvero_leads_view') as 'table' | 'board') ?? 'table';
  });
  const [compareLeads, setCompareLeads] = useState<Lead[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    refreshLeads();
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/leads');
      if (!res.ok) return;
      const { leads: raw } = await res.json();
      const mapped = (raw as Record<string, unknown>[]).map(mapLead);
      setLeads(mapped);
      setStats(computeStats(mapped));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/leads/count');
        if (!res.ok) return;
        const { count } = await res.json();
        if (count > leads.length) refreshLeads();
      } catch {
        /* ignore */
      }
    };
    const t = setInterval(poll, 20000);
    return () => clearInterval(t);
  }, [leads.length, refreshLeads]);

  useEffect(() => {
    const handler = () => refreshLeads();
    window.addEventListener('vero:new-leads', handler);
    return () => window.removeEventListener('vero:new-leads', handler);
  }, [refreshLeads]);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (industryFilter && l.industry !== industryFilter) return false;
      if (tierFilter === 'hot' && l.score < 70) return false;
      if (tierFilter === 'warm' && (l.score < 45 || l.score >= 70)) return false;
      if (tierFilter === 'cold' && l.score >= 45) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          l.name.toLowerCase().includes(q) || l.company.toLowerCase().includes(q) || l.email.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [leads, statusFilter, industryFilter, tierFilter, search]);

  const hot = leads.filter((l) => l.score >= 70).length;
  const warm = leads.filter((l) => l.score >= 45 && l.score < 70).length;
  const cold = leads.filter((l) => l.score < 45).length;

  const statusTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'Alle', count: leads.length },
    { key: 'new', label: 'Neu', count: stats.byStatus.new },
    { key: 'contacted', label: 'Kontaktiert', count: stats.byStatus.contacted },
    { key: 'qualified', label: 'Qualifiziert', count: stats.byStatus.qualified },
    { key: 'lost', label: 'Verloren', count: stats.byStatus.lost },
  ];

  const exportCsv = () => {
    const headers = ['Firma', 'Name', 'E-Mail', 'Score', 'Status', 'Branche', 'Stadt', 'Quelle', 'Erstellt'];
    const rows = filtered.map((l) => [
      l.company,
      l.name,
      l.email,
      String(l.score),
      l.status,
      l.industry ?? '',
      l.city ?? '',
      l.source ?? '',
      new Date(l.createdAt).toLocaleDateString('de-DE'),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `onvero-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen" style={{ background: '#050505', fontFamily: 'var(--font-dm-sans)' }}>
      <div className="mx-auto max-w-[1400px] px-6 pb-6 pt-0">
        {/* -- STICKY HEADER -- Premium Command Bar -- */}
        <div
          className="sticky top-0 z-20 -mx-6 px-6"
          style={{
            background: 'rgba(5,5,5,0.8)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            paddingTop: 16,
            paddingBottom: 14,
          }}
        >
          {/* Row 1: Title + Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#e8e8e8',
                  letterSpacing: '-0.03em',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                Leads
              </h1>
              <p
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.25)',
                  margin: 0,
                  marginTop: 2,
                }}
              >
                {leads.length} Kontakte
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {/* Search -- Command style */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${searchFocused ? 'rgba(107,122,255,0.15)' : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: 12,
                  padding: '0 14px',
                  height: 34,
                  width: 220,
                  transition: 'border-color 0.2s ease',
                  boxShadow: searchFocused ? '0 0 0 1px rgba(107,122,255,0.15)' : 'none',
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Suchen..."
                  style={{
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    color: '#e8e8e8',
                    fontSize: 12,
                    width: '100%',
                  }}
                />
              </div>
              {/* Export -- ghost */}
              <button
                onClick={exportCsv}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.3)',
                  border: 'none',
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontSize: 11,
                  cursor: 'pointer',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
              >
                <Download size={12} /> Export
              </button>
              {/* View toggle -- Segmented */}
              <div
                style={{
                  display: 'flex',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 12,
                  padding: 3,
                  gap: 2,
                }}
              >
                <button
                  onClick={() => {
                    setViewMode('table');
                    localStorage.setItem('onvero_leads_view', 'table');
                  }}
                  style={{
                    padding: '5px 10px',
                    background: viewMode === 'table' ? 'rgba(255,255,255,0.08)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: 8,
                    transition: 'all 0.2s ease',
                    boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                  }}
                  title="Tabelle"
                >
                  <List size={13} style={{ color: viewMode === 'table' ? '#e8e8e8' : 'rgba(255,255,255,0.35)' }} />
                </button>
                <button
                  onClick={() => {
                    setViewMode('board');
                    localStorage.setItem('onvero_leads_view', 'board');
                  }}
                  style={{
                    padding: '5px 10px',
                    background: viewMode === 'board' ? 'rgba(255,255,255,0.08)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: 8,
                    transition: 'all 0.2s ease',
                    boxShadow: viewMode === 'board' ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                  }}
                  title="Board"
                >
                  <LayoutGrid
                    size={13}
                    style={{ color: viewMode === 'board' ? '#e8e8e8' : 'rgba(255,255,255,0.35)' }}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Tabs -- Pill Segments */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                gap: 2,
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 12,
                padding: 4,
              }}
            >
              {statusTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    background: statusFilter === tab.key ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: statusFilter === tab.key ? '#e8e8e8' : 'rgba(255,255,255,0.35)',
                    border: 'none',
                    transition: 'all 0.2s cubic-bezier(0.32,0.72,0,1)',
                    boxShadow: statusFilter === tab.key ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                  }}
                >
                  {tab.label}
                  <span
                    style={{
                      marginLeft: 6,
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.2)',
                      fontFamily: 'var(--font-dm-mono)',
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* -- ACTIVE FILTERS -- */}
        {(industryFilter || tierFilter) && (
          <div style={{ display: 'flex', gap: 6, paddingTop: 12, paddingBottom: 4 }}>
            {industryFilter && (
              <button
                onClick={() => setIndustryFilter(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.5)',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 8,
                  padding: '4px 10px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease',
                }}
              >
                {industryFilter} <X size={10} />
              </button>
            )}
            {tierFilter && (
              <button
                onClick={() => setTierFilter(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  color: tierFilter === 'hot' ? '#FF5C2E' : tierFilter === 'warm' ? '#F59E0B' : '#6B7AFF',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 8,
                  padding: '4px 10px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease',
                }}
              >
                {tierFilter.toUpperCase()} <X size={10} />
              </button>
            )}
          </div>
        )}

        {/* -- CONTENT -- */}
        <div
          style={{
            paddingTop: 12,
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.5s cubic-bezier(0.32,0.72,0,1), transform 0.5s cubic-bezier(0.32,0.72,0,1)',
          }}
        >
          <style>{`@keyframes onvero-pulse{0%,100%{opacity:0.3}50%{opacity:0.8}}`}</style>

          {/* Skeleton */}
          {!mounted && leads.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 56,
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.02)',
                    animation: 'onvero-pulse 1.5s ease-in-out infinite',
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Empty */}
          {leads.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '120px 24px',
                gap: 20,
              }}
            >
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <circle cx="32" cy="32" r="18" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                <circle cx="32" cy="32" r="8" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                <circle cx="32" cy="32" r="2.5" fill="rgba(107,122,255,0.4)" />
              </svg>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#e8e8e8', marginBottom: 8 }}>
                  Noch keine Kontakte
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', maxWidth: 280, lineHeight: 1.6 }}>
                  Beschreibe welche Kunden du suchst — die KI findet passende Kontakte automatisch.
                </div>
              </div>
              <button
                onClick={() => router.push('/dashboard/generate')}
                style={{
                  marginTop: 4,
                  padding: '0 24px',
                  height: 44,
                  background: '#6B7AFF',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                Erste Kontakte generieren
              </button>
            </div>
          ) : viewMode === 'board' ? (
            <KanbanBoard
              leads={filtered}
              onStatusChange={(id, status) => {
                setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
                setStats(computeStats(leads.map((l) => (l.id === id ? { ...l, status } : l))));
              }}
              onLeadDeleted={(id) => {
                const remaining = leads.filter((l) => l.id !== id);
                setLeads(remaining);
                setStats(computeStats(remaining));
              }}
            />
          ) : (
            <LeadsTable
              leads={filtered}
              selectedId={selectedLeadId}
              onSelect={(id) => {
                if (id) router.push(`/dashboard/leads/${id}`);
              }}
              onStatusChange={(id, status) => {
                setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
                setStats(computeStats(leads.map((l) => (l.id === id ? { ...l, status } : l))));
              }}
              onLeadsDeleted={(ids) => {
                const remaining = leads.filter((l) => !ids.includes(l.id));
                setLeads(remaining);
                setStats(computeStats(remaining));
                setSelectedLeadId(null);
              }}
            />
          )}
        </div>
      </div>

      {/* Compare Modal */}
      <LeadCompare isOpen={compareOpen} onClose={() => setCompareOpen(false)} leads={compareLeads} />
    </div>
  );
}
