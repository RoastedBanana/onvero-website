'use client';

import { useState } from 'react';
import { mockLeads } from '@/lib/mock-leads';

function ScoreBadge({ score }: { score: number }) {
  const isHot = score >= 75;
  const isWarm = score >= 45;
  const label = isHot ? 'HOT' : isWarm ? 'WARM' : 'COLD';
  const color = isHot ? '#FF5C2E' : isWarm ? '#F59E0B' : '#6B7AFF';
  const bg = isHot ? 'rgba(255,92,46,0.12)' : isWarm ? 'rgba(245,158,11,0.12)' : 'rgba(107,122,255,0.12)';
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: bg,
        borderRadius: 20,
        padding: '3px 10px',
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 700, color, fontFamily: 'var(--font-dm-mono)' }}>{score}</span>
      <span style={{ fontSize: 9, fontWeight: 600, color, letterSpacing: '0.1em', opacity: 0.85 }}>{label}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    neu: { label: 'Neu', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
    kontaktiert: { label: 'Kontaktiert', color: '#6B7AFF', bg: 'rgba(107,122,255,0.12)' },
    qualifiziert: { label: 'Qualifiziert', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
    verloren: { label: 'Verloren', color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.06)' },
  };
  const s = map[status] ?? map.neu;
  return (
    <span
      style={{ background: s.bg, color: s.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 500 }}
    >
      {s.label}
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: 'rgba(107,122,255,0.15)',
        border: '1px solid rgba(107,122,255,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 600,
        color: '#6B7AFF',
        flexShrink: 0,
        fontFamily: 'var(--font-dm-mono)',
      }}
    >
      {initials}
    </div>
  );
}

interface LeadsTableProps {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export default function LeadsTable({ selectedId, onSelect }: LeadsTableProps) {
  const [sortBy, setSortBy] = useState<'score' | 'date'>('score');

  const sorted = [...mockLeads].sort((a, b) =>
    sortBy === 'score' ? b.score - a.score : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div
      style={{
        background: '#111',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 12,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '64px 1fr 200px 140px 120px 100px',
          padding: '10px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        {[
          { key: 'score', label: 'SCORE' },
          { key: null, label: 'NAME / FIRMA' },
          { key: null, label: 'E-MAIL' },
          { key: null, label: 'BRANCHE' },
          { key: null, label: 'STATUS' },
          { key: 'date', label: 'DATUM' },
        ].map(({ key, label }) => (
          <div
            key={label}
            onClick={() => key && setSortBy(key as 'score' | 'date')}
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: key && sortBy === key ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)',
              letterSpacing: '0.08em',
              cursor: key ? 'pointer' : 'default',
              userSelect: 'none',
            }}
          >
            {label}
            {key && sortBy === key ? ' \u2193' : ''}
          </div>
        ))}
      </div>
      {sorted.map((lead, i) => (
        <div
          key={lead.id}
          onClick={() => onSelect(selectedId === lead.id ? null : lead.id)}
          style={{
            display: 'grid',
            gridTemplateColumns: '64px 1fr 200px 140px 120px 100px',
            padding: '12px 20px',
            borderBottom: i < sorted.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            alignItems: 'center',
            cursor: 'pointer',
            background: selectedId === lead.id ? 'rgba(107,122,255,0.05)' : 'transparent',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => {
            if (selectedId !== lead.id) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
          }}
          onMouseLeave={(e) => {
            if (selectedId !== lead.id) (e.currentTarget as HTMLElement).style.background = 'transparent';
          }}
        >
          <ScoreBadge score={lead.score} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name={lead.name} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>{lead.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{lead.company}</div>
            </div>
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.35)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {lead.email}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{lead.industry?.split('/')[0] ?? '\u2014'}</div>
          <StatusBadge status={lead.status} />
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-dm-mono)' }}>
            {new Date(lead.created_at).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
          </div>
        </div>
      ))}
    </div>
  );
}
