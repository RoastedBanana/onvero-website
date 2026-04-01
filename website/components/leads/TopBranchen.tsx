'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Lead } from '@/lib/leads-client';

const TITLES: Record<string, string> = {
  all: 'Top Branchen',
  new: 'Branchen — Neue Leads',
  contacted: 'Branchen — Kontaktiert',
  qualified: 'Branchen — Qualifiziert',
  lost: 'Branchen — Verloren',
};

const BAR_COLORS: Record<string, string> = {
  all: '#6B7AFF',
  new: '#6B7AFF',
  contacted: '#F59E0B',
  qualified: '#22C55E',
  lost: 'rgba(255,255,255,0.25)',
};

interface TopBranchenProps {
  leads: Lead[];
  activeTab: string;
  activeIndustry?: string | null;
  onIndustryClick?: (name: string | null) => void;
}

export default function TopBranchen({ leads, activeTab, activeIndustry, onIndustryClick }: TopBranchenProps) {
  const [barsReady, setBarsReady] = useState(false);

  useEffect(() => {
    setBarsReady(false);
    const t = setTimeout(() => setBarsReady(true), 50);
    return () => clearTimeout(t);
  }, [activeTab, leads]);

  const data = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const l of leads) {
      const ind = l.industry ?? 'Sonstige';
      acc[ind] = (acc[ind] || 0) + 1;
    }
    return Object.entries(acc)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 7)
      .map(([name, count]) => ({ name, count }));
  }, [leads]);

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const barColor = BAR_COLORS[activeTab] ?? '#6B7AFF';
  const title = TITLES[activeTab] ?? TITLES.all;
  const uniqueIndustries = data.length;

  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#111111] p-4 px-5">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#fff' }}>{title}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
            {leads.length} Leads · {uniqueIndustries} Branchen
          </div>
        </div>
        {activeIndustry && (
          <button
            onClick={() => onIndustryClick?.(null)}
            style={{
              fontSize: 10,
              color: barColor,
              background: `${barColor}15`,
              border: `1px solid ${barColor}33`,
              borderRadius: 20,
              padding: '3px 10px',
              cursor: 'pointer',
            }}
          >
            × Filter
          </button>
        )}
      </div>

      {/* Rows */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {data.map((item, i) => {
          const pct = Math.round((item.count / maxCount) * 100);
          const isActive = activeIndustry === item.name;
          return (
            <div
              key={item.name}
              onClick={() => onIndustryClick?.(isActive ? null : item.name)}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 8,
                padding: '10px 8px',
                margin: '0 -8px',
                borderBottom: i < data.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                cursor: onIndustryClick ? 'pointer' : 'default',
                borderRadius: 6,
                transition: 'background 0.15s',
                background: isActive ? 'rgba(107,122,255,0.08)' : 'transparent',
                opacity: activeIndustry && !isActive ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isActive ? 'rgba(107,122,255,0.08)' : 'transparent';
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span
                    style={{
                      fontSize: 12,
                      color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                      fontWeight: isActive ? 500 : 400,
                    }}
                  >
                    {item.name}
                  </span>
                  <span style={{ fontSize: 11, color: barColor, fontFamily: 'var(--font-dm-mono)', fontWeight: 600 }}>
                    {item.count}
                  </span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: barsReady ? `${pct}%` : '0%',
                      background: isActive ? barColor : `linear-gradient(90deg, ${barColor}99, ${barColor}44)`,
                      borderRadius: 2,
                      transition: `width 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)`,
                      transitionDelay: `${i * 80}ms`,
                      boxShadow: isActive ? `0 0 8px ${barColor}66` : 'none',
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.25)',
                  fontFamily: 'var(--font-dm-mono)',
                  alignSelf: 'center',
                  minWidth: 32,
                  textAlign: 'right',
                }}
              >
                {pct}%
              </div>
            </div>
          );
        })}
        {data.length === 0 && (
          <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
            Keine Daten
          </div>
        )}
      </div>
    </div>
  );
}
