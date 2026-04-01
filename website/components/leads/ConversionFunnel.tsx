'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Lead } from '@/lib/leads-client';

interface ConversionFunnelProps {
  leads: Lead[];
  activeTab: string;
}

interface FunnelRow {
  label: string;
  value: number;
  pct: number;
  color: string;
}

export default function ConversionFunnel({ leads, activeTab }: ConversionFunnelProps) {
  const [barsReady, setBarsReady] = useState(false);

  useEffect(() => {
    setBarsReady(false);
    const t = setTimeout(() => setBarsReady(true), 80);
    return () => clearTimeout(t);
  }, [activeTab, leads.length]);

  const { title, rows, conversionRate } = useMemo(() => {
    const total = leads.length;

    if (activeTab === 'new') {
      const tabLeads = leads.filter((l) => l.status === 'new');
      const t = tabLeads.length;
      const hot = tabLeads.filter((l) => l.score >= 75).length;
      const warm = tabLeads.filter((l) => l.score >= 45 && l.score < 75).length;
      const cold = tabLeads.filter((l) => l.score < 45).length;
      const withDraft = tabLeads.filter((l) => l.emailDraft).length;
      return {
        title: 'Neu — Score-Analyse',
        conversionRate: null,
        rows: [
          { label: 'HOT (≥75)', value: hot, pct: t > 0 ? (hot / t) * 100 : 0, color: '#FF5C2E' },
          { label: 'WARM (45-74)', value: warm, pct: t > 0 ? (warm / t) * 100 : 0, color: '#F59E0B' },
          { label: 'COLD (<45)', value: cold, pct: t > 0 ? (cold / t) * 100 : 0, color: '#6B7AFF' },
          { label: 'Mit E-Mail', value: withDraft, pct: t > 0 ? (withDraft / t) * 100 : 0, color: '#22C55E' },
        ],
      };
    }

    if (activeTab === 'contacted') {
      const contacted = leads.filter((l) => l.status === 'contacted').length;
      const qualified = leads.filter((l) => l.status === 'qualified').length;
      return {
        title: 'Kontaktiert — Status',
        conversionRate: null,
        rows: [
          { label: 'Kontaktiert', value: contacted, pct: total > 0 ? (contacted / total) * 100 : 0, color: '#F59E0B' },
          { label: 'Qualifiziert', value: qualified, pct: total > 0 ? (qualified / total) * 100 : 0, color: '#22C55E' },
        ],
      };
    }

    if (activeTab === 'qualified') {
      const qual = leads.filter((l) => l.status === 'qualified');
      const qLen = qual.length;
      const hotQ = qual.filter((l) => l.score >= 75).length;
      const avgS = qLen > 0 ? Math.round(qual.reduce((s, l) => s + l.score, 0) / qLen) : 0;
      return {
        title: 'Qualifiziert — Übersicht',
        conversionRate: null,
        rows: [
          { label: 'Qualifiziert', value: qLen, pct: total > 0 ? (qLen / total) * 100 : 0, color: '#22C55E' },
          { label: 'Davon HOT', value: hotQ, pct: qLen > 0 ? (hotQ / qLen) * 100 : 0, color: '#FF5C2E' },
          { label: 'Ø Score', value: avgS, pct: avgS, color: '#22C55E' },
        ],
      };
    }

    if (activeTab === 'lost') {
      const lostLeads = leads.filter((l) => l.status === 'lost');
      const lLen = lostLeads.length;
      const coldL = lostLeads.filter((l) => l.score < 45).length;
      return {
        title: 'Verloren — Analyse',
        conversionRate: null,
        rows: [
          {
            label: 'Verloren',
            value: lLen,
            pct: total > 0 ? (lLen / total) * 100 : 0,
            color: 'rgba(255,255,255,0.25)',
          },
          { label: 'Davon COLD', value: coldL, pct: lLen > 0 ? (coldL / lLen) * 100 : 0, color: '#6B7AFF' },
        ],
      };
    }

    // Default: all — pipeline
    const scored = leads.filter((l) => l.score > 0).length;
    const withEmail = leads.filter((l) => l.email).length;
    const contacted = leads.filter((l) => l.status === 'contacted' || l.status === 'qualified').length;
    const qualified = leads.filter((l) => l.status === 'qualified').length;
    const rate = total > 0 ? ((qualified / total) * 100).toFixed(1) : '0';
    return {
      title: 'Conversion Funnel',
      conversionRate: rate,
      rows: [
        { label: 'Generiert', value: total, pct: 100, color: '#6B7AFF' },
        { label: 'Gescored', value: scored, pct: total > 0 ? (scored / total) * 100 : 0, color: '#6B7AFF' },
        { label: 'Mit E-Mail', value: withEmail, pct: total > 0 ? (withEmail / total) * 100 : 0, color: '#A78BFA' },
        { label: 'Kontaktiert', value: contacted, pct: total > 0 ? (contacted / total) * 100 : 0, color: '#F59E0B' },
        { label: 'Qualifiziert', value: qualified, pct: total > 0 ? (qualified / total) * 100 : 0, color: '#22C55E' },
      ],
    };
  }, [leads, activeTab]);

  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#111111] p-4 px-5">
      <div style={{ fontSize: 12, fontWeight: 500, color: '#fff', marginBottom: 14 }}>{title}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rows.map((row, i) => (
          <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', width: 80, flexShrink: 0 }}>{row.label}</div>
            <div
              style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}
            >
              <div
                style={{
                  height: '100%',
                  width: barsReady ? `${Math.max(row.pct, row.value > 0 ? 2 : 0)}%` : '0%',
                  background: `linear-gradient(90deg, ${row.color}, ${row.color}aa)`,
                  borderRadius: 4,
                  transition: `width 1s cubic-bezier(0.34, 1.56, 0.64, 1)`,
                  transitionDelay: `${i * 100}ms`,
                  boxShadow: row.pct > 10 ? `0 0 10px ${row.color}44` : 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, width: 60, justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: row.color, fontFamily: 'var(--font-dm-mono)' }}>
                {row.value}
              </span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-dm-mono)' }}>
                {Math.round(row.pct)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {activeTab === 'all' && conversionRate && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Gesamt-Conversion</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#22C55E', fontFamily: 'var(--font-dm-mono)' }}>
            {conversionRate}%
          </span>
        </div>
      )}

      {rows.length === 0 && (
        <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
          Keine Daten
        </div>
      )}
    </div>
  );
}
