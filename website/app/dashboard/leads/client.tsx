'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Lead, LeadStats } from '@/lib/leads-client';
import { mapLead, computeStats } from '@/lib/leads-client';
import LeadKPICards from '@/components/leads/LeadKPICards';
import LeadsLineChart from '@/components/leads/LeadsLineChart';
import TopBranchen from '@/components/leads/TopBranchen';
import ScoreDonut from '@/components/leads/ScoreDonut';
import ConversionFunnel from '@/components/leads/ConversionFunnel';
import LeadsTable from '@/components/leads/LeadsTable';
// LeadDetailPanel removed — leads now open as full page at /dashboard/leads/[id]
import LeadGeneratorModal from '@/components/leads/LeadGeneratorModal';
import { GeneratorStatusBanner } from '@/components/leads/GeneratorStatusBanner';
import GenerationBanner from '@/components/leads/GenerationBanner';
import PageHeader from '@/components/ui/PageHeader';

type StatusFilter = 'all' | 'new' | 'contacted' | 'qualified' | 'lost' | 'google_maps';

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
  const [modalOpen, setModalOpen] = useState(false);
  const [industryFilter, setIndustryFilter] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState<'hot' | 'warm' | 'cold' | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    // Refresh from client API to ensure all fields (google, news) are present
    // Server-side RSC serialization may strip newly added fields
    refreshLeads();
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh leads from API
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

  // Poll every 20s for new leads
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

  // Listen for banner's new-leads event for instant refresh
  useEffect(() => {
    const handler = () => {
      refreshLeads();
    };
    window.addEventListener('vero:new-leads', handler);
    return () => window.removeEventListener('vero:new-leads', handler);
  }, [refreshLeads]);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (statusFilter === 'google_maps') {
        if (l.source !== 'google_maps_apify') return false;
      } else if (statusFilter !== 'all' && l.status !== statusFilter) return false;
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

  const statusTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'Alle Leads', count: leads.length },
    { key: 'new', label: 'Neu', count: stats.byStatus.new },
    { key: 'contacted', label: 'Kontaktiert', count: stats.byStatus.contacted },
    { key: 'qualified', label: 'Qualifiziert', count: stats.byStatus.qualified },
    { key: 'lost', label: 'Verloren', count: stats.byStatus.lost },
    {
      key: 'google_maps',
      label: '📍 Google Maps',
      count: leads.filter((l) => l.source === 'google_maps_apify').length,
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a', fontFamily: 'var(--font-dm-sans)' }}>
      <div className="mx-auto max-w-[1400px] px-6 pb-6 pt-0">
        {/* ── STICKY HEADER ── */}
        <div
          className="sticky top-0 z-20 -mx-6 flex items-center justify-between border-b border-white/5 px-6 py-4"
          style={{ background: '#0a0a0a' }}
        >
          <PageHeader title="Leads" badge={{ label: 'Live', variant: 'live' }} subtitle="Lead Intelligence Dashboard" />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#111',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                padding: '7px 14px',
                width: 220,
              }}
            >
              <svg
                width="13"
                height="13"
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
            <button
              onClick={() => setModalOpen(true)}
              className="cursor-pointer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#fff',
                color: '#000',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              ⚡ Lead Generator
            </button>
            <button
              style={{
                background: 'transparent',
                color: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '7px 14px',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Filter
            </button>
          </div>
        </div>

        {/* ── STATUS TABS ── */}
        <div
          className="mb-4 flex items-center gap-2"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.4s ease 60ms, transform 0.4s ease 60ms',
          }}
        >
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className="flex cursor-pointer items-center gap-2 rounded-full text-[13px] font-medium"
              style={{
                padding: '6px 16px',
                background: statusFilter === tab.key ? '#ffffff' : 'transparent',
                color: statusFilter === tab.key ? '#0a0a0a' : 'rgba(255,255,255,0.30)',
                border: statusFilter === tab.key ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.07)',
                transition: 'all 0.2s ease',
              }}
            >
              <span
                className="rounded-[10px] px-1.5 text-[11px]"
                style={{
                  background: statusFilter === tab.key ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.06)',
                  color: statusFilter === tab.key ? '#0a0a0a' : 'rgba(255,255,255,0.55)',
                }}
              >
                {tab.count}
              </span>
              {tab.label}
            </button>
          ))}
          <div className="flex-1" />
          <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.30)' }}>
            {filtered.length} von {leads.length} Leads
          </span>
        </div>

        {/* ── GENERATOR STATUS BANNER ── */}
        <GeneratorStatusBanner currentLeadCount={leads.length} />
        <GenerationBanner onStartNew={() => setModalOpen(true)} />

        {/* ── HEUTE ZU TUN ── */}
        {(() => {
          const hotUntouched = leads.filter((l) => l.score >= 75 && l.status !== 'contacted').slice(0, 3);
          if (hotUntouched.length === 0) return null;
          return (
            <div
              style={{
                background: 'rgba(255,92,46,0.06)',
                border: '1px solid rgba(255,92,46,0.15)',
                borderRadius: 10,
                padding: '12px 16px',
                marginBottom: 12,
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.4s ease 80ms, transform 0.4s ease 80ms',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#FF5C2E',
                  marginBottom: 10,
                  fontWeight: 600,
                }}
              >
                🔥 Sofort kontaktieren — {hotUntouched.length} HOT Lead{hotUntouched.length > 1 ? 's' : ''}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {hotUntouched.map((l) => (
                  <div
                    key={l.id}
                    onClick={() => setSelectedLeadId(l.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: '#111',
                      border: '1px solid rgba(255,92,46,0.2)',
                      borderRadius: 8,
                      padding: '8px 12px',
                      cursor: 'pointer',
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,92,46,0.4)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,92,46,0.2)')}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: 'rgba(255,92,46,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 600,
                        color: '#FF5C2E',
                        fontFamily: 'var(--font-dm-mono)',
                      }}
                    >
                      {l.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#fff' }}>{l.name}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                        {l.company} · Score {l.score}
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: '#FF5C2E', marginLeft: 4, fontFamily: 'var(--font-dm-mono)' }}>
                      {l.score} HOT
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ── ACTIVE FILTER BADGE ── */}
        {(industryFilter || tierFilter) && (
          <div
            style={{ fontSize: 11, color: '#6B7AFF', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {industryFilter && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'rgba(107,122,255,0.1)',
                  padding: '3px 10px',
                  borderRadius: 6,
                }}
              >
                Branche: {industryFilter}
                <button
                  onClick={() => setIndustryFilter(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6B7AFF',
                    cursor: 'pointer',
                    fontSize: 11,
                    padding: 0,
                  }}
                >
                  ×
                </button>
              </span>
            )}
            {tierFilter && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'rgba(107,122,255,0.1)',
                  padding: '3px 10px',
                  borderRadius: 6,
                }}
              >
                Score: {tierFilter.toUpperCase()}
                <button
                  onClick={() => setTierFilter(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6B7AFF',
                    cursor: 'pointer',
                    fontSize: 11,
                    padding: 0,
                  }}
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}

        {/* ── KPI CARDS ── */}
        <div
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.4s ease 160ms, transform 0.4s ease 160ms',
          }}
        >
          <LeadKPICards
            total={stats.total}
            scored={stats.scored}
            avgScore={stats.avgScore}
            premium={stats.premium}
            withEmail={stats.withEmail}
            contacted={stats.byStatus.contacted}
            qualified={stats.byStatus.qualified}
          />
        </div>

        {/* ── LINE CHART ── */}
        <div
          className="mt-4"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.4s ease 220ms, transform 0.4s ease 220ms',
          }}
        >
          <LeadsLineChart leads={leads} activeTab={statusFilter} />
        </div>

        {/* ── BOTTOM ROW: 3 Charts ── */}
        <div
          className="mt-4 grid gap-3"
          style={{
            gridTemplateColumns: '1fr 1fr 1fr',
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.4s ease 300ms, transform 0.4s ease 300ms',
          }}
        >
          <TopBranchen
            leads={filtered}
            activeTab={statusFilter}
            activeIndustry={industryFilter}
            onIndustryClick={setIndustryFilter}
          />
          <ScoreDonut leads={filtered} activeTab={statusFilter} activeTier={tierFilter} onTierClick={setTierFilter} />
          <ConversionFunnel leads={leads} activeTab={statusFilter} />
        </div>

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
      </div>

      <LeadGeneratorModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
