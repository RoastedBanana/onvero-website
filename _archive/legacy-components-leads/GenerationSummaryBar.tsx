'use client';

import Link from 'next/link';

interface Props {
  totalLeads: number;
  qualifiedLeads: number;
  hotLeads: number;
  avgScore: number;
  lastGeneratedAt: string | null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins < 2) return 'gerade eben';
  if (mins < 60) return `vor ${mins} Minuten`;
  if (hours < 24) return `vor ${hours} Stunden`;
  return `vor ${Math.floor(hours / 24)} Tagen`;
}

function Metric({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div style={{ flex: 1, minWidth: 80 }}>
      <div style={{ fontSize: 20, fontWeight: 500, color, fontFamily: 'var(--font-dm-mono)', lineHeight: 1.2 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{label}</div>
    </div>
  );
}

export default function GenerationSummaryBar({
  totalLeads,
  qualifiedLeads,
  hotLeads,
  avgScore,
  lastGeneratedAt,
}: Props) {
  if (totalLeads === 0 || !lastGeneratedAt) return null;

  return (
    <div
      style={{
        background: '#0d0d0d',
        border: '0.5px solid #1a1a1a',
        borderRadius: 10,
        padding: '14px 20px',
        marginBottom: 12,
        fontFamily: 'var(--font-dm-sans)',
      }}
    >
      {/* Row 1: Label + time + link */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: '#555', letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
          ⚡ Letzte Generierung
        </span>
        <span style={{ fontSize: 11, color: '#444' }}>·</span>
        <span style={{ fontSize: 11, color: '#444' }}>{timeAgo(lastGeneratedAt)}</span>
        <Link
          href="/dashboard/generate"
          style={{
            marginLeft: 'auto',
            fontSize: 12,
            color: '#555',
            textDecoration: 'none',
            transition: 'color 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#888')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#555')}
        >
          → Neu generieren
        </Link>
      </div>

      {/* Row 2: Metrics */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Metric value={totalLeads} label="gesamt" color="#e0e0e0" />
        <Metric value={qualifiedLeads} label="Score ≥ 60" color={qualifiedLeads > 0 ? '#4ade80' : '#555'} />
        <Metric
          value={hotLeads}
          label="Score ≥ 70"
          color={hotLeads > 0 ? '#ef4444' : qualifiedLeads > 0 ? '#f59e0b' : '#555'}
        />
        <Metric value={avgScore} label="Ø Score" color={avgScore >= 60 ? '#f59e0b' : '#555'} />
      </div>
    </div>
  );
}
