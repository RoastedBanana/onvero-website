'use client';

import { useState, useMemo } from 'react';
import { mockLeads, mockStats } from '@/lib/mock-leads';
import LeadKPICards from '@/components/leads/LeadKPICards';
import LeadsLineChart from '@/components/leads/LeadsLineChart';
import TopBranchen from '@/components/leads/TopBranchen';
import ScoreDonut from '@/components/leads/ScoreDonut';
import ConversionFunnel from '@/components/leads/ConversionFunnel';
import LeadsTable from '@/components/leads/LeadsTable';
import LeadDetailPanel from '@/components/leads/LeadDetailPanel';

type StatusFilter = 'alle' | 'neu' | 'kontaktiert' | 'qualifiziert' | 'verloren';

export default function LeadsDashboardPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('alle');
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  useState(() => {
    setTimeout(() => setMounted(true), 50);
  });

  const leads = mockLeads;
  const stats = mockStats;

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (statusFilter !== 'alle' && l.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return l.name.toLowerCase().includes(q) || l.company.toLowerCase().includes(q);
      }
      return true;
    });
  }, [leads, statusFilter, search]);

  const statusTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'alle', label: 'Alle Leads', count: leads.length },
    { key: 'neu', label: 'Neu', count: stats.byStatus.neu },
    { key: 'kontaktiert', label: 'Kontaktiert', count: stats.byStatus.kontaktiert },
    { key: 'qualifiziert', label: 'Qualifiziert', count: stats.byStatus.qualifiziert },
    { key: 'verloren', label: 'Verloren', count: stats.byStatus.verloren },
  ];

  // Top industries from leads
  const topIndustries = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const l of leads) acc[l.industry] = (acc[l.industry] || 0) + 1;
    return Object.entries(acc)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 7)
      .map(([name, count]) => ({ name, count }));
  }, [leads]);

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a', fontFamily: 'var(--font-dm-sans)' }}>
      <div className="max-w-[1400px] mx-auto px-6 pt-0 pb-6">
        {/* ── STICKY HEADER ── */}
        <div
          className="sticky top-0 z-20 flex items-center justify-between py-4 border-b border-white/5 -mx-6 px-6"
          style={{ background: '#0a0a0a' }}
        >
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.03em', color: '#fff' }}>Leads</h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Lead Intelligence Dashboard</p>
          </div>
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
                cursor: 'pointer',
              }}
            >
              Lead Generator
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
          className="flex items-center gap-2 mb-4"
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
              className="flex items-center gap-2 rounded-full text-[13px] font-medium cursor-pointer"
              style={{
                padding: '6px 16px',
                background: statusFilter === tab.key ? '#ffffff' : 'transparent',
                color: statusFilter === tab.key ? '#0a0a0a' : 'rgba(255,255,255,0.30)',
                border: statusFilter === tab.key ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.07)',
                transition: 'all 0.2s ease',
              }}
            >
              <span
                className="text-[11px] rounded-[10px] px-1.5"
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

        {/* ── STATUS SUMMARY BAR ── */}
        <div
          className="grid grid-cols-4 mb-5 rounded-lg overflow-hidden"
          style={{
            border: '1px solid rgba(255,255,255,0.07)',
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.4s ease 100ms, transform 0.4s ease 100ms',
          }}
        >
          {[
            { label: 'Neu', count: stats.byStatus.neu },
            { label: 'Kontaktiert', count: stats.byStatus.kontaktiert },
            { label: 'Qualifiziert', count: stats.byStatus.qualifiziert },
            { label: 'Verloren', count: stats.byStatus.verloren },
          ].map((s, i) => (
            <div
              key={s.label}
              className="py-3 px-4"
              style={{
                background: '#111111',
                borderRight: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none',
              }}
            >
              <div className="text-[11px] mb-1" style={{ color: 'rgba(255,255,255,0.30)' }}>
                {s.label}
              </div>
              <div className="text-[20px] font-bold" style={{ color: '#ffffff', fontFamily: 'var(--font-dm-mono)' }}>
                {s.count}
              </div>
            </div>
          ))}
        </div>

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
            contacted={stats.byStatus.kontaktiert}
            qualified={stats.byStatus.qualifiziert}
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
          <LeadsLineChart data={stats.leadsByDay} total={stats.total} />
        </div>

        {/* ── BOTTOM ROW: 3 Charts ── */}
        <div
          className="grid gap-3 mt-4"
          style={{
            gridTemplateColumns: '1fr 1fr 1fr',
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.4s ease 300ms, transform 0.4s ease 300ms',
          }}
        >
          <TopBranchen data={topIndustries} />
          <ScoreDonut premium={stats.premium} warm={stats.warm} cold={stats.cold} avgScore={stats.avgScore} />
          <ConversionFunnel
            total={stats.total}
            scored={stats.scored}
            withEmail={stats.withEmail}
            contacted={stats.byStatus.kontaktiert}
            qualified={stats.byStatus.qualifiziert}
          />
        </div>

        <LeadsTable selectedId={selectedLeadId} onSelect={setSelectedLeadId} />
      </div>

      <LeadDetailPanel
        lead={mockLeads.find((l) => l.id === selectedLeadId) ?? null}
        onClose={() => setSelectedLeadId(null)}
      />
    </div>
  );
}
