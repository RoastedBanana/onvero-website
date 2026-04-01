'use client';

import { useState, useEffect } from 'react';
import AnalyticsKPICards from '@/components/analytics/AnalyticsKPICards';
import LeadEntwicklungChart from '@/components/analytics/LeadEntwicklungChart';
import ScoreVerteilungDonut from '@/components/analytics/ScoreVerteilungDonut';
import TopLeadsTable from '@/components/analytics/TopLeadsTable';
import SalesFunnel from '@/components/analytics/SalesFunnel';

const periods = ['Letzte 30 Tage', 'Letzte 7 Tage', 'Quartal'] as const;

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const [period, setPeriod] = useState<(typeof periods)[number]>('Letzte 30 Tage');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 50);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a', fontFamily: 'var(--font-dm-sans)' }}>
      <div className="mx-auto max-w-[1400px] px-6 pb-6 pt-0">
        {/* ── STICKY HEADER ── */}
        <div
          className="sticky top-0 z-20 -mx-6 flex items-center justify-between border-b border-white/5 px-6 py-4"
          style={{ background: '#0a0a0a' }}
        >
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.03em', color: '#fff' }}>Analytics</h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
              Performance &amp; KI-Scoring Übersicht
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Period Selector */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="cursor-pointer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#111',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: '7px 14px',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.55)',
                }}
              >
                {period}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 4l3 3 3-3" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              {dropdownOpen && (
                <div
                  className="absolute right-0 top-full z-30 mt-1 overflow-hidden rounded-lg"
                  style={{
                    background: '#181818',
                    border: '1px solid rgba(255,255,255,0.08)',
                    minWidth: 160,
                  }}
                >
                  {periods.map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setPeriod(p);
                        setDropdownOpen(false);
                      }}
                      className="block w-full cursor-pointer px-3 py-2 text-left text-[12px] hover:bg-white/[0.04]"
                      style={{
                        color: p === period ? '#fff' : 'rgba(255,255,255,0.45)',
                        background: 'transparent',
                        border: 'none',
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Export Button */}
            <button
              className="cursor-pointer"
              style={{
                background: 'transparent',
                color: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '7px 14px',
                fontSize: 12,
              }}
            >
              Export
            </button>

            {/* Live Dot */}
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22C55E] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22C55E]" />
              </span>
              <span className="text-[11px] font-medium" style={{ color: '#22C55E' }}>
                Live
              </span>
            </div>
          </div>
        </div>

        {/* ── KPI CARDS ── */}
        <div
          className="mt-5"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.4s ease 60ms, transform 0.4s ease 60ms',
          }}
        >
          <AnalyticsKPICards />
        </div>

        {/* ── CHARTS ROW 1 ── */}
        <div
          className="mt-4 grid grid-cols-2 gap-3"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.4s ease 160ms, transform 0.4s ease 160ms',
          }}
        >
          <LeadEntwicklungChart />
          <ScoreVerteilungDonut />
        </div>

        {/* ── CHARTS ROW 2 ── */}
        <div
          className="mt-4 grid gap-3"
          style={{
            gridTemplateColumns: '2fr 1fr',
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.4s ease 260ms, transform 0.4s ease 260ms',
          }}
        >
          <TopLeadsTable />
          <SalesFunnel />
        </div>
      </div>
    </div>
  );
}
