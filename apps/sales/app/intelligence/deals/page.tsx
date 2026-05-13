'use client';

import { useState } from 'react';

type ExportStatus = 'aktiv' | 'wartend' | 'gewonnen' | 'verloren';

interface ActiveLead {
  id: string;
  name: string;
  city: string;
  industry: string;
  contact: string;
  contactRole: string;
  initials: string;
  color: string;
  score: number;
  exportedAt: string;
  status: ExportStatus;
  dealValue: string;
  lastUpdate: string;
  note?: string;
}

const STATUS_META: Record<ExportStatus, { label: string; color: string; bg: string; border: string }> = {
  aktiv: { label: 'In Bearbeitung', color: '#0891B2', bg: '#EFF6FF', border: '#BFDBFE' },
  wartend: { label: 'Wartend', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  gewonnen: { label: 'Gewonnen', color: '#059669', bg: '#F0FDF4', border: '#BBF7D0' },
  verloren: { label: 'Verloren', color: '#64748B', bg: '#F1F5F9', border: '#CBD5E1' },
};

const LEADS: ActiveLead[] = [
  {
    id: '1',
    name: 'Fashion House GmbH',
    city: 'München',
    industry: 'Mode & E-Commerce',
    contact: 'Maximilian Brauer',
    contactRole: 'Head of Logistics',
    initials: 'FH',
    color: '#4F46E5',
    score: 91,
    exportedAt: '29.04.2026',
    status: 'aktiv',
    dealValue: '€ 86.400',
    lastUpdate: 'heute',
    note: 'CFO-Termin 05.05. bestätigt. Demo lief sehr positiv.',
  },
  {
    id: '2',
    name: 'LuxuryBags Store',
    city: 'Düsseldorf',
    industry: 'Luxus & Mode',
    contact: 'Thomas Krüger',
    contactRole: 'COO',
    initials: 'LB',
    color: '#7C3AED',
    score: 88,
    exportedAt: '27.04.2026',
    status: 'wartend',
    dealValue: '€ 64.800',
    lastUpdate: 'vor 3 Tagen',
    note: 'Angebot versendet. Wartet auf interne Freigabe.',
  },
  {
    id: '3',
    name: 'SportGear Online',
    city: 'Hamburg',
    industry: 'Sport & Outdoor',
    contact: 'Sophie Richter',
    contactRole: 'CEO',
    initials: 'SG',
    color: '#0891B2',
    score: 85,
    exportedAt: '28.04.2026',
    status: 'aktiv',
    dealValue: '€ 43.200',
    lastUpdate: 'gestern',
  },
  {
    id: '4',
    name: 'GardenPlus GmbH',
    city: 'Leipzig',
    industry: 'Garten & Outdoor',
    contact: 'Anna Hofmann',
    contactRole: 'E-Commerce Managerin',
    initials: 'GP',
    color: '#059669',
    score: 81,
    exportedAt: '25.04.2026',
    status: 'wartend',
    dealValue: '€ 28.800',
    lastUpdate: 'vor 5 Tagen',
    note: 'GF-Freigabe ausstehend.',
  },
  {
    id: '5',
    name: 'BikeShop Nord',
    city: 'Bremen',
    industry: 'Fahrrad & Sport',
    contact: 'Lukas Bauer',
    contactRole: 'Geschäftsführer',
    initials: 'BN',
    color: '#059669',
    score: 76,
    exportedAt: '20.04.2026',
    status: 'gewonnen',
    dealValue: '€ 21.600',
    lastUpdate: 'vor 1 Woche',
    note: 'Vertrag unterschrieben. Onboarding 08.05.',
  },
  {
    id: '6',
    name: 'TechDirect GmbH',
    city: 'Berlin',
    industry: 'Elektronik',
    contact: 'Michael Wolff',
    contactRole: 'Head of Supply Chain',
    initials: 'TD',
    color: '#64748B',
    score: 79,
    exportedAt: '15.04.2026',
    status: 'verloren',
    dealValue: '—',
    lastUpdate: 'vor 2 Wochen',
    note: 'DHL Eigenentwicklung. Re-Engagement Oktober 2026.',
  },
];

function scoreColor(s: number) {
  if (s >= 80) return '#DC2626';
  if (s >= 65) return '#D97706';
  return '#64748B';
}

export default function DealsPage() {
  const [statusFilter, setStatusFilter] = useState<ExportStatus | 'alle'>('alle');
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const filtered = LEADS.filter((l) => statusFilter === 'alle' || l.status === statusFilter);

  function exportCSV() {
    const header = 'Name,Stadt,Branche,Kontakt,Rolle,Score,Deal-Wert,Status,Exportiert,Letzte Aktivität';
    const rows = filtered.map((l) =>
      [
        l.name,
        l.city,
        l.industry,
        l.contact,
        l.contactRole,
        l.score,
        l.dealValue,
        STATUS_META[l.status].label,
        l.exportedAt,
        l.lastUpdate,
      ].join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipeline-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const counts = {
    aktiv: LEADS.filter((l) => l.status === 'aktiv').length,
    wartend: LEADS.filter((l) => l.status === 'wartend').length,
    gewonnen: LEADS.filter((l) => l.status === 'gewonnen').length,
    verloren: LEADS.filter((l) => l.status === 'verloren').length,
  };

  const totalPipeline = LEADS.filter((l) => l.status === 'aktiv' || l.status === 'wartend').reduce(
    (sum, l) => sum + (parseInt(l.dealValue.replace(/[^0-9]/g, '')) || 0),
    0
  );

  return (
    <div
      style={{
        minHeight: '100%',
        background: '#F7F8FC',
        fontFamily: 'var(--font-inter), sans-serif',
        color: '#0A2540',
      }}
    >
      {/* Topbar */}
      <div
        style={{
          background: '#fff',
          borderBottom: '1px solid #E8ECF0',
          padding: '0 32px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0A2540', lineHeight: 1 }}>In Bearbeitung</div>
          <div style={{ fontSize: 11, color: '#8896A5', marginTop: 1 }}>Exportierte Leads — aktueller Status</div>
        </div>
        <button
          onClick={exportCSV}
          style={{
            padding: '6px 14px',
            border: 'none',
            borderRadius: 4,
            background: '#4F46E5',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'var(--font-inter), sans-serif',
          }}
        >
          CSV exportieren
        </button>
      </div>

      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* KPI Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            {
              label: 'Aktive Pipeline',
              value: `€ ${(totalPipeline / 1000).toFixed(0)}k`,
              sub: `${counts.aktiv + counts.wartend} Leads`,
            },
            { label: 'In Bearbeitung', value: String(counts.aktiv), sub: 'aktiv kontaktiert', color: '#0891B2' },
            { label: 'Wartend', value: String(counts.wartend), sub: 'auf Rückmeldung', color: '#D97706' },
            { label: 'Gewonnen', value: String(counts.gewonnen), sub: 'dieser Monat', color: '#059669' },
          ].map((kpi) => (
            <div
              key={kpi.label}
              style={{ background: '#fff', border: '1px solid #E8ECF0', borderRadius: 4, padding: '12px 14px' }}
            >
              <div style={{ fontSize: 11, color: '#8896A5', fontWeight: 500, marginBottom: 6 }}>{kpi.label}</div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: (kpi as { color?: string }).color ?? '#0A2540',
                  lineHeight: 1,
                }}
              >
                {kpi.value}
              </div>
              <div style={{ fontSize: 11, color: '#8896A5', marginTop: 4 }}>{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', gap: 4 }}>
          {(['alle', 'aktiv', 'wartend', 'gewonnen', 'verloren'] as const).map((s) => {
            const meta = s !== 'alle' ? STATUS_META[s] : null;
            const isActive = statusFilter === s;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  padding: '5px 10px',
                  border: `1px solid ${isActive ? (meta?.color ?? '#4F46E5') : '#E8ECF0'}`,
                  borderRadius: 4,
                  background: isActive ? (meta?.bg ?? '#EEF2FF') : '#fff',
                  color: isActive ? (meta?.color ?? '#4F46E5') : '#0A2540',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-inter), sans-serif',
                }}
              >
                {s === 'alle' ? 'Alle' : STATUS_META[s].label}
                {s !== 'alle' && counts[s] > 0 && (
                  <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.7 }}>({counts[s]})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div style={{ background: '#fff', border: '1px solid #E8ECF0', borderRadius: 4, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F7F8FC', borderBottom: '1px solid #E8ECF0' }}>
                {[
                  'Unternehmen',
                  'Ansprechpartner',
                  'Score',
                  'Status',
                  'Deal-Wert',
                  'Exportiert',
                  'Letztes Update',
                  'Notiz',
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '9px 12px',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#8896A5',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => {
                const sm = STATUS_META[lead.status];
                const isHovered = hoveredRow === lead.id;
                return (
                  <tr
                    key={lead.id}
                    style={{ borderBottom: '1px solid #F0F2F5', background: isHovered ? '#F7F8FC' : '#fff' }}
                    onMouseEnter={() => setHoveredRow(lead.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            background: lead.color,
                            borderRadius: 3,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 9,
                            fontWeight: 800,
                            color: '#fff',
                            flexShrink: 0,
                          }}
                        >
                          {lead.initials}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#0A2540' }}>{lead.name}</div>
                          <div style={{ fontSize: 10, color: '#8896A5' }}>
                            {lead.city} · {lead.industry}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontSize: 12, color: '#0A2540' }}>{lead.contact}</div>
                      <div style={{ fontSize: 10, color: '#8896A5' }}>{lead.contactRole}</div>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: scoreColor(lead.score) }}>
                      {lead.score}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          padding: '2px 7px',
                          border: `1px solid ${sm.border}`,
                          borderRadius: 3,
                          background: sm.bg,
                          color: sm.color,
                          fontWeight: 500,
                        }}
                      >
                        {sm.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#0A2540' }}>
                      {lead.dealValue}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 11, color: '#8896A5' }}>{lead.exportedAt}</td>
                    <td style={{ padding: '10px 12px', fontSize: 11, color: '#8896A5' }}>{lead.lastUpdate}</td>
                    <td style={{ padding: '10px 12px', fontSize: 11, color: '#64748B', maxWidth: 200 }}>
                      {lead.note ? (
                        <span
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {lead.note}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 48, color: '#8896A5', fontSize: 13 }}>
            Keine Leads in diesem Status.
          </div>
        )}
      </div>
    </div>
  );
}
