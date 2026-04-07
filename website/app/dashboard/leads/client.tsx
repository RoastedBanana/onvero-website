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
  const avg = leads.length > 0 ? Math.round(leads.reduce((s, l) => s + l.score, 0) / leads.length) : 0;

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
    <div className="min-h-screen" style={{ background: '#0a0a0a', fontFamily: 'var(--font-dm-sans)' }}>
      <div className="mx-auto max-w-[1400px] px-6 pb-6 pt-0">
        {/* ── STICKY HEADER ── */}
        <div className="sticky top-0 z-20 -mx-6 px-6 py-3 border-b border-white/5" style={{ background: '#0a0a0a' }}>
          {/* Row 1: Title + Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <PageHeader
              title="Leads"
              badge={{ label: 'Live', variant: 'live' }}
              subtitle={`${leads.length} Kontakte · ${hot} HOT · ${warm} WARM · ${cold} COLD`}
            />
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {/* Search */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#111',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: '6px 12px',
                  width: 200,
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Suchen..."
                  style={{
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    color: '#fff',
                    fontSize: 12,
                    width: '100%',
                  }}
                />
              </div>
              {/* Export */}
              <button
                onClick={exportCsv}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'transparent',
                  color: 'rgba(255,255,255,0.4)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: '6px 12px',
                  fontSize: 11,
                  cursor: 'pointer',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
              >
                <Download size={12} /> Export
              </button>
              {/* View toggle */}
              <div
                style={{
                  display: 'flex',
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.06)',
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => {
                    setViewMode('table');
                    localStorage.setItem('onvero_leads_view', 'table');
                  }}
                  style={{
                    padding: '5px 8px',
                    background: viewMode === 'table' ? 'rgba(255,255,255,0.08)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Tabelle"
                >
                  <List size={13} style={{ color: viewMode === 'table' ? '#fff' : 'rgba(255,255,255,0.3)' }} />
                </button>
                <button
                  onClick={() => {
                    setViewMode('board');
                    localStorage.setItem('onvero_leads_view', 'board');
                  }}
                  style={{
                    padding: '5px 8px',
                    background: viewMode === 'board' ? 'rgba(255,255,255,0.08)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Board"
                >
                  <LayoutGrid size={13} style={{ color: viewMode === 'board' ? '#fff' : 'rgba(255,255,255,0.3)' }} />
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Tabs + KPIs */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {statusTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    background: statusFilter === tab.key ? '#fff' : 'transparent',
                    color: statusFilter === tab.key ? '#0a0a0a' : 'rgba(255,255,255,0.3)',
                    border: statusFilter === tab.key ? 'none' : '1px solid rgba(255,255,255,0.06)',
                    transition: 'all 0.15s',
                  }}
                >
                  {tab.label}
                  <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.6, fontFamily: 'var(--font-dm-mono)' }}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
            {/* Compact KPIs */}
            <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
              <span style={{ color: '#FF5C2E', fontFamily: 'var(--font-dm-mono)', fontWeight: 600 }}>
                {hot} <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.2)' }}>HOT</span>
              </span>
              <span style={{ color: '#F59E0B', fontFamily: 'var(--font-dm-mono)', fontWeight: 600 }}>
                {warm} <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.2)' }}>WARM</span>
              </span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-dm-mono)' }}>Ø {avg}</span>
            </div>
          </div>
        </div>

        {/* ── ACTIVE FILTERS ── */}
        {(industryFilter || tierFilter) && (
          <div style={{ display: 'flex', gap: 6, paddingTop: 10, paddingBottom: 4 }}>
            {industryFilter && (
              <button
                onClick={() => setIndustryFilter(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.5)',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 6,
                  padding: '3px 8px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
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
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 6,
                  padding: '3px 8px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {tierFilter.toUpperCase()} <X size={10} />
              </button>
            )}
          </div>
        )}

        {/* ── CONTENT ── */}
        <div
          style={{
            paddingTop: 8,
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
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
                    height: 52,
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.03)',
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
                padding: '100px 24px',
                gap: 14,
              }}
            >
              <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
                <circle cx="24" cy="24" r="12" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
                <circle cx="24" cy="24" r="3" fill="rgba(255,255,255,0.15)" />
              </svg>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
                  Noch keine Kontakte
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', maxWidth: 260, lineHeight: 1.5 }}>
                  Beschreibe welche Kunden du suchst — die KI findet passende Kontakte automatisch.
                </div>
              </div>
              <button
                onClick={() => router.push('/dashboard/generate')}
                style={{
                  marginTop: 6,
                  padding: '8px 18px',
                  background: '#fff',
                  color: '#080808',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
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
