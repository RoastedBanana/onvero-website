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
import { GeneratorStatusBanner } from '@/components/leads/GeneratorStatusBanner';
import GenerationBanner from '@/components/leads/GenerationBanner';
import GenerationSummaryBar from '@/components/leads/GenerationSummaryBar';
import PageHeader from '@/components/ui/PageHeader';
import { HowItWorks } from '@/components/ui/how-it-works';
import { Zap, MousePointerClick, Filter } from 'lucide-react';

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
          <PageHeader
            title="Leads"
            badge={{ label: 'Live', variant: 'live' }}
            subtitle={`${leads.length} Leads · ${leads.filter((l) => l.score >= 70).length} HOT · ${leads.filter((l) => l.score >= 45 && l.score < 70).length} WARM · ${leads.filter((l) => l.score < 45).length} COLD`}
          />
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
              onClick={() => router.push('/dashboard/generate')}
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

        {/* ── TUTORIAL ── */}
        <HowItWorks
          storageKey="leads"
          title="So funktionieren Leads"
          subtitle="In 3 Schritten von der KI-Suche zum qualifizierten Kontakt"
          compact
          steps={[
            {
              icon: <Zap className="w-5 h-5 text-[#F59E0B]" />,
              title: 'Leads generieren',
              description:
                'Beschreibe deine Zielkunden — die KI sucht und findet passende B2B-Kontakte über Apollo und Google Maps.',
              benefits: [
                'Freitext-Eingabe in natürlicher Sprache',
                'KI verfeinert deine Suche automatisch',
                'Apollo + Google Maps als Datenquellen',
              ],
            },
            {
              icon: <Filter className="w-5 h-5 text-[#6B7AFF]" />,
              title: 'KI bewertet & scored',
              description:
                'Jeder Lead wird automatisch analysiert und erhält einen Score von 0-100 (COLD → WARM → HOT).',
              benefits: [
                'Score ≥70 = HOT (sofort kontaktieren)',
                'Score 45-69 = WARM (nachfassen)',
                'Personalisierte E-Mail wird generiert',
              ],
            },
            {
              icon: <MousePointerClick className="w-5 h-5 text-[#22C55E]" />,
              title: 'Kontaktieren & konvertieren',
              description:
                'Klicke auf einen Lead für alle Details, kopiere die E-Mail und ändere den Status nach Kontaktaufnahme.',
              benefits: [
                'Detailseite mit allen Infos',
                'E-Mail-Draft per Klick kopieren',
                'Status-Tracking: Neu → Kontaktiert → Qualifiziert',
              ],
            },
          ]}
        />

        {/* ── GENERATION SUMMARY ── */}
        {(() => {
          const now24h = Date.now() - 24 * 60 * 60 * 1000;
          const recent = leads.filter((l) => new Date(l.createdAt).getTime() > now24h);
          if (recent.length === 0) return null;
          const qualified = recent.filter((l) => l.score >= 60).length;
          const hot = recent.filter((l) => l.score >= 70).length;
          const avg = Math.round(recent.reduce((s, l) => s + l.score, 0) / recent.length);
          return (
            <GenerationSummaryBar
              totalLeads={recent.length}
              qualifiedLeads={qualified}
              hotLeads={hot}
              avgScore={avg}
              lastGeneratedAt={recent[0].createdAt}
            />
          );
        })()}

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
        <GenerationBanner onStartNew={() => router.push('/dashboard/generate')} />

        {/* ── HEUTE ZU TUN ── */}
        {(() => {
          const hotUntouched = leads.filter((l) => l.score >= 70 && l.status !== 'contacted').slice(0, 3);
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

        <style>{`@keyframes onvero-pulse{0%,100%{opacity:0.3}50%{opacity:0.8}}`}</style>

        {/* Skeleton loading before mount */}
        {!mounted && leads.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 56,
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.03)',
                  animation: 'onvero-pulse 1.5s ease-in-out infinite',
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        )}

        {leads.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '120px 24px',
              gap: 16,
            }}
          >
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
              <circle cx="24" cy="24" r="12" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
              <line x1="24" y1="4" x2="24" y2="44" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <line x1="4" y1="24" x2="44" y2="24" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <circle cx="24" cy="24" r="3" fill="rgba(255,255,255,0.2)" />
            </svg>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 500, color: 'rgba(255,255,255,0.8)', marginBottom: 8 }}>
                Noch keine Leads
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', maxWidth: 280, lineHeight: 1.5 }}>
                Beschreibe welche Kunden du suchst — die KI findet und bewertet passende Leads automatisch.
              </div>
            </div>
            <button
              onClick={() => router.push('/dashboard/generate')}
              style={{
                marginTop: 8,
                padding: '10px 20px',
                background: 'white',
                color: '#080808',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Erste Leads generieren →
            </button>
          </div>
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
  );
}
